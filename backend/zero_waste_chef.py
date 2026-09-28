"""
Zero-Waste Chef Recipe Engine for KitchenOS
===========================================
Inverts meal planning by inspecting active pantry inventory, identifying ingredients
closest to expiration, and prioritizing them as star components in generated recipes.

Powered by Google Gemini 1.5 Flash configured for structured JSON output generation.
Maintains 100% compatibility with existing frontend contract (serving formatted `recipe_text`)
while exposing structured JSON recipes for advanced consumers.
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

def _call_gemini_structured_recipe(
    target_item: str,
    spices: str = "General",
    cuisine: str = "Indian",
    other_inventory: Optional[List[Dict[str, Any]]] = None,
    dietary_pref: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    inventory_summary = ""
    if other_inventory:
        items_str = ", ".join([f"{i.get('name', '')} ({i.get('quantity', '')} {i.get('unit', '')})" for i in other_inventory[:10]])
        inventory_summary = f"\nAvailable Pantry Ingredients to utilize: {items_str}"

    system_instruction = (
        "You are the KitchenOS Zero-Waste Master Chef. Your mission is to INVERT traditional meal planning: "
        "always prioritize perishable and expiring pantry items, preventing kitchen food waste while creating "
        "nutritious, delicious, and realistic home-cooked meals."
    )

    prompt = f"""Generate a creative, mouth-watering {cuisine} recipe that strictly prioritizes '{target_item}' (which is expiring soon).
Seasoning preference: '{spices}'.
Dietary preferences: '{dietary_pref or 'None specified'}'.{inventory_summary}

