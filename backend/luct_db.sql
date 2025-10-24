CREATE DATABASE IF NOT EXISTS luct_db;
USE luct_db;

-- Faculty table
CREATE TABLE IF NOT EXISTS faculty (
  faculty_id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_name VARCHAR(255) NOT NULL
);

-- Users table
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

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50) UNIQUE NOT NULL,
  faculty_id INT NOT NULL,
  program_leader_id INT,
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
  FOREIGN KEY (program_leader_id) REFERENCES users(user_id)
);

-- Classes table
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

-- Reports table
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
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  FOREIGN KEY (lecturer_id) REFERENCES users(user_id)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  comments TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(report_id),
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id)
);

-- Student Enrollments table
CREATE TABLE IF NOT EXISTS student_enrollments (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  UNIQUE KEY unique_enrollment (student_id, class_id)
);

-- Ratings table
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

-- Grades table
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

-- Insert sample data
