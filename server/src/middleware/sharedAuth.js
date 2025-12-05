import { User } from '../config/models/index.js';

export const sharedAuth = async (req, res, next) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Share token is required'
            });
        }

        const user = await User.findOne({ analyticsShareToken: token });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired share token'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Shared auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};
