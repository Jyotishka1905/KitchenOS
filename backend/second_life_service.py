"""
Second Life Hub for KitchenOS
=============================
Transforms spoiled, past-expiry, or spent kitchen inventory into valuable secondary uses:
- Home remedies & topical skincare
- Natural household vinegar cleaners & enzyme degreasers
- Nutrient-rich compost & garden bio-fertilizers
- Sustainable culinary upcycling (stocks, crisps, croutons)
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

CURATED_SECOND_LIFE_KB: Dict[str, Dict[str, Any]] = {
    "milk": {
        "category": "Upcycle Guide (Expired)",
        "title": "Natural Calcium Whey & Garden Soil Booster",
        "description": "Sour milk contains lactic acid and active cultures that nourish acid-loving plants or can be separated into baking whey.",
        "icon": "🥛",
        "steps": [
            "Do not consume if foul odor or mold is present; use solely for plant care.",
            "Dilute sour milk 1:1 with fresh water to prevent excessive fat build-up in soil.",
            "Pour around the roots of tomatoes, roses, and ferns once a month to prevent blossom end rot.",
            "Alternatively, heat sour milk to separate curds from liquid whey to enrich sourdough or compost piles."
        ]
    },
    "paneer": {
        "category": "Upcycle Guide (Expired)",
        "title": "Microbial Compost Bio-Activator",
        "description": "Expired paneer is densely packed with nitrogen and phosphorus, acting as an organic catalyst for compost decomposition.",
        "icon": "🧀",
        "steps": [
            "Crumble the expired paneer into small pea-sized pieces.",
            "Bury deep inside your compost bin or garden trench (at least 6 inches) to prevent pests.",
            "Cover thoroughly with dry brown matter (dry leaves, cardboard, or coco peat) to balance carbon-nitrogen ratio.",
            "Decomposes within 7-10 days, releasing bioavailable nitrogen into the soil."
        ]
    },
    "curd": {
        "category": "Home Remedy & Garden",
        "title": "Probiotic Hair Mask & Anti-Fungal Plant Spray",
        "description": "Sour curd possesses high lactic acid content, balancing scalp pH and acting as a mild anti-fungal shield for indoor foliage.",
        "icon": "🥣",
        "steps": [
            "For Hair: Mix 3 tbsp sour curd with 1 tsp honey and apply as an anti-dandruff scalp treatment for 20 minutes before rinsing.",
            "For Plants: Dilute 1 cup sour curd into 10 cups water; spray gently onto leaves suffering from mild powdery mildew."
        ]
    },
    "yogurt": {
        "category": "Home Remedy & Upcycle",
        "title": "Exfoliating Face Cleanser & Brass Polisher",
        "description": "The mild acidity of aged yogurt breaks down tarnish on copper/brass pots and loosens dead skin cells naturally.",
        "icon": "🥣",
        "steps": [
            "Brass & Copper: Rub directly onto tarnished copper utensils, let sit for 10 minutes, and wipe clean with a microfiber cloth.",
            "Skincare: Blend 2 tbsp yogurt with a pinch of turmeric for a brightening, probiotic skin compress."
        ]
    },
    "lemon": {
        "category": "Vinegar & Cleaners",
        "title": "Citrus All-Purpose Countertop Cleaner",
        "description": "D-limonene in citrus rinds acts as a powerful natural grease solvent when infused with distilled vinegar.",
        "icon": "🍋",
        "steps": [
            "Pack spent or dried lemon halves and peels into a clean glass mason jar.",
            "Submerge completely with distilled white vinegar and seal tightly.",
            "Store in a dark cupboard for 10-14 days to let citrus essential oils infuse.",
            "Strain the infused liquid into a spray bottle and dilute 1:1 with water for a sparkling kitchen degreaser."
        ]
    },
    "banana": {
        "category": "Compost & Garden",
        "title": "Potassium-Rich Banana Peel Fertilizer Tea",
        "description": "Overripe, blackened bananas and peels release high levels of potassium, phosphorus, and calcium into water.",
        "icon": "🍌",
        "steps": [
            "Chop blackened banana peels into 1-inch strips.",
            "Submerge in a jar of water and let steep for 48 hours at room temperature.",
            "Strain the liquid and water indoor houseplants, particularly flowering orchids, peace lilies, and pothos.",
            "Add the remaining pulp directly into your compost heap."
        ]
    },
    "tomatoes": {
        "category": "Upcycle & Compost",
        "title": "Pot Seedling Starter & Bokashi Composting",
        "description": "Overripe, mushy tomatoes contain viable heirloom seeds and high moisture content for microbial soil enrichment.",
        "icon": "🍅",
        "steps": [
            "If no mold is present, crush overripe tomatoes and blend into simmering curries or freeze into pureed ice cubes.",
            "If partially spoiled, slice into disks and bury in 1 inch of potting soil in a warm spot to sprout seedling plants.",
            "Otherwise, chop and add to compost bins layered with dry garden leaves."
        ]
    },
    "bread": {
        "category": "Upcycle Guide (Expired)",
        "title": "Golden Herb Croutons & Cast Iron Oil Absorber",
        "description": "Stale bread devoid of mold can be dehydrated into gourmet breadcrumbs or used to absorb cooking grease before dishwashing.",
        "icon": "🍞",
        "steps": [
            "Check carefully for green/white mold. If mold exists, compost immediately.",
            "If merely hard/stale: dice into 1cm cubes, toss with olive oil, salt, garlic powder, and oregano.",
            "Bake at 180°C (350°F) for 12 minutes until crunchy and golden brown.",
            "Crush remaining pieces in a food processor for fresh panko breadcrumb coating."
        ]
    },
    "potatoes": {
        "category": "Home Remedy & Garden",
        "title": "Puffy Eye Compress & Sprout Propagation",
        "description": "Sprouted or soft potatoes contain active enzymes that soothe tired eyes, while sprouts can yield new backyard harvests.",
        "icon": "🥔",
        "steps": [
            "Do NOT eat green or heavily sprouted potatoes due to solanine content.",
            "Slice thin discs from unblemished sections and place over closed eyes for 15 minutes to reduce swelling and dark circles.",
            "Cut sprouted eyes with an inch of potato tuber attached, let dry for 24 hours, and plant 4 inches deep in garden soil."
        ]
    },
    "onions": {
        "category": "Vinegar & Natural Dyes",
        "title": "Natural Earth-Tone Textile Dye & Garden Pest Barrier",
        "description": "Dry outer onion skins are rich in quercetin, yielding brilliant yellow, orange, and bronze dyes without harsh chemicals.",
        "icon": "🧅",
        "steps": [
            "Collect papery onion skins in a large pot.",
            "Cover with water and simmer gently for 45 minutes until deep amber.",
            "Strain the liquid. Submerge natural cotton, linen, or wool fabrics to dye them a rich golden-yellow hue.",
            "Boiled onion water also functions as a natural pest deterrent spray for aphids on garden plants."
        ]
    },
    "cooked rice": {
        "category": "Upcycle & Compost",
        "title": "Fermented Rice Water Plant Elixir (Kanji)",
        "description": "Fermented cooked rice water fosters beneficial lactobacillus bacteria, accelerating plant root growth.",
        "icon": "🍚",
        "steps": [
            "Steep 1/2 cup expired cooked rice in 1 liter of water in a loosely covered jar for 3-4 days.",
            "When slightly sour and bubbling, strain the liquid.",
            "Dilute 1:5 with fresh water and apply to soil around vegetable plants once every two weeks.",
            "Discontinue immediately if rancid or black mold appears."
        ]
    },
    "eggs": {
        "category": "Compost & Garden",
        "title": "Calcium Soil Fortifier & Slug Barrier",
        "description": "Eggshells are nearly 95% calcium carbonate, essential for strengthening cellular walls in garden plants.",
        "icon": "🥚",
        "steps": [
            "Rinse eggshells and bake at 100°C for 15 minutes to sanitize.",
            "Crush into coarse shards with a rolling pin and scatter around vegetable patches to create a non-toxic slug and snail barrier.",
            "Grind into a fine powder and incorporate directly into planting soil for peppers and tomatoes."
        ]
    },
    "coriander": {
        "category": "Compost & Soil",
        "title": "Aromatic Nitrogen Compost Layer",
        "description": "Wilted herbs break down rapidly in compost, releasing natural essential oils that deter nuisance pests.",
        "icon": "🌿",
        "steps": [
            "Chop wilted stems and leaves into fine segments.",
            "Layer as fresh 'green' nitrogen material inside compost buckets.",
            "Cover with twice as much 'brown' carbon material (dry leaves or shredded cardboard)."
        ]
    }
}

def _retrieve_gemini_second_life_guide(item_name: str, category: str = "Pantry") -> Optional[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    prompt = f"""You are the KitchenOS Second Life Hub knowledge retrieval engine.
Provide a safe, practical, and creative upcycling guide for this expired kitchen ingredient:
Item Name: '{item_name}'
Category: '{category}'

