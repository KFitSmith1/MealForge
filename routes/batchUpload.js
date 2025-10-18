const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads - use memory storage for Vercel
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.pdf', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and CSV files are allowed'), false);
        }
    }
});

// Batch upload recipes from CSV
router.post('/recipes/csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        const recipes = [];
        const errors = [];

        // Parse CSV file from memory buffer
        await new Promise((resolve, reject) => {
            let rowCount = 0;
            let headerRow = null;
            
            const csvStream = require('stream').Readable.from(req.file.buffer.toString());
            csvStream
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        rowCount++;
                        
                        // Store header row for debugging
                        if (rowCount === 1) {
                            headerRow = Object.keys(row);
                        }
                        
                        // Debug: Log the first few rows to understand the structure
                        if (rowCount <= 3) {
                            console.log(`Row ${rowCount} data:`, row);
                            console.log(`Row ${rowCount} keys:`, Object.keys(row));
                        }
                        
                        // Check if row has any data
                        const hasData = Object.values(row).some(value => value && value.toString().trim() !== '');
                        if (!hasData) {
                            errors.push(`Row ${rowCount}: Empty row`);
                            return;
                        }
                        
                        // Try to find title and description with flexible column matching
                        const title = findColumnValue(row, ['title', 'name', 'recipe_name', 'recipe title']);
                        const description = findColumnValue(row, ['description', 'desc', 'summary', 'notes']);
                        
                        // If we can't find title, try to use the first non-empty column
                        const finalTitle = title || Object.values(row).find(value => value && value.toString().trim() !== '') || `Recipe ${rowCount}`;
                        
                        // If we can't find description, use a default
                        const finalDescription = description || 'No description provided';

                        // Parse ingredients from various possible columns
                        const mainIngredients = findColumnValue(row, ['Main Ingredients', 'ingredients', 'ingredient', 'ingredient_list', 'items', 'Ingredients']);
                        const ingredients = mainIngredients ? 
                            mainIngredients.split(',').map(ing => {
                                const trimmed = ing.trim();
                                // Try to parse amount and unit from the ingredient string
                                const parts = trimmed.split(' ');
                                if (parts.length >= 2 && !isNaN(parts[0])) {
                                    return {
                                        amount: parts[0],
                                        unit: parts[1],
                                        name: parts.slice(2).join(' ')
                                    };
                                } else {
                                    return {
                                        amount: '1',
                                        unit: 'serving',
                                        name: trimmed
                                    };
                                }
                            }) : [];

                        // Create basic instructions if none provided
                        const instructions = parseInstructionsFromRow(row);
                        if (instructions.length === 0) {
                            instructions.push('Follow recipe instructions for ' + finalTitle);
                        }

                        // Parse prep and cook times, handling "15 min" format
                        const prepTimeText = findColumnValue(row, ['prepTime', 'prep_time', 'preparation time', 'prep', 'Prep Time']);
                        const cookTimeText = findColumnValue(row, ['cookTime', 'cook_time', 'cooking time', 'cook', 'Cook Time']);
                        
                        const prepTime = prepTimeText ? parseInt(prepTimeText.toString().replace(/[^\d]/g, '')) || 15 : 15;
                        const cookTime = cookTimeText ? parseInt(cookTimeText.toString().replace(/[^\d]/g, '')) || 15 : 15;

                        const recipe = {
                            title: finalTitle.toString().trim(),
                            description: finalDescription.toString().trim(),
                            prepTime: prepTime,
                            cookTime: cookTime,
                            servings: parseInt(findColumnValue(row, ['servings', 'serves', 'portions', 'Servings'])) || 1,
                            difficulty: findColumnValue(row, ['difficulty', 'level', 'skill']) || 'easy',
                            cuisine: findColumnValue(row, ['cuisine', 'type', 'style', 'Category']) || 'International',
                            ingredients: ingredients,
                            instructions: instructions,
                            tags: parseTagsFromRow(row),
                            nutrition: {
                                calories: parseInt(findColumnValue(row, ['Calories', 'calories'])) || 0,
                                fiber: parseInt(findColumnValue(row, ['Fiber (g)', 'fiber'])) || 0,
                                fat: parseInt(findColumnValue(row, ['Fat (g)', 'fat'])) || 0,
                                protein: parseInt(findColumnValue(row, ['Protein (g)', 'protein'])) || 0
                            }
                        };

                        console.log(`Recipe "${recipe.title}" parsed ingredients:`, ingredients);
                        console.log(`Recipe "${recipe.title}" parsed instructions:`, instructions);

                        recipes.push(recipe);
                    } catch (error) {
                        errors.push(`Row ${rowCount}: ${error.message}`);
                    }
                })
                .on('end', () => {
                    // Add header information to errors if there are issues
                    if (errors.length > 0 && headerRow) {
                        errors.unshift(`CSV Headers found: ${headerRow.join(', ')}`);
                        errors.unshift(`Expected headers: title, description, prepTime, cookTime, servings, difficulty, cuisine, ingredients, instructions, tags`);
                    }
                    resolve();
                })
                .on('error', reject);
        });

        // Save recipes to database using the existing database system
        const savedRecipes = [];
        const db = require('../config/database');
        const Recipe = require('../models/Recipe');
        
        for (const recipe of recipes) {
            try {
                console.log(`Processing recipe: ${recipe.title}`);
                
                // Use flexible validation for batch uploads
                const validationErrors = validateRecipeForBatchUpload(recipe);
                if (validationErrors.length > 0) {
                    console.log(`Validation errors for ${recipe.title}:`, validationErrors);
                    errors.push(`Failed to save recipe "${recipe.title}": ${validationErrors.join(', ')}`);
                    continue;
                }
                
                // Save to database
                console.log(`Saving recipe to database: ${recipe.title}`);
                const recipeData = db.create('recipes', recipe);
                const savedRecipe = new Recipe(recipeData);
                savedRecipes.push(savedRecipe);
                console.log(`Successfully saved recipe: ${recipe.title} with ID: ${recipeData.id}`);
            } catch (error) {
                console.error(`Error saving recipe ${recipe.title}:`, error);
                errors.push(`Failed to save recipe "${recipe.title}": ${error.message}`);
            }
        }

        res.json({
            success: true,
            data: {
                uploaded: savedRecipes.length,
                total: recipes.length,
                errors: errors,
                recipes: savedRecipes
            }
        });

    } catch (error) {
        console.error('CSV upload error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to process CSV file: ' + error.message
        });
    }
});

