"""
Deterministic Spoilage Engine for KitchenOS
===========================================
Calculates real-time expiration countdowns, freshness percentages, and quality decay
using baseline shelf-life data from the USDA FoodKeeper dataset combined with
extensive common Indian culinary staples.
"""

from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List
import math

SPOILAGE_BASELINE_DATA: Dict[str, Dict[str, Any]] = {
    "paneer": {
        "category": "Dairy",
        "icon": "🧀",
        "refrigerated_days": 4,
        "freezer_days": 90,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Keep immersed in water in airtight container and change water daily."
    },
    "cottage cheese": {
        "category": "Dairy",
        "icon": "🧀",
        "refrigerated_days": 7,
        "freezer_days": 60,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Store in the coldest part of refrigerator."
    },
    "milk": {
        "category": "Dairy",
        "icon": "🥛",
        "refrigerated_days": 5,
        "freezer_days": 30,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Boil once opened to extend freshness in warm climates."
    },
    "curd": {
        "category": "Dairy",
        "icon": "🥣",
        "refrigerated_days": 7,
        "freezer_days": 30,
        "pantry_days": 1,
        "default_storage": "refrigerator",
        "notes": "Turns increasingly acidic with temperature fluctuation."
    },
    "yogurt": {
        "category": "Dairy",
        "icon": "🥣",
        "refrigerated_days": 10,
        "freezer_days": 60,
        "pantry_days": 1,
        "default_storage": "refrigerator",
        "notes": "Consume within 7-10 days of opening."
    },
    "ghee": {
        "category": "Pantry",
        "icon": "🧈",
        "refrigerated_days": 365,
        "freezer_days": 730,
        "pantry_days": 240,
        "default_storage": "pantry",
        "notes": "Keep in clean, dry container away from direct sunlight."
    },
    "butter": {
        "category": "Dairy",
        "icon": "🧈",
        "refrigerated_days": 30,
        "freezer_days": 270,
        "pantry_days": 2,
        "default_storage": "refrigerator",
        "notes": "Store wrapped or in a butter dish."
    },
    "eggs": {
        "category": "Dairy",
        "icon": "🥚",
        "refrigerated_days": 28,
        "freezer_days": 180,
        "pantry_days": 7,
        "default_storage": "refrigerator",
        "notes": "Store in main body of fridge, not the door."
    },
    "egg": {
        "category": "Dairy",
        "icon": "🥚",
        "refrigerated_days": 28,
        "freezer_days": 180,
        "pantry_days": 7,
        "default_storage": "refrigerator",
        "notes": "Store in main body of fridge, not the door."
    },
    "cucumber": {
        "category": "Vegetables",
        "icon": "🥒",
        "refrigerated_days": 8,
        "freezer_days": 60,
        "pantry_days": 3,
        "default_storage": "refrigerator",
        "notes": "Keep in crisper drawer wrapped in paper towel."
    },
    "cucumbers": {
        "category": "Vegetables",
        "icon": "🥒",
        "refrigerated_days": 8,
        "freezer_days": 60,
        "pantry_days": 3,
        "default_storage": "refrigerator",
        "notes": "Keep in crisper drawer."
    },
    "cooked dal": {
        "category": "Grains",
        "icon": "🍲",
        "refrigerated_days": 4,
        "freezer_days": 60,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Reheat to boiling point before consuming."
    },
    "dal": {
        "category": "Grains",
        "icon": "🍲",
        "refrigerated_days": 4,
        "freezer_days": 60,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Prepared cooked lentils should be refrigerated immediately after cooling."
    },
    "cooked sabzi": {
        "category": "Vegetables",
        "icon": "🥘",
        "refrigerated_days": 3,
        "freezer_days": 45,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Cooked vegetables degrade quickly at room temperature."
    },
    "cooked rice": {
        "category": "Grains",
        "icon": "🍚",
        "refrigerated_days": 4,
        "freezer_days": 90,
        "pantry_days": 0.5,
        "default_storage": "refrigerator",
        "notes": "Refrigerate within 1 hour to prevent Bacillus cereus spore growth."
    },
    "idli batter": {
        "category": "Grains",
        "icon": "🥣",
        "refrigerated_days": 5,
        "freezer_days": 30,
        "pantry_days": 1,
        "default_storage": "refrigerator",
        "notes": "Ferments rapidly at room temperature. Keep refrigerated once risen."
    },
    "dosa batter": {
        "category": "Grains",
        "icon": "🥣",
        "refrigerated_days": 5,
        "freezer_days": 30,
        "pantry_days": 1,
        "default_storage": "refrigerator",
        "notes": "Stir well before use."
    },
    "roti": {
        "category": "Bakery",
        "icon": "🫓",
        "refrigerated_days": 3,
        "freezer_days": 30,
        "pantry_days": 1,
        "default_storage": "pantry",
        "notes": "Wrap in foil or cloth inside an insulated casserole."
    },
    "chapati": {
        "category": "Bakery",
        "icon": "🫓",
        "refrigerated_days": 3,
        "freezer_days": 30,
        "pantry_days": 1,
        "default_storage": "pantry",
        "notes": "Best stored wrapped in cotton cloth."
    },
    "tomatoes": {
        "category": "Vegetables",
        "icon": "🍅",
        "refrigerated_days": 10,
        "freezer_days": 60,
        "pantry_days": 5,
        "default_storage": "pantry",
        "notes": "Store stem-down at room temperature until ripe, then refrigerate."
    },
    "tomato": {
        "category": "Vegetables",
        "icon": "🍅",
        "refrigerated_days": 10,
        "freezer_days": 60,
        "pantry_days": 5,
        "default_storage": "pantry",
        "notes": "Keep away from direct heat."
    },
    "potatoes": {
        "category": "Vegetables",
        "icon": "🥔",
        "refrigerated_days": 30,
        "freezer_days": 180,
        "pantry_days": 21,
        "default_storage": "pantry",
        "notes": "Store in a cool, dark, dry place away from onions."
    },
    "potato": {
        "category": "Vegetables",
        "icon": "🥔",
        "refrigerated_days": 30,
        "freezer_days": 180,
        "pantry_days": 21,
        "default_storage": "pantry",
        "notes": "Avoid refrigeration to prevent sugar buildup."
    },
    "onions": {
        "category": "Vegetables",
        "icon": "🧅",
        "refrigerated_days": 45,
        "freezer_days": 180,
        "pantry_days": 30,
        "default_storage": "pantry",
        "notes": "Maintain good airflow; do not store in sealed plastic bags."
    },
    "onion": {
        "category": "Vegetables",
        "icon": "🧅",
        "refrigerated_days": 45,
        "freezer_days": 180,
        "pantry_days": 30,
        "default_storage": "pantry",
        "notes": "Store in ventilated basket."
    },
    "coriander": {
        "category": "Vegetables",
        "icon": "🌿",
        "refrigerated_days": 7,
        "freezer_days": 60,
        "pantry_days": 2,
        "default_storage": "refrigerator",
        "notes": "Trim stems and place in jar with an inch of water, loosely covered."
    },
    "curry leaves": {
        "category": "Vegetables",
        "icon": "🍃",
        "refrigerated_days": 14,
        "freezer_days": 90,
        "pantry_days": 3,
        "default_storage": "refrigerator",
        "notes": "Wash, dry thoroughly, and store in airtight box lined with paper towel."
    },
    "green chillies": {
        "category": "Vegetables",
        "icon": "🌶️",
        "refrigerated_days": 14,
        "freezer_days": 120,
        "pantry_days": 4,
        "default_storage": "refrigerator",
        "notes": "Remove green stems before storing to prevent rot."
    },
    "ginger": {
        "category": "Vegetables",
        "icon": "🫚",
        "refrigerated_days": 28,
        "freezer_days": 180,
        "pantry_days": 14,
        "default_storage": "refrigerator",
        "notes": "Store unpeeled in a resealable bag in the crisper drawer."
    },
    "garlic": {
        "category": "Vegetables",
        "icon": "🧄",
        "refrigerated_days": 60,
        "freezer_days": 180,
        "pantry_days": 60,
        "default_storage": "pantry",
        "notes": "Store whole heads in cool, dry pantry with good ventilation."
    },
    "spinach": {
        "category": "Vegetables",
        "icon": "🥬",
        "refrigerated_days": 5,
        "freezer_days": 240,
        "pantry_days": 1,
        "default_storage": "refrigerator",
        "notes": "Do not wash until ready to cook to avoid moisture rot."
    },
    "palak": {
        "category": "Vegetables",
        "icon": "🥬",
        "refrigerated_days": 5,
        "freezer_days": 240,
        "pantry_days": 1,
        "default_storage": "refrigerator",
        "notes": "Remove yellowed leaves before chilling."
    },
    "cauliflower": {
        "category": "Vegetables",
        "icon": "🥦",
        "refrigerated_days": 7,
        "freezer_days": 240,
        "pantry_days": 2,
        "default_storage": "refrigerator",
        "notes": "Keep dry in perforated bag."
    },
    "carrots": {
        "category": "Vegetables",
        "icon": "🥕",
        "refrigerated_days": 21,
        "freezer_days": 270,
        "pantry_days": 5,
        "default_storage": "refrigerator",
        "notes": "Cut off green tops to retain moisture in roots."
    },
    "apples": {
        "category": "Fruits",
        "icon": "🍎",
        "refrigerated_days": 28,
        "freezer_days": 240,
        "pantry_days": 7,
        "default_storage": "refrigerator",
        "notes": "Keep isolated as they emit ethylene gas."
    },
    "bananas": {
        "category": "Fruits",
        "icon": "🍌",
        "refrigerated_days": 7,
        "freezer_days": 90,
        "pantry_days": 5,
        "default_storage": "pantry",
        "notes": "Peel and freeze when brown for smoothies or baking."
    },
    "lemon": {
        "category": "Fruits",
        "icon": "🍋",
        "refrigerated_days": 21,
        "freezer_days": 120,
        "pantry_days": 7,
        "default_storage": "refrigerator",
        "notes": "Submerge in water in fridge to keep juicy for up to a month."
    },
    "rice": {
        "category": "Grains",
        "icon": "🌾",
        "refrigerated_days": 720,
        "freezer_days": 1000,
        "pantry_days": 365,
        "default_storage": "pantry",
        "notes": "Keep in airtight dispenser with dry bay leaves or dried neem."
    },
    "basmati rice": {
        "category": "Grains",
        "icon": "🌾",
        "refrigerated_days": 720,
        "freezer_days": 1000,
        "pantry_days": 365,
        "default_storage": "pantry",
        "notes": "Store sealed away from moisture."
    },
    "atta": {
        "category": "Grains",
        "icon": "🌾",
        "refrigerated_days": 180,
        "freezer_days": 365,
        "pantry_days": 90,
        "default_storage": "pantry",
        "notes": "Whole wheat flour oils oxidize; use within 3 months in pantry."
    },
    "flour": {
        "category": "Grains",
        "icon": "🌾",
        "refrigerated_days": 180,
        "freezer_days": 365,
        "pantry_days": 180,
        "default_storage": "pantry",
        "notes": "Sealed container prevents pantry weevils."
    },
    "lentils": {
        "category": "Grains",
        "icon": "🫘",
        "refrigerated_days": 540,
        "freezer_days": 720,
        "pantry_days": 365,
        "default_storage": "pantry",
        "notes": "Dried pulses remain safe indefinitely; cooking time increases with age."
    },
    "chana dal": {
        "category": "Grains",
        "icon": "🫘",
        "refrigerated_days": 540,
        "freezer_days": 720,
        "pantry_days": 365,
        "default_storage": "pantry",
        "notes": "Keep dry and tightly capped."
    },
    "bread": {
        "category": "Bakery",
        "icon": "🍞",
        "refrigerated_days": 10,
        "freezer_days": 90,
        "pantry_days": 5,
        "default_storage": "pantry",
        "notes": "Refrigeration accelerates staling, but stops mold."
    },
    "chicken": {
        "category": "Meat",
        "icon": "🍗",
        "refrigerated_days": 2,
        "freezer_days": 270,
        "pantry_days": 0,
        "default_storage": "refrigerator",
        "notes": "USDA: Raw poultry is safe in the fridge for only 1-2 days."
    },
    "fish": {
        "category": "Meat",
        "icon": "🐟",
        "refrigerated_days": 2,
        "freezer_days": 180,
        "pantry_days": 0,
        "default_storage": "refrigerator",
        "notes": "Cook within 1-2 days of purchase."
    }
}

