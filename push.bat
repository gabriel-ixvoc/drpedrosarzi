@echo off
cd /d "%~dp0"
git add .
set /p msg="Mensagem do commit: "
git commit -m "%msg%"
git push origin HEAD:main
echo.
echo Pronto! Alteracoes enviadas para o GitHub.
pause
