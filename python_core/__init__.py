# -*- coding: utf-8 -*-
"""
CREATOROS - Python Core Package Root
Tự động cấu hình sys.path để các module con và engines có thể import lẫn nhau thuận tiện.
"""

import os
import sys

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_ENGINES_DIR = os.path.join(_CURRENT_DIR, "engines")
_PROJECT_ROOT = os.path.dirname(_CURRENT_DIR)

for path in [_CURRENT_DIR, _ENGINES_DIR, _PROJECT_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)
