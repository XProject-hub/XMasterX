import React, { createContext, useState, useContext, useEffect } from 'react';
import { userAPI } from '../utils/api';
import { AuthContext } from './AuthContext';

export const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [preferences, setPreferences] = useState({
    defaultCategory: 'All',
    defaultLanguage: 'All',
    showOnlyLive: false,
    resultsPerPage: 10,
    theme: 'system'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useContext(AuthContext);

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setUserProfile(null);
      setFavorites([]);
      setWatchHistory([]);
      setPreferences({
        defaultCategory: 'All',
        defaultLanguage: 'All',
        showOnlyLive: false,
        resultsPerPage: 10,
        theme: 'system'
      });
    }
  }, [user]);

  // Load user profile
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await userAPI.getProfile();
      
      if (data.success) {
        setUserProfile(data.data);
        setFavorites(data.data.favorites || []);
        setWatchHistory(data.data.watchHistory || []);
        setPreferences(data.data.preferences || {
          defaultCategory: 'All',
          defaultLanguage: 'All',
          showOnlyLive: false,
          resultsPerPage: 10,
          theme: 'system'
        });
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error loading user profile'
      );
      console.error('Error loading user profile:', error);
    }
  };

  // Update preferences
  const updatePreferences = async (newPreferences) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await userAPI.updatePreferences(newPreferences);
      
      if (data.success) {
        setPreferences(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error updating preferences'
      );
      throw error;
    }
  };

  // Add to favorites
  const addToFavorites = async (channelId) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await userAPI.addFavorite(channelId);
      
      if (data.success) {
        await loadUserProfile(); // Reload profile to get updated favorites
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error adding to favorites'
      );
      throw error;
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (channelId) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await userAPI.removeFavorite(channelId);
      
      if (data.success) {
        setFavorites(favorites.filter(fav => fav.channel._id !== channelId));
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error removing from favorites'
      );
      throw error;
    }
  };

  // Check if channel is in favorites
  const isInFavorites = (channelId) => {
    return favorites.some(fav => fav.channel._id === channelId);
  };

  // Add to watch history
  const addToWatchHistory = async (channelId, duration = 0) => {
    if (!user) return;
    
    try {
      await userAPI.addToWatchHistory(channelId, duration);
      
      // No need to reload the entire profile, just update the local state
      const now = new Date();
      
      // Check if already in recent history
      const existingIndex = watchHistory.findIndex(
        item => item.channel._id === channelId
      );
      
      if (existingIndex !== -1) {
        // Update existing entry
        const updatedHistory = [...watchHistory];
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          watchedAt: now,
          duration: (updatedHistory[existingIndex].duration || 0) + duration
        };
        setWatchHistory(updatedHistory);
      } else {
        // Add new entry (we don't have the channel object, so we'll reload the profile)
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  };

  // Clear watch history
  const clearWatchHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await userAPI.clearWatchHistory();
      
      if (data.success) {
        setWatchHistory([]);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error clearing watch history'
      );
      throw error;
    }
  };

  // Apply theme from preferences
  useEffect(() => {
    if (preferences) {
      const { theme } = preferences;
      
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-bs-theme', 'light');
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
      }
    }
  }, [preferences]);

  return (
    <UserProfileContext.Provider
      value={{
        userProfile,
        favorites,
        watchHistory,
        preferences,
        loading,
        error,
        loadUserProfile,
        updatePreferences,
        addToFavorites,
        removeFromFavorites,
        isInFavorites,
        addToWatchHistory,
        clearWatchHistory
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};
