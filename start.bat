@echo off
title text2img
color 0E
cd /d "%~dp0"
set "NODE_OPTIONS="
echo.
echo  ============================================
echo    text2img
echo  ============================================
echo.
node node_modules\next\dist\bin\next dev
pause
