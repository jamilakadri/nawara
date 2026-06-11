const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: 'postgresql://postgres:123456@localhost:5433/hr_onboarding' });
  try {
    console.log('Checking Employee table columns...');
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Employee'
      ORDER BY ordinal_position;
    `);
    const cols = rows.map((r) => r.column_name);
    console.log('Existing columns:', cols);

    const alters = [];
    if (!cols.includes('phone')) {
      alters.push('ALTER TABLE "Employee" ADD COLUMN "phone" TEXT;');
    }
    if (!cols.includes('additionalInfo')) {
      alters.push('ALTER TABLE "Employee" ADD COLUMN "additionalInfo" TEXT;');
    }

    if (alters.length === 0) {
      console.log('No schema changes needed.');
    } else {
      for (const sql of alters) {
        console.log('Executing:', sql.trim());
        await pool.query(sql);
      }
      console.log('Schema synced successfully.');
    }
  } catch (error) {
    console.error('Error syncing schema:', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
