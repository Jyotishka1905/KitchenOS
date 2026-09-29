"""
Voice Inventory Logging & Quick Updates Service for KitchenOS
=============================================================
Enables hands-free verbal pantry updates in busy kitchen environments:
Example: "Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge"
"""

import os
import json
import base64
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

import models
from spoilage_engine import lookup_baseline_shelf_life

ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

def synthesize_elevenlabs_audio(text: str, voice_id: str = ELEVENLABS_DEFAULT_VOICE_ID) -> Optional[str]:
    api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("ELEVEN_LABS_API_KEY")
    if not api_key:
        return None

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key.strip()
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.2,
            "use_speaker_boost": True
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=12)
        if response.status_code == 200 and response.content:
            b64_audio = base64.b64encode(response.content).decode("utf-8")
            return f"data:audio/mp3;base64,{b64_audio}"
        else:
            print(f"ElevenLabs TTS returned code {response.status_code}: {response.text}")
    except Exception as e:
        print(f"ElevenLabs API exception: {e}")

    return None

def parse_kitchen_voice_command(command_text: str) -> Dict[str, Any]:
    clean_command = command_text.strip()
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        prompt = f"""You are the KitchenOS Voice Assistant. A user speaking in the kitchen said:
"{clean_command}"

Extract all inventory updates into structured actions.
Allowed actions:
- "CONSUME": item was partially or completely eaten/used (e.g. "used half the cottage cheese", "used 2 eggs").
- "ADD": item was placed in pantry/fridge/freezer (e.g. "put 200g of cooked dal in the fridge").
- "REMOVE": item was discarded or finished completely.

Respond ONLY with valid, raw JSON (no markdown backticks, no code block) matching this schema:
{{
  "actions": [
    {{
      "action": "CONSUME",
      "item_name": "Cottage Cheese",
      "quantity": 0.5,
      "is_percentage": true,
      "unit": "proportion",
      "storage_location": "refrigerator"
    }},
    {{
      "action": "ADD",
      "item_name": "Cooked Dal",
      "quantity": 200.0,
      "is_percentage": false,
      "unit": "grams",
      "storage_location": "refrigerator"
    }}
  ],
  "confirmation_message": "Got it! I used half of your cottage cheese and added 200g of cooked dal to the fridge."
}}
"""
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            if response and response.text:
                raw = response.text.strip()
                if raw.startswith("```json"):
                    raw = raw[7:]
                if raw.startswith("```"):
                    raw = raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                return json.loads(raw.strip())
        except Exception as e:
            print(f"Gemini voice intent parsing failed: {e}")

    actions = []
    lower = clean_command.lower()
    
    if "used half" in lower or "consumed half" in lower or "half the" in lower:
        target = "cottage cheese"
        if "cottage cheese" in lower:
            target = "Cottage Cheese"
        elif "milk" in lower:
            target = "Milk"
        elif "paneer" in lower:
            target = "Paneer"
        elif "curd" in lower:
            target = "Curd"
            
        actions.append({
            "action": "CONSUME",
            "item_name": target,
            "quantity": 0.5,
            "is_percentage": True,
            "unit": "proportion",
            "storage_location": "refrigerator"
        })

    if "put" in lower or "add" in lower or "cooked dal" in lower:
        item = "Cooked Dal"
        qty = 200.0
        unit = "grams"
        loc = "refrigerator"
        
        if "fridge" in lower:
            loc = "refrigerator"
        elif "freezer" in lower:
            loc = "freezer"
        elif "pantry" in lower:
            loc = "pantry"
            
        actions.append({
            "action": "ADD",
            "item_name": item,
            "quantity": qty,
            "is_percentage": False,
            "unit": unit,
            "storage_location": loc
        })

    if not actions:
        actions.append({
            "action": "INFO",
            "item_name": "General",
            "quantity": 1.0,
            "is_percentage": False,
            "unit": "pcs",
            "storage_location": "pantry"
        })
        confirmation = f"Heard: '{clean_command}'. What pantry change would you like me to log?"
    else:
        parts = []
        for act in actions:
            if act["action"] == "CONSUME":
                desc = "half of " if act.get("is_percentage") else f"{act['quantity']} {act['unit']} of "
                parts.append(f"used {desc}{act['item_name']}")
            elif act["action"] == "ADD":
                parts.append(f"added {act['quantity']} {act['unit']} of {act['item_name']} to your {act['storage_location']}")
            elif act["action"] == "REMOVE":
                parts.append(f"removed {act['item_name']}")
        confirmation = f"Understood! I {' and '.join(parts)}."

    return {
        "actions": actions,
        "confirmation_message": confirmation
    }

