const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({ connectionString: 'postgresql://postgres:123456@localhost:5433/hr_onboarding' });
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Employee' ORDER BY ordinal_position;`);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
