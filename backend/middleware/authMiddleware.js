const User = require('../models/User');

// Middleware to check if user is admin
exports.checkAdmin = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
        }

        // Decode the demo token format (base64 of userId:timestamp)
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId] = decoded.split(':');

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token format' });
        }

        // FALLBACK for Admin
        if (userId === '000000000000000000000000') {
            req.user = { _id: userId, role: 'admin', email: 'admin@intake.ai' };
            return next();
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
        }

        // Attach user to request for use in routes
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ success: false, error: 'Server error during authentication' });
    }
};