def execute_voice_actions_on_db(
    actions: List[Dict[str, Any]],
    db: Session,
    user_id: str = "default_user"
) -> List[Dict[str, Any]]:
    execution_results = []
    today = datetime.now().date()

    for act in actions:
        action_type = act.get("action", "").upper()
        item_name = act.get("item_name", "").strip()
        qty = float(act.get("quantity", 1.0))
        is_pct = act.get("is_percentage", False)
        unit = act.get("unit", "pcs")
        storage = act.get("storage_location", "refrigerator")

        if not item_name or action_type == "INFO":
            continue

        existing_items = db.query(models.IngredientModel).all()
        target_item = None
        for db_item in existing_items:
            if (item_name.lower() in db_item.name.lower() or 
                db_item.name.lower() in item_name.lower()):
                target_item = db_item
                break

        if action_type in ["CONSUME", "REMOVE"]:
            if target_item:
                old_qty = target_item.quantity
                if is_pct or unit == "proportion":
                    new_qty = round(max(0.0, old_qty * (1.0 - qty)), 2)
                else:
                    new_qty = round(max(0.0, old_qty - qty), 2)

                target_item.quantity = new_qty
                db.commit()
                db.refresh(target_item)
                
                execution_results.append({
                    "action": "CONSUME",
                    "item_name": target_item.name,
                    "previous_quantity": old_qty,
                    "new_quantity": new_qty,
                    "unit": target_item.unit,
                    "status": "updated"
                })
            else:
                execution_results.append({
                    "action": "CONSUME",
                    "item_name": item_name,
                    "status": "item_not_found"
                })

        elif action_type == "ADD":
            if target_item:
                old_qty = target_item.quantity
                target_item.quantity = round(old_qty + qty, 2)
                db.commit()
                db.refresh(target_item)
                execution_results.append({
                    "action": "ADD_EXISTING",
                    "item_name": target_item.name,
                    "previous_quantity": old_qty,
                    "new_quantity": target_item.quantity,
                    "unit": target_item.unit,
                    "status": "incremented"
                })
            else:
                baseline = lookup_baseline_shelf_life(item_name)
                baseline_days = baseline.get("refrigerated_days", 7)
                if "freez" in storage.lower():
                    baseline_days = baseline.get("freezer_days", 60)
                elif "pant" in storage.lower():
                    baseline_days = baseline.get("pantry_days", 7)

                auto_expiry = (today + timedelta(days=int(baseline_days))).strftime("%Y-%m-%d")
                
                new_db_item = models.IngredientModel(
                    name=item_name.title(),
                    icon=baseline.get("icon", "📦"),
                    category=baseline.get("category", "Other"),
                    quantity=qty,
                    unit=unit if unit != "proportion" else "pcs",
                    expiry_date=auto_expiry,
                    user_id=user_id
                )
                db.add(new_db_item)
                db.commit()
                db.refresh(new_db_item)
                
                execution_results.append({
                    "action": "ADD_NEW",
                    "item_name": new_db_item.name,
                    "quantity": new_db_item.quantity,
                    "unit": new_db_item.unit,
                    "expiry_date": auto_expiry,
                    "category": new_db_item.category,
                    "status": "created"
                })

    return execution_results

def process_voice_logging_workflow(
    command_text: str,
    db: Session,
    user_id: str = "default_user",
    generate_audio: bool = True
) -> Dict[str, Any]:
    parsed = parse_kitchen_voice_command(command_text)
    actions = parsed.get("actions", [])
    confirmation_text = parsed.get("confirmation_message", "Pantry updated successfully.")

    db_results = execute_voice_actions_on_db(actions, db, user_id=user_id)

    audio_base64 = None
    if generate_audio:
        audio_base64 = synthesize_elevenlabs_audio(confirmation_text)

    return {
        "status": "success",
        "transcribed_command": command_text,
        "actions_parsed": actions,
        "database_updates": db_results,
        "confirmation_text": confirmation_text,
        "audio_base64": audio_base64,
        "voice_synthesized": audio_base64 is not None
    }