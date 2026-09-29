"""
Voice Inventory Logging & Quick Updates Service for KitchenOS
=============================================================
Enables hands-free verbal pantry updates in busy kitchen environments:
Example: "Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge"
"""

import os
import re
import json
import base64
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

import models
from spoilage_engine import lookup_baseline_shelf_life

ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

NUMBER_WORDS: Dict[str, float] = {
    "zero": 0.0, "half": 0.5, "one": 1.0, "a": 1.0, "an": 1.0, "two": 2.0, "three": 3.0,
    "four": 4.0, "five": 5.0, "six": 6.0, "seven": 7.0, "eight": 8.0, "nine": 9.0,
    "ten": 10.0, "eleven": 11.0, "twelve": 12.0, "dozen": 12.0
}

UNIT_MAPPING: Dict[str, str] = {
    "kg": "kg", "kgs": "kg", "kilogram": "kg", "kilograms": "kg",
    "g": "grams", "gm": "grams", "gms": "grams", "gram": "grams", "grams": "grams",
    "l": "liters", "ltr": "liters", "ltrs": "liters", "liter": "liters", "liters": "liters", "litre": "liters", "litres": "liters",
    "ml": "ml", "milliliter": "ml", "milliliters": "ml",
    "packet": "packets", "packets": "packets", "pack": "packets", "packs": "packets",
    "piece": "pcs", "pieces": "pcs", "pc": "pcs", "pcs": "pcs",
    "bottle": "bottles", "bottles": "bottles",
    "can": "cans", "cans": "cans",
    "bunch": "bunch", "bunches": "bunch",
    "slice": "slices", "slices": "slices",
    "cup": "cups", "cups": "cups",
    "box": "box", "boxes": "box"
}

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

