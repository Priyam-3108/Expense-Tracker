import mongoose from 'mongoose';
import { Category } from '../config/models/index.js';

// Get all categories for a user
export const getCategories = async (req, res) => {
  try {
    // Get all categories for the user
    const categories = await Category.find({ user: req.user._id });

    // Get user's category order
    const { User } = await import('../config/models/index.js');
    const user = await User.findById(req.user._id);
    const categoryOrder = user.categoryOrder || [];

    // Create a map for order index
    const orderMap = {};
    categoryOrder.forEach((id, index) => {
      orderMap[id.toString()] = index;
    });

    // Sort categories based on order map
    // Items not in the map will be placed at the end, sorted by isDefault and createdAt
    categories.sort((a, b) => {
      const indexA = orderMap[a._id.toString()];
      const indexB = orderMap[b._id.toString()];

      if (indexA !== undefined && indexB !== undefined) {
        return indexA - indexB;
      }
      if (indexA !== undefined) return -1;
      if (indexB !== undefined) return 1;

      // Fallback to default sorting
      if (a.isDefault !== b.isDefault) {
        return b.isDefault - a.isDefault; // Defaults first
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Get expense counts for each category using aggregation
    const { Expense } = await import('../config/models/index.js');
    const expenseCounts = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of category ID to expense count
    const expenseCountMap = {};
    expenseCounts.forEach(item => {
      expenseCountMap[item._id.toString()] = item.count;
    });

    // Add expense count to each category
    const categoriesWithCounts = categories.map(category => {
      const categoryObj = category.toObject();
      categoryObj.expenseCount = expenseCountMap[category._id.toString()] || 0;
      return categoryObj;
    });

    res.json({
      success: true,
      data: {
        categories: categoriesWithCounts
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

// Get single category
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get expense count for this category
    const { Expense } = await import('../config/models/index.js');
    const expenseCount = await Expense.countDocuments({
      category: category._id,
      user: req.user._id
    });

    const categoryObj = category.toObject();
    categoryObj.expenseCount = expenseCount;

    res.json({
      success: true,
      data: {
        category: categoryObj
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category',
      error: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      name: name.trim(),
      user: req.user._id
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name: name.trim(),
      color: color || '#3B82F6',
      icon: icon || '💰',
      user: req.user._id,
      isDefault: false // Ensure user-created categories are not default
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Create category error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const categoryId = req.params.id;

    // Find category and ensure it belongs to the user
    const category = await Category.findOne({
      _id: categoryId,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent modification of default categories
    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify default categories'
      });
    }

    // Check if new name conflicts with existing category
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        name: name.trim(),
        user: req.user._id,
        _id: { $ne: categoryId }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category
    const updates = {};
    if (name) updates.name = name.trim();
    if (color) updates.color = color;
    if (icon) updates.icon = icon;

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    console.error('Update category error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Find category and ensure it belongs to the user
    const category = await Category.findOne({
      _id: categoryId,
      user: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent deletion of default categories
    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default categories'
      });
    }

    // Check if category has associated expenses
    const { Expense } = await import('../config/models/index.js');
    const expenseCount = await Expense.countDocuments({
      category: categoryId,
      user: req.user._id
    });

    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${expenseCount} associated expense(s). Please reassign or delete the expenses first.`
      });
    }

    await Category.findByIdAndDelete(categoryId);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

// Get category statistics
export const getCategoryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate and return date string in YYYY-MM-DD format
    const validateDateString = (dateStr) => {
      if (!dateStr) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let dateFilter = {};
    if (startDate && endDate) {
      const start = validateDateString(startDate);
      const end = validateDateString(endDate);

      if (start && end) {
        dateFilter = {
          date: {
            $gte: start,
            $lte: end
          }
        };
      }
    }

    const { Expense } = await import('../config/models/index.js');

    const stats = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          categoryColor: { $first: '$categoryInfo.color' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category statistics',
      error: error.message
    });
  }
};

// Update category order
export const updateCategoryOrder = async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order must be an array of category IDs'
      });
    }

    const { User } = await import('../config/models/index.js');

    // Update user's category order
    await User.findByIdAndUpdate(req.user._id, {
      categoryOrder: order
    });

    res.json({
      success: true,
      message: 'Category order updated successfully'
    });
  } catch (error) {
    console.error('Update category order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category order',
      error: error.message
    });
  }
};

