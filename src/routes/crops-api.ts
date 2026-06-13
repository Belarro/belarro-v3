import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all crops
router.get('/', async (req: Request, res: Response) => {
  try {
    const crops = await prisma.crop.findMany({
      where: { deleted_at: null },
      include: {
        variants: true,
        growth_steps: { orderBy: { step_order: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: crops });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crops' });
  }
});

// Get single crop
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const crop = await prisma.crop.findFirst({
      where: { id, deleted_at: null },
      include: {
        variants: true,
        growth_steps: { orderBy: { step_order: 'asc' } },
      },
    });

    if (!crop) {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }

    res.json({ success: true, data: crop });
  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crop' });
  }
});

// Create crop
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name_en, name_de, flavor, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule, status } = req.body;

    if (!name_en || !name_de || seeds_per_tray === undefined || yield_per_tray === undefined || total_growth_days === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const crop = await prisma.crop.create({
      data: {
        name_en,
        name_de,
        flavor: flavor || null,
        seeds_per_tray: parseFloat(seeds_per_tray),
        yield_per_tray: parseFloat(yield_per_tray),
        total_growth_days: parseInt(total_growth_days),
        seeding_schedule: seeding_schedule || 'TUESDAY',
        status: status || 'active',
      },
      include: {
        variants: true,
        growth_steps: true,
      },
    });

    res.status(201).json({ success: true, data: crop });
  } catch (error) {
    console.error('Error creating crop:', error);
    res.status(500).json({ success: false, error: 'Failed to create crop' });
  }
});

// Update crop
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name_en, name_de, flavor, seeds_per_tray, yield_per_tray, total_growth_days, seeding_schedule, status } = req.body;

    const crop = await prisma.crop.update({
      where: { id },
      data: {
        ...(name_en !== undefined && { name_en }),
        ...(name_de !== undefined && { name_de }),
        ...(flavor !== undefined && { flavor }),
        ...(seeds_per_tray !== undefined && { seeds_per_tray: parseFloat(seeds_per_tray) }),
        ...(yield_per_tray !== undefined && { yield_per_tray: parseFloat(yield_per_tray) }),
        ...(total_growth_days !== undefined && { total_growth_days: parseInt(total_growth_days) }),
        ...(seeding_schedule !== undefined && { seeding_schedule }),
        ...(status !== undefined && { status }),
      },
      include: {
        variants: true,
        growth_steps: true,
      },
    });

    res.json({ success: true, data: crop });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }
    console.error('Error updating crop:', error);
    res.status(500).json({ success: false, error: 'Failed to update crop' });
  }
});

// Delete crop (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const crop = await prisma.crop.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ success: true, data: { id: crop.id, deleted: true } });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Crop not found' });
    }
    console.error('Error deleting crop:', error);
    res.status(500).json({ success: false, error: 'Failed to delete crop' });
  }
});

export default router;
