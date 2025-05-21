import React, { createContext, useState, useContext } from 'react';
import { channelAPI } from '../utils/api';
import { AuthContext } from './AuthContext';

export const ChannelContext = createContext();

export const ChannelProvider = ({ children }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [tags, setTags] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);
  
  const { } = useContext(AuthContext);

  // Search channels with advanced filtering
  const searchChannels = async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      // If params is a string, convert it to an object with query property
      const searchParams = typeof params === 'string' 
        ? { query: params } 
        : params;
      
      // Ensure we have a query parameter
      if (!searchParams.query) {
        setLoading(false);
        setError('Search query is required');
        throw new Error('Search query is required');
      }
      
      const { data } = await channelAPI.search(searchParams);
      
      if (data.success) {
        setChannels(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error searching channels'
      );
      throw error;
    }
  };

  // Get all channels (admin)
  const getAllChannels = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.getAll(params);
      
      if (data.success) {
        setChannels(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error fetching channels'
      );
      throw error;
    }
  };

  // Get channel by ID
  const getChannelById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.getById(id);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error fetching channel'
      );
      throw error;
    }
  };

  // Get channel statistics
  const getChannelStatistics = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.getStatistics(id);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error fetching channel statistics'
      );
      throw error;
    }
  };

  // Get system statistics
  const getSystemStatistics = async (days = 7) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.getSystemStatistics(days);
      
      if (data.success) {
        setStatistics(data.data);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error fetching system statistics'
      );
      throw error;
    }
  };

  // Load metadata (categories, providers, etc.)
  const loadMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        categoriesRes,
        providersRes,
        languagesRes,
        countriesRes,
        tagsRes
      ] = await Promise.all([
        channelAPI.getCategories(),
        channelAPI.getProviders(),
        channelAPI.getLanguages(),
        channelAPI.getCountries(),
        channelAPI.getTags()
      ]);
      
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.data);
      }
      
      if (providersRes.data.success) {
        setProviders(providersRes.data.data);
      }
      
      if (languagesRes.data.success) {
        setLanguages(languagesRes.data.data);
      }
      
      if (countriesRes.data.success) {
        setCountries(countriesRes.data.data);
      }
      
      if (tagsRes.data.success) {
        setTags(tagsRes.data.data);
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error loading metadata'
      );
      throw error;
    }
  };

  // Upload M3U file
  const uploadM3UFile = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.uploadFile(formData);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error uploading file'
      );
      throw error;
    }
  };

  // Upload M3U from URL
  const uploadM3UFromUrl = async (params) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.uploadFromUrl(params);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error uploading from URL'
      );
      throw error;
    }
  };

  // Upload M3U from credentials
  const uploadM3UFromCredentials = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.uploadFromCredentials(credentials);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error uploading from credentials'
      );
      throw error;
    }
  };

  // Check individual channel status
  const checkChannelStatus = async (id) => {
    try {
      const { data } = await channelAPI.checkStatus(id);
      
      if (data.success) {
        // Update channel in state
        setChannels(channels.map(channel => 
          channel._id === id 
            ? { ...channel, isLive: data.data.isLive, lastChecked: data.data.lastChecked } 
            : channel
        ));
      }
      
      return data;
    } catch (error) {
      console.error('Error checking channel status:', error);
      throw error;
    }
  };

  // Check all channels
  const checkAllChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.checkAll();
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error checking all channels'
      );
      throw error;
    }
  };

  // Check channels by category
  const checkChannelsByCategory = async (category) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.checkByCategory(category);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error checking channels by category'
      );
      throw error;
    }
  };

  // Check selected channels
  const checkSelectedChannels = async () => {
    try {
      if (selectedChannels.length === 0) {
        throw new Error('No channels selected');
      }
      
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.checkSelected(selectedChannels);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error checking selected channels'
      );
      throw error;
    }
  };

  // Cleanup inactive channels
  const cleanupInactiveChannels = async (days = 4) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.cleanup(days);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error cleaning up inactive channels'
      );
      throw error;
    }
  };

  // Update channel
  const updateChannel = async (id, channelData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.update(id, channelData);
      
      if (data.success) {
        // Update channel in state
        setChannels(channels.map(channel => 
          channel._id === id ? data.data : channel
        ));
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error updating channel'
      );
      throw error;
    }
  };

  // Delete channel
  const deleteChannel = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.delete(id);
      
      if (data.success) {
        // Remove channel from state
        setChannels(channels.filter(channel => channel._id !== id));
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error deleting channel'
      );
      throw error;
    }
  };

  // Bulk delete channels
  const bulkDeleteChannels = async (ids) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.bulkDelete(ids);
      
      if (data.success) {
        // Remove channels from state
        setChannels(channels.filter(channel => !ids.includes(channel._id)));
        setSelectedChannels([]);
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error deleting channels'
      );
      throw error;
    }
  };

  // Bulk update channels
  const bulkUpdateChannels = async (ids, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await channelAPI.bulkUpdate(ids, updates);
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error updating channels'
      );
      throw error;
    }
  };

  // Toggle channel selection
  const toggleChannelSelection = (id) => {
    if (selectedChannels.includes(id)) {
      setSelectedChannels(selectedChannels.filter(channelId => channelId !== id));
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  // Select all channels
  const selectAllChannels = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(channels.map(channel => channel._id));
    }
  };

  // Clear channel selection
  const clearChannelSelection = () => {
    setSelectedChannels([]);
  };

  return (
    <ChannelContext.Provider
      value={{
        channels,
        loading,
        error,
        categories,
        providers,
        languages,
        countries,
        tags,
        statistics,
        selectedChannels,
        searchChannels,
        getAllChannels,
        getChannelById,
        getChannelStatistics,
        getSystemStatistics,
        loadMetadata,
        uploadM3UFile,
        uploadM3UFromUrl,
        uploadM3UFromCredentials,
        checkChannelStatus,
        checkAllChannels,
        checkChannelsByCategory,
        checkSelectedChannels,
        cleanupInactiveChannels,
        updateChannel,
        deleteChannel,
        bulkDeleteChannels,
        bulkUpdateChannels,
        toggleChannelSelection,
        selectAllChannels,
        clearChannelSelection
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};
