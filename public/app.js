// Global state
let currentSection = 'dashboard';
let recipes = [];
let mealPlans = [];
let ingredients = [];

// API base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

// Initialize the application
function initializeApp() {
    // Set up navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Recipe search
    const recipeSearch = document.getElementById('recipe-search');
    if (recipeSearch) {
        recipeSearch.addEventListener('input', debounce(applyRecipeFilters, 300));
    }

    // Ingredient search
    const ingredientSearch = document.getElementById('ingredient-search');
    if (ingredientSearch) {
        ingredientSearch.addEventListener('input', debounce(applyIngredientFilters, 300));
    }

    // Filter dropdowns
    const difficultyFilter = document.getElementById('difficulty-filter');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const categoryFilter = document.getElementById('category-filter');
    const storageFilter = document.getElementById('storage-filter');

    if (difficultyFilter) difficultyFilter.addEventListener('change', applyRecipeFilters);
    if (cuisineFilter) cuisineFilter.addEventListener('change', applyRecipeFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyIngredientFilters);
    if (storageFilter) storageFilter.addEventListener('change', applyIngredientFilters);
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to selected nav item
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    currentSection = sectionName;

    // Load section-specific data
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'recipes':
            loadRecipes();
            break;
        case 'meal-plans':
            loadMealPlans();
            break;
        case 'ingredients':
            loadIngredients();
            break;
        case 'shopping':
            loadShoppingLists();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading(true);
        
        const [recipesRes, mealPlansRes, ingredientsRes] = await Promise.all([
            fetch(`${API_BASE}/recipes`),
            fetch(`${API_BASE}/meal-plans`),
            fetch(`${API_BASE}/ingredients`)
        ]);

        const recipesData = await recipesRes.json();
        const mealPlansData = await mealPlansRes.json();
        const ingredientsData = await ingredientsRes.json();

        recipes = recipesData.data || [];
        mealPlans = mealPlansData.data || [];
        ingredients = ingredientsData.data || [];

        // Update stats
        document.getElementById('recipe-count').textContent = recipes.length;
        document.getElementById('meal-plan-count').textContent = mealPlans.length;
        document.getElementById('ingredient-count').textContent = ingredients.length;

        // Calculate average cook time
        const avgCookTime = recipes.length > 0 
            ? Math.round(recipes.reduce((sum, recipe) => sum + (recipe.prepTime || 0) + (recipe.cookTime || 0), 0) / recipes.length)
            : 0;
        document.getElementById('avg-cook-time').textContent = `${avgCookTime} min`;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

// Load recipes
async function loadRecipes() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/recipes`);
        const data = await response.json();
        
        if (data.success) {
            recipes = data.data;
            renderRecipes(recipes);
            populateCuisineFilter(recipes);
        } else {
            showNotification('Error loading recipes', 'error');
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        showNotification('Error loading recipes', 'error');
    } finally {
        showLoading(false);
    }
}

// Render recipes
function renderRecipes(recipesToRender) {
    const container = document.getElementById('recipes-grid');
    if (!container) return;

    if (recipesToRender.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No recipes found</div>';
        return;
    }

    container.innerHTML = recipesToRender.map(recipe => `
        <div class="recipe-card" onclick="viewRecipe(${recipe.id})">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${recipe.title}</h3>
                    <p class="card-subtitle">${recipe.cuisine || 'International'} • ${recipe.servings} servings</p>
                </div>
                <div class="card-actions">
                    <button class="card-action" onclick="event.stopPropagation(); editRecipe(${recipe.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action" onclick="event.stopPropagation(); deleteRecipe(${recipe.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <p>${recipe.description || 'No description available'}</p>
                <div class="card-tags">
                    <span class="tag difficulty-${recipe.difficulty}">${recipe.difficulty || 'Unknown'}</span>
                    <span class="tag">${(recipe.prepTime || 0) + (recipe.cookTime || 0)} min</span>
                    ${recipe.tags ? recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Load meal plans
async function loadMealPlans() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/meal-plans`);
        const data = await response.json();
        
        if (data.success) {
            mealPlans = data.data;
            renderMealPlans(mealPlans);
        } else {
            showNotification('Error loading meal plans', 'error');
        }
    } catch (error) {
        console.error('Error loading meal plans:', error);
        showNotification('Error loading meal plans', 'error');
    } finally {
        showLoading(false);
    }
}

// Render meal plans
function renderMealPlans(mealPlansToRender) {
    const container = document.getElementById('meal-plans-list');
    if (!container) return;

    if (mealPlansToRender.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No meal plans found</div>';
        return;
    }

    container.innerHTML = mealPlansToRender.map(plan => `
        <div class="meal-plan-card" onclick="viewMealPlan(${plan.id})">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${plan.name}</h3>
                    <p class="card-subtitle">
                        ${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}
                    </p>
                </div>
                <div class="card-actions">
                    <button class="card-action" onclick="event.stopPropagation(); editMealPlan(${plan.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action" onclick="event.stopPropagation(); deleteMealPlan(${plan.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <p>${plan.meals ? plan.meals.length : 0} meals planned</p>
            </div>
        </div>
    `).join('');
}

// Load ingredients
async function loadIngredients() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/ingredients`);
        const data = await response.json();
        
        if (data.success) {
            ingredients = data.data;
            renderIngredients(ingredients);
            populateCategoryFilter(ingredients);
        } else {
            showNotification('Error loading ingredients', 'error');
        }
    } catch (error) {
        console.error('Error loading ingredients:', error);
        showNotification('Error loading ingredients', 'error');
    } finally {
        showLoading(false);
    }
}

