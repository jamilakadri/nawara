const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({ connectionString: 'postgresql://postgres:123456@localhost:5433/hr_onboarding' });
    const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`);
    console.log('tables:', tables.rows.map((r) => r.table_name));

    const migrations = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_name = '_prisma_migrations';`);
    console.log('has_prisma_migrations:', migrations.rows.length > 0);

    if (migrations.rows.length > 0) {
      const rows = await pool.query(`SELECT id, migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;`);
      console.log('recent migrations:', rows.rows);
    }

    await pool.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
