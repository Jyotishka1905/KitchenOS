from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class IngredientModel(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    icon = Column(String, default="🛒")
    category = Column(String, default="Other")
    quantity = Column(Float, default=1.0)
    unit = Column(String, default="pcs")
    expiry_date = Column(String, nullable=True)
    user_id = Column(String, default="default_user")
    household_id = Column(String, default="family_household", index=True)

class MealPlanModel(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, index=True) # e.g., "Monday", "Tuesday"
    meal_type = Column(String)       # "Breakfast", "Lunch", "Dinner"
    recipe_name = Column(String)     # Name of the meal or recipe
    user_id = Column(String, index=True, default="default_user")
    household_id = Column(String, default="family_household", index=True)

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone_number = Column(String, nullable=True)