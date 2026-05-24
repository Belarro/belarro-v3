import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /invoices - List invoices
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, month, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (customer_id) where.customer_id = customer_id as string;
    if (month) where.invoice_month = month as string;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { invoice_month: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /invoices/:id - Get single invoice
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(404, 'NOT_FOUND', `Invoice with ID ${id} not found`);
    }

    res.json({
      success: true,
      data: invoice,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// POST /invoices - Generate monthly invoice
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_id, invoice_month } = req.body;

    // Validate
    if (!customer_id || !invoice_month) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing required fields: customer_id, invoice_month');
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
    if (!customer) {
      throw new ApiError(404, 'NOT_FOUND', `Customer with ID ${customer_id} not found`);
    }

    // Check invoice doesn't already exist
    const existing = await prisma.invoice.findFirst({
      where: { customer_id, invoice_month },
    });
    if (existing) {
      throw new ApiError(400, 'VALIDATION_ERROR', `Invoice already exists for ${invoice_month}`);
    }

    // Calculate total from orders this month
    const monthStart = `${invoice_month}-01`;
    const [year, month] = invoice_month.split('-').map(Number);
    const monthEnd = new Date(year, month, 0); // Last day of month

    // Get all orders for this customer in this month
    const orders = await prisma.order.findMany({
      where: {
        customer_id,
        order_date: {
          gte: new Date(monthStart),
          lte: monthEnd,
        },
      },
      include: {
        variant: true,
      },
    });

    // Sum order totals
    const total_amount_eur = orders.reduce((sum, order) => {
      return sum + (order.variant.price_eur * order.quantity);
    }, 0);

    // Calculate VAT (19% German VAT)
    const vat_amount_eur = Math.round(total_amount_eur * 0.19 * 100) / 100;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        customer_id,
        invoice_month,
        total_amount_eur,
        vat_amount_eur,
        status: 'draft',
      },
      include: {
        customer: true,
      },
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice generated successfully',
      details: {
        order_count: orders.length,
        subtotal_eur: total_amount_eur,
        vat_eur: vat_amount_eur,
        total_with_vat: total_amount_eur + vat_amount_eur,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// PATCH /invoices/:id - Update invoice status
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, sent_at, paid_at } = req.body;

    // Validate status
    if (status && !['draft', 'sent', 'paid'].includes(status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid status. Must be draft, sent, or paid');
    }

    // Check invoice exists
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', `Invoice with ID ${id} not found`);
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: status || existing.status,
        sent_at: sent_at ? new Date(sent_at) : existing.sent_at,
        paid_at: paid_at ? new Date(paid_at) : existing.paid_at,
      },
      include: {
        customer: true,
      },
    });

    res.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// DELETE /invoices/:id - Delete invoice (draft only)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new ApiError(404, 'NOT_FOUND', `Invoice with ID ${id} not found`);
    }

    if (invoice.status !== 'draft') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Can only delete draft invoices');
    }

    await prisma.invoice.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      details: {
        invoice_id: id,
        invoice_month: invoice.invoice_month,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
