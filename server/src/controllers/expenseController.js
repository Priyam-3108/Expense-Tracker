import mongoose from 'mongoose';
import { Expense, Category } from '../config/models/index.js';

// Validate and return date string in YYYY-MM-DD format
const validateDateString = (dateStr) => {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // If it's an ISO string or other format, extract the date part
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date as YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get next recurring date as YYYY-MM-DD string
const getNextRecurringDate = (currentDateStr, period) => {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const currentDate = new Date(year, month - 1, day);

  switch (period) {
    case 'weekly':
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case 'yearly':
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      break;
    case 'monthly':
    default: {
      const originalDay = currentDate.getDate();
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      currentDate.setDate(Math.min(originalDay, daysInMonth));
      break;
    }
  }

  const newYear = currentDate.getFullYear();
  const newMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const newDay = String(currentDate.getDate()).padStart(2, '0');
  return `${newYear}-${newMonth}-${newDay}`;
};

// Get all expenses for a user with filtering and pagination
export const getExpenses = async (req, res) => {
  try {
    const {
      page,
      limit,
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

    if (category && category !== 'all') {
      try {
        filter.category = new mongoose.Types.ObjectId(category);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category identifier'
        });
      }
    }
    if (type && type !== 'all') filter.type = type;

    if (startDate && endDate) {
      filter.date = {
        $gte: validateDateString(startDate),
        $lte: validateDateString(endDate)
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

    // Check if pagination is requested
    if (page && limit) {
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
    } else {
      // Return all expenses without pagination
      const expenses = await Expense.find(filter)
        .populate('category', 'name color icon')
        .sort(sort);

      res.json({
        success: true,
        data: {
          expenses
        }
      });
    }
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

// Bulk create expenses
export const bulkCreateExpenses = async (req, res) => {
  try {
    const { date, expenses } = req.body;

    if (!date || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Date and expenses array are required'
      });
    }

    const baseDate = validateDateString(date);
    if (!baseDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date provided. Use YYYY-MM-DD format.'
      });
    }

    // Validate all expenses
    const validExpenses = [];
    const errors = [];

    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];

      if (!expense.amount || parseFloat(expense.amount) <= 0) {
        errors.push(`Expense ${i + 1}: Invalid amount`);
        continue;
      }

      if (!expense.category) {
        errors.push(`Expense ${i + 1}: Category is required`);
        continue;
      }

      // Verify category exists and belongs to user
      const categoryExists = await Category.findOne({
        _id: expense.category,
        user: req.user._id
      });

      if (!categoryExists) {
        errors.push(`Expense ${i + 1}: Invalid category`);
        continue;
      }

      validExpenses.push({
        description: expense.description ? expense.description.trim() : '',
        amount: parseFloat(expense.amount),
        date: baseDate,
        category: expense.category,
        type: 'expense',
        user: req.user._id
      });
    }

    if (validExpenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid expenses to create',
        errors
      });
    }

    // Insert all valid expenses
    const createdExpenses = await Expense.insertMany(validExpenses);
    await Expense.populate(createdExpenses, { path: 'category', select: 'name color icon' });

    res.status(201).json({
      success: true,
      message: `${createdExpenses.length} expense(s) created successfully`,
      data: {
        expenses: createdExpenses,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk create expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expenses',
      error: error.message
    });
  }
};

