"""Pytest configuration and root fixtures."""
import os
import sys

# Ensure tests use safe defaults before any app imports happen.
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URL", "sqlite://")

# Add BackEnd directory to path so 'app' module is importable.
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
