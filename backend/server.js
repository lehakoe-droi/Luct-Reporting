// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { initDB, query, get, run } = require("./db");

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['https://luct-reporting-front.onrender.com'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware: Auth check
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware: Role check
const roleCheck = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug Endpoints
app.get("/api/debug/db-status", async (req, res) => {
  try {
    const testResult = await get("SELECT 1 as test");
    const tables = await query("SHOW TABLES");
    const userCount = await get("SELECT COUNT(*) as count FROM users");

    res.json({
      database: 'connected',
      testQuery: testResult,
      tables: tables,
      userCount: userCount.count
    });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(500).json({
      error: 'Database connection failed',
      message: err.message
    });
  }
});

app.get("/api/debug/db-structure", async (req, res) => {
  try {
    const tables = await query("SHOW TABLES");
    
    const tableStructures = {};
    for (let table of tables) {
      const tableName = table.Tables_in_luct_db || table.TABLE_NAME;
      const structure = await query(`DESCRIBE ${tableName}`);
      tableStructures[tableName] = structure;
    }

    res.json({
      tables: Object.keys(tableStructures),
      structures: tableStructures
    });
  } catch (err) {
    console.error('Database structure check failed:', err);
    res.status(500).json({ 
      error: err.message,
      code: err.code 
    });
  }
});

// Test endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "LUCT Reporting System API is running",
    version: "1.0.0"
  });
});

app.post("/api/test", (req, res) => {
  console.log('Test request details:', {
    method: req.method,
    path: req.path,
    body: req.body,
    contentType: req.headers['content-type']
  });
  res.json({ 
    success: true,
    receivedBody: req.body 
  });
});

// =======================
// Auth Endpoints
// =======================
app.post("/api/auth/register", async (req, res) => {
  console.log('=== REGISTER REQUEST ===');
  console.log('Body:', req.body);

  try {
    const { username, password, full_name, email, role, faculty_id } = req.body;
    
    // Validation
    if (!username || !password || !full_name || !email || !role) {
      return res.status(400).json({ 
        success: false,
        error: "All fields are required: username, password, full_name, email, role" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle faculty_id - if provided, verify it exists, otherwise set to NULL
    let finalFacultyId = null;
    if (faculty_id && faculty_id !== '') {
      const facultyExists = await get("SELECT faculty_id FROM faculty WHERE faculty_id = ?", [faculty_id]);
      if (!facultyExists) {
        console.log(`Faculty ID ${faculty_id} not found, setting to NULL`);
        finalFacultyId = null;
      } else {
        finalFacultyId = faculty_id;
      }
    }

    console.log('Final faculty_id being used:', finalFacultyId);

    const result = await run(
      "INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name, email, role, finalFacultyId]
    );

    const userId = result.lastID;
    const token = jwt.sign(
      {
        user_id: userId,
        username: username,
        role: role,
        faculty_id: finalFacultyId,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { 
        user_id: userId, 
        username, 
        full_name, 
        email, 
        role, 
        faculty_id: finalFacultyId 
      }
    });
  } catch (err) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ 
        success: false,
        error: "Username or email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: "Registration failed: " + err.message 
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Body:', req.body);

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Username and password are required" 
      });
    }

    const user = await get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        faculty_id: user.faculty_id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ 
      success: true, 
      token, 
      user: { 
        user_id: user.user_id, 
        username: user.username, 
        role: user.role, 
        full_name: user.full_name, 
        email: user.email, 
        faculty_id: user.faculty_id 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: "Login failed: " + err.message 
    });
  }
});

// Users/Profile
app.get("/api/auth/profile", authenticate, async (req, res) => {
  try {
    const user = await get(
      "SELECT user_id, username, full_name, email, role, faculty_id FROM users WHERE user_id = ?", 
      [req.user.user_id]
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch profile: " + err.message 
    });
  }
});

// Get all users
app.get("/api/users", authenticate, roleCheck(['Program Leader', 'Principal Lecturer']), async (req, res) => {
  try {
    const users = await query(
      "SELECT user_id, username, full_name, email, role, faculty_id FROM users ORDER BY user_id"
    );
    res.json({
      success: true,
      users: users
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch users: " + err.message 
    });
  }
});

