// Sample data for Mealforge application
const sampleRecipes = [
    {
        title: "Classic Spaghetti Carbonara",
        description: "A traditional Italian pasta dish with eggs, cheese, and pancetta",
        ingredients: [
            { name: "spaghetti", amount: "400", unit: "g" },
            { name: "pancetta", amount: "200", unit: "g" },
            { name: "eggs", amount: "4", unit: "pieces" },
            { name: "parmesan cheese", amount: "100", unit: "g" },
            { name: "black pepper", amount: "1", unit: "tsp" },
            { name: "salt", amount: "1", unit: "tsp" }
        ],
        instructions: [
            "Cook spaghetti according to package instructions",
            "Fry pancetta until crispy",
            "Beat eggs with parmesan and pepper",
            "Mix hot pasta with pancetta",
            "Add egg mixture and toss quickly",
            "Serve immediately with extra parmesan"
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        difficulty: "medium",
        cuisine: "Italian",
        tags: ["pasta", "comfort food", "quick"],
        nutrition: {
            calories: 520,
            protein: 28,
            carbs: 45,
            fat: 24
        }
    },
    {
        title: "Chicken Teriyaki Bowl",
        description: "Healthy and flavorful Japanese-inspired chicken with rice and vegetables",
        ingredients: [
            { name: "chicken breast", amount: "500", unit: "g" },
            { name: "jasmine rice", amount: "2", unit: "cups" },
            { name: "broccoli", amount: "300", unit: "g" },
            { name: "carrots", amount: "2", unit: "pieces" },
            { name: "soy sauce", amount: "3", unit: "tbsp" },
            { name: "honey", amount: "2", unit: "tbsp" },
            { name: "garlic", amount: "3", unit: "cloves" },
            { name: "ginger", amount: "1", unit: "tbsp" }
        ],
        instructions: [
            "Cook rice according to package instructions",
            "Cut chicken into bite-sized pieces",
            "Make teriyaki sauce with soy sauce, honey, garlic, and ginger",
            "Cook chicken in a pan until golden",
            "Add teriyaki sauce and simmer",
            "Steam broccoli and carrots",
            "Serve chicken over rice with vegetables"
        ],
        prepTime: 20,
        cookTime: 25,
        servings: 4,
        difficulty: "easy",
        cuisine: "Japanese",
        tags: ["healthy", "asian", "one-pan"],
        nutrition: {
            calories: 420,
            protein: 35,
            carbs: 55,
            fat: 8
        }
    },
    {
        title: "Mediterranean Quinoa Salad",
        description: "Fresh and nutritious salad with quinoa, vegetables, and feta cheese",
        ingredients: [
            { name: "quinoa", amount: "1", unit: "cup" },
            { name: "cherry tomatoes", amount: "200", unit: "g" },
            { name: "cucumber", amount: "1", unit: "piece" },
            { name: "red onion", amount: "0.5", unit: "piece" },
            { name: "feta cheese", amount: "150", unit: "g" },
            { name: "olives", amount: "100", unit: "g" },
            { name: "olive oil", amount: "3", unit: "tbsp" },
            { name: "lemon juice", amount: "2", unit: "tbsp" },
            { name: "fresh herbs", amount: "2", unit: "tbsp" }
        ],
        instructions: [
            "Cook quinoa according to package instructions",
            "Let quinoa cool completely",
            "Dice tomatoes, cucumber, and red onion",
            "Crumble feta cheese",
            "Mix olive oil, lemon juice, and herbs for dressing",
            "Combine all ingredients in a large bowl",
            "Toss with dressing and season to taste"
        ],
        prepTime: 25,
        cookTime: 15,
        servings: 6,
        difficulty: "easy",
        cuisine: "Mediterranean",
        tags: ["vegetarian", "healthy", "meal prep"],
        nutrition: {
            calories: 280,
            protein: 12,
            carbs: 35,
            fat: 12
        }
    }
];

const sampleIngredients = [
    {
        name: "Chicken Breast",
        category: "Meat",
        unit: "kg",
        storage: "fridge",
        shelfLife: 3,
        price: 8.99,
        notes: "Freeze if not using within 3 days",
        nutrition: {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6
        }
    },
    {
        name: "Jasmine Rice",
        category: "Grains",
        unit: "kg",
        storage: "pantry",
        shelfLife: 365,
        price: 4.50,
        notes: "Store in airtight container",
        nutrition: {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3
        }
    },
    {
        name: "Broccoli",
        category: "Vegetables",
        unit: "kg",
        storage: "fridge",
        shelfLife: 7,
        price: 3.99,
        notes: "Best when fresh, can be frozen",
        nutrition: {
            calories: 34,
            protein: 2.8,
            carbs: 7,
            fat: 0.4
        }
    },
    {
        name: "Parmesan Cheese",
        category: "Dairy",
        unit: "g",
        storage: "fridge",
        shelfLife: 30,
        price: 0.15,
        notes: "Grate fresh for best flavor",
        nutrition: {
            calories: 431,
            protein: 38,
            carbs: 4.1,
            fat: 29
        }
    },
    {
        name: "Extra Virgin Olive Oil",
        category: "Oils",
        unit: "ml",
        storage: "pantry",
        shelfLife: 730,
        price: 0.08,
        notes: "Store in cool, dark place",
        nutrition: {
            calories: 884,
            protein: 0,
            carbs: 0,
            fat: 100
        }
    }
];

const sampleMealPlans = [
    {
        name: "Week 1 - Healthy Start",
        startDate: "2024-01-15",
        endDate: "2024-01-21",
        meals: [
            {
                id: 1,
                date: "2024-01-15",
                type: "dinner",
                recipeId: 1,
                servings: 4,
                notes: "Monday dinner"
            },
            {
                id: 2,
                date: "2024-01-16",
                type: "lunch",
                recipeId: 2,
                servings: 2,
                notes: "Tuesday lunch"
            },
            {
                id: 3,
                date: "2024-01-17",
                type: "dinner",
                recipeId: 3,
                servings: 6,
                notes: "Wednesday dinner"
            }
        ]
    }
];

module.exports = {
    sampleRecipes,
    sampleIngredients,
    sampleMealPlans
};
