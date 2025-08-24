import { Category } from '../config/models/index.js';

// Get all categories for a user
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id })
      .populate('expenseCount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        categories
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
    }).populate('expenseCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category
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
      user: req.user._id
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
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
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

// Create default categories for a user
export const createDefaultCategories = async (req, res) => {
  try {
    const defaultCategories = [
      { name: 'Meal', color: '#EF4444', icon: '🍽️', isDefault: true },
      { name: 'House Rent', color: '#10B981', icon: '🏠', isDefault: true },
      { name: 'Travel', color: '#3B82F6', icon: '✈️', isDefault: true },
      { name: 'Loan', color: '#F59E0B', icon: '💳', isDefault: true },
      { name: 'Shopping', color: '#8B5CF6', icon: '🛍️', isDefault: true },
      { name: 'Transportation', color: '#06B6D4', icon: '🚗', isDefault: true },
      { name: 'Healthcare', color: '#EC4899', icon: '🏥', isDefault: true },
      { name: 'Entertainment', color: '#F97316', icon: '🎬', isDefault: true },
      { name: 'Education', color: '#84CC16', icon: '📚', isDefault: true },
      { name: 'Utilities', color: '#6366F1', icon: '⚡', isDefault: true }
    ];

    // Check which default categories don't exist for this user
    const existingCategories = await Category.find({ user: req.user._id });
    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());
    
    const categoriesToCreate = defaultCategories.filter(
      cat => !existingNames.includes(cat.name.toLowerCase())
    );

    if (categoriesToCreate.length === 0) {
      return res.json({
        success: true,
        message: 'All default categories already exist',
        data: {
          created: 0,
          categories: []
        }
      });
    }

    // Create the missing default categories
    const createdCategories = [];
    for (const categoryData of categoriesToCreate) {
      const category = new Category({
        ...categoryData,
        user: req.user._id
      });
      await category.save();
      createdCategories.push(category);
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdCategories.length} default categories`,
      data: {
        created: createdCategories.length,
        categories: createdCategories
      }
    });
  } catch (error) {
    console.error('Create default categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create default categories',
      error: error.message
    });
  }
};