def lookup_baseline_shelf_life(name: str) -> Dict[str, Any]:
    clean_name = name.lower().strip()
    if clean_name in SPOILAGE_BASELINE_DATA:
        return SPOILAGE_BASELINE_DATA[clean_name]
    for key, data in SPOILAGE_BASELINE_DATA.items():
        if key in clean_name or clean_name in key:
            return data
    return {
        "category": "Other",
        "icon": "📦",
        "refrigerated_days": 7,
        "freezer_days": 90,
        "pantry_days": 7,
        "default_storage": "pantry",
        "notes": "Standard perishable baseline. Check package expiration date."
    }

def calculate_shelf_life_decay(
    expiry_date_str: Optional[str],
    name: str = "",
    storage_location: str = "refrigerator",
    added_date_str: Optional[str] = None
) -> Dict[str, Any]:
    baseline = lookup_baseline_shelf_life(name)
    location_key = storage_location.lower()
    if "freez" in location_key:
        baseline_days = float(baseline.get("freezer_days", 90))
    elif "pant" in location_key or "room" in location_key:
        baseline_days = float(baseline.get("pantry_days", 7))
    else:
        baseline_days = float(baseline.get("refrigerated_days", 7))
        
    if baseline_days <= 0:
        baseline_days = 7.0

    now = datetime.now()
    today = now.date()

    if not expiry_date_str:
        exp_date = today + timedelta(days=int(baseline_days))
        expiry_date_str = exp_date.strftime("%Y-%m-%d")
    else:
        try:
            exp_date = datetime.strptime(expiry_date_str.strip(), "%Y-%m-%d").date()
        except ValueError:
            try:
                exp_date = datetime.fromisoformat(expiry_date_str.strip()).date()
            except Exception:
                exp_date = today + timedelta(days=int(baseline_days))
                expiry_date_str = exp_date.strftime("%Y-%m-%d")

    target_dt = datetime.combine(exp_date, datetime.max.time().replace(microsecond=0))
    time_delta = target_dt - now
    total_seconds_left = time_delta.total_seconds()
    days_left = (exp_date - today).days

    if days_left < 0:
        freshness_pct = 0.0
        status = "Expired"
        urgency = "Critical"
    else:
        ratio = max(0.0, min(1.0, (days_left + (time_delta.seconds / 86400.0)) / baseline_days))
        freshness_pct = round(100.0 * math.pow(ratio, 1.22), 1)
        freshness_pct = max(0.0, min(100.0, freshness_pct))

        if days_left == 0:
            status = "Expiring Today"
            urgency = "Urgent"
        elif days_left <= 3:
            status = "Expiring Soon"
            urgency = "High"
        elif freshness_pct >= 70.0:
            status = "Fresh"
            urgency = "Low"
        else:
            status = "Good"
            urgency = "Medium"

    if total_seconds_left <= 0:
        overdue_days = abs(days_left)
        countdown_formatted = f"Expired {overdue_days} day(s) ago"
        countdown_detail = {
            "is_expired": True,
            "days_left": days_left,
            "hours_left": 0,
            "minutes_left": 0,
            "total_seconds": 0,
            "display": countdown_formatted
        }
    else:
        hours = int((total_seconds_left % 86400) // 3600)
        minutes = int((total_seconds_left % 3600) // 60)
        countdown_formatted = f"{days_left}d {hours}h {minutes}m"
        countdown_detail = {
            "is_expired": False,
            "days_left": days_left,
            "hours_left": hours,
            "minutes_left": minutes,
            "total_seconds": int(total_seconds_left),
            "display": countdown_formatted
        }

    return {
        "ingredient_name": name,
        "expiry_date": expiry_date_str,
        "baseline_shelf_life_days": baseline_days,
        "storage_location": storage_location,
        "freshness_percentage": freshness_pct,
        "status": status,
        "urgency": urgency,
        "countdown": countdown_detail,
        "storage_tip": baseline.get("notes", "Keep stored properly.")
    }

def get_inventory_freshness_audit(ingredients: List[Any]) -> Dict[str, Any]:
    audit_items = []
    expired_items = []
    expiring_soon_items = []
    fresh_items = []

    for item in ingredients:
        name = getattr(item, "name", "")
        expiry = getattr(item, "expiry_date", None)
        storage = getattr(item, "storage_location", "refrigerator") if hasattr(item, "storage_location") else "refrigerator"
        item_id = getattr(item, "id", None)
        category = getattr(item, "category", "Other")
        quantity = getattr(item, "quantity", 1.0)
        unit = getattr(item, "unit", "pcs")
        icon = getattr(item, "icon", "📦")

        decay_data = calculate_shelf_life_decay(
            expiry_date_str=expiry,
            name=name,
            storage_location=storage
        )

        entry = {
            "id": item_id,
            "name": name,
            "icon": icon,
            "category": category,
            "quantity": quantity,
            "unit": unit,
            "expiry_date": decay_data["expiry_date"],
            "freshness_percentage": decay_data["freshness_percentage"],
            "status": decay_data["status"],
            "urgency": decay_data["urgency"],
            "countdown": decay_data["countdown"],
            "storage_location": storage,
            "storage_tip": decay_data["storage_tip"]
        }

        audit_items.append(entry)
        if decay_data["countdown"]["is_expired"]:
            expired_items.append(entry)
        elif decay_data["status"] in ["Expiring Soon", "Expiring Today"]:
            expiring_soon_items.append(entry)
        else:
            fresh_items.append(entry)

    audit_items.sort(key=lambda x: (x["countdown"]["days_left"], x["freshness_percentage"]))

    return {
        "timestamp": datetime.now().isoformat(),
        "total_items": len(audit_items),
        "expired_count": len(expired_items),
        "expiring_soon_count": len(expiring_soon_items),
        "fresh_count": len(fresh_items),
        "items": audit_items,
        "expiring_soon": expiring_soon_items,
        "expired": expired_items
    }
