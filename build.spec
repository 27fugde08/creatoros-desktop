# -*- mode: python ; coding: utf-8 -*-
"""
CREATOROS Enterprise PyInstaller Spec
Tạo tệp thực thi độc lập (Standalone Executable) `creatoros_core.exe`
Nhúng toàn bộ Python Engine: JSON-RPC WebSocket Bridge, State Manager, Hardware Governor,
Local Vector RAG, QC Agent, No-Strike FFmpeg Engine, Voice Synthesis, Comic Engine.
"""

import sys
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None
project_dir = os.path.abspath(os.getcwd())

# 1. Thu thập các tệp dữ liệu & tài nguyên (Data files)
datas = [
    (os.path.join(project_dir, 'state_manager.py'), '.'),
    (os.path.join(project_dir, 'hardware_governor.py'), '.'),
    (os.path.join(project_dir, 'agentic_self_healing.py'), '.'),
    (os.path.join(project_dir, 'local_rag_engine.py'), '.'),
    (os.path.join(project_dir, 'qc_agent.py'), '.'),
    (os.path.join(project_dir, 'orchestrator_engine.py'), '.'),
    (os.path.join(project_dir, 'nostrike_engine.py'), '.'),
    (os.path.join(project_dir, 'bulk_downloader_engine.py'), '.'),
    (os.path.join(project_dir, 'local_voice_engine.py'), '.'),
    (os.path.join(project_dir, 'comic_engine.py'), '.'),
    (os.path.join(project_dir, 'fb_automation_engine.py'), '.'),
    (os.path.join(project_dir, 'ai_highlight_writer.py'), '.'),
    (os.path.join(project_dir, 'ai_review_recap.py'), '.'),
    (os.path.join(project_dir, 'tiktok_scraper.py'), '.'),
    (os.path.join(project_dir, 'transcript_analyzer.py'), '.'),
    (os.path.join(project_dir, 'video_render.py'), '.'),
]

# Thu thập thêm models/certificates hoặc assets nếu có
if os.path.exists(os.path.join(project_dir, 'assets')):
    datas.append((os.path.join(project_dir, 'assets'), 'assets'))

# 2. Thu thập binaries ngoại vi (ffmpeg.exe, ffprobe.exe, yt-dlp)
binaries = []
bin_dir = os.path.join(project_dir, 'bin')
if os.path.exists(bin_dir):
    for f in os.listdir(bin_dir):
        if f.lower().endswith(('.exe', '.dll', '.pyd')):
            binaries.append((os.path.join(bin_dir, f), 'bin'))

# 3. Thu thập Hidden Imports cho các thư viện AI/Async/Socket/PyTorch
hidden_imports = [
    'websockets',
    'websockets.legacy',
    'websockets.legacy.server',
    'asyncio',
    'sqlite3',
    'json',
    'hashlib',
    'psutil',
    'pynvml',
    'yt_dlp',
    'edge_tts',
    'pydub',
    'pydub.playback',
    'soundfile',
    'numpy',
    'google.genai',
    'fastapi',
    'uvicorn',
    'pydantic',
    'pydantic_settings',
    'state_manager',
    'hardware_governor',
    'agentic_self_healing',
    'local_rag_engine',
    'qc_agent',
    'orchestrator_engine',
    'nostrike_engine',
    'bulk_downloader_engine',
    'local_voice_engine',
    'comic_engine',
    'fb_automation_engine',
    'ai_highlight_writer',
    'ai_review_recap',
    'tiktok_scraper',
    'transcript_analyzer',
    'video_render'
]

# Tự động thu thập submodules của các package lớn nếu đã cài
for pkg in ['websockets', 'yt_dlp', 'edge_tts', 'pydantic']:
    try:
        hidden_imports.extend(collect_submodules(pkg))
    except Exception:
        pass

a = Analysis(
    ['py_ws_bridge.py'],
    pathex=[project_dir],
    binaries=binaries,
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'test', 'unittest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='creatoros_core',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True, # Hiển thị console phục vụ log stdout khi cần debug
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(project_dir, 'assets', 'icon.ico') if os.path.exists(os.path.join(project_dir, 'assets', 'icon.ico')) else None
)
