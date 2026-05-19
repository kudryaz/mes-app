"""create initial tables

Revision ID: 001
Revises:
Create Date: 2026-05-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workshops",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("login", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(128), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("role", sa.Enum("admin", "workshop_chief", "operator", "manager", name="role"), nullable=False, server_default="operator"),
        sa.Column("workshop_id", sa.Integer, sa.ForeignKey("workshops.id"), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "production_orders",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("workshop_id", sa.Integer, sa.ForeignKey("workshops.id"), nullable=False),
        sa.Column("created_by", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("product_name", sa.String(200), nullable=False),
        sa.Column("product_code", sa.String(50), nullable=True),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("completed_quantity", sa.Integer, server_default="0"),
        sa.Column("deadline", sa.DateTime, nullable=False),
        sa.Column("status", sa.Enum("draft", "planned", "in_progress", "completed", "cancelled", name="orderstatus"), server_default="draft"),
        sa.Column("priority", sa.Enum("low", "medium", "high", "urgent", name="priority"), server_default="medium"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "order_tasks",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("production_orders.id"), nullable=False),
        sa.Column("operator_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("planned_quantity", sa.Integer, nullable=False),
        sa.Column("completed_quantity", sa.Integer, server_default="0"),
        sa.Column("status", sa.Enum("pending", "in_progress", "completed", "cancelled", name="taskstatus"), server_default="pending"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("order_tasks")
    op.drop_table("production_orders")
    op.drop_table("users")
    op.drop_table("workshops")