// Lecturers
app.get("/api/users/lecturers", authenticate, async (req, res) => {
  try {
    const { search, faculty_id } = req.query;

    let queryStr = "SELECT u.user_id, u.username, u.full_name, u.email, u.role, u.faculty_id, " +
                   "COUNT(c.class_id) as class_count, f.faculty_name " +
                   "FROM users u " +
                   "LEFT JOIN classes c ON u.user_id = c.lecturer_id " +
                   "LEFT JOIN faculty f ON u.faculty_id = f.faculty_id " +
                   "WHERE u.role = 'Lecturer'";

    let params = [];

    // Filter by faculty for Program Leaders
    if (req.user.role === 'Program Leader') {
      queryStr += " AND u.faculty_id = ?";
      params.push(req.user.faculty_id);
    }

    // Add search filter
    if (search && search.trim()) {
      queryStr += " AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)";
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add faculty filter
    if (faculty_id && faculty_id !== 'all') {
      queryStr += " AND u.faculty_id = ?";
      params.push(faculty_id);
    }

    queryStr += " GROUP BY u.user_id, u.username, u.full_name, u.email, u.role, u.faculty_id, f.faculty_name " +
                "ORDER BY u.full_name";

    const lecturers = await query(queryStr, params);
    res.json({
      success: true,
      lecturers: lecturers
    });
  } catch (err) {
    console.error('Get lecturers error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lecturers: " + err.message
    });
  }
});

// =======================
// Faculties
// =======================
app.get("/api/faculties", async (req, res) => {
  try {
    const faculties = await query("SELECT * FROM faculty");
    res.json({
      success: true,
      faculties: faculties
    });
  } catch (err) {
    console.error('Get faculties error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch faculties: " + err.message 
    });
  }
});

// =======================
// Debug Endpoints
// =======================
app.post("/api/debug/create-faculty", async (req, res) => {
  try {
    const result = await run(
      "INSERT INTO faculty (faculty_name) VALUES (?)",
      ["Faculty of Information Communication Technology"]
    );
    
    res.json({
      success: true,
      message: "Faculty created successfully",
      faculty_id: result.lastID
    });
  } catch (err) {
    console.error('Create faculty error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to create faculty: " + err.message
    });
  }
});

app.get("/api/debug/faculties", async (req, res) => {
  try {
    const faculties = await query("SELECT * FROM faculty");
    res.json({
      success: true,
      faculties: faculties
    });
  } catch (err) {
    console.error('Get faculties error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch faculties: " + err.message
    });
  }
});

app.get("/api/debug/test-db", async (req, res) => {
  try {
    const testResult = await query("SELECT 1 as test");
    const users = await query("SELECT COUNT(*) as count FROM users");
    const faculty = await query("SELECT COUNT(*) as count FROM faculty");
    
    res.json({
      success: true,
      connection: "OK",
      testQuery: testResult,
      usersCount: users[0].count,
      facultyCount: faculty[0].count
    });
  } catch (err) {
    console.error('Database test failed:', err);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: err.message,
      code: err.code
    });
  }
});

// =======================
// COURSES ENDPOINTS
// =======================
app.get("/api/courses", authenticate, async (req, res) => {
  try {
    console.log('GET /api/courses called by user:', req.user.user_id, 'role:', req.user.role);
    
    let courses;
    if (req.user.role === 'Program Leader') {
      courses = await query(
        `SELECT c.*, f.faculty_name 
         FROM courses c 
         LEFT JOIN faculty f ON c.faculty_id = f.faculty_id 
         WHERE c.program_leader_id = ?`,
        [req.user.user_id]
      );
    } else {
      courses = await query(
        `SELECT c.*, f.faculty_name 
         FROM courses c 
         LEFT JOIN faculty f ON c.faculty_id = f.faculty_id`
      );
    }
    
    res.json({
      success: true,
      courses: courses
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch courses: " + err.message 
    });
  }
});

