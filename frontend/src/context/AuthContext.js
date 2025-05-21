import React, { createContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = () => {
      try {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await authAPI.login(email, password);
      
      if (data.success) {
        localStorage.setItem('userInfo', JSON.stringify(data.data));
        setUser(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Login failed'
      );
      throw error;
    }
  };
  
  // Register user
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await authAPI.register(username, email, password);
      
      if (data.success) {
        localStorage.setItem('userInfo', JSON.stringify(data.data));
        setUser(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Registration failed'
      );
      throw error;
    }
  };
  
  // Create admin user
  const createAdmin = async (username, email, password, secretKey) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await authAPI.createAdmin(username, email, password, secretKey);
      
      if (data.success) {
        localStorage.setItem('userInfo', JSON.stringify(data.data));
        setUser(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Admin creation failed'
      );
      throw error;
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };
  
  // Update user profile
  const updateProfile = async (preferences) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await userAPI.updatePreferences(preferences);
      
      if (data.success && user) {
        const updatedUser = { ...user, preferences: data.data };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error updating profile'
      );
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        createAdmin,
        logout,
        updateProfile,
        isAuthenticated: !!user,
       isAdmin: user && user.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
