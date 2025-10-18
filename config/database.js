// Simple in-memory database for development
// In production, this would connect to a real database like MongoDB or PostgreSQL

class Database {
    constructor() {
        this.recipes = [];
        this.mealPlans = [];
        this.ingredients = [];
        this.nextId = 1;
    }

    // Generic CRUD operations
    create(collection, data) {
        const item = { id: this.nextId++, ...data, createdAt: new Date() };
        this[collection].push(item);
        return item;
    }

    findById(collection, id) {
        return this[collection].find(item => item.id === parseInt(id));
    }

    findAll(collection) {
        return this[collection];
    }

    update(collection, id, data) {
        const index = this[collection].findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            this[collection][index] = { ...this[collection][index], ...data, updatedAt: new Date() };
            return this[collection][index];
        }
        return null;
    }

    delete(collection, id) {
        const index = this[collection].findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            return this[collection].splice(index, 1)[0];
        }
        return null;
    }

    // Search functionality
    search(collection, query, fields) {
        return this[collection].filter(item => {
            return fields.some(field => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(query.toLowerCase());
                }
                return false;
            });
        });
    }
}

const db = new Database();

module.exports = db;
