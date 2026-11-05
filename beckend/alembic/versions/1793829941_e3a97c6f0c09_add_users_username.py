"""add users username

Revision ID: e3a97c6f0c09
Revises: 7e6cf7ecb4d9
Create Date: 2026-11-04 23:05:41.511028

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e3a97c6f0c09"
down_revision: str | Sequence[str] | None = "7e6cf7ecb4d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("username", sa.String(length=20), nullable=True))

    users = sa.table(
        "users",
        sa.column("id", sa.Integer()),
        sa.column("username", sa.String(length=20)),
    )
    op.execute(
        users.update().values(username=sa.literal("user_") + sa.cast(users.c.id, sa.String()))
    )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_email"))
        batch_op.alter_column("username", existing_type=sa.String(length=20), nullable=False)
        batch_op.create_check_constraint(
            batch_op.f("ck_users_username_length"),
            "length(username) >= 3 AND length(username) <= 20",
        )
        batch_op.create_unique_constraint(batch_op.f("uq_users_email"), ["email"])
        batch_op.create_unique_constraint(batch_op.f("uq_users_username"), ["username"])
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=False)
        batch_op.create_index(batch_op.f("ix_users_username"), ["username"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_username"))
        batch_op.drop_index(batch_op.f("ix_users_email"))
        batch_op.drop_constraint(batch_op.f("uq_users_username"), type_="unique")
        batch_op.drop_constraint(batch_op.f("uq_users_email"), type_="unique")
        batch_op.drop_constraint(batch_op.f("ck_users_username_length"), type_="check")
        batch_op.drop_column("username")
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=True)
