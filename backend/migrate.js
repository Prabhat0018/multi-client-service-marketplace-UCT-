require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  console.log('🔄 Running migration...');
  
  try {
    // Check if service_id column already exists
    const [cols] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'service_id'`);
    
    if (cols.length === 0) {
      console.log('Adding service_id column...');
      await pool.query('ALTER TABLE orders ADD COLUMN service_id VARCHAR(36) AFTER merchant_id');
      console.log('✅ Added service_id');
    } else {
      console.log('✓ service_id already exists');
    }
    
    // Check if notes column exists
    const [notesCols] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'notes'`);
    if (notesCols.length === 0) {
      console.log('Adding notes column...');
      await pool.query('ALTER TABLE orders ADD COLUMN notes TEXT');
      console.log('✅ Added notes');
    } else {
      console.log('✓ notes already exists');
    }
    
    // Check if scheduled_date column exists
    const [dateCols] = await pool.query(`SHOW COLUMNS FROM orders LIKE 'scheduled_date'`);
    if (dateCols.length === 0) {
      console.log('Adding scheduled_date column...');
      await pool.query('ALTER TABLE orders ADD COLUMN scheduled_date DATETIME');
      console.log('✅ Added scheduled_date');
    } else {
      console.log('✓ scheduled_date already exists');
    }
    
    console.log('\n✅ Migration complete!');
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  }
  
  await pool.end();
  process.exit(0);
}

migrate();
