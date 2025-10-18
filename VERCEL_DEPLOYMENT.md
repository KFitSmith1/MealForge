# Mealforge - Vercel Deployment Guide

## Quick Deploy to Vercel

1. **Fork or clone this repository**
2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository

3. **Deploy:**
   - Vercel will automatically detect this as a Node.js project
   - The `vercel.json` configuration will handle the routing
   - Click "Deploy"

## Troubleshooting Deployment Issues

### If you get "FUNCTION_INVOCATION_FAILED" error:

1. **Check the Vercel Function Logs:**
   - Go to your Vercel dashboard
   - Click on your project
   - Go to "Functions" tab
   - Check the logs for specific error messages

2. **Common Issues and Solutions:**

   **Issue: Route loading errors**
   - The app now includes error handling for route loading
   - Check the function logs for specific route errors

   **Issue: Memory limits**
   - File uploads are limited to 10MB
   - Large CSV files might cause memory issues

   **Issue: Environment variables**
   - Make sure NODE_ENV is set to "production" in Vercel
   - Check that no required environment variables are missing

3. **Test the API endpoints:**
   - Visit `https://your-app.vercel.app/api/test` to test basic functionality
   - Check if individual routes are working

## Important Notes

### Database Limitations
- **This app uses an in-memory database** - data will be lost when the serverless function restarts
- For production use, consider migrating to a persistent database like:
  - MongoDB Atlas (free tier available)
  - PostgreSQL with Supabase
  - Firebase Firestore

### File Upload Limitations
- File uploads are processed in memory (no persistent storage)
- Files are processed and then discarded
- Maximum file size: 10MB

### Environment Variables
No environment variables are required for basic functionality.

## Local Development

```bash
npm install
npm start
```

The app will run on `http://localhost:3000`

## Production Considerations

1. **Database Migration**: Replace the in-memory database with a persistent solution
2. **File Storage**: Consider using cloud storage (AWS S3, Cloudinary) for file uploads
3. **Environment Variables**: Add production environment variables as needed

## API Endpoints

- `GET /api/test` - Test endpoint to verify API is working
- `GET /api/recipes` - Get all recipes
- `POST /api/recipes` - Create a recipe
- `GET /api/meal-plans` - Get all meal plans
- `POST /api/meal-plans` - Create a meal plan
- `GET /api/ingredients` - Get all ingredients
- `POST /api/ingredients` - Create an ingredient
- `POST /api/batch/recipes/csv` - Upload recipes from CSV
- `POST /api/batch/ingredients/csv` - Upload ingredients from CSV
- `POST /api/batch/recipes/pdf` - Upload recipes from PDF

## Recent Changes for Vercel Compatibility

- Added error handling for route loading
- Improved error messages for production vs development
- Added test endpoint for debugging
- Simplified Vercel configuration
- Added `.vercelignore` file
