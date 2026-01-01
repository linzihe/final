@echo off
chcp 65001 >nul
title The Allunity Order - 启动中...

cd /d "%~dp0"

echo.
echo ========================================
echo    The Allunity Order
echo    正在启动，请稍候...
echo ========================================
echo.

REM 检查并安装依赖
if not exist "node_modules" (
    echo [1/3] 正在安装依赖（首次运行需要几分钟）...
    call npm install
) else if not exist "node_modules\@supabase" (
    echo [1/3] 检测到新依赖，正在安装...
    call npm install
) else (
    echo [1/3] 依赖检查完成
)

echo [2/3] 检查 Supabase 配置...
if exist ".env.local" (
    echo [✓] 找到环境变量配置文件
) else (
    echo [⚠] 未找到 .env.local 文件
    echo     请确保已配置 Supabase 环境变量
)

echo [3/3] 正在启动服务器...
echo.
echo ========================================
echo   服务器启动后会自动打开浏览器
echo   按 Ctrl+C 可以停止服务器
echo ========================================
echo.

call npm run dev

pause