app.post("/api/courses", authenticate, roleCheck(['Program Leader']), async (req, res) => {
  try {
    const { course_name, course_code, faculty_id } = req.body;
    if (!course_name || !course_code || !faculty_id) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields" 
      });
    }

    const result = await run(
      "INSERT INTO courses (course_name, course_code, faculty_id, program_leader_id) VALUES (?, ?, ?, ?)",
      [course_name, course_code, faculty_id, req.user.user_id]
    );

    res.status(201).json({ 
      success: true,
      message: "Course added successfully",
      course_id: result.lastID
    });
  } catch (err) {
    console.error('Add course error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to add course: " + err.message 
    });
  }
});

// =======================
// CLASSES ENDPOINTS
// =======================
app.get("/api/classes", authenticate, async (req, res) => {
  try {
    console.log('GET /api/classes called by user:', req.user.user_id, 'role:', req.user.role);
    
    let classes;
    if (req.user.role === 'Student') {
      classes = await query(
        `SELECT cl.*, c.course_name, c.course_code, u.full_name AS lecturer_name
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.course_id
         LEFT JOIN users u ON cl.lecturer_id = u.user_id
         INNER JOIN student_enrollments se ON cl.class_id = se.class_id
         WHERE se.student_id = ?`,
        [req.user.user_id]
      );
    } else if (req.user.role === 'Lecturer') {
      classes = await query(
        `SELECT cl.*, c.course_name, c.course_code, u.full_name AS lecturer_name
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.course_id
         LEFT JOIN users u ON cl.lecturer_id = u.user_id
         WHERE cl.lecturer_id = ?`,
        [req.user.user_id]
      );
    } else {
      classes = await query(
        `SELECT cl.*, c.course_name, c.course_code, u.full_name AS lecturer_name
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.course_id
         LEFT JOIN users u ON cl.lecturer_id = u.user_id`
      );
    }
    
    res.json({
      success: true,
      classes: classes
    });
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch classes: " + err.message 
    });
  }
});

app.get("/api/classes/available", authenticate, roleCheck(['Student']), async (req, res) => {
  try {
    const availableClasses = await query(
      `SELECT cl.*, c.course_name, c.course_code, u.full_name AS lecturer_name
       FROM classes cl
       LEFT JOIN courses c ON cl.course_id = c.course_id
       LEFT JOIN users u ON cl.lecturer_id = u.user_id
       WHERE cl.class_id NOT IN (
         SELECT class_id FROM student_enrollments WHERE student_id = ?
       )`,
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      classes: availableClasses
    });
  } catch (err) {
    console.error('Get available classes error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch available classes: " + err.message 
    });
  }
});

app.post("/api/enrollments", authenticate, roleCheck(['Student']), async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!class_id) {
      return res.status(400).json({ 
        success: false,
        error: "Missing class_id" 
      });
    }

    const existing = await get(
      "SELECT * FROM student_enrollments WHERE student_id = ? AND class_id = ?",
      [req.user.user_id, class_id]
    );
    
    if (existing) {
      return res.status(400).json({ 
        success: false,
        error: "Already enrolled in this class" 
      });
    }

    await run(
      "INSERT INTO student_enrollments (student_id, class_id) VALUES (?, ?)",
      [req.user.user_id, class_id]
    );

    await run(
      "UPDATE classes SET total_registered_students = total_registered_students + 1 WHERE class_id = ?",
      [class_id]
    );

    res.status(201).json({ 
      success: true,
      message: "Enrolled successfully" 
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to enroll: " + err.message 
    });
  }
});

app.post("/api/classes", authenticate, roleCheck(['Program Leader', 'Principal Lecturer']), async (req, res) => {
  try {
    const { class_name, course_id, lecturer_id, venue, scheduled_time } = req.body;
    if (!class_name || !course_id || !lecturer_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    const result = await run(
      "INSERT INTO classes (class_name, course_id, lecturer_id, venue, scheduled_time, total_registered_students) VALUES (?, ?, ?, ?, ?, ?)",
      [class_name, course_id, lecturer_id, venue || '', scheduled_time || null, 0]
    );

    res.status(201).json({
      success: true,
      message: "Class added successfully",
      class_id: result.lastID
    });
  } catch (err) {
    console.error('Add class error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to add class: " + err.message
    });
  }
});

