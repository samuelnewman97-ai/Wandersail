@echo off
title Wandersail - Katie's Travel Journal
cd /d "%~dp0"
color 0E

echo.
echo  ==============================================
echo     WANDERSAIL - Katie's Travel Journal
echo  ==============================================
echo.
echo   Starting the local server...
echo   Your browser will open in a moment.
echo   Keep this window open while using the app.
echo   Close this window when you're done.
echo.

start "" /b cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

call npm run dev