Determine whether it is best suited for:
1. Home Remedy (skin/hair care)
2. Eco-Friendly Household Cleaning / Vinegar Infusion
3. Composting & Garden Soil Enrichment
4. Craft / Practical Repurposing

Safety Rule: If mold or pathogens make it hazardous, recommend safe composting or non-contact cleaning only.

Respond ONLY with valid, raw JSON (no markdown backticks, no code block) matching this schema:
{{
  "category": "Upcycle Guide (Expired)",
  "title": "Second Life Guide for {item_name}",
  "description": "Short explanation (under 30 words) of why this repurposing works.",
  "icon": "♻️",
  "steps": [
    "Step 1: Specific instruction...",
    "Step 2: Specific instruction...",
    "Step 3: Specific instruction..."
  ]
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
                temperature=0.3
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
        print(f"Gemini Second Life retrieval failed: {e}")

    try:
        import google.generativeai as gai
        gai.configure(api_key=api_key)
        model = gai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
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
        print(f"google.generativeai second life retrieval failed: {e}")

    return None

def generate_upcycle_remedy(item_name: str, category: str = "Produce") -> Dict[str, Any]:
    clean_name = item_name.lower().strip()
    
    for key, data in CURATED_SECOND_LIFE_KB.items():
        if key in clean_name or clean_name in key:
            return {
                "category": data["category"],
                "title": data["title"],
                "description": data["description"],
                "icon": data["icon"],
                "steps": data["steps"]
            }

    llm_guide = _retrieve_gemini_second_life_guide(item_name, category)
    if llm_guide and "title" in llm_guide and "steps" in llm_guide:
        return llm_guide

    return {
        "category": "Upcycle Guide (Expired)",
        "title": f"Second Life Organic Compost Guide for {item_name}",
        "description": f"Divert {item_name} from landfill by converting its organic matter into nutrient-dense compost for home gardening.",
        "icon": "♻️",
        "steps": [
            f"Inspect {item_name} and remove all synthetic stickers, twist-ties, or plastic packaging.",
            f"Chop {item_name} into 1-inch segments to increase surface area for aerobic soil bacteria.",
            "Bury in the center of your compost bin, covering with a balanced 2:1 ratio of dry leaves or cardboard.",
            "Moisten lightly and turn the compost weekly to accelerate decomposition."
        ]
    }
