import sys
import os
import shutil
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")


def backup_db(db_path: str | None = None):
    if db_path is None:
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mes.db")

    if not os.path.exists(db_path):
        print(f"База данных не найдена: {db_path}")
        return None

    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"mes_{timestamp}.db")
    shutil.copy2(db_path, backup_path)
    print(f"Резервная копия создана: {backup_path}")
    return backup_path


def list_backups():
    if not os.path.exists(BACKUP_DIR):
        print("Нет резервных копий.")
        return
    files = sorted(os.listdir(BACKUP_DIR))
    for f in files:
        path = os.path.join(BACKUP_DIR, f)
        size = os.path.getsize(path)
        mtime = datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d %H:%M:%S")
        print(f"  {f}  ({size} байт, {mtime})")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true", help="Список резервных копий")
    args = parser.parse_args()
    if args.list:
        list_backups()
    else:
        backup_db()