// Batch upload ingredients from CSV
router.post('/ingredients/csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        const ingredients = [];
        const errors = [];

        // Parse CSV file from memory buffer
        await new Promise((resolve, reject) => {
            let rowCount = 0;
            let headerRow = null;
            
            const csvStream = require('stream').Readable.from(req.file.buffer.toString());
            csvStream
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        rowCount++;
                        
                        // Store header row for debugging
                        if (rowCount === 1) {
                            headerRow = Object.keys(row);
                        }
                        
                        // Debug: Log the first few rows to understand the structure
                        if (rowCount <= 3) {
                            console.log(`Ingredient Row ${rowCount} data:`, row);
                            console.log(`Ingredient Row ${rowCount} keys:`, Object.keys(row));
                        }
                        
                        // Check if row has any data
                        const hasData = Object.values(row).some(value => value && value.toString().trim() !== '');
                        if (!hasData) {
                            errors.push(`Row ${rowCount}: Empty row`);
                            return;
                        }
                        
                        // Try to find name with flexible column matching
                        const name = findColumnValue(row, ['name', 'ingredient_name', 'item', 'food']);
                        
                        if (!name) {
                            errors.push(`Row ${rowCount}: Missing required field (name). Available columns: ${Object.keys(row).join(', ')}`);
                            return;
                        }

                        const ingredient = {
                            name: name.toString().trim(),
                            category: findColumnValue(row, ['category', 'type', 'group']) || 'Other',
                            storage: findColumnValue(row, ['storage', 'store', 'location']) || 'pantry',
                            unit: findColumnValue(row, ['unit', 'measurement', 'measure']) || 'piece',
                            price: parseFloat(findColumnValue(row, ['price', 'cost', 'amount']) || '0') || 0,
                            notes: findColumnValue(row, ['notes', 'note', 'comments', 'description']) || ''
                        };

                        ingredients.push(ingredient);
                    } catch (error) {
                        errors.push(`Row ${rowCount}: ${error.message}`);
                    }
                })
                .on('end', () => {
                    // Add header information to errors if there are issues
                    if (errors.length > 0 && headerRow) {
                        errors.unshift(`CSV Headers found: ${headerRow.join(', ')}`);
                        errors.unshift(`Expected headers: name, category, storage, unit, price, notes`);
                    }
                    resolve();
                })
                .on('error', reject);
        });

        // Save ingredients to database using the existing database system
        const savedIngredients = [];
        const db = require('../config/database');
        const Ingredient = require('../models/Ingredient');
        
        for (const ingredient of ingredients) {
            try {
                // Validate ingredient data
                const validationErrors = Ingredient.validate(ingredient);
                if (validationErrors.length > 0) {
                    errors.push(`Failed to save ingredient "${ingredient.name}": Validation failed - ${validationErrors.join(', ')}`);
                    continue;
                }
                
                // Save to database
                const ingredientData = db.create('ingredients', ingredient);
                const savedIngredient = new Ingredient(ingredientData);
                savedIngredients.push(savedIngredient);
            } catch (error) {
                errors.push(`Failed to save ingredient "${ingredient.name}": ${error.message}`);
            }
        }

        res.json({
            success: true,
            data: {
                uploaded: savedIngredients.length,
                total: ingredients.length,
                errors: errors,
                ingredients: savedIngredients
            }
        });

    } catch (error) {
        console.error('CSV upload error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to process CSV file: ' + error.message
        });
    }
});

