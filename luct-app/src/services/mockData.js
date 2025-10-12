// Mock data for demonstration before backend is ready
export const mockFaculties = [
  { faculty_id: 1, faculty_name: 'Faculty of Information Communication Technology' },
  { faculty_id: 2, faculty_name: 'Faculty of Communication and Media' },
  { faculty_id: 3, faculty_name: 'Faculty of Architecture and Interior' },
  { faculty_id: 4, faculty_name: 'Faculty of Design Innovation' },
  { faculty_id: 5, faculty_name: 'Faculty of Creativity in Tourism and Hospitality' }
];

export const mockCourses = [
  { course_id: 1, course_name: 'Object Oriented Programming', course_code: 'ICT101', faculty_id: 1 },
  { course_id: 2, course_name: 'Database Systems', course_code: 'ICT102', faculty_id: 1 },
  { course_id: 3, course_name: 'Web Development', course_code: 'ICT104', faculty_id: 1 },
  { course_id: 4, course_name: 'Mass Communication Principles', course_code: 'CM201', faculty_id: 2 },
  { course_id: 5, course_name: 'Digital Media Production', course_code: 'CM202', faculty_id: 2 }
];

export const mockClasses = [
  { class_id: 1, class_name: 'BScIT - OOP', course_id: 1, lecturer_id: 2, venue: 'Room 101', scheduled_time: '2024-01-15T10:00:00', total_registered_students: 50 },
  { class_id: 2, class_name: 'BScIT - Database', course_id: 2, lecturer_id: 2, venue: 'Lab 201', scheduled_time: '2024-01-16T14:00:00', total_registered_students: 48 },
  { class_id: 3, class_name: 'BScSM - Web Dev', course_id: 3, lecturer_id: 2, venue: 'Room 105', scheduled_time: '2024-01-17T09:00:00', total_registered_students: 45 }
];

export const mockLecturers = [
  { user_id: 2, username: 'lecturer', full_name: 'Dr. Smith Lecturer', email: 'lecturer@luct.ac.ls', faculty_id: 1 },
  { user_id: 5, username: 'lecturer2', full_name: 'Prof. Johnson', email: 'johnson@luct.ac.ls', faculty_id: 1 },
  { user_id: 6, username: 'lecturer3', full_name: 'Dr. Williams', email: 'williams@luct.ac.ls', faculty_id: 2 }
];