def parse_voice_command_rule_based(command_text: str) -> Dict[str, Any]:
    """
    Robust rule-based and regex NLP extractor for kitchen voice commands.
    Accurately extracts actions (ADD, CONSUME, REMOVE), quantities, units,
    target item names (e.g. cucumber, egg, tomatoes, milk), and storage locations.
    """
    raw_text = command_text.strip()
    # Strip conversational wake words and filler prefixes
    cleaned = re.sub(
        r'^(?:hey\s+kitchen\s*os|kitchen\s*os|hey\s+kitchen|ok\s+kitchen|hello\s+kitchen\s*os|hi\s+kitchen\s*os|please|could\s+you|can\s+you|i\s+just|i\s+have|we\s+have|i\s+want\s+to|today\s+i|hey|hi)\s*[,:]?\s*',
        '',
        raw_text,
        flags=re.IGNORECASE
    ).strip()

    # Split compound clauses on coordinators: "and", "then", commas, semicolons
    raw_clauses = re.split(r'\s*(?:,\s*and\s*|,\s*then\s*|\s+and\s+then\s+|\s+and\s+|\s+then\s*|,\s*|;\s*)\s*', cleaned, flags=re.IGNORECASE)
    clauses = [c.strip() for c in raw_clauses if c.strip()]

    actions = []
    current_action = "ADD"

    for clause in clauses:
        clause_lower = clause.lower().strip()
        if not clause_lower:
            continue

        # 1. Action verb detection
        action = None
        if re.search(r'\b(threw\s+away|throw\s+away|thrown\s+away|discarded?|tossed?|deleted?|removed?|dumped?|spoiled|rotten|expired)\b', clause_lower):
            action = "REMOVE"
        elif re.search(r'\b(used\s+up|used?|consumed?|ate|cooked|drank|finished?|took|having)\b', clause_lower):
            action = "CONSUME"
        elif re.search(r'\b(added?|put|bought|stored?|placed?|kept|keep|got|bring|brought|loaded?|purchased?)\b', clause_lower):
            action = "ADD"
        else:
            action = current_action

        current_action = action

        # 2. Storage location detection
        storage = "refrigerator"
        if re.search(r'\b(freezer|frozen|deep\s+freeze)\b', clause_lower):
            storage = "freezer"
        elif re.search(r'\b(pantry|cupboard|cabinet|shelf)\b', clause_lower):
            storage = "pantry"
        elif re.search(r'\b(fridge|refrigerator|cooler)\b', clause_lower):
            storage = "refrigerator"
        else:
            storage = "refrigerator"

        # 3. Quantity & proportion detection
        quantity = 1.0
        unit = "pcs"
        is_percentage = False

        if re.search(r'\b(?:half\s+a\s+dozen|half\s+dozen)\b', clause_lower):
            quantity = 6.0
            unit = "pcs"
        elif re.search(r'\b(?:a\s+dozen|dozen)\b', clause_lower):
            quantity = 12.0
            unit = "pcs"
        elif re.search(r'\b(?:half\s+of\s+the|half\s+of|half\s+the|half)\b', clause_lower):
            if action == "CONSUME":
                quantity = 0.5
                is_percentage = True
                unit = "proportion"
            else:
                quantity = 0.5
                unit = "pcs"
        elif re.search(r'\b(?:quarter\s+of\s+the|quarter\s+of|quarter\s+the|quarter|one\s+fourth|1/4)\b', clause_lower):
            if action == "CONSUME":
                quantity = 0.25
                is_percentage = True
                unit = "proportion"
            else:
                quantity = 0.25
                unit = "pcs"
        else:
            # Check for numeric quantity with optional unit (e.g. 200g, 2 kg, 3 pieces, 6)
            num_unit_match = re.search(
                r'\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilograms?|grams?|gm|gms|g|liters?|litres?|ltr|ltrs|l|ml|pcs?|pieces?|packets?|packs?|bottles?|cans?|slices?|cups?|boxes?|box)?\b',
                clause_lower
            )
            if num_unit_match:
                try:
                    quantity = float(num_unit_match.group(1))
                except ValueError:
                    quantity = 1.0
                raw_u = num_unit_match.group(2)
                if raw_u:
                    unit = UNIT_MAPPING.get(raw_u.lower(), "pcs")
                else:
                    unit = "pcs"
            else:
                # Check for written number words
                word_match = re.search(
                    r'\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(kg|kgs|kilograms?|grams?|gm|gms|g|liters?|litres?|ltr|ltrs|l|ml|pcs?|pieces?|packets?|packs?|bottles?|cans?|slices?|cups?)?\b',
                    clause_lower
                )
                if word_match:
                    w = word_match.group(1).lower()
                    quantity = NUMBER_WORDS.get(w, 1.0)
                    raw_u = word_match.group(2)
                    if raw_u:
                        unit = UNIT_MAPPING.get(raw_u.lower(), "pcs")
                    else:
                        unit = "pcs"

        # 4. Item name extraction (strip action verbs, storage words, quantity/unit tokens, stop words)
        work_text = clause_lower
        work_text = re.sub(
            r'\b(threw\s+away|throw\s+away|thrown\s+away|discarded?|tossed?|deleted?|removed?|dumped?|used\s+up|used?|consumed?|ate|cooked|drank|finished?|added?|put|bought|stored?|placed?|kept|keep|got|bring|brought)\b',
            ' ',
            work_text
        )
        work_text = re.sub(
            r'\b(into\s+the\s+fridge|in\s+the\s+fridge|to\s+the\s+fridge|in\s+fridge|to\s+fridge|into\s+fridge|fridge|refrigerator|in\s+the\s+freezer|to\s+the\s+freezer|freezer|in\s+the\s+pantry|to\s+the\s+pantry|pantry|cupboard|cabinet)\b',
            ' ',
            work_text
        )
        work_text = re.sub(
            r'\b(half\s+a\s+dozen|half\s+dozen|a\s+dozen|dozen|half\s+of\s+the|half\s+of|half\s+the|half|quarter\s+of\s+the|quarter\s+of|quarter\s+the|quarter)\b',
            ' ',
            work_text
        )
        work_text = re.sub(
            r'\b\d+(?:\.\d+)?\s*(?:kg|kgs|kilograms?|grams?|gm|gms|g|liters?|litres?|ltr|ltrs|l|ml|pcs?|pieces?|packets?|packs?|bottles?|cans?|slices?|cups?|boxes?|box)?\b',
            ' ',
            work_text
        )
        work_text = re.sub(
            r'\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b',
            ' ',
            work_text
        )
        work_text = re.sub(
            r'\b(of\s+the|to\s+the|in\s+the|into\s+the|from\s+the|of|to|in|into|from|for|at|the|a|an|some|my|our|any|fresh|spoiled|rotten|expired|remaining|leftover)\b',
            ' ',
            work_text
        )
        work_text = re.sub(r'[^a-zA-Z\s]', ' ', work_text)

        tokens = [t for t in work_text.split() if len(t) > 1 or t in ["egg", "dal"]]
        item_name = ' '.join(tokens).strip()

        if not item_name:
            continue

        item_name = item_name.title()

        # Storage fallback lookup from baseline
        baseline = lookup_baseline_shelf_life(item_name)
        if storage == "refrigerator" and not re.search(r'\b(fridge|refrigerator)\b', clause_lower):
            storage = baseline.get("default_storage", "refrigerator")

        actions.append({
            "action": action,
            "item_name": item_name,
            "quantity": quantity,
            "is_percentage": is_percentage,
            "unit": unit,
            "storage_location": storage
        })

    if not actions:
        return {
            "actions": [{
                "action": "INFO",
                "item_name": "General",
                "quantity": 1.0,
                "is_percentage": False,
                "unit": "pcs",
                "storage_location": "pantry"
            }],
            "confirmation_message": f"Heard: '{cleaned or raw_text}'. What ingredient would you like me to update?"
        }

    # Generate dynamic natural confirmation message
    parts = []
    for act in actions:
        qty = act["quantity"]
        qty_str = f"{int(qty)}" if qty.is_integer() else f"{qty}"
        unit_str = act["unit"]
        item = act["item_name"]
        loc = act["storage_location"]

        if act["action"] == "CONSUME":
            if act.get("is_percentage") or act.get("unit") == "proportion":
                desc = "half of " if act["quantity"] == 0.5 else f"{int(act['quantity'] * 100)}% of "
                parts.append(f"used {desc}{item}")
            else:
                parts.append(f"used {qty_str} {unit_str} of {item}")
        elif act["action"] == "ADD":
            parts.append(f"added {qty_str} {unit_str} of {item} to your {loc}")
        elif act["action"] == "REMOVE":
            parts.append(f"removed {item}")

    if len(parts) == 1:
        confirmation = f"Understood! I {parts[0]}."
    elif len(parts) == 2:
        confirmation = f"Understood! I {parts[0]} and {parts[1]}."
    else:
        confirmation = f"Understood! I {', '.join(parts[:-1])}, and {parts[-1]}."

    return {
        "actions": actions,
        "confirmation_message": confirmation
    }