// Render ingredients
function renderIngredients(ingredientsToRender) {
    const container = document.getElementById('ingredients-grid');
    if (!container) return;

    if (ingredientsToRender.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No ingredients found</div>';
        return;
    }

    container.innerHTML = ingredientsToRender.map(ingredient => `
        <div class="ingredient-card" onclick="viewIngredient(${ingredient.id})">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${ingredient.name}</h3>
                    <p class="card-subtitle">${ingredient.category} • ${ingredient.storage}</p>
                </div>
                <div class="card-actions">
                    <button class="card-action" onclick="event.stopPropagation(); editIngredient(${ingredient.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="card-action" onclick="event.stopPropagation(); deleteIngredient(${ingredient.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-content">
                <p>${ingredient.notes || 'No notes available'}</p>
                <div class="card-tags">
                    <span class="tag">${ingredient.unit}</span>
                    ${ingredient.price ? `<span class="tag">$${ingredient.price}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Load shopping lists
async function loadShoppingLists() {
    const container = document.getElementById('shopping-lists');
    if (!container) return;

    if (mealPlans.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">No meal plans available to generate shopping lists</div>';
        return;
    }

    container.innerHTML = mealPlans.map(plan => `
        <div class="meal-plan-card">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${plan.name}</h3>
                    <p class="card-subtitle">Shopping List</p>
                </div>
                <button class="btn btn-primary" onclick="generateShoppingList(${plan.id})">
                    <i class="fas fa-shopping-cart"></i>
                    Generate List
                </button>
            </div>
        </div>
    `).join('');
}

// Apply recipe filters
async function applyRecipeFilters() {
    const search = document.getElementById('recipe-search')?.value || '';
    const difficulty = document.getElementById('difficulty-filter')?.value || '';
    const cuisine = document.getElementById('cuisine-filter')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (difficulty) params.append('difficulty', difficulty);
    if (cuisine) params.append('cuisine', cuisine);

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/recipes?${params}`);
        const data = await response.json();
        
        if (data.success) {
            renderRecipes(data.data);
        }
    } catch (error) {
        console.error('Error filtering recipes:', error);
        showNotification('Error filtering recipes', 'error');
    } finally {
        showLoading(false);
    }
}

// Apply ingredient filters
async function applyIngredientFilters() {
    const search = document.getElementById('ingredient-search')?.value || '';
    const category = document.getElementById('category-filter')?.value || '';
    const storage = document.getElementById('storage-filter')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (storage) params.append('storage', storage);

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/ingredients?${params}`);
        const data = await response.json();
        
        if (data.success) {
            renderIngredients(data.data);
        }
    } catch (error) {
        console.error('Error filtering ingredients:', error);
        showNotification('Error filtering ingredients', 'error');
    } finally {
        showLoading(false);
    }
}

