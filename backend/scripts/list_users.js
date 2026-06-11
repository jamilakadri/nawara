const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

(async () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true } });
    console.log('Users in DB:', users);
  } catch (e) {
    console.error('Error querying users:');
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
