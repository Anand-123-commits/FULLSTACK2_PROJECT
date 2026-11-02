require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Connect without database name first to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log("Connected to MySQL server.");

    const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    console.log("Executing init script...");
    await connection.query(sqlScript);
    
    console.log("Database initialized successfully with test data!");
    await connection.end();
  } catch (error) {
    console.error("Error setting up database:", error);
  }
}

setupDatabase();
