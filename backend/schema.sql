-- Create database if it doesn't exist
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

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Insert sample data
INSERT INTO faculty (faculty_name) VALUES ('Faculty of Information Communication Technology');

-- Sample users (passwords are hashed for 'password123')
INSERT INTO users (username, password, full_name, email, role, faculty_id) VALUES
('student1', '$2b$10$example.hash.for.password123', 'John Student', 'student@luct.edu', 'Student', 1),
('lecturer1', '$2b$10$example.hash.for.password123', 'Jane Lecturer', 'lecturer@luct.edu', 'Lecturer', 1),
('prl1', '$2b$10$example.hash.for.password123', 'Bob PRL', 'prl@luct.edu', 'Principal Lecturer', 1),
('pl1', '$2b$10$example.hash.for.password123', 'Alice PL', 'pl@luct.edu', 'Program Leader', 1);

-- Sample course
INSERT INTO courses (course_name, course_code, faculty_id, program_leader_id) VALUES
('Computer Science 101', 'CS101', 1, 4);

-- Sample class
INSERT INTO classes (class_name, course_id, lecturer_id, venue, scheduled_time, total_registered_students) VALUES
('CS101 Lecture 1', 1, 2, 'Room 101', '2023-10-01 09:00:00', 50);