// Batch upload recipes from PDF
router.post('/recipes/pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        // Parse PDF file from memory buffer
        const dataBuffer = req.file.buffer;
        const pdfData = await pdfParse(dataBuffer);
        
        // Extract recipes from PDF text
        const recipes = extractRecipesFromText(pdfData.text);
        const errors = [];
        const savedRecipes = [];

        const db = require('../config/database');
        const Recipe = require('../models/Recipe');
        
        for (const recipe of recipes) {
            try {
                // Validate recipe data
                const validationErrors = Recipe.validate(recipe);
                if (validationErrors.length > 0) {
                    errors.push(`Failed to save recipe "${recipe.title}": Validation failed - ${validationErrors.join(', ')}`);
                    continue;
                }
                
                // Save to database
                const recipeData = db.create('recipes', recipe);
                const savedRecipe = new Recipe(recipeData);
                savedRecipes.push(savedRecipe);
            } catch (error) {
                errors.push(`Failed to save recipe "${recipe.title}": ${error.message}`);
            }
        }

        res.json({
            success: true,
            data: {
                uploaded: savedRecipes.length,
                total: recipes.length,
                errors: errors,
                recipes: savedRecipes
            }
        });

    } catch (error) {
        console.error('PDF upload error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to process PDF file: ' + error.message
        });
    }
});

// Flexible validation for batch uploads
function validateRecipeForBatchUpload(recipe) {
    const errors = [];
    
    if (!recipe.title || recipe.title.trim().length === 0) {
        errors.push('Title is required');
    }
    
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        errors.push('At least one ingredient is required');
    }
    
    // Instructions are optional for batch uploads - we'll create a default one
    if (!recipe.instructions || !Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
        recipe.instructions = ['Follow recipe instructions for ' + recipe.title];
    }
    
    if (recipe.prepTime && (isNaN(recipe.prepTime) || recipe.prepTime < 0)) {
        errors.push('Prep time must be a positive number');
    }
    
    if (recipe.cookTime && (isNaN(recipe.cookTime) || recipe.cookTime < 0)) {
        errors.push('Cook time must be a positive number');
    }
    
    if (recipe.servings && (isNaN(recipe.servings) || recipe.servings <= 0)) {
        errors.push('Servings must be a positive number');
    }
    
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (recipe.difficulty && !validDifficulties.includes(recipe.difficulty)) {
        errors.push('Difficulty must be easy, medium, or hard');
    }
    
    return errors;
}

// Helper function to find column value with flexible matching
function findColumnValue(row, possibleNames) {
    for (const name of possibleNames) {
        // Try exact match first
        if (row[name] && row[name].toString().trim() !== '') {
            return row[name];
        }
        
        // Try case-insensitive match
        const lowerName = name.toLowerCase();
        for (const key of Object.keys(row)) {
            if (key.toLowerCase() === lowerName && row[key] && row[key].toString().trim() !== '') {
                return row[key];
            }
        }
    }
    return null;
}

