import { Expense, Category } from '../config/models/index.js';

// Get all expenses for a user with filtering and pagination
export const getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };
    
    if (category) filter.category = category;
    if (type) filter.type = type;
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get expenses with category info
    const expenses = await Expense.find(filter)
      .populate('category', 'name color icon')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Expense.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses',
      error: error.message
    });
  }
};

// Get single expense
export const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('category', 'name color icon');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense',
      error: error.message
    });
  }
};

// Create new expense
export const createExpense = async (req, res) => {
  try {
    const {
      description,
      amount,
      date,
      category,
      type = 'expense',
      tags,
      notes,
      isRecurring,
      recurringPeriod
    } = req.body;

    // Verify category exists and belongs to user
    const categoryExists = await Category.findOne({
      _id: category,
      user: req.user._id
    });

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const expense = new Expense({
      description: description.trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      category,
      type,
      tags: tags || [],
      notes: notes ? notes.trim() : '',
      isRecurring: isRecurring || false,
      recurringPeriod: recurringPeriod || 'monthly',
      user: req.user._id
    });

    await expense.save();

    // Populate category info before sending response
    await expense.populate('category', 'name color icon');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const {
      description,
      amount,
      date,
      category,
      type,
      tags,
      notes,
      isRecurring,
      recurringPeriod
    } = req.body;

    // Find expense and ensure it belongs to the user
    const expense = await Expense.findOne({
      _id: expenseId,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Verify category exists and belongs to user (if category is being updated)
    if (category) {
      const categoryExists = await Category.findOne({
        _id: category,
        user: req.user._id
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    // Update expense
    const updates = {};
    if (description) updates.description = description.trim();
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (date) updates.date = new Date(date);
    if (category) updates.category = category;
    if (type) updates.type = type;
    if (tags) updates.tags = tags;
    if (notes !== undefined) updates.notes = notes.trim();
    if (isRecurring !== undefined) updates.isRecurring = isRecurring;
    if (recurringPeriod) updates.recurringPeriod = recurringPeriod;

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      updates,
      { new: true, runValidators: true }
    ).populate('category', 'name color icon');

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: {
        expense: updatedExpense
      }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Find expense and ensure it belongs to the user
    const expense = await Expense.findOne({
      _id: expenseId,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Get expense statistics
export const getExpenseStats = async (req, res) => {
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

    // Get monthly summary
    const monthlySummary = await Expense.getMonthlySummary(
      req.user._id,
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );

    // Get category summary
    const categorySummary = await Expense.getCategorySummary(
      req.user._id,
      startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1),
      endDate ? new Date(endDate) : new Date()
    );

    // Get total expenses and income
    const totalStats = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate net amount
    const expenseTotal = totalStats.find(stat => stat._id === 'expense')?.total || 0;
    const incomeTotal = totalStats.find(stat => stat._id === 'income')?.total || 0;
    const netAmount = incomeTotal - expenseTotal;

    res.json({
      success: true,
      data: {
        monthlySummary,
        categorySummary,
        totalStats: {
          expenses: expenseTotal,
          income: incomeTotal,
          net: netAmount
        }
      }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense statistics',
      error: error.message
    });
  }
};

// Get expense trends (monthly data for charts)
export const getExpenseTrends = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const trends = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          expenses: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'expense'] },
                '$total',
                0
              ]
            }
          },
          income: {
            $sum: {
              $cond: [
                { $eq: ['$_id.type', 'income'] },
                '$total',
                0
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Fill in missing months with zero values
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const completeTrends = monthNames.map((month, index) => {
      const monthData = trends.find(t => t._id === index + 1);
      return {
        month,
        expenses: monthData?.expenses || 0,
        income: monthData?.income || 0,
        net: (monthData?.income || 0) - (monthData?.expenses || 0)
      };
    });

    res.json({
      success: true,
      data: {
        trends: completeTrends,
        year: parseInt(year)
      }
    });
  } catch (error) {
    console.error('Get expense trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense trends',
      error: error.message
    });
  }
};
