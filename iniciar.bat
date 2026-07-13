@echo off
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    python iniciar.py
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    py iniciar.py
    goto :eof
)

echo Python nao encontrado no PATH.
echo Instale Python (https://python.org) ou rode manualmente: npx serve .
pause
