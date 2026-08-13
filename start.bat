@echo off
title text2img
color 0E
chcp 65001 >nul
cd /d "%~dp0"
set "NODE_OPTIONS="
powershell -NoProfile -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; node node_modules\next\dist\bin\next dev | ForEach-Object { [Console]::WriteLine($_); if ($_ -match 'Ready') { [Console]::Title='text2img' } }"
pause
