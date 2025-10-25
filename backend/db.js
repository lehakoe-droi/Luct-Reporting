// db.js
const mysql = require('mysql2/promise');

let db = null; // Initialize as null

const createConnection = async () => {
  try {
    console.log('Connecting to TiDB with SSL...');
    
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 4000,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    };

    db = mysql.createPool(config);
    
    // Test connection
    const [rows] = await db.query('SELECT 1 as connected');
    console.log('✅ TiDB connected successfully with SSL');
    
    return db;
  } catch (err) {
    console.error('❌ TiDB connection failed:', err.message);
    throw err;
  }
};

const initDB = async () => {
  try {
    console.log('Initializing database...');
    await createConnection();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Database operation functions with proper error handling
const query = async (sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  
  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('QUERY ERROR:', err.message);
    console.error('SQL:', sql);
    throw err;
  }
};

const get = async (sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  
  try {
    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  } catch (err) {
    console.error('GET ERROR:', err.message);
    console.error('SQL:', sql);
    throw err;
  }
};

const run = async (sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  
  try {
    const [result] = await db.execute(sql, params);
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  } catch (err) {
    console.error('RUN ERROR:', err.message);
    console.error('SQL:', sql);
    throw err;
  }
};

// Export at the end of the file
module.exports = {
  db: () => db, // Export as a function to get the current db instance
  initDB, 
  query, 
  get, 
  run,
  createConnection
};