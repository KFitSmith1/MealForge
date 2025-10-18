const express = require('express');
const router = express.Router();
const db = require('../config/database');
const MealPlan = require('../models/MealPlan');

// GET /api/meal-plans - Get all meal plans
router.get('/', (req, res) => {
    try {
        let mealPlans = db.findAll('mealPlans');
        
        // Apply filters
        if (req.query.search) {
            mealPlans = db.search('mealPlans', req.query.search, ['name']);
        }
        
        if (req.query.startDate) {
            const startDate = new Date(req.query.startDate);
            mealPlans = mealPlans.filter(plan => 
                new Date(plan.startDate) >= startDate
            );
        }
        
        if (req.query.endDate) {
            const endDate = new Date(req.query.endDate);
            mealPlans = mealPlans.filter(plan => 
                new Date(plan.endDate) <= endDate
            );
        }
        
        // Sort by creation date (newest first)
        mealPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            success: true,
            data: mealPlans,
            count: mealPlans.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch meal plans',
            message: error.message
        });
    }
});

// GET /api/meal-plans/:id - Get a specific meal plan
router.get('/:id', (req, res) => {
    try {
        const mealPlan = db.findById('mealPlans', req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                error: 'Meal plan not found'
            });
        }
        
        res.json({
            success: true,
            data: mealPlan
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch meal plan',
            message: error.message
        });
    }
});

// POST /api/meal-plans - Create a new meal plan
router.post('/', (req, res) => {
    try {
        // Validate meal plan data
        const errors = MealPlan.validate(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        const mealPlanData = db.create('mealPlans', req.body);
        const mealPlan = new MealPlan(mealPlanData);
        
        res.status(201).json({
            success: true,
            data: mealPlan,
            message: 'Meal plan created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create meal plan',
            message: error.message
        });
    }
});

// PUT /api/meal-plans/:id - Update a meal plan
router.put('/:id', (req, res) => {
    try {
        const existingMealPlan = db.findById('mealPlans', req.params.id);
        
        if (!existingMealPlan) {
            return res.status(404).json({
                success: false,
                error: 'Meal plan not found'
            });
        }
        
        // Validate updated data
        const updatedData = { ...existingMealPlan, ...req.body };
        const errors = MealPlan.validate(updatedData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        const mealPlanData = db.update('mealPlans', req.params.id, req.body);
        const mealPlan = new MealPlan(mealPlanData);
        
        res.json({
            success: true,
            data: mealPlan,
            message: 'Meal plan updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update meal plan',
            message: error.message
        });
    }
});

// DELETE /api/meal-plans/:id - Delete a meal plan
router.delete('/:id', (req, res) => {
    try {
        const mealPlan = db.delete('mealPlans', req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                error: 'Meal plan not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Meal plan deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete meal plan',
            message: error.message
        });
    }
});

// POST /api/meal-plans/:id/meals - Add a meal to a meal plan
router.post('/:id/meals', (req, res) => {
    try {
        const mealPlan = db.findById('mealPlans', req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                error: 'Meal plan not found'
            });
        }
        
        const mealPlanObj = new MealPlan(mealPlan);
        mealPlanObj.addMeal(req.body);
        
        // Update the meal plan in database
        db.update('mealPlans', req.params.id, { meals: mealPlanObj.meals });
        
        res.json({
            success: true,
            data: mealPlanObj,
            message: 'Meal added successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to add meal',
            message: error.message
        });
    }
});

// DELETE /api/meal-plans/:id/meals/:mealId - Remove a meal from a meal plan
router.delete('/:id/meals/:mealId', (req, res) => {
    try {
        const mealPlan = db.findById('mealPlans', req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                error: 'Meal plan not found'
            });
        }
        
        const mealPlanObj = new MealPlan(mealPlan);
        mealPlanObj.removeMeal(parseInt(req.params.mealId));
        
        // Update the meal plan in database
        db.update('mealPlans', req.params.id, { meals: mealPlanObj.meals });
        
        res.json({
            success: true,
            data: mealPlanObj,
            message: 'Meal removed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to remove meal',
            message: error.message
        });
    }
});

// GET /api/meal-plans/:id/shopping-list - Get shopping list for a meal plan
router.get('/:id/shopping-list', (req, res) => {
    try {
        const mealPlan = db.findById('mealPlans', req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                error: 'Meal plan not found'
            });
        }
        
        const mealPlanObj = new MealPlan(mealPlan);
        const recipes = db.findAll('recipes');
        const shoppingList = mealPlanObj.getShoppingList(recipes);
        
        res.json({
            success: true,
            data: shoppingList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to generate shopping list',
            message: error.message
        });
    }
});

module.exports = router;