app.get("/api/classes/:classId/students", authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    console.log('GET /api/classes/:classId/students called for class:', classId, 'by user:', req.user.user_id, 'role:', req.user.role);

    // Check if user has access to this class
    let accessCheck;
    if (req.user.role === 'Lecturer') {
      accessCheck = await get(
        "SELECT class_id FROM classes WHERE class_id = ? AND lecturer_id = ?",
        [classId, req.user.user_id]
      );
    } else if (req.user.role === 'Student') {
      accessCheck = await get(
        "SELECT class_id FROM student_enrollments WHERE class_id = ? AND student_id = ?",
        [classId, req.user.user_id]
      );
    } else {
      // Program Leader, Principal Lecturer have access to all classes
      accessCheck = await get("SELECT class_id FROM classes WHERE class_id = ?", [classId]);
    }

    if (!accessCheck) {
      return res.status(403).json({
        success: false,
        error: "Access denied or class not found"
      });
    }

    const students = await query(
      `SELECT u.user_id, u.username, u.full_name, u.email, se.enrollment_date
       FROM student_enrollments se
       LEFT JOIN users u ON se.student_id = u.user_id
       WHERE se.class_id = ?
       ORDER BY u.full_name`,
      [classId]
    );

    res.json({
      success: true,
      students: students
    });
  } catch (err) {
    console.error('Get class students error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch class students: " + err.message
    });
  }
});

// Get lecturer's schedule/classes
app.get("/api/classes/lecturer/:lecturerId", authenticate, async (req, res) => {
  try {
    const { lecturerId } = req.params;
    console.log('GET /api/classes/lecturer/:lecturerId called for lecturer:', lecturerId, 'by user:', req.user.user_id, 'role:', req.user.role);

    // Check if user has permission to view this lecturer's schedule
    if (req.user.role === 'Program Leader' && req.user.faculty_id) {
      // Program Leaders can only view lecturers in their faculty
      const lecturerCheck = await get(
        "SELECT faculty_id FROM users WHERE user_id = ? AND role = 'Lecturer'",
        [lecturerId]
      );
      if (!lecturerCheck || lecturerCheck.faculty_id !== req.user.faculty_id) {
        return res.status(403).json({
          success: false,
          error: "Access denied - can only view lecturers in your faculty"
        });
      }
    } else if (req.user.role === 'Lecturer' && parseInt(lecturerId) !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: "Lecturers can only view their own schedule"
      });
    } else if (req.user.role === 'Student') {
      return res.status(403).json({
        success: false,
        error: "Students cannot view lecturer schedules"
      });
    }
    // Principal Lecturers can view all lecturers in their faculty

    const classes = await query(
      `SELECT cl.class_id, cl.class_name, cl.venue, cl.scheduled_time, cl.total_registered_students,
       c.course_name, c.course_code
       FROM classes cl
       LEFT JOIN courses c ON cl.course_id = c.course_id
       WHERE cl.lecturer_id = ?
       ORDER BY cl.scheduled_time IS NULL, cl.scheduled_time`,
      [lecturerId]
    );

    res.json({
      success: true,
      classes: classes
    });
  } catch (err) {
    console.error('Get lecturer schedule error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lecturer schedule: " + err.message
    });
  }
});

