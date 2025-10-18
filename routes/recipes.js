const express = require('express');
const router = express.Router();
const db = require('../config/database');
const Recipe = require('../models/Recipe');

// GET /api/recipes - Get all recipes with optional filtering
router.get('/', (req, res) => {
    try {
        let recipes = db.findAll('recipes');
        
        // Apply filters
        if (req.query.search) {
            recipes = db.search('recipes', req.query.search, ['title', 'description', 'cuisine', 'tags']);
        }
        
        if (req.query.difficulty) {
            recipes = recipes.filter(recipe => recipe.difficulty === req.query.difficulty);
        }
        
        if (req.query.cuisine) {
            recipes = recipes.filter(recipe => recipe.cuisine === req.query.cuisine);
        }
        
        if (req.query.maxTime) {
            const maxTime = parseInt(req.query.maxTime);
            recipes = recipes.filter(recipe => {
                const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
                return totalTime <= maxTime;
            });
        }
        
        // Sort recipes
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        
        recipes.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortBy === 'totalTime') {
                aVal = (a.prepTime || 0) + (a.cookTime || 0);
                bVal = (b.prepTime || 0) + (b.cookTime || 0);
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        res.json({
            success: true,
            data: recipes,
            count: recipes.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recipes',
            message: error.message
        });
    }
});

// GET /api/recipes/:id - Get a specific recipe
router.get('/:id', (req, res) => {
    try {
        const recipe = db.findById('recipes', req.params.id);
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }
        
        res.json({
            success: true,
            data: recipe
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recipe',
            message: error.message
        });
    }
});

// POST /api/recipes - Create a new recipe
router.post('/', (req, res) => {
    try {
        // Validate recipe data
        const errors = Recipe.validate(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        const recipeData = db.create('recipes', req.body);
        const recipe = new Recipe(recipeData);
        
        res.status(201).json({
            success: true,
            data: recipe,
            message: 'Recipe created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create recipe',
            message: error.message
        });
    }
});

// PUT /api/recipes/:id - Update a recipe
router.put('/:id', (req, res) => {
    try {
        const existingRecipe = db.findById('recipes', req.params.id);
        
        if (!existingRecipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }
        
        // Validate updated data
        const updatedData = { ...existingRecipe, ...req.body };
        const errors = Recipe.validate(updatedData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        
        const recipeData = db.update('recipes', req.params.id, req.body);
        const recipe = new Recipe(recipeData);
        
        res.json({
            success: true,
            data: recipe,
            message: 'Recipe updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update recipe',
            message: error.message
        });
    }
});

// DELETE /api/recipes/:id - Delete a recipe
router.delete('/:id', (req, res) => {
    try {
        const recipe = db.delete('recipes', req.params.id);
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Recipe deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete recipe',
            message: error.message
        });
    }
});

// GET /api/recipes/:id/shopping-list - Get shopping list for a recipe
router.get('/:id/shopping-list', (req, res) => {
    try {
        const recipe = db.findById('recipes', req.params.id);
        
        if (!recipe) {
            return res.status(404).json({
                success: false,
                error: 'Recipe not found'
            });
        }
        
        const recipeObj = new Recipe(recipe);
        const shoppingList = recipeObj.getShoppingList();
        
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
