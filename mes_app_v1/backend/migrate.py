import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backup_db import backup_db

DB_PATH = "mes.db"


def migrate():
    if not os.path.exists(DB_PATH):
        print("База данных не найдена. Сначала запустите seed.py")
        return

    # Backup before migration
    print("Создание резервной копии...")
    backup_db(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    def has_column(table, col_name):
        cols = cursor.execute(f"PRAGMA table_info({table})").fetchall()
        return any(c[1] == col_name for c in cols)

    migrations = [
        (
            "Add plain_password column",
            "ALTER TABLE users ADD COLUMN plain_password TEXT NOT NULL DEFAULT ''",
            lambda: not has_column("users", "plain_password"),
        ),
        (
            "Add can_switch_workshop column",
            "ALTER TABLE users ADD COLUMN can_switch_workshop BOOLEAN NOT NULL DEFAULT 0",
            lambda: not has_column("users", "can_switch_workshop"),
        ),
        (
            "Add batch_number column",
            "ALTER TABLE batches ADD COLUMN batch_number TEXT NOT NULL DEFAULT ''",
            lambda: not has_column("batches", "batch_number"),
        ),
    ]

    applied = 0
    for name, sql, needs in migrations:
        try:
            if needs():
                cursor.execute(sql)
                conn.commit()
                print(f"  Миграция: {name}")
                applied += 1
            else:
                print(f"  Пропуск: {name} (уже применена)")
        except Exception as e:
            print(f"  Ошибка в миграции '{name}': {e}")

    conn.close()

    if applied == 0:
        print("Все миграции уже применены.")
    else:
        print(f"Применено миграций: {applied}")


if __name__ == "__main__":
    migrate()
