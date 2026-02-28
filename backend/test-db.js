require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('DB_NAME:', process.env.DB_NAME);
  
  try {
    // Test basic connection first (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    console.log('\n✅ MySQL connection successful!');
    
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
    if (databases.length === 0) {
      console.log(`\n❌ Database "${process.env.DB_NAME}" does NOT exist!`);
      console.log('Run this SQL in MySQL Workbench:');
      console.log('   CREATE DATABASE service_marketplace;');
      await connection.end();
      return;
    }
    console.log(`✅ Database "${process.env.DB_NAME}" exists!`);
    
    // Connect to the specific database
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTables in database:');
    if (tables.length === 0) {
      console.log('   ❌ No tables found! You need to run the schema.sql');
    } else {
      tables.forEach(t => {
        const tableName = Object.values(t)[0];
        console.log(`   ✅ ${tableName}`);
      });
    }
    
    // Check categories table has data (needed for merchant signup)
    const [categories] = await connection.query('SELECT * FROM categories LIMIT 5');
    console.log('\nCategories in database:');
    if (categories.length === 0) {
      console.log('   ❌ No categories found!');
    } else {
      categories.forEach(c => {
        console.log(`   ✅ ${c.category_id} - ${c.category_name}`);
      });
    }
    
    await connection.end();
    console.log('\n✅ All checks passed! Database is ready.');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nFix: Check your MySQL username and password in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\nFix: Make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\nFix: Database does not exist. Create it first.');
    }
  }
}

testConnection();
