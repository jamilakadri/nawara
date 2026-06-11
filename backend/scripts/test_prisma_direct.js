const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

(async () => {
  try {
    process.env.DATABASE_URL = 'postgresql://postgres:123456@localhost:5433/hr_onboarding?schema=public';
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter, log: [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }] });
    prisma.$on('query', (e) => { console.log('QUERY', e.query, e.params); });
    prisma.$on('error', (e) => { console.log('PRISMA_ERROR', e.message); });
    await prisma.$connect();
    const emp = await prisma.employee.findFirst({ where: { userId: '223b130b-1f3e-4b0f-8fa8-c6aece34f924' } });
    console.log('EMP', emp);
    await prisma.$disconnect();
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
