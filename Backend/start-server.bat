@echo off
echo Starting SkillSwap Backend Server...
echo.

cd /d "%~dp0"

echo Checking if Node.js is available...
node --version
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Starting server on port 5000...
echo Press Ctrl+C to stop the server
echo.

node server.js

pause