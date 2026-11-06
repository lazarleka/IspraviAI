"""add user profile preferences

Revision ID: e356a2e628f8
Revises: eb96265ef2a9
Create Date: 2026-11-05 17:50:33.431399

"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e356a2e628f8"
down_revision: str | Sequence[str] | None = "eb96265ef2a9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("avatar_color", sa.String(length=12), server_default="amber", nullable=False)
        )
        batch_op.add_column(
            sa.Column("daily_goal", sa.Integer(), server_default="10", nullable=False)
        )
        batch_op.add_column(
            sa.Column("sound_enabled", sa.Boolean(), server_default=sa.true(), nullable=False)
        )
        batch_op.add_column(
            sa.Column("animations_enabled", sa.Boolean(), server_default=sa.true(), nullable=False)
        )
        batch_op.create_check_constraint(
            "avatar_color_allowed",
            "avatar_color IN ('blue', 'amber', 'green', 'purple', 'rose')",
        )
        batch_op.create_check_constraint(
            "daily_goal_range", "daily_goal >= 5 AND daily_goal <= 50"
        )


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_constraint("daily_goal_range", type_="check")
        batch_op.drop_constraint("avatar_color_allowed", type_="check")
        batch_op.drop_column("animations_enabled")
        batch_op.drop_column("sound_enabled")
        batch_op.drop_column("daily_goal")
        batch_op.drop_column("avatar_color")
