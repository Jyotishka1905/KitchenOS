"""
KitchenOS Backend Verification Test Suite
=========================================
Tests all 5 backend modules and API contracts:
1. Deterministic Spoilage Engine (USDA FoodKeeper + Indian Staples decay formulas)
2. Zero-Waste Chef (Inverted meal planning & structured recipe output)
3. Second Life Hub (Knowledge retrieval upcycling protocols)
4. Voice Inventory Logging (Natural command parsing & ElevenLabs synthesis)
5. Family Meal Planner & Macro Analytics (Pantry cross-referencing & macro balancing)
"""

import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from spoilage_engine import calculate_shelf_life_decay, lookup_baseline_shelf_life, SPOILAGE_BASELINE_DATA
from zero_waste_chef import generate_zero_waste_recipe, prioritize_inventory_for_cooking
from second_life_service import generate_upcycle_remedy, CURATED_SECOND_LIFE_KB
from voice_service import parse_kitchen_voice_command, execute_voice_actions_on_db
from planner_service import generate_family_meal_plan

from database import engine, SessionLocal, Base
import models

def test_spoilage_engine():
    print("\n--- [1] Testing Deterministic Spoilage Engine ---")
    
    # Test baseline lookup
    paneer_base = lookup_baseline_shelf_life("Paneer")
    assert paneer_base["refrigerated_days"] == 4, "Paneer shelf life should be 4 days"
    print(f"✓ Baseline lookup for 'Paneer': {paneer_base['refrigerated_days']} days (Storage: {paneer_base['default_storage']})")
    
    # Test decay calculation for item expiring in 2 days
    from datetime import datetime, timedelta
    exp_2_days = (datetime.now().date() + timedelta(days=2)).strftime("%Y-%m-%d")
    decay = calculate_shelf_life_decay(exp_2_days, name="Paneer", storage_location="refrigerator")
    print(f"✓ Decay calculation for Paneer expiring in 2 days:")
    print(f"   - Freshness: {decay['freshness_percentage']}%")
    print(f"   - Status: {decay['status']}")
    print(f"   - Urgency: {decay['urgency']}")
    print(f"   - Countdown display: {decay['countdown']['display']}")
    assert decay["status"] in ["Expiring Soon", "Good"], "Status should be Expiring Soon or Good"
    assert decay["freshness_percentage"] > 0, "Freshness should be positive"

    # Test expired item
    exp_past = (datetime.now().date() - timedelta(days=2)).strftime("%Y-%m-%d")
    decay_exp = calculate_shelf_life_decay(exp_past, name="Milk", storage_location="refrigerator")
    assert decay_exp["countdown"]["is_expired"] is True, "Should be marked expired"
    assert decay_exp["freshness_percentage"] == 0.0, "Freshness should be 0.0 for expired item"
    print(f"✓ Expired item calculation for Milk: {decay_exp['status']}, Countdown: {decay_exp['countdown']['display']}")

def test_zero_waste_chef():
    print("\n--- [2] Testing Zero-Waste Chef Recipe Engine ---")
    
    recipe = generate_zero_waste_recipe(
        item="Paneer",
        spices="Garlicky",
        cuisine="Indian",
        other_inventory=[{"name": "Tomatoes", "quantity": 3, "unit": "pcs"}, {"name": "Onions", "quantity": 1, "unit": "kg"}]
    )
    
    assert "recipe_text" in recipe, "Recipe must contain recipe_text for existing frontend UI"
    assert "expiring_item" in recipe, "Recipe must contain expiring_item"
    assert recipe["expiring_item"] == "Paneer"
    assert "structured_recipe" in recipe, "Recipe must contain structured_recipe"
    
    print(f"✓ Generated Recipe Title: {recipe['title']}")
    print(f"✓ Prep Time: {recipe['prep_time']} | Cook Time: {recipe['cook_time']} | Difficulty: {recipe['difficulty']}")
    print(f"✓ Nutrition Analytics: {recipe['macro_analytics']}")
    print(f"✓ Frontend contract recipe_text sample:\n{recipe['recipe_text'][:180]}...")

