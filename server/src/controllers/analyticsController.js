import crypto from 'crypto';
import { User } from '../config/models/index.js';

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