// Bulk delete expenses
export const bulkDeleteExpenses = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of expense IDs is required'
      });
    }

    const result = await Expense.deleteMany({
      _id: { $in: ids },
      user: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No expenses found to delete'
      });
    }

    res.json({
      success: true,
      message: `${result.deletedCount} expense(s) deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expenses',
      error: error.message
    });
  }
};

// Bulk update expenses
export const bulkUpdateExpenses = async (req, res) => {
  try {
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of expense IDs is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    // Validate updates
    const allowedUpdates = {};
    if (updates.category) {
      // Verify category exists and belongs to user
      const categoryExists = await Category.findOne({
        _id: updates.category,
        user: req.user._id
      });

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      allowedUpdates.category = updates.category;
    }

    if (updates.date) {
      const dateStr = validateDateString(updates.date);
      if (!dateStr) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date provided. Use YYYY-MM-DD format.'
        });
      }
      allowedUpdates.date = dateStr;
    }

    if (updates.type) allowedUpdates.type = updates.type;
    if (updates.description !== undefined) allowedUpdates.description = updates.description.trim();
    if (updates.amount !== undefined) allowedUpdates.amount = parseFloat(updates.amount);

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const result = await Expense.updateMany(
      {
        _id: { $in: ids },
        user: req.user._id
      },
      { $set: allowedUpdates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No expenses found to update'
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} expense(s) updated successfully`
    });
  } catch (error) {
    console.error('Bulk update expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expenses',
      error: error.message
    });
  }
};
// Bulk update expenses with individual values
export const bulkUpdateList = async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of expenses is required'
      });
    }

    const updates = [];
    const errors = [];

    for (let i = 0; i < expenses.length; i++) {
      const item = expenses[i];

      if (!item._id) {
        errors.push(`Item ${i + 1}: Missing ID`);
        continue;
      }

      const updateData = {};

      if (item.category) {
        // Verify category exists
        const categoryExists = await Category.findOne({
          _id: item.category,
          user: req.user._id
        });
        if (!categoryExists) {
          errors.push(`Item ${i + 1}: Invalid category`);
          continue;
        }
        updateData.category = item.category;
      }

      if (item.date) {
        const dateStr = validateDateString(item.date);
        if (!dateStr) {
          errors.push(`Item ${i + 1}: Invalid date`);
          continue;
        }
        updateData.date = dateStr;
      }

      if (item.type) updateData.type = item.type;
      if (item.description !== undefined) updateData.description = item.description.trim();
      if (item.amount !== undefined) {
        const amount = parseFloat(item.amount);
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Item ${i + 1}: Invalid amount`);
          continue;
        }
        updateData.amount = amount;
      }

      if (Object.keys(updateData).length > 0) {
        updates.push({
          updateOne: {
            filter: { _id: item._id, user: req.user._id },
            update: { $set: updateData }
          }
        });
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates found',
        errors
      });
    }

    const result = await Expense.bulkWrite(updates);

    res.json({
      success: true,
      message: `${result.modifiedCount} expense(s) updated successfully`,
      data: {
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Bulk list update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expenses',
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
      recurringPeriod,
      recurringEndDate
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

    const baseDate = validateDateString(date) || getTodayString();
    if (!baseDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date provided. Use YYYY-MM-DD format.'
      });
    }

    const cleanedDescription = description ? description.trim() : '';

    if (isRecurring) {
      if (!recurringEndDate) {
        return res.status(400).json({
          success: false,
          message: 'Recurring expenses require an end date'
        });
      }

      const endDateStr = validateDateString(recurringEndDate);
      if (!endDateStr) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recurring end date provided. Use YYYY-MM-DD format.'
        });
      }

      if (baseDate > endDateStr) {
        return res.status(400).json({
          success: false,
          message: 'Recurring end date must be after the start date'
        });
      }

      const period = recurringPeriod || 'monthly';
      const occurrences = [];
      let currentDateStr = baseDate;
      const groupId = new mongoose.Types.ObjectId();
      const maxOccurrences = 500;

      while (currentDateStr <= endDateStr) {
        occurrences.push({
          description: cleanedDescription,
          amount: parseFloat(amount),
          date: currentDateStr,
          category,
          type,
          tags: tags || [],
          notes: notes ? notes.trim() : '',
          isRecurring: true,
          recurringPeriod: period,
          recurringEndDate: endDateStr,
          recurringGroupId: groupId,
          user: req.user._id
        });

        currentDateStr = getNextRecurringDate(currentDateStr, period);

        if (occurrences.length >= maxOccurrences) {
          break;
        }
      }

      const createdExpenses = await Expense.insertMany(occurrences);
      await Expense.populate(createdExpenses, { path: 'category', select: 'name color icon' });

      return res.status(201).json({
        success: true,
        message: 'Recurring expenses created successfully',
        data: {
          expenses: createdExpenses
        }
      });
    }

    const expense = new Expense({
      description: cleanedDescription,
      amount: parseFloat(amount),
      date: baseDate, // YYYY-MM-DD string
      category,
      type,
      tags: tags || [],
      notes: notes ? notes.trim() : '',
      isRecurring: false,
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
      recurringPeriod,
      recurringEndDate
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

    const updates = {};
    const unset = {};

    if (description !== undefined) updates.description = description ? description.trim() : '';
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (date) {
      const dateStr = validateDateString(date);
      if (!dateStr) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date provided. Use YYYY-MM-DD format.'
        });
      }
      updates.date = dateStr;
    }
    if (category) updates.category = category;
    if (type) updates.type = type;
    if (tags) updates.tags = tags;
    if (notes !== undefined) updates.notes = notes ? notes.trim() : '';
    if (isRecurring !== undefined) updates.isRecurring = isRecurring;
    if (isRecurring !== undefined && !isRecurring) {
      unset.recurringPeriod = '';
      unset.recurringEndDate = '';
      unset.recurringGroupId = '';
    } else if (recurringPeriod) {
      updates.recurringPeriod = recurringPeriod;
    }

    if (recurringEndDate !== undefined) {
      if (recurringEndDate) {
        const endDateStr = validateDateString(recurringEndDate);
        if (!endDateStr) {
          return res.status(400).json({
            success: false,
            message: 'Invalid recurring end date provided. Use YYYY-MM-DD format.'
          });
        }

        const effectiveDate = updates.date || expense.date;
        if (effectiveDate > endDateStr) {
          return res.status(400).json({
            success: false,
            message: 'Recurring end date must be after the start date'
          });
        }

        updates.recurringEndDate = endDateStr;
      } else {
        unset.recurringEndDate = '';
      }
    }

    const updatePayload = Object.keys(updates).length ? { $set: updates } : {};
    const unsetPayload = Object.keys(unset).length ? { $unset: unset } : {};

    if (!Object.keys(updatePayload).length && !Object.keys(unsetPayload).length) {
      const freshExpense = await Expense.findById(expenseId).populate('category', 'name color icon');
      return res.json({
        success: true,
        message: 'Expense updated successfully',
        data: {
          expense: freshExpense
        }
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { ...updatePayload, ...unsetPayload },
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
          $gte: validateDateString(startDate),
          $lte: validateDateString(endDate)
        }
      };
    }

    // Get monthly summary
    const now = new Date();
    const monthlySummary = await Expense.getMonthlySummary(
      req.user._id,
      now.getFullYear(),
      now.getMonth() + 1
    );

    // Get category summary - use string dates
    const startDateStr = startDate ? validateDateString(startDate) : `${now.getFullYear()}-01-01`;
    const endDateStr = endDate ? validateDateString(endDate) : getTodayString();
    const categorySummary = await Expense.getCategorySummary(
      req.user._id,
      startDateStr,
      endDateStr
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

    // Use string date comparison for YYYY-MM-DD format
    const startDateStr = `${year}-01-01`;
    const endDateStr = `${year}-12-31`;

    const trends = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: startDateStr,
            $lte: endDateStr
          }
        }
      },
      {
        // Extract month from YYYY-MM-DD string
        $addFields: {
          monthNum: { $toInt: { $substr: ['$date', 5, 2] } }
        }
      },
      {
        $group: {
          _id: {
            month: '$monthNum',
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

// Get detailed analytics with comprehensive insights
export const getDetailedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, category, type } = req.query;

    // Build base filter
    const filter = { user: req.user._id };

    // Add date range filter using string comparison
    if (startDate && endDate) {
      filter.date = {
        $gte: validateDateString(startDate),
        $lte: validateDateString(endDate)
      };
    } else {
      // Default to current month if no dates provided
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      filter.date = {
        $gte: `${year}-${month}-01`,
        $lte: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
      };
    }

    // Add category filter if provided
    if (category && category !== 'all') {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    // Add type filter if provided
    if (type && type !== 'all') {
      filter.type = type;
    }

    // 1. Get category-wise breakdown with detailed stats
    const categoryBreakdown = await Expense.aggregate([
      { $match: { ...filter, type: 'expense' } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          category: { $first: '$categoryInfo' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // 2. Get overall summary stats
    const summaryStats = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' }
        }
      }
    ]);

    const expenseStats = summaryStats.find(s => s._id === 'expense') || { total: 0, count: 0, avg: 0 };
    const incomeStats = summaryStats.find(s => s._id === 'income') || { total: 0, count: 0, avg: 0 };

    // 3. Get daily spending pattern (date is already YYYY-MM-DD string)
    const dailyPattern = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: '$date',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          },
          transactionCount: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Get top spending days
    const topSpendingDays = await Expense.aggregate([
      { $match: { ...filter, type: 'expense' } },
      {
        $group: {
          _id: '$date',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // 5. Get weekly comparison - extract year and calculate week from string date
    const weeklyComparison = await Expense.aggregate([
      { $match: filter },
      {
        $addFields: {
          yearNum: { $toInt: { $substr: ['$date', 0, 4] } },
          monthNum: { $toInt: { $substr: ['$date', 5, 2] } },
          dayNum: { $toInt: { $substr: ['$date', 8, 2] } }
        }
      },
      {
        $addFields: {
          // Simple week calculation (approximate)
          weekNum: { $ceil: { $divide: [{ $add: [{ $multiply: [{ $subtract: ['$monthNum', 1] }, 4] }, '$dayNum'] }, 7] } }
        }
      },
      {
        $group: {
          _id: {
            week: '$weekNum',
            year: '$yearNum',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { week: '$_id.week', year: '$_id.year' },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    // 6. Get monthly comparison - extract month and year from string date
    const monthlyComparison = await Expense.aggregate([
      { $match: filter },
      {
        $addFields: {
          yearNum: { $toInt: { $substr: ['$date', 0, 4] } },
          monthNum: { $toInt: { $substr: ['$date', 5, 2] } }
        }
      },
      {
        $group: {
          _id: {
            month: '$monthNum',
            year: '$yearNum',
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { month: '$_id.month', year: '$_id.year' },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 7. Calculate insights
    const totalDays = dailyPattern.length || 1;
    const avgDailyExpense = expenseStats.total / totalDays;
    const avgDailyIncome = incomeStats.total / totalDays;
    const netAmount = incomeStats.total - expenseStats.total;
    const savingsRate = incomeStats.total > 0 ? ((netAmount / incomeStats.total) * 100) : 0;

    // 8. Get recurring expenses info
    const recurringExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          isRecurring: true,
          type: 'expense'
        }
      },
      {
        $group: {
          _id: '$recurringGroupId',
          amount: { $first: '$amount' },
          description: { $first: '$description' },
          period: { $first: '$recurringPeriod' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRecurringExpenses = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Prepare response
    res.json({
      success: true,
      data: {
        summary: {
          totalExpenses: expenseStats.total,
          totalIncome: incomeStats.total,
          netAmount,
          expenseCount: expenseStats.count,
          incomeCount: incomeStats.count,
          avgExpenseAmount: expenseStats.avg,
          avgIncomeAmount: incomeStats.avg,
          avgDailyExpense,
          avgDailyIncome,
          savingsRate,
          totalDays
        },
        categoryBreakdown,
        dailyPattern,
        topSpendingDays,
        weeklyComparison,
        monthlyComparison,
        recurringExpenses: {
          total: totalRecurringExpenses,
          count: recurringExpenses.length,
          details: recurringExpenses
        },
        insights: {
          highestSpendingCategory: categoryBreakdown[0] || null,
          lowestSpendingCategory: categoryBreakdown[categoryBreakdown.length - 1] || null,
          averageTransactionSize: expenseStats.count > 0 ? expenseStats.total / expenseStats.count : 0,
          totalTransactions: expenseStats.count + incomeStats.count
        }
      }
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed analytics',
      error: error.message
    });
  }
};

