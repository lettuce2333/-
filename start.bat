@echo off
cd /d "%~dp0"
echo ========================================
echo   Starting Project
echo ========================================
echo.

echo Step 1/6: Building server...
cd apps\server
call ..\..\node_modules\.bin\nest build >nul 2>&1
cd /d "%~dp0"

echo Step 2/6: Starting backend (port 4000)...
start "Backend" cmd /c "cd /d "%~dp0apps\server" && node --import tsx dist\apps\server\src\main.js"

timeout /t 3 /nobreak >nul

echo Step 3/6: Starting web (port 3000)...
start "Web" cmd /c "cd /d "%~dp0apps\web" && node_modules\.bin\next.cmd dev -p 3000"

echo Step 4/6: Starting merchant (port 3001)...
start "Merchant" cmd /c "cd /d "%~dp0apps\merchant" && node_modules\.bin\next.cmd dev -p 3001"

echo Step 5/6: Starting admin (port 3002)...
start "Admin" cmd /c "cd /d "%~dp0apps\admin" && node_modules\.bin\next.cmd dev -p 3002"

echo Step 6/6: Starting miniapp (weapp compile)...
start "Miniapp" cmd /k "cd /d "%~dp0apps\miniapp" && npm run dev:weapp"

echo.
echo ========================================
echo   All services started!
echo   Web:      http://localhost:3000
echo   Merchant: http://localhost:3001
echo   Admin:    http://localhost:3002
echo   API:      http://localhost:4000
echo   Miniapp:  apps\miniapp\dist (import in WeChat DevTools)
echo ========================================
echo.
echo Close a window to stop that service.
pause
