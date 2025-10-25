// services/api.js
import axios from "axios";

const API_BASE_URL = 'https://luct-reporting-backend-saus.onrender.com';

// Create Axios instance with better configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Enhanced request interceptor with error handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Response transformer to normalize array responses
const normalizeArrayResponse = (response) => {
  // If response.data is already an array, return it
  if (Array.isArray(response.data)) {
    return response.data;
  }
  
  // If response.data has a success property and contains an array
  if (response.data && response.data.success) {
    // Look for common array property names
    const arrayProperties = ['data', 'users', 'lecturers', 'ratings', 'courses', 'classes', 'reports', 'grades', 'faculties', 'students'];
    
    for (const prop of arrayProperties) {
      if (Array.isArray(response.data[prop])) {
        return response.data[prop];
      }
    }
    
    // If no array found but success is true, return empty array
    return [];
  }
  
  // If response.data is an object but not in expected format, return empty array
  console.warn('Unexpected response format:', response.data);
  return [];
};

// =======================
// Auth API
// =======================
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
};

// =======================
// Users API
// =======================
export const usersAPI = {
  getUsers: () => api.get("/users").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
};

// =======================
// Courses API
// =======================
export const coursesAPI = {
  getCourses: () => api.get("/courses").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
  addCourse: (data) => api.post("/courses", data),
};

// =======================
// Classes API
// =======================
export const classesAPI = {
  getClasses: () => api.get("/classes").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
  addClass: (data) => api.post("/classes", data),
  getAvailableClasses: () => api.get("/classes/available").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
  getClassStudents: (classId) => api.get(`/classes/${classId}/students`).then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
  getLecturerSchedule: (lecturerId) => api.get(`/classes/lecturer/${lecturerId}`).then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
};

// =======================
// Enrollments API
// =======================
export const enrollmentsAPI = {
  enroll: (class_id) => api.post("/enrollments", { class_id }),
};

// =======================
// Lecturers API - FIXED with proper response normalization
// =======================
export const lecturersAPI = {
  getLecturers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/users/lecturers?${queryString}` : "/users/lecturers";

    return api.get(url).then(response => {
      console.log('Lecturers raw response:', response.data);

      // Handle different response structures
      let lecturersArray;

      if (Array.isArray(response.data)) {
        lecturersArray = response.data;
      } else if (response.data && Array.isArray(response.data.lecturers)) {
        lecturersArray = response.data.lecturers;
      } else if (response.data && response.data.success && Array.isArray(response.data.lecturers)) {
        lecturersArray = response.data.lecturers;
      } else {
        console.warn('Unexpected lecturers response structure:', response.data);
        lecturersArray = [];
      }

      return {
        ...response,
        data: lecturersArray
      };
    });
  },
};

// =======================
// Reports API
// =======================
export const reportsAPI = {
  getReports: () => api.get("/reports").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
  addReport: (data) => api.post("/reports", data),
  addFeedback: (reportId, feedback) => api.post(`/reports/${reportId}/feedback`, { comments: feedback }),
  deleteReport: (reportId) => api.delete(`/reports/${reportId}`),
};

// =======================
// Ratings API - FIXED with proper response normalization
// =======================
export const ratingsAPI = {
  getRatings: () => api.get("/ratings").then(response => {
    console.log('Ratings raw response:', response.data);
    
    // Handle different response structures
    let ratingsArray;
    
    if (Array.isArray(response.data)) {
      ratingsArray = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      ratingsArray = response.data.data;
    } else if (response.data && Array.isArray(response.data.ratings)) {
      ratingsArray = response.data.ratings;
    } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
      ratingsArray = response.data.data;
    } else if (response.data && response.data.success && Array.isArray(response.data.ratings)) {
      ratingsArray = response.data.ratings;
    } else {
      console.warn('Unexpected ratings response structure:', response.data);
      ratingsArray = [];
    }
    
    return {
      ...response,
      data: ratingsArray
    };
  }),
  submitRating: (data) => api.post("/ratings", data),
};

// =======================
// Grades API
// =======================
export const gradesAPI = {
  getGrades: () => api.get("/grades").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
  submitGrade: (data) => api.post("/grades", data),
};

// =======================
// Analytics API
// =======================
export const analyticsAPI = {
  getDashboardStats: () => api.get("/analytics/dashboard"),
  getMonitoringDashboard: () => api.get("/monitoring/dashboard"), // Fixed path
};

// =======================
// Faculties API
// =======================
export const facultiesAPI = {
  getFaculties: () => api.get("/faculties").then(response => ({
    ...response,
    data: normalizeArrayResponse(response)
  })),
};

// Debug function to test API responses
export const debugAPI = {
  testAllEndpoints: async () => {
    const endpoints = [
      { name: 'Lecturers', call: () => lecturersAPI.getLecturers() },
      { name: 'Ratings', call: () => ratingsAPI.getRatings() },
      { name: 'Users', call: () => usersAPI.getUsers() },
      { name: 'Courses', call: () => coursesAPI.getCourses() },
      { name: 'Classes', call: () => classesAPI.getClasses() },
      { name: 'Faculties', call: () => facultiesAPI.getFaculties() },
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await endpoint.call();
        console.log(`${endpoint.name} API Response:`, {
          success: response.data.success,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          fullResponse: response.data
        });
      } catch (error) {
        console.error(`${endpoint.name} API Error:`, error.response?.data || error.message);
      }
    }
  }
};

export default api;