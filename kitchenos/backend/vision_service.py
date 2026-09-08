import io
from PIL import Image
import cv2
import numpy as np
from ultralytics import YOLO

# Load lightweight YOLOv8 model (pretrained on COCO dataset, covering common grocery classes)
model = YOLO("yolov8n.pt")

def process_grocery_image(image_bytes: bytes):
    # Convert image bytes to a numpy array for OpenCV/YOLO processing
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_np = np.array(image)
    
    # Run YOLOv8 object detection
    results = model(img_np)
    
    detected_items = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            class_name = model.names[cls_id]
            
            # Filter for common grocery/food related classes or high confidence objects
            if conf > 0.4:
                detected_items.append({
                    "name": class_name.capitalize(),
                    "confidence": round(conf, 2),
                    "quantity": 1,
                    "unit": "pcs",
                    "category": "Other",
                    "icon": "🛒"
                })
                
    # Deduplicate detected items and aggregate quantities
    unique_items = {}
    for item in detected_items:
        name = item["name"]
        if name in unique_items:
            unique_items[name]["quantity"] += 1
        else:
            unique_items[name] = item
            
    return list(unique_items.values())