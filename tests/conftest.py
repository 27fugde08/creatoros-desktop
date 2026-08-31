import os
import sys
import pytest
import sqlite3
import tempfile
import asyncio

# Đảm bảo đường dẫn import thư mục gốc dự án
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Thiết lập môi trường kiểm thử cô lập
temp_user_data = tempfile.mkdtemp(prefix="creatoros_test_")
os.environ["CREATOROS_USER_DATA"] = temp_user_data
os.environ["CREATOROS_DB_PATH"] = os.path.join(temp_user_data, "test_creatoros_state.db")
os.environ["CREATOROS_CACHE_DIR"] = os.path.join(temp_user_data, "test_cache")

@pytest.fixture(autouse=True)
def clean_test_db():
    from state_manager import state_manager
    state_manager._init_tables()
    yield
