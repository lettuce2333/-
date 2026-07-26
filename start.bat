@echo off
cd /d "%~dp0"
echo ========================================
echo   正在启动项目 - 请勿关闭此窗口
echo ========================================
echo.

echo [1/5] 构建后端...
cd apps\server
call ..\..\node_modules\.bin\nest build >nul 2>&1
cd /d "%~dp0"

echo [2/5] 启动后端 API (port 4000)...
start "Backend" cmd /c "cd /d "%~dp0apps\server" && node --import tsx dist\apps\server\src\main.js"

timeout /t 3 /nobreak >nul

echo [3/5] 启动买家端 (port 3000)...
start "Web" cmd /c "cd /d "%~dp0apps\web" && node_modules\.bin\next.cmd dev -p 3000"

echo [4/5] 启动商家端 (port 3001)...
start "Merchant" cmd /c "cd /d "%~dp0apps\merchant" && node_modules\.bin\next.cmd dev -p 3001"

echo [5/5] 启动管理后台 (port 3002)...
start "Admin" cmd /c "cd /d "%~dp0apps\admin" && node_modules\.bin\next.cmd dev -p 3002"

echo.
echo ========================================
echo   全部服务已启动！
echo   买家端:    http://localhost:3000
echo   商家端:    http://localhost:3001
echo   管理后台:  http://localhost:3002
echo   API:      http://localhost:4000
echo ========================================
echo.
echo 提示：关闭新窗口即停止对应服务。
echo 按任意键关闭本窗口...
pause >nul
