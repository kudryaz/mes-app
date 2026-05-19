from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, ProductionOrder, OrderTask, TaskStatus
from app.schemas.schemas import OrderTaskCreate, OrderTaskUpdate, OrderTaskResponse, OrderTaskDetail, OperatorTaskResponse
from app.dependencies.auth import get_current_user, require_role

router = APIRouter()


@router.get("/", response_model=list[OperatorTaskResponse])
def list_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(OrderTask)
    if current_user.role == Role.operator:
        query = query.filter(OrderTask.operator_id == current_user.id)
    elif current_user.role == Role.workshop_chief:
        query = (
            query.join(ProductionOrder)
            .filter(ProductionOrder.workshop_id == current_user.workshop_id)
        )
    return query.order_by(OrderTask.created_at.desc()).all()


@router.get("/{task_id}", response_model=OrderTaskDetail)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin, Role.workshop_chief, Role.manager)),
):
    task = db.query(OrderTask).filter(OrderTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задание не найдено")
    return task


@router.post("/", response_model=OrderTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    data: OrderTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.workshop_chief)),
):
    order = db.query(ProductionOrder).filter(ProductionOrder.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    if current_user.role == Role.workshop_chief and order.workshop_id != current_user.workshop_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    operator = db.query(User).filter(User.id == data.operator_id, User.role == Role.operator).first()
    if not operator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Оператор не найден")
    task = OrderTask(
        order_id=data.order_id,
        operator_id=data.operator_id,
        description=data.description,
        planned_quantity=data.planned_quantity,
        notes=data.notes,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=OrderTaskResponse)
def update_task(
    task_id: int,
    data: OrderTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(OrderTask).filter(OrderTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задание не найдено")
    if current_user.role == Role.operator and task.operator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа")
    if current_user.role == Role.operator:
        allowed_fields = {"completed_quantity", "status", "notes"}
        update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if k in allowed_fields}
    else:
        update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin, Role.workshop_chief)),
):
    task = db.query(OrderTask).filter(OrderTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Задание не найдено")
    db.delete(task)
    db.commit()
