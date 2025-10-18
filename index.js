const express = require('express');
const cors = require('cors');
const path = require('path');

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Test route to ensure basic functionality
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working',
        timestamp: new Date().toISOString()
    });
});

// Routes - wrapped in try-catch to prevent crashes
try {
    app.use('/api/recipes', require('./routes/recipes'));
    console.log('✅ Recipes route loaded');
} catch (error) {
    console.error('❌ Error loading recipes route:', error.message);
}

try {
    app.use('/api/meal-plans', require('./routes/mealPlans'));
    console.log('✅ Meal plans route loaded');
} catch (error) {
    console.error('❌ Error loading meal plans route:', error.message);
}

try {
    app.use('/api/ingredients', require('./routes/ingredients'));
    console.log('✅ Ingredients route loaded');
} catch (error) {
    console.error('❌ Error loading ingredients route:', error.message);
}

try {
    app.use('/api/batch', require('./routes/batchUpload'));
    console.log('✅ Batch upload route loaded');
} catch (error) {
    console.error('❌ Error loading batch upload route:', error.message);
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found' 
    });
});

// For Vercel deployment, export the app directly
// For local development, start the server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🍽️  Mealforge server running on port ${PORT}`);
        console.log(`📱 Open http://localhost:${PORT} to view the application`);
    });
}

module.exports = app;