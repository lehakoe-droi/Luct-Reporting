// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// =======================
// Middleware: Auth check
// =======================
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// =======================
// Middleware: Role check
// =======================
const roleCheck = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

// =======================
 // Test endpoint
 // =======================
app.get("/", (req, res) => {
  res.send("LUCT Reporting System API is running ✅");
});

// Test body parsing
app.post("/api/test", (req, res) => {
  console.log('Test request details:', {
    method: req.method,
    path: req.path,
    body: req.body,
    contentType: req.headers['content-type']
  });
  res.json({ receivedBody: req.body });
});

// =======================
// Auth Endpoints
// =======================
app.post("/api/auth/register", async (req, res) => {
  console.log('Register request details:', {
    method: req.method,
    path: req.path,
    body: req.body,
    contentType: req.headers['content-type']
  });

  try {
    const { username, password, full_name, email, role, faculty_id } = req.body;
    if (!username || !password || !full_name || !email || !role)
      return res.status(400).json({ error: "Missing fields" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      "INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, full_name, email, role, faculty_id || null]
    );

    const userId = result.lastID;
    const token = jwt.sign(
      {
        user_id: userId,
        username: username,
        role: role,
        faculty_id: faculty_id,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { user_id: userId, username, full_name, email, role, faculty_id }
    });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  console.log('Login request details:', {
    method: req.method,
    path: req.path,
    body: req.body,
    contentType: req.headers['content-type']
  });

  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing username or password" });

    const users = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

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

    res.json({ success: true, token, user: { user_id: user.user_id, username: user.username, role: user.role, full_name: user.full_name, email: user.email, faculty_id: user.faculty_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Users/Profile
// =======================
app.get("/api/auth/profile", authenticate, async (req, res) => {
  try {
    const users = await db.query("SELECT user_id, username, full_name, email, role, faculty_id FROM users WHERE user_id = ?", [req.user.user_id]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Lecturers
// =======================
app.get("/api/users/lecturers", authenticate, async (req, res) => {
  try {
    const lecturers = await db.query(
      "SELECT user_id, username, full_name, email, role, faculty_id FROM users WHERE role = 'Lecturer'"
    );
    res.json(lecturers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Faculties
// =======================
app.get("/api/faculties", async (req, res) => {
  try {
    const faculties = await db.query("SELECT * FROM faculty");
    res.json(faculties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Courses
// =======================
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await db.query(
      `SELECT c.course_id, c.course_name, c.course_code, c.faculty_id, f.faculty_name, c.program_leader_id
       FROM courses c
       LEFT JOIN faculty f ON c.faculty_id = f.faculty_id`
    );
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/courses", authenticate, roleCheck(['Program Leader']), async (req, res) => {
  try {
    const { course_name, course_code, faculty_id } = req.body;
    if (!course_name || !course_code || !faculty_id)
      return res.status(400).json({ error: "Missing fields" });

    await db.query(
      "INSERT INTO courses (course_name, course_code, faculty_id, program_leader_id) VALUES (?, ?, ?, ?)",
      [course_name, course_code, faculty_id, req.user.user_id]
    );

    res.status(201).json({ message: "Course added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Classes
// =======================
app.get("/api/classes", authenticate, async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'Student') {
      classes = await db.query(
        `SELECT cl.class_id, cl.class_name, cl.course_id, c.course_name, cl.lecturer_id, u.full_name AS lecturer_name, cl.venue, cl.scheduled_time, cl.total_registered_students
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.course_id
         LEFT JOIN users u ON cl.lecturer_id = u.user_id
         INNER JOIN student_enrollments se ON cl.class_id = se.class_id
         WHERE se.student_id = ?`,
        [req.user.user_id]
      );
    } else if (req.user.role === 'Lecturer') {
      classes = await db.query(
        `SELECT cl.class_id, cl.class_name, cl.course_id, c.course_name, cl.lecturer_id, u.full_name AS lecturer_name, cl.venue, cl.scheduled_time, cl.total_registered_students
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.course_id
         LEFT JOIN users u ON cl.lecturer_id = u.user_id
         WHERE cl.lecturer_id = ?`,
        [req.user.user_id]
      );
    } else {
      classes = await db.query(
        `SELECT cl.class_id, cl.class_name, cl.course_id, c.course_name, cl.lecturer_id, u.full_name AS lecturer_name, cl.venue, cl.scheduled_time, cl.total_registered_students
         FROM classes cl
         LEFT JOIN courses c ON cl.course_id = c.course_id
         LEFT JOIN users u ON cl.lecturer_id = u.user_id`
      );
    }
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Available classes for enrollment
app.get("/api/classes/available", authenticate, roleCheck(['Student']), async (req, res) => {
  try {
    const availableClasses = await db.query(
      `SELECT cl.class_id, cl.class_name, cl.course_id, c.course_name, cl.lecturer_id, u.full_name AS lecturer_name, cl.venue, cl.scheduled_time, cl.total_registered_students
       FROM classes cl
       LEFT JOIN courses c ON cl.course_id = c.course_id
       LEFT JOIN users u ON cl.lecturer_id = u.user_id
       WHERE cl.class_id NOT IN (SELECT class_id FROM student_enrollments WHERE student_id = ?)`,
      [req.user.user_id]
    );
    res.json(availableClasses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Enroll in class
app.post("/api/enrollments", authenticate, roleCheck(['Student']), async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!class_id) return res.status(400).json({ error: "Missing class_id" });

    // Check if already enrolled
    const existing = await db.get(
      "SELECT COUNT(*) as count FROM student_enrollments WHERE student_id = ? AND class_id = ?",
      [req.user.user_id, class_id]
    );
    if (existing.count > 0) return res.status(400).json({ error: "Already enrolled in this class" });

    // Insert enrollment
    await db.query(
      "INSERT INTO student_enrollments (student_id, class_id) VALUES (?, ?)",
      [req.user.user_id, class_id]
    );

    // Update total_registered_students
    await db.query(
      "UPDATE classes SET total_registered_students = total_registered_students + 1 WHERE class_id = ?",
      [class_id]
    );

    res.status(201).json({ message: "Enrolled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/classes", authenticate, roleCheck(['Program Leader', 'Principal Lecturer']), async (req, res) => {
  try {
    const { class_name, course_id, lecturer_id, venue, scheduled_time, total_registered_students } = req.body;
    if (!class_name || !course_id || !lecturer_id)
      return res.status(400).json({ error: "Missing fields" });

    await db.query(
      "INSERT INTO classes (class_name, course_id, lecturer_id, venue, scheduled_time, total_registered_students) VALUES (?, ?, ?, ?, ?, ?)",
      [class_name, course_id, lecturer_id, venue, scheduled_time || null, total_registered_students || 0]
    );

    res.status(201).json({ message: "Class added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Reports
// =======================
app.get("/api/reports", authenticate, async (req, res) => {
  try {
    let query = `SELECT r.*, cl.class_name, c.course_name, c.course_code, u.full_name AS lecturer_name,
              f.comments AS feedback_comments, f.feedback_id
       FROM reports r
       LEFT JOIN classes cl ON r.class_id = cl.class_id
       LEFT JOIN courses c ON cl.course_id = c.course_id
       LEFT JOIN users u ON r.lecturer_id = u.user_id
       LEFT JOIN feedback f ON r.report_id = f.report_id`;
    let params = [];

    if (req.user.role === 'Lecturer') {
      query += " WHERE r.lecturer_id = ?";
      params.push(req.user.user_id);
    }

    const reports = await db.query(query, params);
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/reports", authenticate, roleCheck(['Lecturer']), async (req, res) => {
  try {
    const { class_id, week_of_reporting, date_of_lecture, topic_taught, learning_outcomes, recommendations, actual_students_present } = req.body;
    if (!class_id) return res.status(400).json({ error: "Missing class_id" });

    await db.query(
      `INSERT INTO reports (class_id, lecturer_id, week_of_reporting, date_of_lecture, topic_taught, learning_outcomes, recommendations, actual_students_present)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [class_id, req.user.user_id, week_of_reporting || null, date_of_lecture || null, topic_taught || "", learning_outcomes || "", recommendations || "", actual_students_present || 0]
    );

    res.status(201).json({ message: "Report submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add feedback
app.post("/api/reports/:id/feedback", authenticate, roleCheck(['Principal Lecturer']), async (req, res) => {
  try {
    const reportId = req.params.id;
    const { feedback } = req.body;
    if (!feedback) return res.status(400).json({ error: "Missing feedback" });

    await db.query(
      "INSERT INTO feedback (report_id, reviewer_id, comments) VALUES (?, ?, ?)",
      [reportId, req.user.user_id, feedback]
    );

    res.status(201).json({ message: "Feedback added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete report
app.delete("/api/reports/:id", authenticate, roleCheck(['Principal Lecturer']), async (req, res) => {
  try {
    const reportId = req.params.id;

    // Delete associated feedback first
    await db.query("DELETE FROM feedback WHERE report_id = ?", [reportId]);

    // Delete the report
    const result = await db.query("DELETE FROM reports WHERE report_id = ?", [reportId]);
    if (result.changes === 0) return res.status(404).json({ error: "Report not found" });

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Ratings
// =======================
app.get("/api/ratings", authenticate, async (req, res) => {
  try {
    const ratings = await db.query(
      `SELECT r.*, cl.class_name, c.course_name
       FROM ratings r
       LEFT JOIN classes cl ON r.class_id = cl.class_id
       LEFT JOIN courses c ON cl.course_id = c.course_id
       WHERE r.user_id = ?`,
      [req.user.user_id]
    );
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/ratings", authenticate, async (req, res) => {
  try {
    const { class_id, rating, comments } = req.body;
    if (!class_id || !rating) return res.status(400).json({ error: "Missing fields" });

    // Check enrollment for students
    if (req.user.role === 'Student') {
      const enrollment = await db.get(
        "SELECT COUNT(*) as count FROM student_enrollments WHERE student_id = ? AND class_id = ?",
        [req.user.user_id, class_id]
      );
      if (enrollment.count === 0) {
        return res.status(403).json({ error: "Not enrolled in this class" });
      }
    }

    await db.query(
      "INSERT INTO ratings (class_id, user_id, rating, comments) VALUES (?, ?, ?, ?)",
      [class_id, req.user.user_id, rating, comments || ""]
    );

    res.status(201).json({ message: "Rating submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Analytics (example)
// =======================
app.get("/api/analytics/dashboard", authenticate, async (req, res) => {
  try {
    const totalUsers = await db.query("SELECT COUNT(*) AS count FROM users");
    const totalCourses = await db.query("SELECT COUNT(*) AS count FROM courses");
    const totalClasses = await db.query("SELECT COUNT(*) AS count FROM classes");
    const totalReports = await db.query("SELECT COUNT(*) AS count FROM reports");

    res.json({
      users: totalUsers[0].count,
      courses: totalCourses[0].count,
      classes: totalClasses[0].count,
      reports: totalReports[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
