# -*- coding: utf-8 -*-
"""
CREATOROS - Python Core Engines Package
Chứa toàn bộ các Engine xử lý AI, Render Video, Download, Sync, RAG & Voice.
"""

import os
import sys

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.dirname(_CURRENT_DIR)
_PROJECT_ROOT = os.path.dirname(_PARENT_DIR)

for path in [_CURRENT_DIR, _PARENT_DIR, _PROJECT_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

