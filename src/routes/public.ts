import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ApiResponse } from '../index';

const router = Router();

// GET /public/products - For for-chefs.html
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crops = await prisma.crop.findMany({
      where: { status: 'active' },
      include: { variants: true },
      orderBy: { created_at: 'desc' },
    });

    const products = crops.map((crop: any, idx: number) => ({
      id: crop.id,
      name: crop.name_en,
      flavor_profile: crop.flavor,
      photo: crop.photo_url,
      category: 'microgreen',
      availability_status: 'visible',
      sort_order: idx + 1,
      available_sizes: crop.variants.map((v: any) => v.size_name).sort(),
      prices: Object.fromEntries(crop.variants.map((v: any) => [v.size_name, v.price_eur])),
    }));

    res.json({
      success: true,
      data: products,
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
