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