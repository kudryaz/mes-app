# Backend MES Приложения

Бэкенд для системы управления производством (MES), построенный на FastAPI с использованием PostgreSQL и JWT-аутентификации.

## Технологии

- **FastAPI** — современный веб-фреймворк для Python  
- **SQLAlchemy** — ORM для работы с базой данных  
- **PostgreSQL** — реляционная база данных  
- **Alembic** — миграции базы данных  
- **python-jose** — JWT токены  
- **passlib** — хэширование паролей  
- **Uvicorn** — ASGI сервер  

## Установка и запуск

### Требования

- Python 3.9+  
- PostgreSQL 13+  
- Poetry (опционально) или pip  

### Настройка окружения

1. **Клонируйте репозиторий и перейдите в папку backend**

```bash
cd backend
```

2. **Создайте виртуальное окружение**

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
# или
venv\Scripts\activate  # Windows
```

3. **Установите зависимости**

```bash
pip install -r requirements.txt
```

4. **Настройте переменные окружения**

Создайте файл `.env` в папке backend:

```env
DATABASE_URL=postgresql://user:password@localhost/mes_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. **Создайте базу данных**

```bash
# В PostgreSQL
createdb mes_db
```

6. **Примените миграции**

```bash
alembic upgrade head
```

7. **Заполните базу начальными данными**

```bash
python seed.py
```

8. **Запустите сервер разработки**

```bash
uvicorn app.main:app --reload --port 8000
```