// =======================
// GRADES ENDPOINTS
// =======================
app.get("/api/grades", authenticate, async (req, res) => {
  try {
    console.log('GET /api/grades called by user:', req.user.user_id, 'role:', req.user.role);
    
    let grades;
    if (req.user.role === 'Lecturer') {
      grades = await query(
        `SELECT g.*, u.full_name AS student_name, c.class_name, co.course_name
         FROM grades g
         LEFT JOIN users u ON g.student_id = u.user_id
         LEFT JOIN classes c ON g.class_id = c.class_id
         LEFT JOIN courses co ON c.course_id = co.course_id
         WHERE g.lecturer_id = ?
         ORDER BY g.date_given DESC`,
        [req.user.user_id]
      );
    } else if (req.user.role === 'Student') {
      grades = await query(
        `SELECT g.*, u.full_name AS lecturer_name, c.class_name, co.course_name
         FROM grades g
         LEFT JOIN users u ON g.lecturer_id = u.user_id
         LEFT JOIN classes c ON g.class_id = c.class_id
         LEFT JOIN courses co ON c.course_id = co.course_id
         WHERE g.student_id = ?
         ORDER BY g.date_given DESC`,
        [req.user.user_id]
      );
    } else {
      grades = await query(
        `SELECT g.*, s.full_name AS student_name, l.full_name AS lecturer_name, c.class_name, co.course_name
         FROM grades g
         LEFT JOIN users s ON g.student_id = s.user_id
         LEFT JOIN users l ON g.lecturer_id = l.user_id
         LEFT JOIN classes c ON g.class_id = c.class_id
         LEFT JOIN courses co ON c.course_id = co.course_id
         ORDER BY g.date_given DESC`
      );
    }
    
    res.json({
      success: true,
      grades: grades
    });
  } catch (err) {
    console.error('Get grades error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch grades: " + err.message
    });
  }
});

app.post("/api/grades", authenticate, roleCheck(['Lecturer']), async (req, res) => {
  try {
    console.log('POST /api/grades called by lecturer:', req.user.user_id);
    console.log('Request body:', req.body);

    const { student_id, class_id, grade, grade_type, description, date_given } = req.body;

    if (!student_id || !class_id || !grade || !grade_type || !date_given) {
      return res.status(400).json({
        success: false,
        error: "All fields are required: student_id, class_id, grade, grade_type, date_given"
      });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({
        success: false,
        error: "Grade must be between 0 and 100"
      });
    }

    const validGradeTypes = ['assignment', 'exam', 'quiz', 'project', 'participation', 'homework'];
    if (!validGradeTypes.includes(grade_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid grade type. Must be one of: " + validGradeTypes.join(', ')
      });
    }

    const classCheck = await get(
      "SELECT class_id FROM classes WHERE class_id = ? AND lecturer_id = ?",
      [class_id, req.user.user_id]
    );

    if (!classCheck) {
      return res.status(403).json({
        success: false,
        error: "You can only assign grades for classes you teach"
      });
    }

    const enrollmentCheck = await get(
      "SELECT * FROM student_enrollments WHERE student_id = ? AND class_id = ?",
      [student_id, class_id]
    );

    if (!enrollmentCheck) {
      return res.status(400).json({
        success: false,
        error: "Student is not enrolled in this class"
      });
    }

    const result = await run(
      "INSERT INTO grades (student_id, class_id, lecturer_id, grade, grade_type, description, date_given) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [student_id, class_id, req.user.user_id, grade, grade_type, description || "", date_given]
    );

    console.log('Grade inserted with ID:', result.lastID);

    res.status(201).json({
      success: true,
      message: "Grade submitted successfully",
      grade_id: result.lastID
    });
  } catch (err) {
    console.error('Submit grade error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to submit grade: " + err.message
    });
  }
});

