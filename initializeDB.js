require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔍 Attempting to connect to MySQL...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    // Connect without database name first to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server successfully!');

    const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    console.log('📝 Executing database initialization script...');
    await connection.query(sqlScript);
    
    console.log('✅ Database initialized successfully!');
    console.log('✅ Tables created: Vehicle, ParkingSlot, ParkingRecord');
    
    await connection.end();
    console.log('✨ Setup complete! You can now start the server with: node server.js');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. MySQL is not running - Start MySQL service');
    console.error('2. Wrong password in .env file');
    console.error('3. MySQL server not accessible on localhost:3306');
    process.exit(1);
  }
}

initializeDatabase();
