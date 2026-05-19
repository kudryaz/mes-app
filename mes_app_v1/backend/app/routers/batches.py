from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, Workshop, Recipe, Batch, BatchComponent, BatchStatus, CapsuleWeight
from app.schemas.schemas import BatchCreate, BatchResponse, BatchStatusUpdate, BatchComponentResponse
from app.dependencies.auth import get_current_user, require_role
from app.services.batch_service import calculate_batch

router = APIRouter()


def batch_to_response(batch: Batch) -> BatchResponse:
    ratio_map = {"250": "80/170", "700": "200/500", "1350": "350/1000", "1630": "430/1200"}

    if batch.recipe:
        capsule_weight_str = batch.recipe.capsule_weight.value
        recipe_name = batch.recipe.name
        capsule_weight = batch.recipe.capsule_weight
        capsule_ratio = ratio_map.get(capsule_weight_str, "")
        total_mass_kg = round(float(batch.recipe.capsule_weight.value) / 1_000_000 * batch.capsule_count, 3)
    else:
        recipe_name = "Удалена"
        capsule_weight = CapsuleWeight.w250
        capsule_ratio = "80/170"
        total_mass_kg = 0

    components = [
        BatchComponentResponse(
            id=c.id,
            batch_id=c.batch_id,
            type=c.type,
            name=c.name,
            percentage=c.percentage,
            required_kg=c.required_kg,
            added_kg=c.added_kg,
            order_index=c.order_index,
        )
        for c in batch.components
    ]

    return BatchResponse(
        id=batch.id,
        workshop=batch.workshop,
        batch_number=batch.batch_number,
        recipe_id=batch.recipe_id,
        recipe_name=recipe_name,
        capsule_weight=capsule_weight,
        capsule_ratio=capsule_ratio,
        capsule_count=batch.capsule_count,
        total_mass_kg=total_mass_kg,
        gelatin_mass_kg=0,
        filling_mass_kg=0,
        status=batch.status,
        created_at=batch.created_at,
        started_at=batch.started_at,
        completed_at=batch.completed_at,
        components=components,
    )


def _enrich_mass(response: BatchResponse):
    ratio_str = response.capsule_ratio
    if "/" in ratio_str:
        parts = ratio_str.split("/")
        gel_part = int(parts[0])
        fill_part = int(parts[1])
        total_parts = gel_part + fill_part
        response.gelatin_mass_kg = round(response.total_mass_kg * gel_part / total_parts, 3)
        response.filling_mass_kg = round(response.total_mass_kg * fill_part / total_parts, 3)


@router.get("/", response_model=list[BatchResponse])
def list_batches(
    status_filter: str | None = None,
    workshop: Workshop | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.foreman, Role.workshop_master, Role.boiler_operator)),
):
    query = db.query(Batch)
    if current_user.role == Role.admin:
        if workshop:
            query = query.filter(Batch.workshop == workshop)
    else:
        query = query.filter(Batch.workshop == current_user.workshop)
    if status_filter:
        try:
            query = query.filter(Batch.status == BatchStatus(status_filter))
        except ValueError:
            pass
    batches = query.order_by(Batch.created_at.desc()).all()
    result = []
    for b in batches:
        resp = batch_to_response(b)
        _enrich_mass(resp)
        result.append(resp)
    return result


@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.foreman, Role.boiler_operator, Role.technologist, Role.workshop_master)),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Партия не найдена")
    if current_user.role not in (Role.workshop_master,) and batch.workshop != current_user.workshop:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к партии другого цеха")
    resp = batch_to_response(batch)
    _enrich_mass(resp)
    return resp


@router.post("/", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    data: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.foreman)),
):
    recipe = db.query(Recipe).filter(Recipe.id == data.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рецептура не найдена")
    if recipe.workshop != current_user.workshop:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Рецептура из другого цеха")
    if not recipe.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Рецептура неактивна")

    existing = db.query(Batch).filter(
        Batch.workshop == current_user.workshop,
        Batch.batch_number == data.batch_number,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Партия с номером '{data.batch_number}' уже существует в этом цехе",
        )

    calc = calculate_batch(
        capsule_weight=recipe.capsule_weight.value,
        capsule_count=data.capsule_count,
        gelatin_components=recipe.gelatin_components,
        filling_components=recipe.filling_components,
    )

    batch = Batch(
        workshop=current_user.workshop,
        batch_number=data.batch_number,
        recipe_id=data.recipe_id,
        created_by=current_user.id,
        capsule_count=data.capsule_count,
        status=BatchStatus.planned,
    )
    db.add(batch)
    db.flush()

    for comp in calc["components"]:
        db.add(BatchComponent(
            batch_id=batch.id,
            type=comp["type"],
            name=comp["name"],
            percentage=comp["percentage"],
            required_kg=comp["required_kg"],
            order_index=comp["order_index"],
        ))

    db.commit()
    db.refresh(batch)

    resp = batch_to_response(batch)
    _enrich_mass(resp)
    return resp


@router.patch("/{batch_id}/status", response_model=BatchResponse)
def update_batch_status(
    batch_id: int,
    data: BatchStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.foreman, Role.workshop_master)),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Партия не найдена")
    if current_user.role not in (Role.admin,) and batch.workshop != current_user.workshop:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к партии другого цеха")

    valid_transitions = {
        BatchStatus.planned: [BatchStatus.in_progress, BatchStatus.cancelled],
        BatchStatus.in_progress: [BatchStatus.gelatin_ready, BatchStatus.cancelled],
        BatchStatus.gelatin_ready: [BatchStatus.filling_ready, BatchStatus.cancelled],
        BatchStatus.filling_ready: [BatchStatus.completed],
        BatchStatus.completed: [],
        BatchStatus.cancelled: [],
    }

    allowed = valid_transitions.get(batch.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Нельзя перейти из '{batch.status.value}' в '{data.status.value}'",
        )

    batch.status = data.status
    if data.status == BatchStatus.in_progress and batch.started_at is None:
        batch.started_at = datetime.utcnow()
    if data.status == BatchStatus.completed:
        batch.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(batch)

    resp = batch_to_response(batch)
    _enrich_mass(resp)
    return resp


@router.patch("/{batch_id}/component/{component_id}/added", response_model=BatchResponse)
def update_component_added(
    batch_id: int,
    component_id: int,
    added_kg: float = Query(..., alias="added_kg"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.boiler_operator)),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Партия не найдена")
    if batch.workshop != current_user.workshop:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к партии другого цеха")

    component = db.query(BatchComponent).filter(
        BatchComponent.id == component_id,
        BatchComponent.batch_id == batch_id,
    ).first()
    if not component:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Компонент не найден")

    component.added_kg = added_kg
    db.commit()

    db.refresh(batch)
    resp = batch_to_response(batch)
    _enrich_mass(resp)
    return resp
