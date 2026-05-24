import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test crops
  const broccoli = await prisma.crop.create({
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
          quantity_grams: 500,
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

  console.log('✓ Seeding complete');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
