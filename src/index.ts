import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { prisma } from './db';

// Load environment variables
dotenv.config();

// Initialize Express
const app: Express = express();
const PORT = process.env.PORT || 3002;

// Import auth middleware
import { authMiddleware } from './middleware/auth';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Multer for file uploads (for photo uploads)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Serve static files (for uploaded photos)
app.use(express.static('public'));

// Health check (before auth)
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'API is running' });
});

// Routes are registered below

// Global error handler
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Error handling middleware will be registered AFTER routes below

// Import routes
import cropRoutes from './routes/crops';
import variantRoutes from './routes/variants';
import orderRoutes from './routes/orders';
import seedingHarvestRoutes from './routes/seeding-harvest';
import customerRoutes from './routes/customers';
import followUpRoutes from './routes/follow-ups';
import inventoryRoutes from './routes/inventory';
import dashboardRoutes from './routes/dashboard';
import invoiceRoutes from './routes/invoices';
import standingOrderRoutes from './routes/standing-orders';
import growthStepRoutes from './routes/growth-steps';
import sizeTemplateRoutes from './routes/size-templates';
import publicRoutes from './routes/public';

// Use routes (public routes first, before auth middleware)
app.use('/api/public', publicRoutes);

app.use(authMiddleware);

// Log crops requests for debugging
app.use('/api/crops', (req, res, next) => {
  console.log('[INDEX] Request to /api/crops:', req.method, req.path, req.query);
  next();
});

app.use('/api/crops', cropRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seeding', seedingHarvestRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/standing-orders', standingOrderRoutes);
app.use('/api/growth-steps', growthStepRoutes);
app.use('/api/size-templates', sizeTemplateRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
  } as ApiResponse);
});

// Error handling middleware (MUST be after routes)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] Path:', req.path, 'Method:', req.method);
  console.error('[ERROR] Full error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      details: err.details,
    } as ApiResponse);
  }

  console.error('Unhandled error:', err instanceof Error ? err.message : String(err));
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  } as ApiResponse);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection (optional - server starts even if DB fails)
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✓ Database connection successful');
    } catch (dbError) {
      console.warn('⚠ Database connection failed, but server starting anyway');
      console.warn('  Details:', dbError instanceof Error ? dbError.message : String(dbError));
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export { app, ApiError, ApiResponse, prisma };
