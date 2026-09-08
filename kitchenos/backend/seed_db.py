import csv
import os
from database import SessionLocal, engine
import models

# Ensure database tables exist
models.Base.metadata.create_all(bind=engine)

def seed_database(csv_file_path="ingredients.csv"):
    db = SessionLocal()
    
    if not os.path.exists(csv_file_path):
        print(f"Error: '{csv_file_path}' was not found in the current folder ({os.getcwd()}).")
        db.close()
        return

    # Clear existing data to avoid duplicates
    db.query(models.IngredientModel).delete()
    db.commit()

    with open(csv_file_path, mode="r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        count = 0
        for row in reader:
            db_item = models.IngredientModel(
                name=row["name"].strip(),
                icon=row.get("icon", "📦").strip(),
                category=row["category"].strip(),
                quantity=float(row["quantity"]),
                unit=row["unit"].strip(),
                expiry_date=row["expiry_date"].strip(),
                user_id=row.get("user_id", "default_user").strip()
            )
            db.add(db_item)
            count += 1
            
        db.commit()
        print(f"Successfully imported {count} items from {csv_file_path} into the database!")
    
    db.close()

if __name__ == "__main__":
    seed_database()