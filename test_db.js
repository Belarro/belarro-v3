const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful:', result);
    process.exit(0);
  } catch (error) {
    console.log('✗ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
