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
            let rowCount = 0;
            let headerRow = null;
            
            fs.createReadStream(req.file.path)
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

                        const recipe = {
                            title: finalTitle.toString().trim(),
                            description: finalDescription.toString().trim(),
                            prepTime: parseInt(findColumnValue(row, ['prepTime', 'prep_time', 'preparation time', 'prep'])) || 0,
                            cookTime: parseInt(findColumnValue(row, ['cookTime', 'cook_time', 'cooking time', 'cook'])) || 0,
                            servings: parseInt(findColumnValue(row, ['servings', 'serves', 'portions'])) || 1,
                            difficulty: findColumnValue(row, ['difficulty', 'level', 'skill']) || 'easy',
                            cuisine: findColumnValue(row, ['cuisine', 'type', 'style']) || 'International',
                            ingredients: parseIngredientsFromRow(row),
                            instructions: parseInstructionsFromRow(row),
                            tags: parseTagsFromRow(row)
                        };

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
            let rowCount = 0;
            let headerRow = null;
            
            fs.createReadStream(req.file.path)
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
    const instructionsText = findColumnValue(row, ['instructions', 'instruction', 'steps', 'directions', 'method']);
    if (!instructionsText) return [];
    
    return instructionsText.split(/[;,\n]/).map(inst => {
        const trimmed = inst.trim();
        return trimmed ? trimmed.replace(/^\d+\.\s*/, '') : null;
    }).filter(Boolean);
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