// =======================
// RATINGS ENDPOINTS
// =======================
app.get("/api/ratings", authenticate, async (req, res) => {
  try {
    console.log('GET /api/ratings called by user:', req.user.user_id, 'role:', req.user.role);
    
    let ratings;
    if (req.user.role === 'Principal Lecturer' || req.user.role === 'Program Leader') {
      ratings = await query(
        `SELECT r.*,
         l.full_name AS lecturer_name,
         s.full_name AS user_name,
         s.role AS user_role
         FROM ratings r
         LEFT JOIN users l ON r.lecturer_id = l.user_id
         LEFT JOIN users s ON r.user_id = s.user_id
         ORDER BY r.created_at DESC`
      );
    } else if (req.user.role === 'Lecturer') {
      ratings = await query(
        `SELECT r.*,
         u.full_name AS user_name,
         u.role AS user_role
         FROM ratings r
         LEFT JOIN users u ON r.user_id = u.user_id
         WHERE r.lecturer_id = ?
         ORDER BY r.created_at DESC`,
        [req.user.user_id]
      );
    } else {
      ratings = await query(
        `SELECT r.*,
         u.full_name AS lecturer_name
         FROM ratings r
         LEFT JOIN users u ON r.lecturer_id = u.user_id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [req.user.user_id]
      );
    }
    
    console.log('Found ratings:', ratings);
    
    res.json({
      success: true,
      data: ratings,
      count: ratings.length
    });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch ratings: " + err.message 
    });
  }
});

app.post("/api/ratings", authenticate, async (req, res) => {
  try {
    console.log('POST /api/ratings called by user:', req.user.user_id);
    console.log('Request body:', req.body);

    const { lecturer_id, rating, comments } = req.body;

    if (!lecturer_id || !rating) {
      return res.status(400).json({
        success: false,
        error: "Lecturer ID and rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5"
      });
    }

    if (parseInt(lecturer_id) === req.user.user_id) {
      return res.status(400).json({
        success: false,
        error: "You cannot rate yourself"
      });
    }

    const lecturer = await get(
      "SELECT user_id, role FROM users WHERE user_id = ? AND role = 'Lecturer'",
      [lecturer_id]
    );

    if (!lecturer) {
      return res.status(400).json({
        success: false,
        error: "Lecturer not found"
      });
    }

    // Check if rating already exists
    const existingRating = await get(
      "SELECT rating_id FROM ratings WHERE user_id = ? AND lecturer_id = ?",
      [req.user.user_id, lecturer_id]
    );

    let result;
    if (existingRating) {
      // Update existing rating
      result = await run(
        "UPDATE ratings SET rating = ?, comments = ?, created_at = NOW() WHERE rating_id = ?",
        [rating, comments || "", existingRating.rating_id]
      );
      console.log('Rating updated for ID:', existingRating.rating_id);
    } else {
      // Insert new rating
      result = await run(
        "INSERT INTO ratings (lecturer_id, user_id, rating, comments, created_at) VALUES (?, ?, ?, ?, NOW())",
        [lecturer_id, req.user.user_id, rating, comments || ""]
      );
      console.log('Rating inserted with ID:', result.lastID);
    }

    res.status(200).json({
      success: true,
      message: existingRating ? "Rating updated successfully" : "Rating submitted successfully",
      rating_id: existingRating ? existingRating.rating_id : result.lastID
    });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to submit rating: " + err.message
    });
  }
});

// =======================
// REPORTS ENDPOINTS
// =======================
app.get("/api/reports", authenticate, async (req, res) => {
  try {
    let queryStr = `SELECT r.*, cl.class_name, c.course_name, c.course_code, u.full_name AS lecturer_name,
              f.comments AS feedback_comments, f.feedback_id,
              cl.total_registered_students
       FROM reports r
       LEFT JOIN classes cl ON r.class_id = cl.class_id
       LEFT JOIN courses c ON cl.course_id = c.course_id
       LEFT JOIN users u ON r.lecturer_id = u.user_id
       LEFT JOIN feedback f ON r.report_id = f.report_id`;
    let params = [];

    if (req.user.role === 'Lecturer') {
      queryStr += " WHERE r.lecturer_id = ?";
      params.push(req.user.user_id);
    }

    const reports = await query(queryStr, params);
    res.json({
      success: true,
      reports: reports
    });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch reports: " + err.message 
    });
  }
});

app.post("/api/reports", authenticate, roleCheck(['Lecturer']), async (req, res) => {
  try {
    const { class_id, week_of_reporting, date_of_lecture, topic_taught, learning_outcomes, recommendations, actual_students_present } = req.body;
    if (!class_id) return res.status(400).json({
      success: false,
      error: "Missing class_id"
    });

    await run(
      `INSERT INTO reports (class_id, lecturer_id, week_of_reporting, date_of_lecture, topic_taught, learning_outcomes, recommendations, actual_students_present)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [class_id, req.user.user_id, week_of_reporting || null, date_of_lecture || null, topic_taught || "", learning_outcomes || "", recommendations || "", actual_students_present || 0]
    );

    res.status(201).json({
      success: true,
      message: "Report submitted successfully"
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to submit report: " + err.message
    });
  }
});

app.post("/api/reports/:reportId/feedback", authenticate, roleCheck(['Principal Lecturer']), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { comments } = req.body;

    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        error: "Feedback comments are required"
      });
    }

    // Check if report exists
    const report = await get("SELECT report_id FROM reports WHERE report_id = ?", [reportId]);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found"
      });
    }

    // Check if feedback already exists for this report
    const existingFeedback = await get("SELECT feedback_id FROM feedback WHERE report_id = ?", [reportId]);
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        error: "Feedback already exists for this report"
      });
    }

    await run(
      "INSERT INTO feedback (report_id, reviewer_id, comments) VALUES (?, ?, ?)",
      [reportId, req.user.user_id, comments.trim()]
    );

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully"
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to submit feedback: " + err.message
    });
  }
});

