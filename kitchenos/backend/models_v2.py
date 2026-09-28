from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from db import Base

class IngredientModel(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    icon = Column(String, default="📦")
    category = Column(String, default="Other")
    quantity = Column(Float, default=1.0)
    unit = Column(String, default="pcs")
    expiry_date = Column(String, nullable=True)
    user_id = Column(String, default="default_user")
    household_id = Column(String, default="family")

    # Spoilage Engine fields
    storage_location = Column(String, default="refrigerator")
    baseline_shelf_life_days = Column(Float, nullable=True)
    freshness_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone_number = Column(String, nullable=True)

class MealPlanModel(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String)
    meal_type = Column(String)
    recipe_name = Column(String)
    user_id = Column(String, default="default_user")

    # Macro Analytics fields
    calories = Column(Integer, nullable=True)
    protein_g = Column(Float, nullable=True)
    carbs_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    pantry_ingredients = Column(String, nullable=True)
    dietary_tags = Column(String, nullable=True)