Respond ONLY with valid, raw JSON (no surrounding markdown code blocks, no backticks) matching this exact schema:
{{
  "title": "Distinctive Recipe Title",
  "cuisine": "{cuisine}",
  "difficulty": "Easy",
  "prep_time": "15 mins",
  "cook_time": "20 mins",
  "total_time": "35 mins",
  "servings": 2,
  "expiring_ingredients_used": [
    {{"name": "{target_item}", "amount": "e.g. 250g", "urgency": "Expiring soonest"}}
  ],
  "pantry_staples_used": ["e.g. Onion", "Cooking Oil", "Turmeric"],
  "ingredients": [
    {{"item": "{target_item}", "quantity": "e.g. 250g", "notes": "diced or prepared"}},
    {{"item": "Salt & Spices", "quantity": "to taste", "notes": "seasoning"}}
  ],
  "instructions": [
    "Step 1: Description...",
    "Step 2: Description...",
    "Step 3: Description..."
  ],
  "macro_analytics": {{
    "calories": 380,
    "protein_g": 16.5,
    "carbs_g": 34.0,
    "fat_g": 14.0,
    "fiber_g": 6.5
  }},
  "zero_waste_tip": "Chef tip on how to store or repurpose leftovers of this dish."
}}
"""
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                system_instruction=system_instruction,
                temperature=0.4
            )
        )
        if response and response.text:
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
    except Exception as e:
        print(f"google-genai v1 call failed: {e}")

    try:
        import google.generativeai as gai
        gai.configure(api_key=api_key)
        model = gai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json", "temperature": 0.4}
        )
        response = model.generate_content(prompt)
        if response and response.text:
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
    except Exception as e:
        print(f"google.generativeai call failed: {e}")

    return None

def _create_fallback_zero_waste_recipe(
    item: str,
    spices: str = "General",
    cuisine: str = "Indian"
) -> Dict[str, Any]:
    clean_item = item.strip().title()
    title = f"Zero-Waste {cuisine} Pan-Seared {clean_item}"
    
    ingredients_list = [
        {"item": clean_item, "quantity": "All available remaining stock", "notes": "Star expiring ingredient"},
        {"item": "Cooking Oil / Ghee", "quantity": "1-2 tbsp", "notes": "Healthy cooking fat"},
        {"item": f"{spices} Spice Blend", "quantity": "1 tbsp", "notes": f"Infused with {spices.lower()} notes"},
        {"item": "Aromatic Aromas (Onion, Garlic, Ginger)", "quantity": "1/2 cup finely chopped", "notes": "Flavor base"},
        {"item": "Fresh Coriander or Herbs", "quantity": "A handful", "notes": "Fresh garnish"}
    ]
    
    instructions = [
        f"Inspect and prep your expiring {clean_item}. Trim any bruised spots while preserving maximum edible produce.",
        f"Heat 1-2 tbsp oil or ghee in a heavy pan. Sauté aromatic onions, ginger, and garlic over medium heat until fragrant.",
        f"Incorporate your {clean_item} along with the {spices} seasoning. Sauté for 4-6 minutes to sear in flavors.",
        "Lower flame, cover with a tight lid, and let it simmer for 8-10 minutes until tender and thoroughly infused.",
        "Garnish with chopped fresh herbs and serve hot alongside rotis, rice, or sourdough toast."
    ]
    
    macros = {
        "calories": 320,
        "protein_g": 14.0,
        "carbs_g": 26.0,
        "fat_g": 12.0,
        "fiber_g": 5.0
    }
    
    zero_waste_tip = (
        f"Save any trimmings, peels, or stems from {clean_item} in a freezer bag to boil into a rich vegetable broth later."
    )

    return {
        "title": title,
        "cuisine": cuisine,
        "difficulty": "Easy",
        "prep_time": "10 mins",
        "cook_time": "15 mins",
        "total_time": "25 mins",
        "servings": 2,
        "expiring_ingredients_used": [
            {"name": clean_item, "amount": "Available stock", "urgency": "High - Spoilage prevention"}
        ],
        "pantry_staples_used": ["Cooking Oil", "Onion", "Salt", f"{spices} Seasoning"],
        "ingredients": ingredients_list,
        "instructions": instructions,
        "macro_analytics": macros,
        "zero_waste_tip": zero_waste_tip
    }

def format_recipe_markdown(structured: Dict[str, Any], item: str) -> str:
    title = structured.get("title", f"Zero-Waste Recipe for {item}")
    cuisine = structured.get("cuisine", "Special")
    difficulty = structured.get("difficulty", "Easy")
    prep_time = structured.get("prep_time", "15 mins")
    cook_time = structured.get("cook_time", "20 mins")
    servings = structured.get("servings", 2)
    
    lines = []
    lines.append(f"👨‍🍳 {title.upper()}")
    lines.append(f"⏱️ Prep: {prep_time} | Cook: {cook_time} | Servings: {servings} | Difficulty: {difficulty}\n")
    
    exp_used = structured.get("expiring_ingredients_used", [])
    if exp_used:
        exp_names = ", ".join([f"{u.get('name', item)} ({u.get('amount', 'pantry qty')})" for u in exp_used])
        lines.append(f"🚨 Prioritized Expiring Item(s): {exp_names}\n")

    lines.append("🛒 INGREDIENTS:")
    for ing in structured.get("ingredients", []):
        if isinstance(ing, dict):
            notes = f" ({ing['notes']})" if ing.get("notes") else ""
            lines.append(f"• {ing.get('item', '')}: {ing.get('quantity', '')}{notes}")
        else:
            lines.append(f"• {ing}")
    lines.append("")

    lines.append("🍳 INSTRUCTIONS:")
    for idx, step in enumerate(structured.get("instructions", []), 1):
        if isinstance(step, dict):
            step_text = step.get("instruction", "")
        else:
            step_text = str(step)
        lines.append(f"{idx}. {step_text}")
    lines.append("")

    macros = structured.get("macro_analytics", {})
    if macros:
        lines.append(
            f"📊 NUTRITION (per serving): {macros.get('calories', 350)} kcal | "
            f"Protein: {macros.get('protein_g', 0)}g | "
            f"Carbs: {macros.get('carbs_g', 0)}g | "
            f"Fats: {macros.get('fat_g', 0)}g | "
            f"Fiber: {macros.get('fiber_g', 0)}g\n"
        )

    tip = structured.get("zero_waste_tip")
    if tip:
        lines.append(f"💡 ZERO-WASTE CHEF TIP: {tip}")

    return "\n".join(lines)

def generate_zero_waste_recipe(
    item: str,
    spices: str = "General",
    cuisine: str = "Indian",
    other_inventory: Optional[List[Dict[str, Any]]] = None,
    dietary_pref: Optional[str] = None
) -> Dict[str, Any]:
    structured = _call_gemini_structured_recipe(
        target_item=item,
        spices=spices,
        cuisine=cuisine,
        other_inventory=other_inventory,
        dietary_pref=dietary_pref
    )

    if not structured:
        structured = _create_fallback_zero_waste_recipe(
            item=item,
            spices=spices,
            cuisine=cuisine
        )

    formatted_text = format_recipe_markdown(structured, item)

    return {
        "recipe_text": formatted_text,
        "expiring_item": item,
        "selected_spices": spices,
        "selected_cuisine": cuisine,
        "structured_recipe": structured,
        "title": structured.get("title", ""),
        "difficulty": structured.get("difficulty", "Easy"),
        "prep_time": structured.get("prep_time", ""),
        "cook_time": structured.get("cook_time", ""),
        "macro_analytics": structured.get("macro_analytics", {}),
        "zero_waste_tip": structured.get("zero_waste_tip", "")
    }

def prioritize_inventory_for_cooking(inventory_items: List[Any]) -> List[Dict[str, Any]]:
    today = datetime.now().date()
    prioritized = []

    for item in inventory_items:
        name = getattr(item, "name", "")
        expiry = getattr(item, "expiry_date", None)
        days_left = 999
        if expiry:
            try:
                exp_date = datetime.strptime(expiry, "%Y-%m-%d").date()
                days_left = (exp_date - today).days
            except Exception:
                pass
        
        prioritized.append({
            "name": name,
            "quantity": getattr(item, "quantity", 1),
            "unit": getattr(item, "unit", "pcs"),
            "category": getattr(item, "category", "Other"),
            "expiry_date": expiry,
            "days_left": days_left
        })

    usable_items = [i for i in prioritized if i["days_left"] >= -1]
    usable_items.sort(key=lambda x: x["days_left"])
    return usable_items
