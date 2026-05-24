import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiError, ApiResponse } from '../index';

const router = Router();

// GET /dashboard - Get complete dashboard with KPIs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch all required data in parallel
    const [
      totalCrops,
      activeCrops,
      totalCustomers,
      activeCustomers,
      totalOrders,
      pendingOrders,
      totalRevenue,
      seedInventoryAlerts,
      packageInventoryAlerts,
      activeSeedingBatches,
      pendingFollowUps,
    ] = await Promise.all([
      prisma.crop.count(),
      prisma.crop.count({ where: { status: 'active' } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.aggregate({
        _sum: { quantity: true },
        where: { status: { not: 'cancelled' } },
      }),
      prisma.seedInventory.findMany(),
      prisma.packageInventory.findMany(),
      prisma.seedingBatch.count({
        where: { harvest_records: { none: {} } },
      }),
      prisma.followUp.count({ where: { status: 'pending' } }),
    ]);

    // Calculate seed reorder alerts
    const seedAlerts = await prisma.seedInventory.findMany({
      include: { crop: true },
    });
    const seedReorderAlerts = seedAlerts.filter((inv) => {
      const remainingTrays = Math.floor(inv.quantity_grams / inv.crop.seeds_per_tray);
      return remainingTrays < inv.reorder_threshold_trays;
    });

    // Calculate package reorder alerts
    const packageReorderAlerts = packageInventoryAlerts.filter(
      (inv) => inv.quantity_available < inv.reorder_threshold
    );

    // Calculate average order value
    const allOrders = await prisma.order.findMany({
      include: { variant: true },
      where: { status: { not: 'cancelled' } },
    });
    const totalOrderValue = allOrders.reduce((sum: number, order: any) => {
      return sum + (order.variant?.price_eur || 0) * order.quantity;
    }, 0);
    const averageOrderValue = allOrders.length > 0 ? totalOrderValue / allOrders.length : 0;

    // Fetch recent activity
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { name: true } },
        variant: { select: { size_name: true } },
      },
    });

    const recentCustomers = await prisma.customer.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: { id: true, name: true, status: true, created_at: true },
    });

    // Calculate conversion funnel
    const prospects = await prisma.customer.count({ where: { status: 'prospect' } });
    const active = await prisma.customer.count({ where: { status: 'active' } });
    const paused = await prisma.customer.count({ where: { status: 'paused' } });
    const inactive = await prisma.customer.count({ where: { status: 'inactive' } });

    res.json({
      success: true,
      data: {
        overview: {
          total_crops: totalCrops,
          active_crops: activeCrops,
          total_customers: totalCustomers,
          active_customers: activeCustomers,
          prospect_customers: prospects,
          total_orders: totalOrders,
          pending_orders: pendingOrders,
        },
        revenue: {
          total_order_value_eur: parseFloat(totalOrderValue.toFixed(2)),
          average_order_value_eur: parseFloat(averageOrderValue.toFixed(2)),
          orders_counted: allOrders.length,
        },
        operations: {
          active_seeding_batches: activeSeedingBatches,
          pending_follow_ups: pendingFollowUps,
        },
        alerts: {
          seed_reorder_alerts: seedReorderAlerts.length,
          seed_items_below_threshold: seedReorderAlerts.map((inv) => ({
            crop_id: inv.crop_id,
            crop_name: inv.crop.name_en,
            quantity_grams: inv.quantity_grams,
            threshold_trays: inv.reorder_threshold_trays,
            remaining_trays: Math.floor(inv.quantity_grams / inv.crop.seeds_per_tray),
          })),
          package_reorder_alerts: packageReorderAlerts.length,
          package_items_below_threshold: packageReorderAlerts.map((inv) => ({
            variant_id: inv.variant_id,
            quantity_available: inv.quantity_available,
            threshold: inv.reorder_threshold,
          })),
        },
        customer_funnel: {
          prospects,
          active,
          paused,
          inactive,
          conversion_rate_percent: totalCustomers > 0
            ? parseFloat(((active / totalCustomers) * 100).toFixed(2))
            : 0,
        },
        recent_activity: {
          recent_orders: recentOrders.map((order) => ({
            id: order.id,
            customer: order.customer.name,
            product: order.variant?.size_name,
            quantity: order.quantity,
            date: order.created_at,
            status: order.status,
          })),
          recent_customers: recentCustomers,
        },
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /dashboard/crops-performance - Crop-level performance metrics
router.get('/crops-performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crops = await prisma.crop.findMany({
      include: {
        variants: true,
        seed_inventory: true,
        sample_inventory: true,
        seeding_batches: {
          include: { harvest_records: true },
        },
      },
    });

    const performance = crops.map((crop) => {
      const seeding_batches = crop.seeding_batches || [];
      const completedBatches = seeding_batches.filter((b) => (b.harvest_records || []).length > 0).length;
      const totalYield = seeding_batches
        .filter((b) => (b.harvest_records || []).length > 0)
        .reduce((sum: number, b: any) => sum + ((b.harvest_records[0]?.actual_yield_grams || 0)), 0);

      return {
        crop_id: crop.id,
        crop_name_en: crop.name_en,
        crop_name_de: crop.name_de,
        status: crop.status,
        total_variants: crop.variants.length,
        seeding_schedule: crop.seeding_schedule,
        growth_days: crop.total_growth_days,
        seed_inventory: {
          quantity_grams: crop.seed_inventory?.quantity_grams || 0,
          remaining_trays: crop.seed_inventory
            ? Math.floor(crop.seed_inventory.quantity_grams / crop.seeds_per_tray)
            : 0,
          needs_reorder: crop.seed_inventory
            ? Math.floor(crop.seed_inventory.quantity_grams / crop.seeds_per_tray) <
              crop.seed_inventory.reorder_threshold_trays
            : false,
        },
        sample_inventory: {
          available_grams: crop.sample_inventory?.available_grams || 0,
        },
        seeding_batches: {
          total_batches: crop.seeding_batches.length,
          completed_batches: completedBatches,
          pending_batches: crop.seeding_batches.length - completedBatches,
        },
        yield_metrics: {
          total_yield_grams: totalYield,
          average_yield_per_batch: completedBatches > 0 ? totalYield / completedBatches : 0,
          expected_yield_per_tray: crop.yield_per_tray,
        },
      };
    });

    res.json({
      success: true,
      data: performance,
      count: performance.length,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /dashboard/customer-metrics - Customer engagement metrics
router.get('/customer-metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          include: { variant: true },
        },
        follow_ups: true,
        visits: true,
      },
    });

    const metrics = customers.map((customer) => {
      const totalOrders = customer.orders.length;
      const totalOrderValue = customer.orders.reduce((sum: number, order: any) => {
        return sum + (order.variant?.price_eur || 0) * order.quantity;
      }, 0);

      const completedFollowUps = customer.follow_ups.filter((f: any) => f.status === 'completed').length;
      const pendingFollowUps = customer.follow_ups.filter((f: any) => f.status === 'pending').length;
      const daysAsCustomer = Math.floor(
        (new Date().getTime() - new Date(customer.first_contact_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        customer_id: customer.id,
        name: customer.name,
        status: customer.status,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        engagement: {
          total_orders: totalOrders,
          total_spent_eur: parseFloat(totalOrderValue.toFixed(2)),
          average_order_value_eur:
            totalOrders > 0 ? parseFloat((totalOrderValue / totalOrders).toFixed(2)) : 0,
          days_as_customer: daysAsCustomer,
          visits: customer.visits.length,
        },
        follow_ups: {
          total_follow_ups: customer.follow_ups.length,
          completed: completedFollowUps,
          pending: pendingFollowUps,
          completion_rate_percent:
            customer.follow_ups.length > 0
              ? parseFloat(((completedFollowUps / customer.follow_ups.length) * 100).toFixed(2))
              : 0,
        },
      };
    });

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// GET /dashboard/order-trends - Order trends and analysis
router.get('/order-trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        variant: {
          include: { crop: true },
        },
      },
    });

    // Group orders by crop
    const ordersByCrop: Record<
      string,
      {
        crop_id: string;
        crop_name: string;
        count: number;
        total_quantity: number;
        total_value: number;
      }
    > = {};

    orders.forEach((order) => {
      const cropId = order.variant?.crop_id;
      const cropName = order.variant?.crop.name_en || 'Unknown';
      const price = order.variant?.price_eur || 0;

      if (!ordersByCrop[cropId]) {
        ordersByCrop[cropId] = {
          crop_id: cropId,
          crop_name: cropName,
          count: 0,
          total_quantity: 0,
          total_value: 0,
        };
      }

      ordersByCrop[cropId].count += 1;
      ordersByCrop[cropId].total_quantity += order.quantity;
      ordersByCrop[cropId].total_value += price * order.quantity;
    });

    // Group orders by status
    const ordersByStatus: Record<string, number> = {};
    orders.forEach((order) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_orders: orders.length,
        by_crop: Object.values(ordersByCrop).sort((a, b) => b.count - a.count),
        by_status: ordersByStatus,
        recurring_orders: orders.filter((o) => o.recurring).length,
        one_time_orders: orders.filter((o) => !o.recurring).length,
      },
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
