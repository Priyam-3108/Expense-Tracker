import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, Expense } from '../config/models/index.js';

// Generate or retrieve share token
export const getShareToken = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+analyticsShareToken');

        if (!user.analyticsShareToken) {
            // Generate new token
            const token = crypto.randomBytes(32).toString('hex');
            user.analyticsShareToken = token;
            await user.save();
        }

        res.json({
            success: true,
            data: {
                token: user.analyticsShareToken,
                link: `${process.env.CLIENT_URL || 'http://localhost:5173'}/analytics/shared/${user.analyticsShareToken}`
            }
        });
    } catch (error) {
        console.error('Get share token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate share link',
            error: error.message
        });
    }
};

// Revoke share token
export const revokeShareToken = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        user.analyticsShareToken = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Share link revoked successfully'
        });
    } catch (error) {
        console.error('Revoke share token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke share link',
            error: error.message
        });
    }
};

// Get shared profile (public)
export const getSharedProfile = async (req, res) => {
    try {
        // req.user is set by sharedAuth middleware
        const user = req.user;

        res.json({
            success: true,
            data: {
                name: user.name,
                currency: user.currency,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Get shared profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get shared profile',
            error: error.message
        });
    }
};

// Get shared categories
export const getSharedCategories = async (req, res) => {
    try {
        const { Category } = await import('../config/models/index.js');
        const categories = await Category.find({ user: req.user._id });

        res.json({
            success: true,
            data: {
                categories
            }
        });
    } catch (error) {
        console.error('Get shared categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get shared categories',
            error: error.message
        });
    }
};

// Spending grouped by payment method for a date range (expense-only).
export const getPaymentModeBreakdown = async (req, res) => {
  try {
    let { from, to } = req.query;

    if ((from && isNaN(new Date(from).getTime())) || (to && isNaN(new Date(to).getTime()))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date',
      });
    }

    if (!from || !to) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      from = `${year}-${month}-01`;
      to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    }

    const rows = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          type: 'expense',
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$paymentMode', 'other'] },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const breakdown = rows.map((r) => ({
      paymentMode: r._id,
      total: r.total,
      count: r.count,
    }));
    const totalSpent = breakdown.reduce((s, b) => s + b.total, 0);

    res.json({
      success: true,
      data: { from, to, breakdown, totalSpent },
    });
  } catch (error) {
    console.error('Get payment-mode breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compute payment-mode breakdown',
      error: error.message,
    });
  }
};
