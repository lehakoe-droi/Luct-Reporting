// db.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'luct.db');
const db = new Database(dbPath);

// Wrap functions so the rest of your code doesn’t break
db.query = (sql, params = []) => {
  try {
    const rows = db.prepare(sql).all(params);
    return Promise.resolve(rows);
  } catch (err) {
    return Promise.reject(err);
  }
};

db.get = (sql, params = []) => {
  try {
    const row = db.prepare(sql).get(params);
    return Promise.resolve(row);
  } catch (err) {
    return Promise.reject(err);
  }
};

db.run = (sql, params = []) => {
  try {
    const info = db.prepare(sql).run(params);
    return Promise.resolve({ lastID: info.lastInsertRowid });
  } catch (err) {
    return Promise.reject(err);
  }
};

// Initialize database schema and sample data
const initDB = async () => {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS faculty (
        faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_name TEXT NOT NULL
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Student', 'Lecturer', 'Principal Lecturer', 'Program Leader')),
        faculty_id INTEGER,
        FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
      )
    `);

    // ... keep your existing CREATE TABLE statements and inserts exactly as before

    console.log('SQLite database initialized successfully ✅');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }
};

initDB();

module.exports = db;