def test_second_life_hub():
    print("\n--- [3] Testing Second Life Hub Knowledge Retrieval ---")
    
    remedy = generate_upcycle_remedy("Milk", "Dairy")
    assert "category" in remedy, "Must contain category"
    assert "title" in remedy, "Must contain title"
    assert "steps" in remedy and len(remedy["steps"]) > 0, "Must contain actionable steps list"
    
    print(f"✓ Second Life Remedy for Milk:")
    print(f"   - Category: {remedy['category']}")
    print(f"   - Title: {remedy['title']}")
    print(f"   - Steps Count: {len(remedy['steps'])}")
    print(f"   - Sample Step: {remedy['steps'][0]}")

def test_voice_inventory_logging():
    print("\n--- [4] Testing Voice Inventory Logging & Quick Updates ---")
    
    # Test kitchen speech command parsing
    spoken_phrase = "Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge"
    parsed = parse_kitchen_voice_command(spoken_phrase)
    
    print(f"✓ Input Command: '{spoken_phrase}'")
    print(f"✓ Actions Parsed ({len(parsed['actions'])}):")
    for a in parsed["actions"]:
        print(f"   - Action: {a['action']} | Item: {a['item_name']} | Qty: {a['quantity']} {a['unit']}")
    print(f"✓ Conversational Confirmation: \"{parsed['confirmation_message']}\"")
    
    assert len(parsed["actions"]) >= 2, "Should parse at least 2 distinct actions"

    # Test DB execution with in-memory SQLite session
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed test items
        db.query(models.IngredientModel).delete()
        db.add(models.IngredientModel(name="Cottage Cheese", quantity=400.0, unit="grams", category="Dairy"))
        db.commit()

        results = execute_voice_actions_on_db(parsed["actions"], db, user_id="test_user")
        print(f"✓ Database Execution Results ({len(results)}):")
        for res in results:
            print(f"   - Status: {res.get('status')} | Item: {res.get('item_name')} | Prev: {res.get('previous_quantity')} -> New: {res.get('new_quantity')}")
            
        # Verify cottage cheese was halved
        updated_cheese = db.query(models.IngredientModel).filter(models.IngredientModel.name == "Cottage Cheese").first()
        assert updated_cheese.quantity == 200.0, f"Expected 200.0, got {updated_cheese.quantity}"
        print(f"✓ Verified Cottage Cheese was reduced from 400g to {updated_cheese.quantity}g")
        
        # Verify cooked dal was added
        dal_item = db.query(models.IngredientModel).filter(models.IngredientModel.name == "Cooked Dal").first()
        assert dal_item is not None, "Cooked Dal should have been added"
        print(f"✓ Verified Cooked Dal was added with expiry date: {dal_item.expiry_date}")
    finally:
        db.close()

def test_family_meal_planner():
    print("\n--- [5] Testing Family Meal Planner & Macro Analytics ---")
    
    db = SessionLocal()
    try:
        plan = generate_family_meal_plan(
            db=db,
            dietary_goals=["High Protein", "High Fiber"],
            calorie_target=2100,
            family_size=3,
            days=["Saturday", "Sunday"],
            user_id="test_family",
            auto_save_to_db=False
        )
        
        assert "weekly_plan" in plan, "Must have weekly_plan"
        assert "macro_analytics" in plan, "Must have macro_analytics"
        print(f"✓ Generated {len(plan['weekly_plan'])} meals for weekend schedule")
        print(f"✓ Sample Meal: {plan['weekly_plan'][0]['recipe_name']}")
        print(f"   - Macros: {plan['weekly_plan'][0]['macros']}")
        print(f"   - Pantry ingredients used: {plan['weekly_plan'][0]['pantry_ingredients_used']}")
        print(f"✓ Macro Analytics:")
        print(f"   - Daily Protein Avg: {plan['macro_analytics'].get('average_daily_protein_g')}g")
        print(f"   - Daily Fiber Avg: {plan['macro_analytics'].get('average_daily_fiber_g')}g")
        print(f"   - Pantry Utilization Rate: {plan['macro_analytics'].get('pantry_utilization_rate_pct')}%")
        print(f"   - Goal Summary: {plan['macro_analytics'].get('goal_achievement_summary')}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("KITCHENOS BACKEND VERIFICATION SUITE")
    print("=" * 60)
    test_spoilage_engine()
    test_zero_waste_chef()
    test_second_life_hub()
    test_voice_inventory_logging()
    test_family_meal_planner()
    print("\n" + "=" * 60)
    print("ALL 5 BACKEND MODULE TESTS COMPLETED WITH 100% SUCCESS!")
    print("=" * 60)
