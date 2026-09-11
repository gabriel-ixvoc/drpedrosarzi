@echo off
cd /d "%~dp0"
git add .
set /p msg="Mensagem do commit: "
set branch=update-%date:~6,4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%
set branch=%branch: =0%
git commit -m "%msg%"
git push origin HEAD:refs/heads/%branch%
echo.
echo Branch "%branch%" enviado para o GitHub.
echo Abrindo o link para criar o PR...
start https://github.com/gabriel-ixvoc/drpedrosarzi/compare/%branch%?expand=1
pause
