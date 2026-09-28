"""
KitchenOS Backend Verification Test Suite
"""
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from spoilage_engine import calculate_shelf_life_decay, lookup_baseline_shelf_life
from zero_waste_chef import generate_zero_waste_recipe
from second_life_service import generate_upcycle_remedy
from voice_service import parse_kitchen_voice_command, execute_voice_actions_on_db
from planner_service import generate_family_meal_plan

from db import engine, SessionLocal, Base
import models_v2 as models

def run_tests():
    print("Testing KitchenOS Backend Services...")
    # 1. Spoilage
    decay = calculate_shelf_life_decay(None, name="Paneer", storage_location="refrigerator")
    assert decay["status"] in ["Fresh", "Good", "Expiring Soon"]
    print("✓ Spoilage engine verified")

    # 2. Zero-Waste Chef
    recipe = generate_zero_waste_recipe("Paneer", "Garlicky", "Indian")
    assert "recipe_text" in recipe
    print("✓ Zero-Waste chef verified")

    # 3. Second Life Hub
    remedy = generate_upcycle_remedy("Milk", "Dairy")
    assert "title" in remedy and "steps" in remedy
    print("✓ Second Life Hub verified")

    # 4. Voice Logging
    cmd = "Hey Kitchen OS, I just used half the cottage cheese and put 200g of cooked dal in the fridge"
    parsed = parse_kitchen_voice_command(cmd)
    assert len(parsed["actions"]) >= 2
    print("✓ Voice intent parser verified")

    # 5. Family Meal Planner
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        plan = generate_family_meal_plan(db, dietary_goals=["High Protein"], days=["Monday"])
        assert "weekly_plan" in plan
        print("✓ Family Meal Planner verified")
    finally:
        db.close()

    print("\nAll 5 modules verified successfully!")

if __name__ == "__main__":
    run_tests()
