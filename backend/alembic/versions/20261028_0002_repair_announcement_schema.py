"""Repair announcement columns on databases migrated before they were added.

Revision ID: 20261028_0002
Revises: 20261028_0001
"""
from alembic import op
import sqlalchemy as sa

revision = "20261028_0002"
down_revision = "20261028_0001"
branch_labels = None
depends_on = None


def _columns(bind) -> set[str]:
    return {column["name"] for column in sa.inspect(bind).get_columns("announcements")}


def upgrade() -> None:
    bind = op.get_bind()
    if "announcements" not in sa.inspect(bind).get_table_names():
        return

    columns = _columns(bind)
    for legacy_name in ("user_id", "creator_id"):
        if legacy_name in columns and "created_by" not in columns:
            op.alter_column("announcements", legacy_name, new_column_name="created_by")
            break
    columns = _columns(bind)
    if "created_by" not in columns:
        op.add_column(
            "announcements",
            sa.Column(
                "created_by",
                sa.Integer(),
                sa.ForeignKey("users.user_id", ondelete="SET NULL"),
                nullable=True,
            ),
        )

    columns = _columns(bind)
    if "created_on" in columns and "published_at" not in columns:
        op.alter_column("announcements", "created_on", new_column_name="published_at")
    elif "published_at" not in columns:
        op.add_column(
            "announcements",
            sa.Column("published_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    raise RuntimeError("This data-preserving repair has no automatic downgrade")
