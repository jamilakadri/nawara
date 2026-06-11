const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({ connectionString: 'postgresql://postgres:123456@localhost:5433/hr_onboarding' });
    const res = await pool.query(`
      SELECT e.id AS employee_id,
             e."userId" AS userId,
             u.email,
             u."firstName" AS userFirstName,
             u."lastName" AS userLastName,
             e."positionId" AS positionId,
             p.title AS positionTitle,
             e."departmentId" AS departmentId,
             d.name AS departmentName
      FROM "Employee" e
      LEFT JOIN "User" u ON u.id = e."userId"
      LEFT JOIN "Position" p ON p.id = e."positionId"
      LEFT JOIN "Department" d ON d.id = e."departmentId"
      ORDER BY u.email
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(1);
  }
})();