// Populate cuisine filter
function populateCuisineFilter(recipes) {
    const cuisineFilter = document.getElementById('cuisine-filter');
    if (!cuisineFilter) return;

    const cuisines = [...new Set(recipes.map(recipe => recipe.cuisine).filter(Boolean))];
    const existingOptions = Array.from(cuisineFilter.options).map(option => option.value);
    
    cuisines.forEach(cuisine => {
        if (!existingOptions.includes(cuisine)) {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        }
    });
}

// Populate category filter
function populateCategoryFilter(ingredients) {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    const categories = [...new Set(ingredients.map(ingredient => ingredient.category).filter(Boolean))];
    const existingOptions = Array.from(categoryFilter.options).map(option => option.value);
    
    categories.forEach(category => {
        if (!existingOptions.includes(category)) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });
}

// Modal functions
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Show add recipe modal
function showAddRecipeModal() {
    const content = `
        <form id="recipe-form" onsubmit="submitRecipe(event)">
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" name="title" required>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" name="description"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Prep Time (minutes)</label>
                    <input type="number" class="form-input" name="prepTime" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Cook Time (minutes)</label>
                    <input type="number" class="form-input" name="cookTime" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Servings</label>
                    <input type="number" class="form-input" name="servings" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Difficulty</label>
                    <select class="form-select" name="difficulty">
                        <option value="">Select difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Cuisine</label>
                <input type="text" class="form-input" name="cuisine">
            </div>
            <div class="form-group">
                <label class="form-label">Ingredients (one per line)</label>
                <textarea class="form-textarea" name="ingredients" placeholder="1 cup flour&#10;2 eggs&#10;1 tsp salt"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Instructions (one per line)</label>
                <textarea class="form-textarea" name="instructions" placeholder="Mix dry ingredients&#10;Add wet ingredients&#10;Bake for 30 minutes"></textarea>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary">Create Recipe</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('Add Recipe', content);
}

// Submit recipe
async function submitRecipe(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const recipeData = {
        title: formData.get('title'),
        description: formData.get('description'),
        prepTime: parseInt(formData.get('prepTime')) || 0,
        cookTime: parseInt(formData.get('cookTime')) || 0,
        servings: parseInt(formData.get('servings')) || 1,
        difficulty: formData.get('difficulty'),
        cuisine: formData.get('cuisine'),
        ingredients: formData.get('ingredients').split('\n').filter(line => line.trim()).map(line => {
            const parts = line.trim().split(' ');
            const amount = parts[0];
            const unit = parts[1] || 'piece';
            const name = parts.slice(2).join(' ');
            return { amount, unit, name };
        }),
        instructions: formData.get('instructions').split('\n').filter(line => line.trim())
    };

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipeData)
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Recipe created successfully!', 'success');
            closeModal();
            loadRecipes();
        } else {
            showNotification(data.error || 'Error creating recipe', 'error');
        }
    } catch (error) {
        console.error('Error creating recipe:', error);
        showNotification('Error creating recipe', 'error');
    } finally {
        showLoading(false);
    }
}

// Show add meal plan modal
function showAddMealPlanModal() {
    const content = `
        <form id="meal-plan-form" onsubmit="submitMealPlan(event)">
            <div class="form-group">
                <label class="form-label">Name *</label>
                <input type="text" class="form-input" name="name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Start Date *</label>
                    <input type="date" class="form-input" name="startDate" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Date *</label>
                    <input type="date" class="form-input" name="endDate" required>
                </div>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary">Create Meal Plan</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('Create Meal Plan', content);
}

// Submit meal plan
async function submitMealPlan(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const mealPlanData = {
        name: formData.get('name'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        meals: []
    };

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/meal-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mealPlanData)
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Meal plan created successfully!', 'success');
            closeModal();
            loadMealPlans();
        } else {
            showNotification(data.error || 'Error creating meal plan', 'error');
        }
    } catch (error) {
        console.error('Error creating meal plan:', error);
        showNotification('Error creating meal plan', 'error');
    } finally {
        showLoading(false);
    }
}

