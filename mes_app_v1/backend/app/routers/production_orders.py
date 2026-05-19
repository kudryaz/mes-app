from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, Workshop, ProductionOrder, OrderStatus
from app.schemas.schemas import (
    ProductionOrderCreate,
    ProductionOrderUpdate,
    ProductionOrderResponse,
    ProductionOrderDetail,
)
from app.dependencies.auth import get_current_user, require_role

router = APIRouter()


@router.get("/", response_model=list[ProductionOrderResponse])
def list_orders(
    status_filter: OrderStatus | None = None,
    workshop_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProductionOrder)
    if current_user.role == Role.workshop_chief:
        query = query.filter(ProductionOrder.workshop_id == current_user.workshop_id)
    elif current_user.role == Role.operator:
        if current_user.workshop_id:
            query = query.filter(ProductionOrder.workshop_id == current_user.workshop_id)
    if status_filter:
        query = query.filter(ProductionOrder.status == status_filter)
    if workshop_id and current_user.role in (Role.admin,):
        query = query.filter(ProductionOrder.workshop_id == workshop_id)
    return query.order_by(ProductionOrder.created_at.desc()).all()


@router.get("/{order_id}", response_model=ProductionOrderDetail)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    if current_user.role == Role.workshop_chief and order.workshop_id != current_user.workshop_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    return order


@router.post("/", response_model=ProductionOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.workshop_chief)),
):
    if current_user.role == Role.workshop_chief:
        if current_user.workshop_id != data.workshop_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Можно создавать заказы только для своего цеха")
    workshop = db.query(Workshop).filter(Workshop.id == data.workshop_id).first()
    if not workshop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Цех не найден")
    order = ProductionOrder(
        workshop_id=data.workshop_id,
        created_by=current_user.id,
        product_name=data.product_name,
        product_code=data.product_code,
        quantity=data.quantity,
        deadline=data.deadline,
        priority=data.priority,
        description=data.description,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}", response_model=ProductionOrderResponse)
def update_order(
    order_id: int,
    data: ProductionOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.workshop_chief)),
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    if current_user.role == Role.workshop_chief and order.workshop_id != current_user.workshop_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.workshop_chief)),
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    if current_user.role == Role.workshop_chief and order.workshop_id != current_user.workshop_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    db.delete(order)
    db.commit()