def parse_kitchen_voice_command(command_text: str) -> Dict[str, Any]:
    clean_command = command_text.strip()
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        prompt = f"""You are the KitchenOS Voice Assistant. A user speaking in the kitchen said:
"{clean_command}"

Extract ONLY the exact ingredients and quantities explicitly mentioned by the user into structured JSON actions.
Allowed actions:
- "CONSUME": item was partially or completely eaten/used (e.g. "used half the milk", "used 2 eggs").
- "ADD": item was placed in pantry/fridge/freezer (e.g. "add cucumber", "put 200g of cooked dal in the fridge").
- "REMOVE": item was discarded or finished completely (e.g. "threw away spoiled milk").

Do NOT invent or mention items that the user did not say.
Respond ONLY with valid raw JSON matching this schema:
{{
  "actions": [
    {{
      "action": "ADD",
      "item_name": "Cucumber",
      "quantity": 1.0,
      "is_percentage": false,
      "unit": "pcs",
      "storage_location": "refrigerator"
    }}
  ],
  "confirmation_message": "Understood! I added 1 pcs of Cucumber to your refrigerator."
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
                parsed = json.loads(raw.strip())
                if isinstance(parsed, dict) and "actions" in parsed and len(parsed["actions"]) > 0:
                    # Validate that parsed items relate to the command text (prevent hallucinations)
                    first_item = parsed["actions"][0].get("item_name", "").lower()
                    if any(token in clean_command.lower() for token in first_item.split()):
                        return parsed
        except Exception as e:
            print(f"Gemini voice intent parsing failed: {e}")

    # Use the robust rule-based NLP extractor
    return parse_voice_command_rule_based(clean_command)

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
                if action_type == "REMOVE":
                    new_qty = 0.0
                elif is_pct or unit == "proportion":
                    new_qty = round(max(0.0, old_qty * (1.0 - qty)), 2)
                else:
                    new_qty = round(max(0.0, old_qty - qty), 2)

                target_item.quantity = new_qty
                db.commit()
                db.refresh(target_item)
                
                execution_results.append({
                    "action": action_type,
                    "item_name": target_item.name,
                    "previous_quantity": old_qty,
                    "new_quantity": new_qty,
                    "unit": target_item.unit,
                    "status": "updated"
                })
            else:
                execution_results.append({
                    "action": action_type,
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
                    "quantity": qty,
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

    # Format structured items for UI cards
    added_items = []
    consumed_items = []
    discarded_items = []

    for r in db_results:
        act = r.get("action", "")
        if "ADD" in act:
            added_items.append({
                "name": r.get("item_name"),
                "quantity": r.get("quantity") or r.get("new_quantity"),
                "unit": r.get("unit", "pcs")
            })
        elif act == "CONSUME":
            consumed_items.append({
                "name": r.get("item_name"),
                "amount_used": f"{r.get('previous_quantity', 1) - r.get('new_quantity', 0)} {r.get('unit', 'pcs')}",
                "percentage_used": None
            })
        elif act == "REMOVE":
            discarded_items.append({
                "name": r.get("item_name")
            })

    return {
        "status": "success",
        "transcribed_command": command_text,
        "command_text": command_text,
        "actions_parsed": actions,
        "database_updates": db_results,
        "added_items": added_items,
        "consumed_items": consumed_items,
        "discarded_items": discarded_items,
        "confirmation_text": confirmation_text,
        "natural_summary": confirmation_text,
        "audio_base64": audio_base64,
        "voice_synthesized": audio_base64 is not None
    }