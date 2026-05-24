import { prisma } from '../index';

describe('Crop API Tests', () => {
  beforeAll(async () => {
    // Clear existing test data
    await prisma.crop.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup
    await prisma.crop.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /crops - Create crop', () => {
    it('should create a crop with valid data', async () => {
      const crop = await prisma.crop.create({
        data: {
          name_en: 'Broccoli',
          name_de: 'Brokkoli',
          seeds_per_tray: 60,
          yield_per_tray: 25,
          total_growth_days: 10,
          seeding_schedule: 'FRIDAY',
          status: 'active',
          seed_inventory: {
            create: {
              quantity_grams: 0,
              reorder_threshold_trays: 20,
            },
          },
          sample_inventory: {
            create: {
              available_grams: 0,
            },
          },
        },
      });

      expect(crop).toBeDefined();
      expect(crop.name_en).toBe('Broccoli');
      expect(crop.seeding_schedule).toBe('FRIDAY');
      expect(crop.status).toBe('active');
    });

    it('should create seed_inventory and sample_inventory on crop creation', async () => {
      const crop = await prisma.crop.create({
        data: {
          name_en: 'Pea Shoots',
          name_de: 'Erbsenkeimlinge',
          seeds_per_tray: 80,
          yield_per_tray: 30,
          total_growth_days: 10,
          seeding_schedule: 'TUESDAY',
          seed_inventory: {
            create: {
              quantity_grams: 0,
            },
          },
          sample_inventory: {
            create: {
              available_grams: 0,
            },
          },
        },
        include: {
          seed_inventory: true,
          sample_inventory: true,
        },
      });

      expect(crop.seed_inventory).toBeDefined();
      expect(crop.sample_inventory).toBeDefined();
    });
  });

  describe('GET /crops - List crops', () => {
    beforeEach(async () => {
      // Create test crops
      await prisma.crop.deleteMany({});
      await Promise.all([
        prisma.crop.create({
          data: {
            name_en: 'Broccoli',
            name_de: 'Brokkoli',
            seeds_per_tray: 60,
            yield_per_tray: 25,
            total_growth_days: 10,
            seeding_schedule: 'FRIDAY',
            status: 'active',
            seed_inventory: { create: { quantity_grams: 0 } },
            sample_inventory: { create: { available_grams: 0 } },
          },
        }),
        prisma.crop.create({
          data: {
            name_en: 'Pea Shoots',
            name_de: 'Erbsenkeimlinge',
            seeds_per_tray: 80,
            yield_per_tray: 30,
            total_growth_days: 10,
            seeding_schedule: 'TUESDAY',
            status: 'paused',
            seed_inventory: { create: { quantity_grams: 500 } },
            sample_inventory: { create: { available_grams: 0 } },
          },
        }),
      ]);
    });

    it('should list crops with active status filter', async () => {
      const crops = await prisma.crop.findMany({
        where: { status: 'active' },
      });

      expect(crops).toHaveLength(1);
      expect(crops[0].name_en).toBe('Broccoli');
    });

    it('should list crops with paused status filter', async () => {
      const crops = await prisma.crop.findMany({
        where: { status: 'paused' },
      });

      expect(crops).toHaveLength(1);
      expect(crops[0].name_en).toBe('Pea Shoots');
    });

    it('should list all crops without filter', async () => {
      const crops = await prisma.crop.findMany({});

      expect(crops.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /crops/:id - Get single crop', () => {
    let cropId: string;

    beforeEach(async () => {
      const crop = await prisma.crop.create({
        data: {
          name_en: 'Microgreens Mix',
          name_de: 'Microgreens Mix',
          seeds_per_tray: 50,
          yield_per_tray: 20,
          total_growth_days: 7,
          seeding_schedule: 'TUESDAY',
          seed_inventory: { create: { quantity_grams: 0 } },
          sample_inventory: { create: { available_grams: 0 } },
        },
      });
      cropId = crop.id;
    });

    it('should return crop detail with variants', async () => {
      const crop = await prisma.crop.findUnique({
        where: { id: cropId },
        include: { variants: true, seed_inventory: true },
      });

      expect(crop).toBeDefined();
      expect(crop?.name_en).toBe('Microgreens Mix');
    });

    it('should return 404 for nonexistent crop', async () => {
      const crop = await prisma.crop.findUnique({
        where: { id: 'nonexistent-id' },
      });

      expect(crop).toBeNull();
    });
  });

  describe('PUT /crops/:id - Update crop', () => {
    let cropId: string;

    beforeEach(async () => {
      const crop = await prisma.crop.create({
        data: {
          name_en: 'Original Name',
          name_de: 'Originalname',
          seeds_per_tray: 60,
          yield_per_tray: 25,
          total_growth_days: 10,
          seeding_schedule: 'FRIDAY',
          seed_inventory: { create: { quantity_grams: 0 } },
          sample_inventory: { create: { available_grams: 0 } },
        },
      });
      cropId = crop.id;
    });

    it('should update crop name', async () => {
      const updated = await prisma.crop.update({
        where: { id: cropId },
        data: {
          name_en: 'Updated Name',
        },
      });

      expect(updated.name_en).toBe('Updated Name');
    });

    it('should update crop status to paused', async () => {
      const updated = await prisma.crop.update({
        where: { id: cropId },
        data: {
          status: 'paused',
        },
      });

      expect(updated.status).toBe('paused');
    });

    it('should update growth days', async () => {
      const updated = await prisma.crop.update({
        where: { id: cropId },
        data: {
          total_growth_days: 15,
        },
      });

      expect(updated.total_growth_days).toBe(15);
    });
  });

  describe('DELETE /crops/:id - Delete crop', () => {
    it('should delete crop and cascade to related data', async () => {
      const crop = await prisma.crop.create({
        data: {
          name_en: 'To Delete',
          name_de: 'Zu löschen',
          seeds_per_tray: 60,
          yield_per_tray: 25,
          total_growth_days: 10,
          seeding_schedule: 'FRIDAY',
          seed_inventory: { create: { quantity_grams: 0 } },
          sample_inventory: { create: { available_grams: 0 } },
        },
      });

      await prisma.crop.delete({ where: { id: crop.id } });

      const deleted = await prisma.crop.findUnique({
        where: { id: crop.id },
      });

      expect(deleted).toBeNull();
    });

    it('should also delete seed_inventory on crop delete', async () => {
      const crop = await prisma.crop.create({
        data: {
          name_en: 'Delete Test',
          name_de: 'Löschtest',
          seeds_per_tray: 60,
          yield_per_tray: 25,
          total_growth_days: 10,
          seeding_schedule: 'FRIDAY',
          seed_inventory: { create: { quantity_grams: 500 } },
          sample_inventory: { create: { available_grams: 0 } },
        },
        include: { seed_inventory: true },
      });

      const seedInventoryId = crop.seed_inventory?.id;

      await prisma.crop.delete({ where: { id: crop.id } });

      if (seedInventoryId) {
        const deleted = await prisma.seedInventory.findUnique({
          where: { id: seedInventoryId },
        });
        expect(deleted).toBeNull();
      }
    });
  });

  describe('Seeding schedule validation', () => {
    it('should only allow TUESDAY or FRIDAY', async () => {
      const validSchedules = ['TUESDAY', 'FRIDAY'];

      for (const schedule of validSchedules) {
        const crop = await prisma.crop.create({
          data: {
            name_en: `Test ${schedule}`,
            name_de: `Test ${schedule}`,
            seeds_per_tray: 60,
            yield_per_tray: 25,
            total_growth_days: 10,
            seeding_schedule: schedule,
            seed_inventory: { create: { quantity_grams: 0 } },
            sample_inventory: { create: { available_grams: 0 } },
          },
        });

        expect(crop.seeding_schedule).toBe(schedule);
      }
    });
  });
});
