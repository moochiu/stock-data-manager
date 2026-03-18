@echo off
echo ========================================
echo   Stock Data Manager - GitHub Setup
echo ========================================
echo.

echo Step 1: Initializing Git repository...
git init
if errorlevel 1 (
    echo ERROR: Git initialization failed
    pause
    exit /b 1
)

echo.
echo Step 2: Adding all files...
git add .
if errorlevel 1 (
    echo ERROR: Git add failed
    pause
    exit /b 1
)

echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit - Stock Data Manager v1.2.0"
if errorlevel 1 (
    echo ERROR: Git commit failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Git repository initialized successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Create a new repository on GitHub
echo 2. Copy your repository URL
echo 3. Run: git remote add origin YOUR_REPOSITORY_URL
echo 4. Run: git push -u origin main
echo.
echo After pushing to GitHub, the automatic build will start.
echo Check the "Actions" tab in your GitHub repository for build progress.
echo.
pause
