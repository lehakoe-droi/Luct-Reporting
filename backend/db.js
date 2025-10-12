const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to database file in backend directory
const dbPath = path.join(__dirname, 'luct.db');
const db = new sqlite3.Database(dbPath);

// Save native methods to avoid recursion
const nativeAll = db.all.bind(db);
const nativeGet = db.get.bind(db);
const nativeRun = db.run.bind(db);

// Promisify query (uses all for multi-row)
db.query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    nativeAll(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Promisify get for single row
db.get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    nativeGet(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

// Promisify run for inserts/updates (returns lastID)
db.run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    nativeRun(sql, params, function(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID });
    });
  });
};

// Initialize database schema and sample data on startup
const initDB = async () => {
  try {
    // Create tables (SQLite syntax)
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

    await db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        course_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        course_code TEXT UNIQUE NOT NULL,
        faculty_id INTEGER NOT NULL,
        program_leader_id INTEGER,
        FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id),
        FOREIGN KEY (program_leader_id) REFERENCES users (user_id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        class_id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        lecturer_id INTEGER NOT NULL,
        venue TEXT,
        scheduled_time TEXT,
        total_registered_students INTEGER DEFAULT 0,
        FOREIGN KEY (course_id) REFERENCES courses (course_id),
        FOREIGN KEY (lecturer_id) REFERENCES users (user_id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        lecturer_id INTEGER NOT NULL,
        week_of_reporting TEXT,
        date_of_lecture TEXT,
        topic_taught TEXT,
        learning_outcomes TEXT,
        recommendations TEXT,
        actual_students_present INTEGER DEFAULT 0,
        FOREIGN KEY (class_id) REFERENCES classes (class_id),
        FOREIGN KEY (lecturer_id) REFERENCES users (user_id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        comments TEXT NOT NULL,
        FOREIGN KEY (report_id) REFERENCES reports (report_id),
        FOREIGN KEY (reviewer_id) REFERENCES users (user_id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comments TEXT,
        FOREIGN KEY (class_id) REFERENCES classes (class_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS student_enrollments (
        enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users (user_id),
        FOREIGN KEY (class_id) REFERENCES classes (class_id),
        UNIQUE(student_id, class_id)
      )
    `);

    // Insert sample data if tables are empty
    const facultyCount = await db.get('SELECT COUNT(*) as count FROM faculty');
    if (facultyCount.count === 0) {
      await db.run("INSERT INTO faculty (faculty_name) VALUES (?)", ['Faculty of Engineering']);
    }

    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      // Note: Use actual bcrypt hashes for 'password123' - for demo, use placeholder; in real, hash them
      // For now, use plain for testing, but recommend hashing in code
      await db.run(
        "INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?)",
        ['student1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Student', 'student@luct.edu', 'Student', 1]
      );
      await db.run(
        "INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?)",
        ['lecturer1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Lecturer', 'lecturer@luct.edu', 'Lecturer', 1]
      );
      await db.run(
        "INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?)",
        ['prl1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob PRL', 'prl@luct.edu', 'Principal Lecturer', 1]
      );
      await db.run(
        "INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?)",
        ['pl1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice PL', 'pl@luct.edu', 'Program Leader', 1]
      );
    }

    const courseCount = await db.get('SELECT COUNT(*) as count FROM courses');
    if (courseCount.count === 0) {
      await db.run(
        "INSERT INTO courses (course_name, course_code, faculty_id, program_leader_id) VALUES (?, ?, ?, ?)",
        ['Computer Science 101', 'CS101', 1, 4]
      );
    }

    const classCount = await db.get('SELECT COUNT(*) as count FROM classes');
    if (classCount.count === 0) {
      await db.run(
        "INSERT INTO classes (class_name, course_id, lecturer_id, venue, scheduled_time, total_registered_students) VALUES (?, ?, ?, ?, ?, ?)",
        ['CS101 Lecture 1', 1, 2, 'Room 101', '2023-10-01 09:00:00', 50]
      );
    }

    // Insert sample enrollment if empty
    const enrollmentCount = await db.get('SELECT COUNT(*) as count FROM student_enrollments');
    if (enrollmentCount.count === 0) {
      await db.run(
        "INSERT INTO student_enrollments (student_id, class_id) VALUES (?, ?)",
        [1, 1]  // student1 in CS101 Lecture 1
      );
    }

    console.log('SQLite database initialized successfully ✅');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }
};

// Run init on startup
initDB();

// Export db
module.exports = db;
