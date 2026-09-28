from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class IngredientBase(BaseModel):
    name: str
    icon: Optional[str] = "📦"
    category: Optional[str] = "Other"
    quantity: float
    unit: str
    expiry_date: Optional[str] = None

class IngredientCreate(IngredientBase):
    user_id: Optional[str] = "default_user"
    storage_location: Optional[str] = "refrigerator"

class IngredientResponse(IngredientBase):
    id: int
    user_id: str
    storage_location: Optional[str] = "refrigerator"
    freshness_percentage: Optional[float] = None
    freshness_status: Optional[str] = None
    countdown: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    phone_number: Optional[str] = None

class MealPlanBase(BaseModel):
    day: str
    meal_type: str
    recipe_name: str

class MealPlanCreate(MealPlanBase):
    user_id: Optional[str] = "default_user"
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None

class MealPlanResponse(MealPlanBase):
    id: int
    user_id: str
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None

    class Config:
        from_attributes = True

class ZeroWasteRecipeRequest(BaseModel):
    item: Optional[str] = None
    cuisine: Optional[str] = "Indian"
    spices: Optional[str] = "General"
    dietary_pref: Optional[str] = None
    ingredients: Optional[List[Dict[str, Any]]] = None

class VoiceCommandRequest(BaseModel):
    text: str
    user_id: Optional[str] = "default_user"
    generate_audio: Optional[bool] = True

class WeeklyPlanRequest(BaseModel):
    dietary_goals: Optional[List[str]] = ["High Protein", "High Fiber"]
    calorie_target: Optional[int] = 2000
    family_size: Optional[int] = 2
    days: Optional[List[str]] = None
    user_id: Optional[str] = "default_user"
    auto_save: Optional[bool] = True
