from app.models.audit_log import AuditLog
from app.models.buyer_request import BuyerRequest
from app.models.match import Match
from app.models.transaction import Transaction
from app.models.listing import Listing
from app.models.buyer import Buyer
from app.models.farmer import Farmer
from app.models.user import User
from app.core.database import Base
from app.core.config import settings
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys

# Add project root to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# Import ALL models so Alembic can detect them

# Alembic Config object
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata


def get_database_url():
    return settings.DATABASE_URL


def run_migrations_offline():
    context.configure(
        url=get_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        {
            "sqlalchemy.url": get_database_url()
        },
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
