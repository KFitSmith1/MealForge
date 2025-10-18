const db = require('../config/database');
const { sampleRecipes, sampleIngredients, sampleMealPlans } = require('../data/sample-data');

// Seed the database with sample data
function seedDatabase() {
    console.log('🌱 Seeding database with sample data...');
    
    // Clear existing data
    db.recipes = [];
    db.mealPlans = [];
    db.ingredients = [];
    db.nextId = 1;
    
    // Add sample recipes
    sampleRecipes.forEach(recipe => {
        db.create('recipes', recipe);
    });
    
    // Add sample ingredients
    sampleIngredients.forEach(ingredient => {
        db.create('ingredients', ingredient);
    });
    
    // Add sample meal plans
    sampleMealPlans.forEach(mealPlan => {
        db.create('mealPlans', mealPlan);
    });
    
    console.log(`✅ Added ${sampleRecipes.length} recipes`);
    console.log(`✅ Added ${sampleIngredients.length} ingredients`);
    console.log(`✅ Added ${sampleMealPlans.length} meal plans`);
    console.log('🎉 Database seeded successfully!');
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
