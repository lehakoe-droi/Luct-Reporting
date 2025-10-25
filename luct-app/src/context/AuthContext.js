import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  }, []);

  // Register function
  const register = useCallback(async (data) => {
    try {
      const response = await authAPI.register(data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Refresh profile (optional)
  const fetchProfile = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  const value = useMemo(() => ({
    user, loading, login, register, logout, fetchProfile
  }), [user, loading, login, register, logout, fetchProfile]); // Added all dependencies

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};