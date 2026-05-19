import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship

from app.database import Base


class Role(str, enum.Enum):
    admin = "admin"
    foreman = "foreman"
    technologist = "technologist"
    boiler_operator = "boiler_operator"
    machine_operator = "machine_operator"
    sorter = "sorter"
    quality_control = "quality_control"
    workshop_master = "workshop_master"
    mechanic = "mechanic"


class Workshop(str, enum.Enum):
    mzhk = "mzhk"
    tzhk = "tzhk"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(128), nullable=False)
    plain_password = Column(String(50), nullable=False, server_default="")
    name = Column(String(100), nullable=False)
    role = Column(Enum(Role), nullable=False)
    workshop = Column(Enum(Workshop), nullable=True)
    can_switch_workshop = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_recipes = relationship("Recipe", back_populates="creator")


class CapsuleWeight(str, enum.Enum):
    w250 = "250"
    w700 = "700"
    w1350 = "1350"
    w1630 = "1630"


CAPSULE_RATIOS = {
    "250": (80, 170),
    "700": (200, 500),
    "1350": (350, 1000),
    "1630": (430, 1200),
}


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    workshop = Column(Enum(Workshop), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    capsule_weight = Column(Enum(CapsuleWeight), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", back_populates="created_recipes")
    gelatin_components = relationship(
        "RecipeGelatinComponent", back_populates="recipe", cascade="all, delete-orphan"
    )
    filling_components = relationship(
        "RecipeFillingComponent", back_populates="recipe", cascade="all, delete-orphan"
    )


class BatchStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    gelatin_ready = "gelatin_ready"
    filling_ready = "filling_ready"
    completed = "completed"
    cancelled = "cancelled"


class ComponentType(str, enum.Enum):
    gelatin = "gelatin"
    filling = "filling"


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    workshop = Column(Enum(Workshop), nullable=False)
    batch_number = Column(String(50), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    capsule_count = Column(Integer, nullable=False)
    status = Column(Enum(BatchStatus), nullable=False, default=BatchStatus.planned)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    recipe = relationship("Recipe")
    creator = relationship("User")
    components = relationship(
        "BatchComponent", back_populates="batch", cascade="all, delete-orphan"
    )


class BatchComponent(Base):
    __tablename__ = "batch_components"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    type = Column(Enum(ComponentType), nullable=False)
    name = Column(String(200), nullable=False)
    percentage = Column(Float, nullable=False)
    required_kg = Column(Float, nullable=False)
    added_kg = Column(Float, nullable=True)
    order_index = Column(Integer, default=0)

    batch = relationship("Batch", back_populates="components")


class RecipeGelatinComponent(Base):
    __tablename__ = "recipe_gelatin_components"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    name = Column(String(200), nullable=False)
    percentage = Column(Float, nullable=False)
    order_index = Column(Integer, default=0)

    recipe = relationship("Recipe", back_populates="gelatin_components")


class RecipeFillingComponent(Base):
    __tablename__ = "recipe_filling_components"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    name = Column(String(200), nullable=False)
    percentage = Column(Float, nullable=False)
    order_index = Column(Integer, default=0)

    recipe = relationship("Recipe", back_populates="filling_components")
