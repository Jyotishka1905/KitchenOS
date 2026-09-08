from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import redis
import json

from database import engine, get_db
import models
import schemas
from vision_service import process_grocery_image

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KitchenOS API",
    description="Backend engine for smart pantry management and food waste reduction.",
    version="1.0.0"
)

# Enable CORS for Vite frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to local Redis instance with error handling
try:
    cache = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    cache.ping()
except Exception:
    cache = None

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
            
    return ingredients

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