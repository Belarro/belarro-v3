import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Multer for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'API is running' });
});

// Import routes
import cropsRouter from '../src/routes/crops';
import customersRouter from '../src/routes/customers';
import ordersRouter from '../src/routes/orders';
import inventoryRouter from '../src/routes/inventory';
import seedingRouter from '../src/routes/seeding';
import invoicesRouter from '../src/routes/invoices';
import standingOrdersRouter from '../src/routes/standing-orders';
import followUpsRouter from '../src/routes/follow-ups';
import dashboardRouter from '../src/routes/dashboard';

// Register routes
app.use('/api/crops', cropsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/seeding', seedingRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/standing-orders', standingOrdersRouter);
app.use('/api/follow-ups', followUpsRouter);
app.use('/api/dashboard', dashboardRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.message || 'An error occurred';

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
});

// Export as Vercel serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
