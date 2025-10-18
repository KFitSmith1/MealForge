# 🍽️ Mealforge

A comprehensive meal planning and recipe management application built with Node.js, Express, and vanilla JavaScript.

## ✨ Features

- **Recipe Management**: Create, edit, and organize your favorite recipes
- **Meal Planning**: Plan your meals for days or weeks ahead
- **Ingredient Tracking**: Manage your pantry and ingredient inventory
- **Shopping Lists**: Generate shopping lists from your meal plans
- **Search & Filter**: Find recipes by cuisine, difficulty, cooking time, and more
- **Nutritional Info**: Track nutritional information for recipes and ingredients
- **Responsive Design**: Beautiful, mobile-friendly interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mealforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Or production mode
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
mealforge/
├── config/
│   └── database.js          # Database configuration
├── data/
│   └── sample-data.js       # Sample data for seeding
├── models/
│   ├── Recipe.js            # Recipe data model
│   ├── MealPlan.js          # Meal plan data model
│   └── Ingredient.js        # Ingredient data model
├── routes/
│   ├── recipes.js           # Recipe API endpoints
│   ├── mealPlans.js         # Meal plan API endpoints
│   └── ingredients.js       # Ingredient API endpoints
├── public/
│   ├── index.html           # Main application page
│   ├── styles.css           # Application styles
│   └── app.js               # Frontend JavaScript
├── scripts/
│   └── seed-data.js         # Database seeding script
├── index.js                 # Main server file
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## 🔧 API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes (with filtering)
- `GET /api/recipes/:id` - Get specific recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/:id/shopping-list` - Get shopping list for recipe

### Meal Plans
- `GET /api/meal-plans` - Get all meal plans
- `GET /api/meal-plans/:id` - Get specific meal plan
- `POST /api/meal-plans` - Create new meal plan
- `PUT /api/meal-plans/:id` - Update meal plan
- `DELETE /api/meal-plans/:id` - Delete meal plan
- `POST /api/meal-plans/:id/meals` - Add meal to plan
- `DELETE /api/meal-plans/:id/meals/:mealId` - Remove meal from plan
- `GET /api/meal-plans/:id/shopping-list` - Get shopping list for meal plan

### Ingredients
- `GET /api/ingredients` - Get all ingredients (with filtering)
- `GET /api/ingredients/:id` - Get specific ingredient
- `POST /api/ingredients` - Create new ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient
- `GET /api/ingredients/categories` - Get ingredient categories
- `GET /api/ingredients/nutrition/:id` - Get nutrition info for ingredient

## 🎯 Usage Examples

### Creating a Recipe
```javascript
const recipe = {
  title: "Chicken Teriyaki",
  description: "Delicious Japanese-style chicken",
  ingredients: [
    { name: "chicken breast", amount: "500", unit: "g" },
    { name: "soy sauce", amount: "3", unit: "tbsp" }
  ],
  instructions: ["Cut chicken", "Marinate in soy sauce", "Cook until done"],
  prepTime: 15,
  cookTime: 20,
  servings: 4,
  difficulty: "easy",
  cuisine: "Japanese"
};
```

### Creating a Meal Plan
```javascript
const mealPlan = {
  name: "Week 1 - Healthy Start",
  startDate: "2024-01-15",
  endDate: "2024-01-21",
  meals: [
    {
      date: "2024-01-15",
      type: "dinner",
      recipeId: 1,
      servings: 4
    }
  ]
};
```

## 🏭 Factory.ai Integration

This project is designed to work seamlessly with Factory.ai droid for enhanced development:

1. **Connect Factory.ai Droid**:
   - Download Factory Bridge
   - Set root directory to your Mealforge project
   - Select appropriate droid (Code Droid recommended)

2. **Useful Commands**:
   - `> Analyze this codebase and explain the overall architecture`
   - `> Add comprehensive logging to the main application startup`
   - `> Create a meal planning API structure`
   - `> Add user authentication system`

## 🛠️ Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

### Adding New Features
1. Create model in `models/` directory
2. Add routes in `routes/` directory
3. Update frontend in `public/` directory
4. Test with sample data

## 🔮 Future Enhancements

- [ ] User authentication and profiles
- [ ] Recipe sharing and social features
- [ ] Nutritional analysis integration
- [ ] Meal prep scheduling
- [ ] Grocery store integration
- [ ] Mobile app development
- [ ] Recipe recommendation engine
- [ ] Dietary restriction filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Express.js and vanilla JavaScript
- Designed for Factory.ai droid integration
- Inspired by modern meal planning applications
