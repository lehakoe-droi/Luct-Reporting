// db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// MySQL connection configuration (without database initially)
const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || '26gBsAggzLYqsJu.root',
  password: process.env.DB_PASSWORD || 'ihMhLddb8N2c6Vup',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Configuration with database
const dbConfigWithDB = {
  ...dbConfig,
  database: process.env.DB_NAME || 'test'
};

let db;

// Create connection pool
const createConnection = async () => {
  try {
    // First create connection without database to ensure database exists
    const tempDb = mysql.createPool(dbConfig);
    await tempDb.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'luct_db'}\``);
    await tempDb.end();

    // Now create connection with database
    db = mysql.createPool(dbConfigWithDB);
    console.log('MySQL connection pool created successfully');
    return db;
  } catch (err) {
    console.error('Failed to create MySQL connection pool:', err);
    throw err;
  }
};

// Enhanced wrapper functions for MySQL
const query = async (sql, params = []) => {
  console.log('DB QUERY:', sql);
  console.log('PARAMS:', params);
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
  console.log('DB GET:', sql);
  console.log('PARAMS:', params);
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
  console.log('DB RUN:', sql);
  console.log('PARAMS:', params);
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

// Helper function to check if tables already exist
const checkIfTablesExist = async () => {
  try {
    // Check if the users table exists (as a representative table)
    const result = await query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'users'
    `, [process.env.DB_NAME || 'luct_db']);
    
    return result[0].table_count > 0;
  } catch (err) {
    // If there's an error, assume tables don't exist
    console.log('Error checking if tables exist, assuming they need to be created:', err.message);
    return false;
  }
};

// Improved initialization with better error handling - uses existing database
const initDB = async () => {
  try {
    console.log('Starting database initialization...');

    // Create connection pool first
    await createConnection();

    // Check if tables already exist by testing one key table
    const tablesExist = await checkIfTablesExist();
    
    if (tablesExist) {
      console.log('Database tables already exist, skipping schema creation');
      console.log('Database initialization completed - using existing database');
      return;
    }

    console.log('No existing tables found, creating database schema...');

    // Create tables manually with MySQL syntax
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS faculty (
        faculty_id INT AUTO_INCREMENT PRIMARY KEY,
        faculty_name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role ENUM('Student', 'Lecturer', 'Principal Lecturer', 'Program Leader') NOT NULL,
        faculty_id INT,
        FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
      );

      CREATE TABLE IF NOT EXISTS courses (
        course_id INT AUTO_INCREMENT PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(50) UNIQUE NOT NULL,
        faculty_id INT NOT NULL,
        program_leader_id INT,
        FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
        FOREIGN KEY (program_leader_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS classes (
        class_id INT AUTO_INCREMENT PRIMARY KEY,
        class_name VARCHAR(255) NOT NULL,
        course_id INT NOT NULL,
        lecturer_id INT NOT NULL,
        venue VARCHAR(255),
        scheduled_time DATETIME,
        total_registered_students INT DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses(course_id),
        FOREIGN KEY (lecturer_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        lecturer_id INT NOT NULL,
        week_of_reporting VARCHAR(50),
        date_of_lecture DATE,
        topic_taught TEXT,
        learning_outcomes TEXT,
        recommendations TEXT,
        actual_students_present INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(class_id),
        FOREIGN KEY (lecturer_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS feedback (
        feedback_id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        comments TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES reports(report_id),
        FOREIGN KEY (reviewer_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS student_enrollments (
        enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(user_id),
        FOREIGN KEY (class_id) REFERENCES classes(class_id),
        UNIQUE KEY unique_enrollment (student_id, class_id)
      );

      CREATE TABLE IF NOT EXISTS ratings (
        rating_id INT AUTO_INCREMENT PRIMARY KEY,
        lecturer_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lecturer_id) REFERENCES users(user_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      CREATE TABLE IF NOT EXISTS grades (
        grade_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        lecturer_id INT NOT NULL,
        grade DECIMAL(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 100),
        grade_type ENUM('assignment', 'exam', 'project', 'participation') NOT NULL,
        description TEXT,
        date_given DATE NOT NULL,
        FOREIGN KEY (student_id) REFERENCES users(user_id),
        FOREIGN KEY (class_id) REFERENCES classes(class_id),
        FOREIGN KEY (lecturer_id) REFERENCES users(user_id)
      );
    `;

    // Execute each CREATE TABLE statement
    const createStatements = createTablesSQL.split(';').filter(stmt => stmt.trim().length > 0);
    for (const statement of createStatements) {
      if (statement.trim()) {
        await run(statement.trim());
      }
    }
    console.log('Tables created successfully');

    console.log('Database initialized successfully - No sample data inserted');

  } catch (err) {
    console.error('Database initialization failed:', err.message);
    console.error('Full error:', err);
    throw err;
  }
};

// Make sure all functions are exported
module.exports = { 
  db, 
  initDB, 
  query, 
  get, 
  run, 
  createConnection 
};