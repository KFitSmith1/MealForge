# Mealforge Installation Guide

## Prerequisites Installation

### 1. Install Node.js
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS version** (recommended)
3. Run the installer and follow the setup wizard
4. Restart your command prompt/PowerShell after installation

### 2. Install Git
1. Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the latest version for Windows
3. Run the installer with default settings
4. Restart your command prompt/PowerShell after installation

## Quick Setup (Automated)

After installing Node.js and Git, run the automated setup script:

```bash
setup-mealforge.bat
```

This script will:
- ✅ Verify Node.js and Git installation
- ✅ Install all dependencies
- ✅ Seed the database with sample data
- ✅ Initialize Git repository
- ✅ Upload to GitHub
- ✅ Start the application

## Manual Setup

If you prefer to run commands manually:

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Setup Git Repository
```bash
git init
git remote add origin https://github.com/KFitSmith1/MealForge.git
git add .
git commit -m "Initial commit: Complete Mealforge application"
git push -u origin main
```

### 4. Start Application
```bash
npm run dev
```

## Access the Application

Once running, open your browser and go to:
**http://localhost:3000**

## Features Available

- 🍽️ **Recipe Management** - Create, edit, and organize recipes
- 📅 **Meal Planning** - Plan meals for days or weeks
- 🥕 **Ingredient Tracking** - Manage your pantry
- 🛒 **Shopping Lists** - Generate lists from meal plans
- 🔍 **Search & Filter** - Find recipes by various criteria
- 📊 **Dashboard** - View statistics and quick actions

## Troubleshooting

### If npm is not recognized:
- Restart your command prompt/PowerShell
- Verify Node.js installation: `node --version`

### If git is not recognized:
- Restart your command prompt/PowerShell
- Verify Git installation: `git --version`

### If GitHub push fails:
- Configure Git with your credentials:
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- You may need to authenticate with GitHub (use Personal Access Token)

## Next Steps

1. **Explore the application** - Try adding recipes and creating meal plans
2. **Connect Factory.ai droid** - Use the droid for enhanced development
3. **Customize features** - Modify the application to your needs
4. **Deploy** - Consider deploying to platforms like Heroku or Vercel

## Support

If you encounter any issues:
1. Check that Node.js and Git are properly installed
2. Restart your command prompt/PowerShell
3. Run the setup script again
4. Check the console for error messages
