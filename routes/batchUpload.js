const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        // Validate required fields
                        if (!row.title || !row.description) {
                            errors.push(`Row ${recipes.length + 1}: Missing required fields (title, description)`);
                            return;
                        }

                        const recipe = {
                            title: row.title.trim(),
                            description: row.description.trim(),
                            prepTime: parseInt(row.prepTime) || 0,
                            cookTime: parseInt(row.cookTime) || 0,
                            servings: parseInt(row.servings) || 1,
                            difficulty: row.difficulty || 'easy',
                            cuisine: row.cuisine || 'International',
                            ingredients: row.ingredients ? 
                                row.ingredients.split(';').map(ing => {
                                    const parts = ing.trim().split(' ');
                                    return {
                                        amount: parts[0] || '1',
                                        unit: parts[1] || 'piece',
                                        name: parts.slice(2).join(' ') || ing.trim()
                                    };
                                }) : [],
                            instructions: row.instructions ? 
                                row.instructions.split(';').map(inst => inst.trim()).filter(Boolean) : [],
                            tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : []
                        };

                        recipes.push(recipe);
                    } catch (error) {
                        errors.push(`Row ${recipes.length + 1}: ${error.message}`);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Save recipes to database (simplified - in real app, use proper database)
        const savedRecipes = [];
        for (const recipe of recipes) {
            try {
                // Here you would save to your actual database
                // For now, we'll simulate success
                recipe.id = Date.now() + Math.random();
                recipe.createdAt = new Date();
                savedRecipes.push(recipe);
            } catch (error) {
                errors.push(`Failed to save recipe "${recipe.title}": ${error.message}`);
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

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
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

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

        // Parse CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        // Validate required fields
                        if (!row.name) {
                            errors.push(`Row ${ingredients.length + 1}: Missing required field (name)`);
                            return;
                        }

                        const ingredient = {
                            name: row.name.trim(),
                            category: row.category || 'Other',
                            storage: row.storage || 'pantry',
                            unit: row.unit || 'piece',
                            price: parseFloat(row.price) || 0,
                            notes: row.notes || ''
                        };

                        ingredients.push(ingredient);
                    } catch (error) {
                        errors.push(`Row ${ingredients.length + 1}: ${error.message}`);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Save ingredients to database
        const savedIngredients = [];
        for (const ingredient of ingredients) {
            try {
                ingredient.id = Date.now() + Math.random();
                ingredient.createdAt = new Date();
                savedIngredients.push(ingredient);
            } catch (error) {
                errors.push(`Failed to save ingredient "${ingredient.name}": ${error.message}`);
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

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
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

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

        // Parse PDF file
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        
        // Extract recipes from PDF text
        const recipes = extractRecipesFromText(pdfData.text);
        const errors = [];
        const savedRecipes = [];

        for (const recipe of recipes) {
            try {
                recipe.id = Date.now() + Math.random();
                recipe.createdAt = new Date();
                savedRecipes.push(recipe);
            } catch (error) {
                errors.push(`Failed to save recipe "${recipe.title}": ${error.message}`);
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

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
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process PDF file: ' + error.message
        });
    }
});

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
