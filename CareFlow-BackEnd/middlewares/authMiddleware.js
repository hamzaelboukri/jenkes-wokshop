import jwt from 'jsonwebtoken';
import User from '../Models/userModel.js';

// Middleware pour vérifier le token JWT
export const verifyToken = async (req, res, next) => {
    try {
        let token = req.cookies?.Authorization;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.startsWith('Bearer') 
                ? req.headers.authorization.split(' ')[1] 
                : req.headers.authorization;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        if (token.startsWith('Bearer')) {
            token = token.slice(6);
        }

        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended. Please contact administrator.',
            });
        }

        req.user = {
            userId: decoded.userId,
            name: user.name,
            email: decoded.email,
            role: user.role,
            verified: decoded.verified,
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }
};

// Middleware pour vérifier les rôles autorisés
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
            });
        }

        next();
    };
};

// Middleware pour vérifier si l'utilisateur est vérifié
export const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'User not authenticated.',
        });
    }

    if (!req.user.verified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required. Please verify your email first.',
        });
    }

    next();
};

// Middleware combiné : authentification + rôles
export const authenticateAndAuthorize = (...allowedRoles) => {
    return [verifyToken, authorize(...allowedRoles)];
};

export default { verifyToken, authorize, requireVerified, authenticateAndAuthorize };