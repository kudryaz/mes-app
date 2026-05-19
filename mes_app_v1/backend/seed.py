import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backup_db import backup_db
from app.database import engine, SessionLocal, Base
from app.models import User, Role, Workshop, Recipe, RecipeGelatinComponent, RecipeFillingComponent, CapsuleWeight, Batch, BatchComponent, BatchStatus, ComponentType
from app.services.auth_service import get_password_hash

DB_PATH = "mes.db"


def seed_users(db):
    if db.query(User).filter(User.role == Role.admin).first():
        print("  Пользователи уже существуют, пропуск.")
        return

    users_data = [
        ("admin", "admin", "Администратор", Role.admin, None, True),
        ("технолог_мжк", "технолог", "Технолог МЖК", Role.technologist, Workshop.mzhk, True),
        ("технолог_тжк", "технолог", "Технолог ТЖК", Role.technologist, Workshop.tzhk, True),
        ("бригадир_мжк", "бригадир", "Бригадир МЖК", Role.foreman, Workshop.mzhk, True),
        ("бригадир_тжк", "бригадир", "Бригадир ТЖК", Role.foreman, Workshop.tzhk, True),
        ("варщик_мжк", "варщик", "Варщик МЖК", Role.boiler_operator, Workshop.mzhk, False),
        ("оператор_мжк", "оператор", "Оператор МЖК", Role.machine_operator, Workshop.mzhk, False),
        ("отбраковка_мжк", "отбраковка", "Отбраковка МЖК", Role.sorter, Workshop.mzhk, False),
        ("отк_мжк", "отк", "ОТК МЖК", Role.quality_control, Workshop.mzhk, False),
        ("мастер_мжк", "мастер", "Мастер цеха МЖК", Role.workshop_master, Workshop.mzhk, False),
        ("механик_мжк", "механик", "Механик МЖК", Role.mechanic, Workshop.mzhk, False),
    ]

    users = {}
    for login, pwd, name, role, workshop, can_switch in users_data:
        u = User(
            login=login,
            hashed_password=get_password_hash(pwd),
            plain_password=pwd,
            name=name,
            role=role,
            workshop=workshop,
            can_switch_workshop=can_switch,
        )
        db.add(u)
        users[login] = u
    db.flush()

    print(f"  Создано {len(users)} пользователей.")


