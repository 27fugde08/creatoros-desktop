@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo                 CREATOROS ENTERPRISE - WINDOWS BUILD SYSTEM
echo         Packaging Electron + Node.js IPC + Standalone Python Core (.exe)
echo ==============================================================================
echo.

:: 1. Kiem tra Node.js va npm
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js. Vui long cai dat Node.js v18+ tu https://nodejs.org
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay npm. Vui long kiem tra bien moi truong PATH.
    pause
    exit /b 1
)

:: 2. Kiem tra Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python. Vui long cai dat Python 3.10 - 3.12 tu https://python.org
    pause
    exit /b 1
)

echo [1/5] Cai dat goi phu thuoc Node.js (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [LOI] Khong the cai dat cac goi npm.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Cai dat moi truong Python va PyInstaller...
call python -m pip install --upgrade pip
call python -m pip install pyinstaller
if exist requirements.txt (
    call python -m pip install -r requirements.txt
)

echo.
echo [3/5] Kiem tra thu muc binaries ngoai vi (ffmpeg / ffprobe)...
if not exist "bin" (
    mkdir "bin"
    echo [THONG BAO] Da tao thu muc 'bin/'. Vui long copy ffmpeg.exe, ffprobe.exe vao day neu can nhung offline.
)
if not exist "dist_py" (
    mkdir "dist_py"
)

echo.
echo [4/5] Bien dich Python Core thanh Standalone Executable (PyInstaller)...
call pyinstaller --clean build.spec --distpath dist_py
if %errorlevel% neq 0 (
    echo [CANH BAO] PyInstaller gap loi hoac thieu thu vien, se dong goi ma nguon Python truc tiep.
)

echo.
echo [5/5] Xay dung Frontend, Express Server va Dong Goi Installer (Electron Builder)...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Bien dich Frontend / Server that bai.
    pause
    exit /b %errorlevel%
)

call npx electron-builder --win -c electron-builder.yml
if %errorlevel% neq 0 (
    echo [LOI] Qua trinh dong goi Electron Builder gap loi.
    pause
    exit /b %errorlevel%
)

echo.
echo ==============================================================================
echo  [THANH CONG] Trinh cai dat Standalone .exe da duoc tao tai thu muc 'release/':
echo    - release/CreatorOS Desktop Setup 1.0.0.exe (Trinh cai dat NSIS)
echo    - release/CreatorOS-Portable-1.0.0.exe (Ban Portable chay ngay)
echo ==============================================================================
echo.
pause
