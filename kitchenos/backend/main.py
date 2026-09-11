from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import redis
import json

from database import engine, get_db
import models
import schemas
from vision_service import process_grocery_image
from alert_service import dispatch_expiry_alert
from recipe_service import generate_recipe
from upcycle_service import generate_upcycle_remedy

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KitchenOS API",
    description="Backend engine for smart pantry management and food waste reduction.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    cache = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    cache.ping()
except Exception:
    cache = None

# Background Scheduler for Automated Expiry Alarms
scheduler = BackgroundScheduler()

def check_expiring_pantry_alarms():
    try:
        db = next(get_db())
        ingredients = db.query(models.IngredientModel).all()
        today = datetime.now().date()
        expiring_soon = []

        for item in ingredients:
            if item.expiry_date:
                try:
                    exp_date = datetime.strptime(item.expiry_date, "%Y-%m-%d").date()
                    days_left = (exp_date - today).days
                    if days_left <= 3:
                        expiring_soon.append({
                            "name": item.name,
                            "quantity": item.quantity,
                            "unit": item.unit,
                            "days_left": days_left
                        })
                except Exception:
                    pass

        if expiring_soon:
            dispatch_expiry_alert(expiring_soon)
            
        db.close()
    except Exception as e:
        print(f"Alarm scheduler error: {e}")

@app.on_event("startup")
def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_expiring_pantry_alarms, 'interval', hours=12)
        scheduler.start()

@app.on_event("shutdown")
def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()

@app.get("/")
def read_root():
    return {"message": "Welcome to KitchenOS API", "docs": "/docs"}

@app.get("/api/health")
def health_check():
    cache_status = "offline (bypassed)"
    if cache:
        try:
            if cache.ping():
                cache_status = "active"
        except Exception:
            pass
    return {"status": "healthy", "database": "connected", "cache": cache_status}

@app.get("/api/test-sms-alarm")
def test_sms_alarm():
    check_expiring_pantry_alarms()
    return {"status": "triggered", "message": "Expiry alarm check and push alert dispatch executed manually."}

@app.post("/api/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.UserModel(
        name=user.name,
        email=user.email,
        password=user.password,
        phone_number=user.phone_number
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"status": "success", "message": "User registered successfully", "user_id": db_user.id}

@app.get("/api/ingredients", response_model=List[schemas.IngredientResponse])
def get_ingredients(db: Session = Depends(get_db)):
    if cache:
        try:
            cached_data = cache.get("pantry_inventory")
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass
    
    ingredients = db.query(models.IngredientModel).all()
    serialized = [
        {
            "id": i.id,
            "name": i.name,
            "icon": i.icon,
            "category": i.category,
            "quantity": i.quantity,
            "unit": i.unit,
            "expiry_date": i.expiry_date,
            "user_id": i.user_id
        }
        for i in ingredients
    ]
    
    if cache:
        try:
            cache.setex("pantry_inventory", 60, json.dumps(serialized))
        except Exception:
            pass
            
    return serialized

