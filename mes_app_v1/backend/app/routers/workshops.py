from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, Workshop
from app.schemas.schemas import WorkshopCreate, WorkshopUpdate, WorkshopResponse, WorkshopWithUsers
from app.dependencies.auth import get_current_user, require_role

router = APIRouter()


@router.get("/", response_model=list[WorkshopResponse])
def list_workshops(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == Role.workshop_chief:
        return db.query(Workshop).filter(Workshop.id == current_user.workshop_id).all()
    return db.query(Workshop).all()


@router.get("/{workshop_id}", response_model=WorkshopWithUsers)
def get_workshop(
    workshop_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin, Role.workshop_chief, Role.manager)),
):
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Цех не найден")
    return workshop


@router.post("/", response_model=WorkshopResponse, status_code=status.HTTP_201_CREATED)
def create_workshop(
    data: WorkshopCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    existing = db.query(Workshop).filter(Workshop.name == data.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Цех с таким названием уже существует")
    workshop = Workshop(name=data.name, description=data.description)
    db.add(workshop)
    db.commit()
    db.refresh(workshop)
    return workshop


@router.put("/{workshop_id}", response_model=WorkshopResponse)
def update_workshop(
    workshop_id: int,
    data: WorkshopUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Цех не найден")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workshop, key, value)
    db.commit()
    db.refresh(workshop)
    return workshop


@router.delete("/{workshop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workshop(
    workshop_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Цех не найден")
    db.delete(workshop)
    db.commit()
