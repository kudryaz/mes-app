from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, Workshop, Recipe, RecipeGelatinComponent, RecipeFillingComponent, CapsuleWeight, CAPSULE_RATIOS
from app.schemas.schemas import RecipeCreate, RecipeUpdate, RecipeResponse, RecipeDetail
from app.dependencies.auth import get_current_user, require_role

router = APIRouter()


def get_ratio_str(capsule_weight: str) -> str:
    g, f = CAPSULE_RATIOS[capsule_weight]
    return f"{g}/{f}"


@router.get("/", response_model=list[RecipeResponse])
def list_recipes(
    workshop: Workshop | None = None,
    capsule_weight: CapsuleWeight | None = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    query = db.query(Recipe)
    if active_only:
        query = query.filter(Recipe.is_active == True)
    if workshop:
        query = query.filter(Recipe.workshop == workshop)
    if capsule_weight:
        query = query.filter(Recipe.capsule_weight == capsule_weight)
    recipes = query.order_by(Recipe.created_at.desc()).all()
    result = []
    for r in recipes:
        rec = RecipeResponse.model_validate(r)
        rec.capsule_ratio = get_ratio_str(r.capsule_weight.value)
        result.append(rec)
    return result


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рецептура не найдена")
    detail = RecipeDetail.model_validate(recipe)
    detail.capsule_ratio = get_ratio_str(recipe.capsule_weight.value)
    return detail


@router.post("/", response_model=RecipeDetail, status_code=status.HTTP_201_CREATED)
def create_recipe(
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.technologist)),
):
    recipe = Recipe(
        workshop=data.workshop,
        created_by=current_user.id,
        name=data.name,
        capsule_weight=data.capsule_weight,
        description=data.description,
    )
    db.add(recipe)
    db.flush()

    for i, comp in enumerate(data.gelatin_components):
        db.add(RecipeGelatinComponent(
            recipe_id=recipe.id,
            name=comp.name,
            percentage=comp.percentage,
            order_index=comp.order_index or i,
        ))

    for i, comp in enumerate(data.filling_components):
        db.add(RecipeFillingComponent(
            recipe_id=recipe.id,
            name=comp.name,
            percentage=comp.percentage,
            order_index=comp.order_index or i,
        ))

    db.commit()
    db.refresh(recipe)

    detail = RecipeDetail.model_validate(recipe)
    detail.capsule_ratio = get_ratio_str(recipe.capsule_weight.value)
    return detail


@router.put("/{recipe_id}", response_model=RecipeDetail)
def update_recipe(
    recipe_id: int,
    data: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.technologist)),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рецептура не найдена")

    update_data = data.model_dump(exclude_unset=True, exclude={"gelatin_components", "filling_components"})
    for key, value in update_data.items():
        setattr(recipe, key, value)

    if data.gelatin_components is not None:
        db.query(RecipeGelatinComponent).filter(RecipeGelatinComponent.recipe_id == recipe.id).delete()
        db.flush()
        for i, comp in enumerate(data.gelatin_components):
            db.add(RecipeGelatinComponent(
                recipe_id=recipe.id,
                name=comp.name,
                percentage=comp.percentage,
                order_index=comp.order_index or i,
            ))

    if data.filling_components is not None:
        db.query(RecipeFillingComponent).filter(RecipeFillingComponent.recipe_id == recipe.id).delete()
        db.flush()
        for i, comp in enumerate(data.filling_components):
            db.add(RecipeFillingComponent(
                recipe_id=recipe.id,
                name=comp.name,
                percentage=comp.percentage,
                order_index=comp.order_index or i,
            ))

    db.commit()
    db.refresh(recipe)

    detail = RecipeDetail.model_validate(recipe)
    detail.capsule_ratio = get_ratio_str(recipe.capsule_weight.value)
    return detail


@router.post("/{recipe_id}/new-version", response_model=RecipeDetail, status_code=status.HTTP_201_CREATED)
def create_new_version(
    recipe_id: int,
    data: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.admin, Role.technologist)),
):
    old = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not old:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рецептура не найдена")

    new_version = old.version + 1
    recipe = Recipe(
        workshop=old.workshop,
        created_by=current_user.id,
        name=data.name or old.name,
        capsule_weight=old.capsule_weight,
        description=data.description if data.description is not None else old.description,
        version=new_version,
    )
    db.add(recipe)
    db.flush()

    old_gel = db.query(RecipeGelatinComponent).filter(RecipeGelatinComponent.recipe_id == old.id).all()
    for i, c in enumerate(old_gel):
        db.add(RecipeGelatinComponent(
            recipe_id=recipe.id,
            name=c.name,
            percentage=c.percentage,
            order_index=c.order_index,
        ))

    old_fill = db.query(RecipeFillingComponent).filter(RecipeFillingComponent.recipe_id == old.id).all()
    for i, c in enumerate(old_fill):
        db.add(RecipeFillingComponent(
            recipe_id=recipe.id,
            name=c.name,
            percentage=c.percentage,
            order_index=c.order_index,
        ))

    if data.gelatin_components is not None:
        db.query(RecipeGelatinComponent).filter(RecipeGelatinComponent.recipe_id == recipe.id).delete()
        db.flush()
        for i, comp in enumerate(data.gelatin_components):
            db.add(RecipeGelatinComponent(
                recipe_id=recipe.id,
                name=comp.name,
                percentage=comp.percentage,
                order_index=comp.order_index or i,
            ))

    if data.filling_components is not None:
        db.query(RecipeFillingComponent).filter(RecipeFillingComponent.recipe_id == recipe.id).delete()
        db.flush()
        for i, comp in enumerate(data.filling_components):
            db.add(RecipeFillingComponent(
                recipe_id=recipe.id,
                name=comp.name,
                percentage=comp.percentage,
                order_index=comp.order_index or i,
            ))

    db.commit()
    db.refresh(recipe)

    detail = RecipeDetail.model_validate(recipe)
    detail.capsule_ratio = get_ratio_str(recipe.capsule_weight.value)
    return detail


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.admin, Role.technologist)),
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рецептура не найдена")
    db.delete(recipe)
    db.commit()
