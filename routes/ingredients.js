const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Ingredient = require('../models/Ingredient');

// GET /api/ingredients - Get all ingredients with optional filtering
router.get('/', (req, res) => {
    try {
        let ingredients = db.findAll('ingredients');
        
        // Apply filters
        if (req.query.search) {
            ingredients = db.search('ingredients', req.query.search, ['name', 'category', 'notes']);
        }
        
        if (req.query.category) {
            ingredients = ingredients.filter(ingredient => 
                ingredient.category === req.query.category
            );
        }
        
        if (req.query.storage) {
            ingredients = ingredients.filter(ingredient => 
                ingredient.storage === req.query.storage
            );
        }
        
        if (req.query.perishable) {
            const isPerishable = req.query.perishable === 'true';
            ingredients = ingredients.filter(ingredient => {
                const ingredientObj = new Ingredient(ingredient);
                return ingredientObj.isPerishable() === isPerishable;
            });
        }
        
        // Sort ingredients
        const sortBy = req.query.sortBy || 'name';
        const sortOrder = req.query.sortOrder || 'asc';
        
        ingredients.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        res.json({
            success: true,
            data: ingredients,
            count: ingredients.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ingredients',
            message: error.message
        });
    }
});

// GET /api/ingredients/:id - Get a specific ingredient
router.get('/:id', (req, res) => {
    try {
        const ingredient = db.findById('ingredients', req.params.id);
        
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }
        
        res.json({
            success: true,
            data: ingredient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ingredient',
            message: error.message
        });
    }
});

// POST /api/ingredients - Create a new ingredient
router.post('/', (req, res) => {
    try {
        // Validate ingredient data
        const errors = Ingredient.validate(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        const ingredientData = db.create('ingredients', req.body);
        const ingredient = new Ingredient(ingredientData);
        
        res.status(201).json({
            success: true,
            data: ingredient,
            message: 'Ingredient created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create ingredient',
            message: error.message
        });
    }
});

// PUT /api/ingredients/:id - Update an ingredient
router.put('/:id', (req, res) => {
    try {
        const existingIngredient = db.findById('ingredients', req.params.id);
        
        if (!existingIngredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }
        
        // Validate updated data
        const updatedData = { ...existingIngredient, ...req.body };
        const errors = Ingredient.validate(updatedData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        const ingredientData = db.update('ingredients', req.params.id, req.body);
        const ingredient = new Ingredient(ingredientData);
        
        res.json({
            success: true,
            data: ingredient,
            message: 'Ingredient updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update ingredient',
            message: error.message
        });
    }
});

// DELETE /api/ingredients/:id - Delete an ingredient
router.delete('/:id', (req, res) => {
    try {
        const ingredient = db.delete('ingredients', req.params.id);
        
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Ingredient deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete ingredient',
            message: error.message
        });
    }
});

// GET /api/ingredients/categories - Get all ingredient categories
router.get('/categories', (req, res) => {
    try {
        const ingredients = db.findAll('ingredients');
        const categories = [...new Set(ingredients.map(ingredient => ingredient.category))];
        
        res.json({
            success: true,
            data: categories.sort()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// GET /api/ingredients/nutrition/:id - Get nutrition information for an ingredient
router.get('/nutrition/:id', (req, res) => {
    try {
        const ingredient = db.findById('ingredients', req.params.id);
        
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }
        
        const ingredientObj = new Ingredient(ingredient);
        const nutrition = ingredientObj.getNutritionPer100g();
        
        res.json({
            success: true,
            data: {
                ingredient: ingredient.name,
                nutrition: nutrition,
                storage: ingredientObj.getStorageRecommendation()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch nutrition information',
            message: error.message
        });
    }
});

module.exports = router;
