import { Request, Response, NextFunction } from 'express';

// For MVP: hardcode admin user. In production, decode JWT from Authorization header
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'customer' | 'chef';
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // MVP: Check for Authorization header with Bearer token
  // In production, this would validate a real JWT
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For MVP testing, allow requests but mark as unauthenticated
    // In production, this should reject with 401
    req.user = {
      id: 'anonymous',
      role: 'customer', // Default role
    };
    return next();
  }

  // Parse token (format: "Bearer <user_id>:<role>")
  // In production, this would be a real JWT
  const token = authHeader.substring(7);
  const [userId, role] = token.split(':');

  if (!userId || !role) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid authorization token format',
    });
  }

  if (!['admin', 'customer', 'chef'].includes(role)) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_ROLE',
      message: 'Invalid user role',
    });
  }

  req.user = { id: userId, role: role as 'admin' | 'customer' | 'chef' };
  next();
};

// Authorization check: only admins can access
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // MVP: Allow unauthenticated admin access for testing
  // In production, enforce strict authentication
  if (process.env.NODE_ENV === 'production') {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
  } else {
    // Development: If no user, assume admin for testing
    if (!req.user) {
      req.user = { id: 'dev-admin', role: 'admin' };
    }
  }
  next();
};

// Authorization check: customers can only access their own data
export const requireCustomerOwnership = (customerId: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Admins can access anything
    if (req.user?.role === 'admin') {
      return next();
    }

    // Customers can only access their own data
    if (req.user?.role === 'customer' && req.user.id === customerId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  };
};