// Helper function to parse ingredients from CSV row
function parseIngredientsFromRow(row) {
    const ingredientsText = findColumnValue(row, ['ingredients', 'ingredient', 'ingredient_list', 'items']);
    if (!ingredientsText) return [];
    
    return ingredientsText.split(/[;,\n]/).map(ing => {
        const trimmed = ing.trim();
        if (!trimmed) return null;
        
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
            return {
                amount: parts[0],
                unit: parts[1],
                name: parts.slice(2).join(' ')
            };
        } else {
            return {
                amount: '1',
                unit: 'piece',
                name: trimmed
            };
        }
    }).filter(Boolean);
}

// Helper function to parse instructions from CSV row
function parseInstructionsFromRow(row) {
    const instructionsText = findColumnValue(row, ['instructions', 'instruction', 'steps', 'directions', 'method', 'Instructions']);
    if (!instructionsText) return [];
    
    // Split by numbered steps (1., 2., etc.) or by periods followed by numbers
    const steps = instructionsText.split(/(?=\d+\.)/).map(step => {
        const trimmed = step.trim();
        return trimmed ? trimmed.replace(/^\d+\.\s*/, '') : null;
    }).filter(Boolean);
    
    // If no numbered steps found, split by periods
    if (steps.length <= 1) {
        return instructionsText.split(/\.\s+(?=\d+\.)/).map(inst => {
            const trimmed = inst.trim();
            return trimmed ? trimmed.replace(/^\d+\.\s*/, '') : null;
        }).filter(Boolean);
    }
    
    return steps;
}

// Helper function to parse tags from CSV row
function parseTagsFromRow(row) {
    const tagsText = findColumnValue(row, ['tags', 'tag', 'categories', 'category']);
    if (!tagsText) return [];
    
    return tagsText.split(/[,;]/).map(tag => tag.trim()).filter(Boolean);
}

// Helper function to extract recipes from PDF text
function extractRecipesFromText(text) {
    const recipes = [];
    
    // Simple recipe extraction - look for common patterns
    const recipePatterns = [
        // Pattern 1: Title followed by ingredients and instructions
        /([A-Z][^.\n]{10,50})\n\n(?:Ingredients?|INGREDIENTS?)[:\s]*\n([\s\S]*?)(?:\n\n(?:Instructions?|INSTRUCTIONS?|Directions?|DIRECTIONS?)[:\s]*\n([\s\S]*?))(?=\n\n[A-Z]|\n\n\n|$)/gi,
        // Pattern 2: Title, description, ingredients, instructions
        /([A-Z][^.\n]{10,50})\n\n([^.\n]{20,200})\n\n(?:Ingredients?|INGREDIENTS?)[:\s]*\n([\s\S]*?)(?:\n\n(?:Instructions?|INSTRUCTIONS?|Directions?|DIRECTIONS?)[:\s]*\n([\s\S]*?))(?=\n\n[A-Z]|\n\n\n|$)/gi
    ];

    for (const pattern of recipePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const title = match[1].trim();
            const description = match[2] ? match[2].trim() : '';
            const ingredientsText = match[3] || match[2];
            const instructionsText = match[4] || match[3];

            if (title && ingredientsText) {
                const recipe = {
                    title: title,
                    description: description,
                    prepTime: 0,
                    cookTime: 0,
                    servings: 1,
                    difficulty: 'medium',
                    cuisine: 'International',
                    ingredients: parseIngredients(ingredientsText),
                    instructions: parseInstructions(instructionsText),
                    tags: []
                };
                recipes.push(recipe);
            }
        }
    }

    return recipes;
}

// Helper function to parse ingredients from text
function parseIngredients(text) {
    const ingredients = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.match(/^(Ingredients?|INGREDIENTS?)[:\s]*$/i)) {
            // Try to parse amount, unit, and name
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                ingredients.push({
                    amount: parts[0],
                    unit: parts[1],
                    name: parts.slice(2).join(' ')
                });
            } else {
                ingredients.push({
                    amount: '1',
                    unit: 'piece',
                    name: trimmed
                });
            }
        }
    }
    
    return ingredients;
}

// Helper function to parse instructions from text
function parseInstructions(text) {
    if (!text) return [];
    
    const instructions = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.match(/^(Instructions?|INSTRUCTIONS?|Directions?|DIRECTIONS?)[:\s]*$/i)) {
            // Remove step numbers (1., 2., etc.)
            const cleaned = trimmed.replace(/^\d+\.\s*/, '');
            if (cleaned) {
                instructions.push(cleaned);
            }
        }
    }
    
    return instructions;
}

module.exports = router;