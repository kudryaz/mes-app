from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role
from app.schemas.schemas import UserCreate, UserUpdate, UserResponse
from app.dependencies.auth import get_current_user, require_role
from app.services.auth_service import get_password_hash

router = APIRouter()


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        login=user.login,
        name=user.name,
        role=user.role,
        workshop=user.workshop,
        can_switch_workshop=user.can_switch_workshop,
        is_active=user.is_active,
        created_at=user.created_at,
        password=user.plain_password,
    )


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    users = db.query(User).all()
    return [user_to_response(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    return user_to_response(user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    existing = db.query(User).filter(User.login == data.login).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Логин уже существует")
    user = User(
        login=data.login,
        hashed_password=get_password_hash(data.password),
        plain_password=data.password,
        name=data.name,
        role=data.role,
        workshop=data.workshop,
        can_switch_workshop=data.can_switch_workshop,
        is_active=data.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_response(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    if data.login is not None:
        existing = db.query(User).filter(User.login == data.login, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Логин уже существует")
        user.login = data.login

    if data.password is not None and data.password != "":
        user.hashed_password = get_password_hash(data.password)
        user.plain_password = data.password

    if data.name is not None:
        user.name = data.name
    if data.role is not None:
        user.role = data.role
    if data.workshop is not None:
        user.workshop = data.workshop
    if data.can_switch_workshop is not None:
        user.can_switch_workshop = data.can_switch_workshop
    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)
    return user_to_response(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    db.delete(user)
    db.commit()
