class Ingredient {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.category = data.category || 'Other';
        this.unit = data.unit || 'piece';
        this.nutrition = data.nutrition || {};
        this.storage = data.storage || 'pantry'; // pantry, fridge, freezer
        this.shelfLife = data.shelfLife; // in days
        this.price = data.price; // per unit
        this.notes = data.notes || '';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Get nutritional value per 100g
    getNutritionPer100g() {
        const nutrition = this.nutrition;
        return {
            calories: nutrition.calories || 0,
            protein: nutrition.protein || 0,
            carbs: nutrition.carbs || 0,
            fat: nutrition.fat || 0,
            fiber: nutrition.fiber || 0,
            sugar: nutrition.sugar || 0,
            sodium: nutrition.sodium || 0
        };
    }

    // Check if ingredient is perishable
    isPerishable() {
        return this.storage === 'fridge' || this.storage === 'freezer';
    }

    // Get storage recommendation
    getStorageRecommendation() {
        const recommendations = {
            'pantry': 'Store in a cool, dry place',
            'fridge': 'Refrigerate and use within recommended time',
            'freezer': 'Freeze for long-term storage'
        };
        return recommendations[this.storage] || 'Check packaging for storage instructions';
    }

    // Calculate cost per serving (if serving size is provided)
    getCostPerServing(servingSize = 1) {
        if (!this.price || !servingSize) return 0;
        return (this.price * servingSize).toFixed(2);
    }

    // Validate ingredient data
    static validate(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Ingredient name is required');
        }
        
        const validCategories = [
            'Vegetables', 'Fruits', 'Meat', 'Seafood', 'Dairy', 'Grains', 
            'Legumes', 'Nuts', 'Spices', 'Oils', 'Beverages', 'Other'
        ];
        
        if (data.category && !validCategories.includes(data.category)) {
            errors.push(`Category must be one of: ${validCategories.join(', ')}`);
        }
        
        const validStorage = ['pantry', 'fridge', 'freezer'];
        if (data.storage && !validStorage.includes(data.storage)) {
            errors.push('Storage must be pantry, fridge, or freezer');
        }
        
        if (data.shelfLife && (isNaN(data.shelfLife) || data.shelfLife < 0)) {
            errors.push('Shelf life must be a positive number');
        }
        
        if (data.price && (isNaN(data.price) || data.price < 0)) {
            errors.push('Price must be a positive number');
        }
        
        return errors;
    }
}

module.exports = Ingredient;
