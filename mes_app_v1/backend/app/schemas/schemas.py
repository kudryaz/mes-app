from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models import Role, Workshop, CapsuleWeight, BatchStatus, ComponentType


class LoginRequest(BaseModel):
    login: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    login: str
    name: str
    role: Role
    workshop: Workshop | None = None
    can_switch_workshop: bool = False
    is_active: bool = True


class UserResponse(UserBase):
    id: int
    created_at: datetime
    password: str = ""

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    login: str | None = None
    name: str | None = None
    password: str | None = None
    role: Role | None = None
    workshop: Workshop | None = None
    can_switch_workshop: bool | None = None
    is_active: bool | None = None


class GelatinComponentBase(BaseModel):
    name: str
    percentage: float
    order_index: int = 0


class GelatinComponentCreate(GelatinComponentBase):
    pass


class GelatinComponentResponse(GelatinComponentBase):
    id: int
    recipe_id: int

    model_config = ConfigDict(from_attributes=True)


class FillingComponentBase(BaseModel):
    name: str
    percentage: float
    order_index: int = 0


class FillingComponentCreate(FillingComponentBase):
    pass


class FillingComponentResponse(FillingComponentBase):
    id: int
    recipe_id: int

    model_config = ConfigDict(from_attributes=True)


class RecipeBase(BaseModel):
    workshop: Workshop
    name: str
    capsule_weight: CapsuleWeight
    description: str | None = None


class RecipeCreate(RecipeBase):
    gelatin_components: list[GelatinComponentCreate] = []
    filling_components: list[FillingComponentCreate] = []


class RecipeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    gelatin_components: list[GelatinComponentCreate] | None = None
    filling_components: list[FillingComponentCreate] | None = None


class RecipeResponse(RecipeBase):
    id: int
    created_by: int
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime
    capsule_ratio: str | None = None
    gelatin_components: list[GelatinComponentResponse] = []
    filling_components: list[FillingComponentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RecipeDetail(RecipeResponse):
    creator: UserResponse | None = None


class BatchComponentResponse(BaseModel):
    id: int
    batch_id: int
    type: ComponentType
    name: str
    percentage: float
    required_kg: float
    added_kg: float | None = None
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class BatchResponse(BaseModel):
    id: int
    workshop: Workshop
    batch_number: str
    recipe_id: int
    recipe_name: str
    capsule_weight: CapsuleWeight
    capsule_ratio: str
    capsule_count: int
    total_mass_kg: float
    gelatin_mass_kg: float
    filling_mass_kg: float
    status: BatchStatus
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    components: list[BatchComponentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class BatchCreate(BaseModel):
    batch_number: str
    recipe_id: int
    capsule_count: int


class BatchStatusUpdate(BaseModel):
    status: BatchStatus
