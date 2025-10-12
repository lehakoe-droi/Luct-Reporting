// services/api.js
import axios from "axios";

const API_BASE_URL = "https://https://luct-reporting-backend-476s.onrender.com/api";


// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// =======================
// Auth API
// =======================
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
};

// =======================
// Courses API
// =======================
export const coursesAPI = {
  getCourses: () => api.get("/courses"),
  addCourse: (data) => api.post("/courses", data),
};

// =======================
// Classes API
// =======================
export const classesAPI = {
  getClasses: () => api.get("/classes"),
  addClass: (data) => api.post("/classes", data),
  getAvailableClasses: () => api.get("/classes/available"),
};

// =======================
// Enrollments API
// =======================
export const enrollmentsAPI = {
  enroll: (class_id) => api.post("/enrollments", { class_id }),
};

// =======================
// Lecturers API
// =======================
export const lecturersAPI = {
  getLecturers: () => api.get("/users/lecturers"),
};

// =======================
// Reports API
// =======================
export const reportsAPI = {
  getReports: () => api.get("/reports"),
  addReport: (data) => api.post("/reports", data),
  addFeedback: (reportId, feedback) => api.post(`/reports/${reportId}/feedback`, { feedback }),
  deleteReport: (id) => api.delete(`/reports/${id}`),
};

// =======================
// Ratings API
// =======================
export const ratingsAPI = {
  getRatings: () => api.get("/ratings"),
  submitRating: (data) => api.post("/ratings", data),
};

// =======================
// Analytics API
// =======================
export const analyticsAPI = {
  getDashboardStats: () => api.get("/analytics/dashboard"),
};

// =======================
// Faculties API
// =======================
export const facultiesAPI = {
  getFaculties: () => api.get("/faculties"),
};

export default api;
