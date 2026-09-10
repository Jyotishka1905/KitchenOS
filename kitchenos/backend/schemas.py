from pydantic import BaseModel
from typing import Optional

class IngredientBase(BaseModel):
    name: str
    icon: str
    category: str
    quantity: float
    unit: str
    expiry_date: str

class IngredientCreate(IngredientBase):
    user_id: Optional[str] = "default_user"

class IngredientResponse(IngredientBase):
    id: int
    user_id: Optional[str] = "default_user"

    class Config:
        from_attributes = True

class MealPlanCreate(BaseModel):
    day: str
    meal_type: str
    recipe_name: str
    user_id: Optional[str] = "default_user"

class MealPlanResponse(MealPlanCreate):
    id: int

    class Config:
        from_attributes = True