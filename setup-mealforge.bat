@echo off
echo ========================================
echo    Mealforge Setup and Installation
echo ========================================
echo.

echo Checking system requirements...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version for Windows
    echo After installation, restart this script
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
    node --version
)

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo Download the latest version for Windows
    echo After installation, restart this script
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Git is installed
    git --version
)

echo.
echo ========================================
echo    Installing Mealforge Dependencies
echo ========================================
echo.

echo Installing npm packages...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Setting Up Database
echo ========================================
echo.

echo Seeding database with sample data...
npm run seed
if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Setting Up Git Repository
echo ========================================
echo.

echo Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize Git repository
    pause
    exit /b 1
)

echo Adding remote repository...
git remote add origin https://github.com/KFitSmith1/MealForge.git
if %errorlevel% neq 0 (
    echo ❌ Failed to add remote repository
    pause
    exit /b 1
)

echo Adding all files to Git...
git add .
if %errorlevel% neq 0 (
    echo ❌ Failed to add files to Git
    pause
    exit /b 1
)

echo Committing changes...
git commit -m "Initial commit: Complete Mealforge application with all features"
if %errorlevel% neq 0 (
    echo ❌ Failed to commit changes
    pause
    exit /b 1
)

echo Pushing to GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo ❌ Failed to push to GitHub
    echo You may need to authenticate with GitHub
    echo.
    echo Please run these commands manually:
    echo git config --global user.name "Your Name"
    echo git config --global user.email "your.email@example.com"
    echo git push -u origin main
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Starting Mealforge Application
echo ========================================
echo.

echo Starting the application...
echo Open your browser and go to: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

npm run dev
