@echo off
echo ==========================================
echo  Pushing AspectEd Updates
echo ==========================================

REM Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not found in your PATH.
    echo Please install Git for Windows and restart your terminal.
    echo Download: https://git-scm.com/download/win
    pause
    exit /b
)

echo [1/3] Adding Changes...
git add .

echo [2/3] Committing...
git commit -m "feat: increased upload limit to 100MB+ and added large file support"

echo [3/3] Pushing to GitHub...
git push

echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Updates pushed successfully!
) else (
    echo [FAILURE] Something went wrong. Check above.
)
echo ==========================================
pause