app.delete("/api/reports/:reportId", authenticate, roleCheck(['Principal Lecturer']), async (req, res) => {
  try {
    const { reportId } = req.params;

    // Check if report exists
    const report = await get("SELECT report_id FROM reports WHERE report_id = ?", [reportId]);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found"
      });
    }

    // Delete associated feedback first (if exists)
    await run("DELETE FROM feedback WHERE report_id = ?", [reportId]);

    // Delete the report
    await run("DELETE FROM reports WHERE report_id = ?", [reportId]);

    res.json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to delete report: " + err.message
    });
  }
});

// =======================
// Analytics
// =======================
app.get("/api/analytics/dashboard", authenticate, async (req, res) => {
  try {
    const totalUsers = await get("SELECT COUNT(*) AS count FROM users");
    const totalCourses = await get("SELECT COUNT(*) AS count FROM courses");
    const totalClasses = await get("SELECT COUNT(*) AS count FROM classes");
    const totalReports = await get("SELECT COUNT(*) AS count FROM reports");

    res.json({
      success: true,
      data: {
        users: totalUsers.count,
        courses: totalCourses.count,
        classes: totalClasses.count,
        reports: totalReports.count,
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics: " + err.message
    });
  }
});

// =======================
// Monitoring Dashboard
// =======================
app.get("/api/monitoring/dashboard", authenticate, async (req, res) => {
  try {
    console.log('GET /api/monitoring/dashboard called by user:', req.user.user_id, 'role:', req.user.role);

    let monitoringData = [];
    let attendanceData = [];
    let stats = [];

    if (req.user.role === 'Student') {
      const studentClasses = await query(
        `SELECT c.class_name, c.class_id, co.course_name
         FROM student_enrollments se
         LEFT JOIN classes c ON se.class_id = c.class_id
         LEFT JOIN courses co ON c.course_id = co.course_id
         WHERE se.student_id = ?`,
        [req.user.user_id]
      );

      monitoringData = [
        { date: 'Mon', attendance: 100, progress: 85 },
        { date: 'Tue', attendance: 100, progress: 87 },
        { date: 'Wed', attendance: 90, progress: 89 },
        { date: 'Thu', attendance: 100, progress: 91 },
        { date: 'Fri', attendance: 95, progress: 93 }
      ];

      attendanceData = studentClasses.map(cls => ({
        subject: cls.class_name,
        attendance: Math.floor(Math.random() * 20) + 80
      }));

      stats = [
        { label: 'Overall Progress', value: '89%', icon: 'bi-graph-up' },
        { label: 'Attendance Rate', value: '97%', icon: 'bi-people' },
        { label: 'Completed Tasks', value: '12', icon: 'bi-check-circle' },
        { label: 'Current Score', value: '4.2', icon: 'bi-award' }
      ];

    } else if (req.user.role === 'Lecturer') {
      const lecturerClasses = await query(
        `SELECT c.class_name, c.class_id, c.total_registered_students
         FROM classes c
         WHERE c.lecturer_id = ?`,
        [req.user.user_id]
      );

      const totalReports = await get(
        "SELECT COUNT(*) as count FROM reports WHERE lecturer_id = ?",
        [req.user.user_id]
      );

      monitoringData = [
        { date: 'Mon', attendance: 85, reports: 1 },
        { date: 'Tue', attendance: 92, reports: 0 },
        { date: 'Wed', attendance: 88, reports: 1 },
        { date: 'Thu', attendance: 95, reports: 0 },
        { date: 'Fri', attendance: 90, reports: 1 }
      ];

      attendanceData = lecturerClasses.map(cls => ({
        subject: cls.class_name,
        attendance: Math.floor(Math.random() * 15) + 85
      }));

      stats = [
        { label: 'Class Attendance', value: '90%', icon: 'bi-people' },
        { label: 'Reports Submitted', value: totalReports.count.toString(), icon: 'bi-clipboard' },
        { label: 'Active Classes', value: lecturerClasses.length.toString(), icon: 'bi-book' },
        { label: 'Student Feedback', value: '4.1', icon: 'bi-star' }
      ];

    } else if (req.user.role === 'Principal Lecturer') {
      const facultyLecturers = await query(
        `SELECT u.user_id, u.full_name, COUNT(r.report_id) as reports_count
         FROM users u
         LEFT JOIN reports r ON u.user_id = r.lecturer_id
         WHERE u.role = 'Lecturer' AND u.faculty_id = ?
         GROUP BY u.user_id, u.full_name`,
        [req.user.faculty_id]
      );

      monitoringData = facultyLecturers.map(lecturer => ({
        lecturer: lecturer.full_name,
        reports: lecturer.reports_count,
        attendance: Math.floor(Math.random() * 15) + 85
      }));

      attendanceData = [
        { name: 'High Performers', value: 70 },
        { name: 'Average', value: 25 },
        { name: 'Needs Attention', value: 5 }
      ];

      stats = [
        { label: 'Faculty Reports', value: facultyLecturers.reduce((sum, l) => sum + l.reports_count, 0).toString(), icon: 'bi-clipboard-check' },
        { label: 'Active Lecturers', value: facultyLecturers.length.toString(), icon: 'bi-people' },
        { label: 'Avg Performance', value: '4.0', icon: 'bi-star' },
        { label: 'Pending Reviews', value: '3', icon: 'bi-clock' }
      ];

    } else if (req.user.role === 'Program Leader') {
      const programCourses = await query(
        `SELECT c.course_name, c.course_id,
         COUNT(cl.class_id) as classes_count,
         SUM(cl.total_registered_students) as total_students
         FROM courses c
         LEFT JOIN classes cl ON c.course_id = cl.course_id
         WHERE c.program_leader_id = ?
         GROUP BY c.course_id, c.course_name`,
        [req.user.user_id]
      );

      monitoringData = programCourses.map(course => ({
        course: course.course_name,
        students: course.total_students || 0,
        attendance: Math.floor(Math.random() * 15) + 85,
        satisfaction: (Math.random() * 1 + 4).toFixed(1)
      }));

      attendanceData = [
        { name: 'Excellent', value: 40 },
        { name: 'Good', value: 35 },
        { name: 'Satisfactory', value: 20 },
        { name: 'Needs Improvement', value: 5 }
      ];

      stats = [
        { label: 'Total Students', value: programCourses.reduce((sum, c) => sum + (c.total_students || 0), 0).toString(), icon: 'bi-people' },
        { label: 'Active Courses', value: programCourses.length.toString(), icon: 'bi-journal' },
        { label: 'Program Success', value: '92%', icon: 'bi-trophy' },
        { label: 'Avg Satisfaction', value: '4.3', icon: 'bi-star' }
      ];
    }

    console.log('Monitoring data prepared:', {
      monitoringDataCount: monitoringData.length,
      attendanceDataCount: attendanceData.length,
      statsCount: stats.length
    });

    res.json({
      success: true,
      monitoringData: monitoringData,
      attendanceData: attendanceData,
      stats: stats
    });
  } catch (err) {
    console.error('Monitoring dashboard error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch monitoring data: " + err.message
    });
  }
});

// =======================
// Error Handling Middleware
// =======================
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// =======================
// Start Server with Database Initialization
// =======================
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    console.log('Initializing database...');
    await initDB();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`=== SERVER STARTED SUCCESSFULLY ===`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${process.env.DB_NAME || 'luct_db'}`);
      console.log(`===================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();