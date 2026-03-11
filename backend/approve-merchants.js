require('dotenv').config();
const pool = require('./config/db');

async function approveMerchants() {
  try {
    // Update pending merchants to approved
    const [result] = await pool.query(
      "UPDATE merchants SET status = 'approved' WHERE status = 'pending'"
    );
    console.log('Updated:', result.affectedRows, 'merchants');

    // Show all merchants
    const [merchants] = await pool.query(
      'SELECT merchant_id, business_name, status FROM merchants'
    );
    console.log('All merchants:', merchants);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

approveMerchants();