// Show add ingredient modal
function showAddIngredientModal() {
    const content = `
        <form id="ingredient-form" onsubmit="submitIngredient(event)">
            <div class="form-group">
                <label class="form-label">Name *</label>
                <input type="text" class="form-input" name="name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" name="category">
                        <option value="Other">Other</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Meat">Meat</option>
                        <option value="Seafood">Seafood</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains</option>
                        <option value="Legumes">Legumes</option>
                        <option value="Nuts">Nuts</option>
                        <option value="Spices">Spices</option>
                        <option value="Oils">Oils</option>
                        <option value="Beverages">Beverages</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Storage</label>
                    <select class="form-select" name="storage">
                        <option value="pantry">Pantry</option>
                        <option value="fridge">Fridge</option>
                        <option value="freezer">Freezer</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Unit</label>
                    <input type="text" class="form-input" name="unit" value="piece">
                </div>
                <div class="form-group">
                    <label class="form-label">Price</label>
                    <input type="number" class="form-input" name="price" step="0.01" min="0">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes"></textarea>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary">Add Ingredient</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    showModal('Add Ingredient', content);
}

// Submit ingredient
async function submitIngredient(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const ingredientData = {
        name: formData.get('name'),
        category: formData.get('category'),
        storage: formData.get('storage'),
        unit: formData.get('unit'),
        price: parseFloat(formData.get('price')) || 0,
        notes: formData.get('notes')
    };

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/ingredients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingredientData)
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Ingredient added successfully!', 'success');
            closeModal();
            loadIngredients();
        } else {
            showNotification(data.error || 'Error adding ingredient', 'error');
        }
    } catch (error) {
        console.error('Error adding ingredient:', error);
        showNotification('Error adding ingredient', 'error');
    } finally {
        showLoading(false);
    }
}

// Generate shopping list
async function generateShoppingList(mealPlanId) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/meal-plans/${mealPlanId}/shopping-list`);
        const data = await response.json();
        
        if (data.success) {
            const mealPlan = mealPlans.find(plan => plan.id === mealPlanId);
            showShoppingListModal(mealPlan.name, data.data);
        } else {
            showNotification('Error generating shopping list', 'error');
        }
    } catch (error) {
        console.error('Error generating shopping list:', error);
        showNotification('Error generating shopping list', 'error');
    } finally {
        showLoading(false);
    }
}

// Show shopping list modal
function showShoppingListModal(mealPlanName, shoppingList) {
    const content = `
        <div class="shopping-list">
            <h3>Shopping List for ${mealPlanName}</h3>
            <div class="shopping-items">
                ${shoppingList.map(item => `
                    <div class="shopping-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-amount">${item.amount} ${item.unit}</span>
                        <span class="item-category">${item.category}</span>
                    </div>
                `).join('')}
            </div>
            <div class="shopping-actions">
                <button class="btn btn-primary" onclick="printShoppingList()">
                    <i class="fas fa-print"></i>
                    Print List
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    showModal('Shopping List', content);
}

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('active', show);
    }
}

function showNotification(message, type = 'info') {
    // Simple notification - in a real app, you'd use a proper notification library
    alert(`${type.toUpperCase()}: ${message}`);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Placeholder functions for future implementation
function viewRecipe(id) {
    console.log('View recipe:', id);
    // TODO: Implement recipe view
}

function editRecipe(id) {
    console.log('Edit recipe:', id);
    // TODO: Implement recipe edit
}

function deleteRecipe(id) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        console.log('Delete recipe:', id);
        // TODO: Implement recipe deletion
    }
}

function viewMealPlan(id) {
    console.log('View meal plan:', id);
    // TODO: Implement meal plan view
}

function editMealPlan(id) {
    console.log('Edit meal plan:', id);
    // TODO: Implement meal plan edit
}

function deleteMealPlan(id) {
    if (confirm('Are you sure you want to delete this meal plan?')) {
        console.log('Delete meal plan:', id);
        // TODO: Implement meal plan deletion
    }
}

function viewIngredient(id) {
    console.log('View ingredient:', id);
    // TODO: Implement ingredient view
}

function editIngredient(id) {
    console.log('Edit ingredient:', id);
    // TODO: Implement ingredient edit
}

function deleteIngredient(id) {
    if (confirm('Are you sure you want to delete this ingredient?')) {
        console.log('Delete ingredient:', id);
        // TODO: Implement ingredient deletion
    }
}

function printShoppingList() {
    window.print();
}
