require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'SmartParking1',
      multipleStatements: true
    });
    console.log('MySQL connection succeeded.');
    await connection.end();
    return true;
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    return false;
  }
}

testConnection();