@app.post("/api/ingredients", response_model=schemas.IngredientResponse)
def add_ingredient(item: schemas.IngredientCreate, db: Session = Depends(get_db)):
    db_item = models.IngredientModel(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    if cache:
        try:
            cache.delete("pantry_inventory")
        except Exception:
            pass
            
    return db_item

@app.post("/api/scan-grocery")
async def scan_grocery_haul(file: UploadFile = File(...)):
    image_bytes = await file.read()
    detected_items = process_grocery_image(image_bytes)
    
    return {
        "status": "success",
        "items_found": len(detected_items),
        "ingredients": detected_items
    }

@app.get("/api/meal-plans")
def get_meal_plans(user_id: str = "default_user", db: Session = Depends(get_db)):
    return db.query(models.MealPlanModel).filter(models.MealPlanModel.user_id == user_id).all()

@app.post("/api/meal-plans")
def save_meal_plan(plan: schemas.MealPlanCreate, db: Session = Depends(get_db)):
    db_plan = models.MealPlanModel(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@app.get("/api/recipes/search")
def search_expiry_recipes(item: str, spices: str = "General", cuisine: str = "Indian", db: Session = Depends(get_db)):
    query_str = f"best {cuisine} recipe using {item} with {spices} spices"
    google_search_url = f"https://www.google.com/search?q={query_str.replace(' ', '+')}"
    
    return {
        "expiring_item": item,
        "selected_spices": spices,
        "selected_cuisine": cuisine,
        "google_search_url": google_search_url
    }

@app.get("/api/shopping/smart-list")
def generate_smart_shopping_list(db: Session = Depends(get_db)):
    ingredients = db.query(models.IngredientModel).all()
    today = datetime.now().date()
    
    expiring_items = []
    pantry_names = [i.name.lower() for i in ingredients]
    
    for item in ingredients:
        if item.expiry_date:
            try:
                exp_date = datetime.strptime(item.expiry_date, "%Y-%m-%d").date()
                if (exp_date - today).days <= 3:
                    expiring_items.append(item.name)
            except Exception:
                pass
                
    potential_needs = []
    for exp_item in expiring_items:
        if "milk" in exp_item.lower():
            potential_needs.extend(["Rice", "Sugar"])
        elif "tomato" in exp_item.lower():
            potential_needs.extend(["Onion", "Coriander"])
        else:
            potential_needs.extend(["Cooking Oil", "Fresh Herbs"])
            
    shopping_list_items = []
    for need in set(potential_needs):
        if need.lower() not in pantry_names:
            encoded_query = need.replace(" ", "%20")
            buy_link = f"https://www.blinkit.com/s/?q={encoded_query}"
            
            shopping_list_items.append({
                "id": len(shopping_list_items) + 1,
                "name": need,
                "category": "Groceries",
                "quantity": 1,
                "unit": "pack",
                "buy_link": buy_link,
                "store": "Blinkit"
            })
            
    return {
        "expiring_audit": expiring_items,
        "shopping_list": shopping_list_items
    }

@app.get("/api/second-life/remedies")
def get_second_life_remedies(db: Session = Depends(get_db)):
    ingredients = db.query(models.IngredientModel).all()
    today = datetime.now().date()
    
    dynamic_remedies = []
    remedy_id = 1
    
    for item in ingredients:
        is_expired = False
        is_expiring_soon = False
        
        if item.expiry_date:
            try:
                exp_date = datetime.strptime(item.expiry_date, "%Y-%m-%d").date()
                delta = (exp_date - today).days
                if delta < 0:
                    is_expired = True
                elif delta <= 3:
                    is_expiring_soon = True
            except Exception:
                pass
                
        if is_expired or is_expiring_soon or item.category in ["Vegetables", "Fruits"]:
            status_label = "Expired" if is_expired else ("Expiring Soon" if is_expiring_soon else "Pantry Stock")
            
            dynamic_remedies.append({
                "id": remedy_id,
                "category": f"Upcycle Guide ({status_label})",
                "title": f"Second Life Guide for {item.name}",
                "description": f"Your {item.name} is {status_label.lower()}. Give it a second life through composting or natural reuse.",
                "icon": "♻️",
                "steps": [
                    f"Assess the condition of {item.name}.",
                    "Chop and mix into composting soil bins if past consumption stage.",
                    "Alternatively, use citrus or peel varieties for natural surface cleaning infusions."
                ]
            })
            remedy_id += 1

    if not dynamic_remedies:
        dynamic_remedies.append({
            "id": 99,
            "category": "General Hub",
            "title": "Pantry Fresh",
            "description": "No items requiring immediate second-life intervention.",
            "icon": "✨",
            "steps": ["Monitor expiration dates as you add new stock."]
        })

    return {"remedies": dynamic_remedies}

@app.get("/api/alerts/expiring")
def get_expiring_alerts(db: Session = Depends(get_db)):
    ingredients = db.query(models.IngredientModel).all()
    today = datetime.now().date()
    expiring_soon = []

    for item in ingredients:
        if item.expiry_date:
            try:
                exp_date = datetime.strptime(item.expiry_date, "%Y-%m-%d").date()
                if (exp_date - today).days <= 3:
                    expiring_soon.append({
                        "name": item.name,
                        "expiry_date": item.expiry_date,
                        "days_left": (exp_date - today).days
                    })
            except Exception:
                pass

    return {
        "has_alerts": len(expiring_soon) > 0,
        "count": len(expiring_soon),
        "expiring_items": expiring_soon
    }

@app.get("/api/recipes/generate")
def api_generate_recipe(item: str, spices: str = "General", cuisine: str = "Indian"):
    return generate_recipe(item, spices, cuisine)

@app.get("/api/second-life/generate")
def api_generate_upcycle(item: str, category: str = "Produce"):
    return generate_upcycle_remedy(item, category)