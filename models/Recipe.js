class Recipe {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.ingredients = data.ingredients || [];
        this.instructions = data.instructions || [];
        this.prepTime = data.prepTime; // in minutes
        this.cookTime = data.cookTime; // in minutes
        this.servings = data.servings;
        this.difficulty = data.difficulty; // 'easy', 'medium', 'hard'
        this.cuisine = data.cuisine;
        this.tags = data.tags || [];
        this.imageUrl = data.imageUrl;
        this.nutrition = data.nutrition || {};
        this.rating = data.rating || 0;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Calculate total time
    getTotalTime() {
        return (this.prepTime || 0) + (this.cookTime || 0);
    }

    // Get difficulty level as number
    getDifficultyLevel() {
        const levels = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return levels[this.difficulty] || 0;
    }

    // Check if recipe contains specific ingredient
    hasIngredient(ingredientName) {
        return this.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(ingredientName.toLowerCase())
        );
    }

    // Get ingredient list as shopping list format
    getShoppingList() {
        return this.ingredients.map(ingredient => ({
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category || 'Other'
        }));
    }

    // Validate recipe data
    static validate(data) {
        const errors = [];
        
        if (!data.title || data.title.trim().length === 0) {
            errors.push('Title is required');
        }
        
        if (!data.ingredients || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
            errors.push('At least one ingredient is required');
        }
        
        if (!data.instructions || !Array.isArray(data.instructions) || data.instructions.length === 0) {
            errors.push('At least one instruction is required');
        }
        
        if (data.prepTime && (isNaN(data.prepTime) || data.prepTime < 0)) {
            errors.push('Prep time must be a positive number');
        }
        
        if (data.cookTime && (isNaN(data.cookTime) || data.cookTime < 0)) {
            errors.push('Cook time must be a positive number');
        }
        
        if (data.servings && (isNaN(data.servings) || data.servings <= 0)) {
            errors.push('Servings must be a positive number');
        }
        
        const validDifficulties = ['easy', 'medium', 'hard'];
        if (data.difficulty && !validDifficulties.includes(data.difficulty)) {
            errors.push('Difficulty must be easy, medium, or hard');
        }
        
        return errors;
    }
}

module.exports = Recipe;
