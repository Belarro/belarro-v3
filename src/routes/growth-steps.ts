import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// TEST route
router.post('/test', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Test POST works' });
});

// GET /growth-steps?cropId=X - Get all steps for a crop
router.get('/', async (req: Request, res: Response) => {
  try {
    const { cropId } = req.query;

    if (!cropId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'cropId query parameter is required',
      } as ApiResponse);
    }

    const steps = await prisma.growthStep.findMany({
      where: { crop_id: cropId as string },
      orderBy: { step_order: 'asc' },
    });

    res.json({
      success: true,
      data: steps,
    } as ApiResponse);
  } catch (error) {
    console.error('GET growth-steps error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
});

// POST /growth-steps - Create a new growth step
router.post('/', async (req: Request, res: Response) => {
  console.log('[POST /growth-steps] Called');

  try {
    console.log('[POST] Body:', req.body);
    const { crop_id, step_type, duration_hours, notes } = req.body;
    console.log('[POST] Extracted:', { crop_id, step_type, duration_hours, notes });

    // Validate required fields
    if (!crop_id || !step_type) {
      console.log('[POST] Validation failed: missing crop_id or step_type');
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: crop_id, step_type',
      } as ApiResponse);
    }

    // Validate step type
    const validStepTypes = ['soak', 'seed', 'stack', 'blackout', 'humidity_dome', 'light', 'cover_soil', 'harvest'];
    if (!validStepTypes.includes(step_type)) {
      console.log('[POST] Invalid step_type:', step_type);
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Invalid step_type. Must be one of: ${validStepTypes.join(', ')}`,
      } as ApiResponse);
    }

    // Validate duration if provided (must be 0 or positive)
    if (duration_hours !== undefined && duration_hours !== null && duration_hours < 0) {
      console.log('[POST] Invalid duration_hours:', duration_hours);
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'duration_hours must be 0 or positive',
      } as ApiResponse);
    }

    console.log('[POST] Checking if crop exists:', crop_id);
    // Verify crop exists
    const crop = await prisma.crop.findUnique({ where: { id: crop_id } });
    if (!crop) {
      console.log('[POST] Crop not found:', crop_id);
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Crop with ID ${crop_id} not found`,
      } as ApiResponse);
    }

    console.log('[POST] Getting max order for crop');
    // Get the next step_order for this crop
    const maxOrder = await prisma.growthStep.findFirst({
      where: { crop_id },
      orderBy: { step_order: 'desc' },
      select: { step_order: true },
    });
    const nextStepOrder = (maxOrder?.step_order ?? 0) + 1;
    console.log('[POST] Next step order:', nextStepOrder);

    console.log('[POST] Creating step');
    // Create the step
    const step = await prisma.growthStep.create({
      data: {
        crop_id,
        step_order: nextStepOrder,
        step_type,
        duration_hours: duration_hours || null,
        notes: notes || null,
      },
    });

    console.log('[POST] Step created:', step.id);
    return res.status(201).json({
      success: true,
      data: step,
      message: 'Growth step created successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('[POST /growth-steps] ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
});

// PUT /growth-steps/:id - Update a growth step
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { step_order, step_type, duration_hours, notes } = req.body;

    // Verify step exists
    const step = await prisma.growthStep.findUnique({ where: { id } });
    if (!step) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Growth step with ID ${id} not found`,
      } as ApiResponse);
    }

    // Validate step type if provided
    const validStepTypes = ['soak', 'seed', 'stack', 'blackout', 'humidity_dome', 'light', 'cover_soil', 'harvest'];
    if (step_type && !validStepTypes.includes(step_type)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Invalid step_type. Must be one of: ${validStepTypes.join(', ')}`,
      } as ApiResponse);
    }

    // Validate duration if provided (must be 0 or positive)
    if (duration_hours !== undefined && duration_hours !== null && duration_hours < 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'duration_hours must be 0 or positive',
      } as ApiResponse);
    }

    // Update the step
    const updated = await prisma.growthStep.update({
      where: { id },
      data: {
        ...(step_order !== undefined && { step_order }),
        ...(step_type && { step_type }),
        ...(duration_hours !== undefined && { duration_hours: duration_hours || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Growth step updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('PUT growth-steps error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
});

// DELETE /growth-steps/cleanup/corrupted - Clear corrupted growth steps for specific crops
router.delete('/cleanup/corrupted', async (req: Request, res: Response) => {
  try {
    const corruptedCropIds = [
      'f2f6cb85-7b7d-48f9-a6dd-e743554f8b87', // Pea Shoots
      'b6270fdc-ee3b-4158-84a7-18bfe1f6ee72', // Pea Salad
      'a7dc82c6-88b3-42cc-a752-b9b82879fd69', // Sunflower
      '92465990-4e30-4063-b8b8-60bae67a6709', // Popcorn
      '3311da0b-7298-4cd9-b148-d3bf55854eb7', // Wheatgrass
    ];

    const deleted = await prisma.growthStep.deleteMany({
      where: {
        crop_id: { in: corruptedCropIds },
      },
    });

    return res.json({
      success: true,
      message: `Deleted ${deleted.count} corrupted growth steps`,
      data: { deletedCount: deleted.count },
    });
  } catch (error) {
    console.error('[DELETE cleanup] ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /growth-steps/:id - Delete a growth step
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const step = await prisma.growthStep.findUnique({ where: { id } });
    if (!step) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Growth step with ID ${id} not found`,
      } as ApiResponse);
    }

    await prisma.growthStep.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Growth step deleted successfully',
      details: { step_id: id },
    } as ApiResponse);
  } catch (error) {
    console.error('DELETE growth-steps error:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    } as ApiResponse);
  }
});

export default router;
