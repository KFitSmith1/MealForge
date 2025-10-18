class MealPlan {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.meals = data.meals || []; // Array of meal objects
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Add a meal to the plan
    addMeal(meal) {
        this.meals.push({
            id: Date.now() + Math.random(), // Simple ID generation
            ...meal,
            addedAt: new Date()
        });
    }

    // Remove a meal from the plan
    removeMeal(mealId) {
        this.meals = this.meals.filter(meal => meal.id !== mealId);
    }

    // Get meals for a specific date
    getMealsForDate(date) {
        const targetDate = new Date(date).toDateString();
        return this.meals.filter(meal => {
            const mealDate = new Date(meal.date).toDateString();
            return mealDate === targetDate;
        });
    }

    // Get meals by meal type (breakfast, lunch, dinner, snack)
    getMealsByType(mealType) {
        return this.meals.filter(meal => meal.type === mealType);
    }

    // Get all recipes used in this meal plan
    getAllRecipes() {
        const recipeIds = new Set();
        this.meals.forEach(meal => {
            if (meal.recipeId) {
                recipeIds.add(meal.recipeId);
            }
        });
        return Array.from(recipeIds);
    }

    // Calculate total servings for a specific recipe
    getTotalServingsForRecipe(recipeId) {
        return this.meals
            .filter(meal => meal.recipeId === recipeId)
            .reduce((total, meal) => total + (meal.servings || 1), 0);
    }

    // Get shopping list for the entire meal plan
    getShoppingList(recipes) {
        const shoppingList = {};
        
        this.meals.forEach(meal => {
            if (meal.recipeId) {
                const recipe = recipes.find(r => r.id === meal.recipeId);
                if (recipe) {
                    const servings = meal.servings || 1;
                    recipe.ingredients.forEach(ingredient => {
                        const key = ingredient.name.toLowerCase();
                        if (!shoppingList[key]) {
                            shoppingList[key] = {
                                name: ingredient.name,
                                amount: 0,
                                unit: ingredient.unit,
                                category: ingredient.category || 'Other'
                            };
                        }
                        // Scale ingredient amount based on servings
                        const scaledAmount = (ingredient.amount || 0) * servings;
                        shoppingList[key].amount += scaledAmount;
                    });
                }
            }
        });
        
        return Object.values(shoppingList);
    }

    // Validate meal plan data
    static validate(data) {
        const errors = [];
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('Meal plan name is required');
        }
        
        if (!data.startDate) {
            errors.push('Start date is required');
        } else if (isNaN(Date.parse(data.startDate))) {
            errors.push('Start date must be a valid date');
        }
        
        if (!data.endDate) {
            errors.push('End date is required');
        } else if (isNaN(Date.parse(data.endDate))) {
            errors.push('End date must be a valid date');
        }
        
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            if (start >= end) {
                errors.push('End date must be after start date');
            }
        }
        
        return errors;
    }
}

module.exports = MealPlan;
