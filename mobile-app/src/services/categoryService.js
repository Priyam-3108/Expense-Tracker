import api from './api';

export const categoryService = {
    // Get all categories
    getCategories: () => {
        return api.get('/categories');
    },

    // Get single category
    getCategory: (id) => {
        return api.get(`/categories/${id}`);
    },

    // Create new category
    createCategory: (categoryData) => {
        return api.post('/categories', categoryData);
    },

    // Update category
    updateCategory: (id, updates) => {
        return api.put(`/categories/${id}`, updates);
    },

    // Delete category
    deleteCategory: (id) => {
        return api.delete(`/categories/${id}`);
    },

    // Get category statistics
    getCategoryStats: (dateRange = {}) => {
        return api.get('/categories/stats', { params: dateRange });
    },

    // Update category order
    updateCategoryOrder: (order) => {
        return api.put('/categories/order', { order });
    }
};

export default categoryService;