def seed_recipes(db):
    technologist_mzhk = db.query(User).filter(User.login == "технолог_мжк").first()
    if not technologist_mzhk:
        return
    created_by_id = technologist_mzhk.id

    if db.query(Recipe).count() > 0:
        print("  Рецепты уже существуют, пропуск.")
        return

    recipes = [
        {
            "workshop": Workshop.mzhk,
            "name": "Витамин Д3 250мг",
            "capsule_weight": CapsuleWeight.w250,
            "description": "Витамин Д3 для профилактики дефицита",
            "gelatin": [
                ("Желатин пищевой", 45.0, 0),
                ("Глицерин", 20.0, 1),
                ("Вода очищенная", 30.0, 2),
                ("Диоксид титана", 3.0, 3),
                ("Краситель жёлтый", 2.0, 4),
            ],
            "filling": [
                ("Масло подсолнечное", 95.0, 0),
                ("Витамин Д3 концентрат", 4.5, 1),
                ("Антиоксидант", 0.5, 2),
            ],
        },
        {
            "workshop": Workshop.mzhk,
            "name": "Омега-3 700мг",
            "capsule_weight": CapsuleWeight.w700,
            "description": "Омега-3 жирные кислоты из рыбьего жира",
            "gelatin": [
                ("Желатин пищевой", 40.0, 0),
                ("Глицерин", 18.0, 1),
                ("Вода очищенная", 35.0, 2),
                ("Диоксид титана", 5.0, 3),
                ("Краситель красный", 2.0, 4),
            ],
            "filling": [
                ("Рыбий жир концентрат", 96.0, 0),
                ("Витамин Е", 3.0, 1),
                ("Антиоксидант", 1.0, 2),
            ],
        },
        {
            "workshop": Workshop.mzhk,
            "name": "Лецитин 1350мг",
            "capsule_weight": CapsuleWeight.w1350,
            "description": "Соевый лецитин для поддержки печени",
            "gelatin": [
                ("Желатин пищевой", 38.0, 0),
                ("Глицерин", 16.0, 1),
                ("Вода очищенная", 38.0, 2),
                ("Карамель (краситель)", 6.0, 3),
                ("Сорбат калия", 2.0, 4),
            ],
            "filling": [
                ("Лецитин соевый", 90.0, 0),
                ("Масло подсолнечное", 8.0, 1),
                ("Витамин Е", 2.0, 2),
            ],
        },
    ]

    for r_data in recipes:
        recipe = Recipe(
            workshop=r_data["workshop"],
            created_by=created_by_id,
            name=r_data["name"],
            capsule_weight=r_data["capsule_weight"],
            description=r_data["description"],
        )
        db.add(recipe)
        db.flush()

        for name, pct, idx in r_data["gelatin"]:
            db.add(RecipeGelatinComponent(
                recipe_id=recipe.id,
                name=name,
                percentage=pct,
                order_index=idx,
            ))

        for name, pct, idx in r_data["filling"]:
            db.add(RecipeFillingComponent(
                recipe_id=recipe.id,
                name=name,
                percentage=pct,
                order_index=idx,
            ))

    print(f"  Создано {len(recipes)} тестовых рецептов МЖК.")

    technologist_tzhk = db.query(User).filter(User.login == "технолог_тжк").first()
    if not technologist_tzhk:
        return

    recipes_tzhk = [
        {
            "workshop": Workshop.tzhk,
            "name": "Ибупрофен 250мг",
            "capsule_weight": CapsuleWeight.w250,
            "description": "Ибупрофен для снятия боли и воспаления",
            "gelatin": [
                ("Желатин пищевой", 48.0, 0),
                ("Глицерин", 22.0, 1),
                ("Вода очищенная", 25.0, 2),
                ("Диоксид титана", 5.0, 3),
            ],
            "filling": [
                ("Ибупрофен", 70.0, 0),
                ("Масло подсолнечное", 28.0, 1),
                ("Лецитин", 2.0, 2),
            ],
        },
        {
            "workshop": Workshop.tzhk,
            "name": "Куркумин 700мг",
            "capsule_weight": CapsuleWeight.w700,
            "description": "Куркумин для поддержки иммунитета",
            "gelatin": [
                ("Желатин пищевой", 42.0, 0),
                ("Глицерин", 19.0, 1),
                ("Вода очищенная", 32.0, 2),
                ("Диоксид титана", 5.0, 3),
                ("Краситель жёлтый", 2.0, 4),
            ],
            "filling": [
                ("Куркумин экстракт", 85.0, 0),
                ("Масло кокосовое", 13.0, 1),
                ("Пиперин", 2.0, 2),
            ],
        },
    ]

    for r_data in recipes_tzhk:
        recipe = Recipe(
            workshop=r_data["workshop"],
            created_by=technologist_tzhk.id,
            name=r_data["name"],
            capsule_weight=r_data["capsule_weight"],
            description=r_data["description"],
        )
        db.add(recipe)
        db.flush()

        for name, pct, idx in r_data["gelatin"]:
            db.add(RecipeGelatinComponent(
                recipe_id=recipe.id,
                name=name,
                percentage=pct,
                order_index=idx,
            ))

        for name, pct, idx in r_data["filling"]:
            db.add(RecipeFillingComponent(
                recipe_id=recipe.id,
                name=name,
                percentage=pct,
                order_index=idx,
            ))

    print(f"  Создано {len(recipes_tzhk)} тестовых рецептов ТЖК.")


def seed_batches(db):
    if db.query(Batch).count() > 0:
        print("  Партии уже существуют, пропуск.")
        return

    foreman_mzhk = db.query(User).filter(User.login == "бригадир_мжк").first()
    recipe_omega = db.query(Recipe).filter(Recipe.name == "Омега-3 700мг").first()
    recipe_d3 = db.query(Recipe).filter(Recipe.name == "Витамин Д3 250мг").first()

    if not foreman_mzhk or not recipe_omega or not recipe_d3:
        print("  Пропуск партий: нет бригадира или рецептур.")
        return

    batch1 = Batch(
        workshop=Workshop.mzhk,
        recipe_id=recipe_omega.id,
        created_by=foreman_mzhk.id,
        capsule_count=1_000_000,
        status=BatchStatus.in_progress,
    )
    db.add(batch1)
    db.flush()

    batch2 = Batch(
        workshop=Workshop.mzhk,
        recipe_id=recipe_d3.id,
        created_by=foreman_mzhk.id,
        capsule_count=500_000,
        status=BatchStatus.planned,
    )
    db.add(batch2)
    db.flush()

    for recipe, batch in [(recipe_omega, batch1), (recipe_d3, batch2)]:
        from app.services.batch_service import calculate_batch
        calc = calculate_batch(recipe.capsule_weight.value, batch.capsule_count, recipe.gelatin_components, recipe.filling_components)
        for comp in calc["components"]:
            db.add(BatchComponent(
                batch_id=batch.id,
                type=comp["type"],
                name=comp["name"],
                percentage=comp["percentage"],
                required_kg=comp["required_kg"],
                order_index=comp["order_index"],
            ))

    print("  Создано 2 тестовые партии МЖК.")


def seed():
    print("Создание резервной копии...")
    backup_db(DB_PATH)

    print("Создание таблиц...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_users(db)
        seed_recipes(db)
        seed_batches(db)
        db.commit()
        print("Готово.")
    except Exception as e:
        db.rollback()
        print(f"Ошибка: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
