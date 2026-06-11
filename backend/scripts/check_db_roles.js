const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({ connectionString: 'postgresql://postgres:123456@localhost:5433/hr_onboarding' });
    const res = await pool.query(`SELECT rolname, rolcanlogin, rolcreatedb, rolcreaterole FROM pg_roles ORDER BY rolname;`);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(1);
  }
})();
