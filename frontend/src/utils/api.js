import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add request logging and token handling
api.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const { token } = JSON.parse(userInfo);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error('Error parsing user info:', error);
            }
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response logging and error handling
api.interceptors.response.use(
    (response) => {
        console.log('Received response from:', response.config.url);
        return response;
    },
    (error) => {
        console.error('Response error:', error);
        if (error.response) {
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);
        } else if (error.request) {
            console.error('No response received:', error.request);
        }
        
        // Handle session expiration
        if (error.response?.status === 401) {
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API endpoints
export const authAPI = {
    login: (email, password) => 
        api.post('/api/auth/login', { email, password }),
    
    register: (username, email, password) => 
        api.post('/api/auth/register', { username, email, password }),
    
    createAdmin: (username, email, password, secretKey) => 
        api.post('/api/auth/create-admin', { username, email, password, secretKey })
};

export const channelAPI = {
    // Search and filtering
    search: (params) => {
        // If params is a string, convert it to an object with query property
        const searchParams = typeof params === 'string' 
            ? { query: params } 
            : params;
        
        const queryParams = new URLSearchParams();
        
    for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    }
    return api.get(`/api/channels/search?${queryParams.toString()}`);
},

getLiveCount: () => 
    api.get('/api/channels/live-count'),
    
    getAll: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        }
        
        return api.get(`/api/channels?${queryParams.toString()}`);
    },
    
    getById: (id) => 
        api.get(`/api/channels/${id}`),
    
    getStatistics: (id) => 
        api.get(`/api/channels/${id}/statistics`),
    
    getSystemStatistics: (days = 7) => 
        api.get(`/api/channels/system/statistics?days=${days}`),
    
    // Metadata
    getCategories: () => 
        api.get('/api/channels/categories'),
    
    getProviders: () => 
        api.get('/api/channels/providers'),
    
    getLanguages: () => 
        api.get('/api/channels/languages'),
    
    getCountries: () => 
        api.get('/api/channels/countries'),
    
    getTags: () => 
        api.get('/api/channels/tags'),
    
    // Upload methods
    uploadFile: (formData) => {
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };
        return api.post('/api/channels/upload', formData, config);
    },
    
    uploadFromUrl: (params) => 
        api.post('/api/channels/upload-url', params),
    
uploadFromCredentials: (credentials) => 
    api.post('/api/channels/upload-credentials', credentials),

// Status check methods
checkStatus: (id) => 
    api.post(`/api/channels/${id}/check-status`),

// Use polling approach instead of SSE for checking all channels
startCheck: () => 
    api.post('/api/channels/start-check'),

getCheckProgress: (checkId) => 
    api.get(`/api/channels/check-progress/${checkId}`),

// Legacy method - keep for backward compatibility
checkAll: () => 
    api.post('/api/channels/check-all', {}, { 
        timeout: 300000 // 5 minutes timeout
    }),


checkByCategory: (category) => 
    api.post(`/api/channels/check-category/${category}`),

checkSelected: (ids) => 
    api.post('/api/channels/check-selected', { ids }),
    
    // Channel management
    update: (id, channelData) => 
        api.put(`/api/channels/${id}`, channelData),
    
    delete: (id) => 
        api.delete(`/api/channels/${id}`),
    
    bulkDelete: (ids) => 
        api.post('/api/channels/bulk-delete', { ids }),
    
    bulkUpdate: (ids, updates) => 
        api.post('/api/channels/bulk-update', { ids, updates }),
    
    cleanup: (days = 4) => 
        api.post(`/api/channels/cleanup?days=${days}`)
};

export const userAPI = {
    // Profile
    getProfile: () => 
        api.get('/api/users/profile'),
    
    updatePreferences: (preferences) => 
        api.put('/api/users/preferences', preferences),
    
    // Favorites
    getFavorites: () => 
        api.get('/api/users/favorites'),
    
    addFavorite: (channelId) => 
        api.post('/api/users/favorites', { channelId }),
    
    removeFavorite: (channelId) => 
        api.delete(`/api/users/favorites/${channelId}`),
    
    // Watch history
    getWatchHistory: () => 
        api.get('/api/users/watch-history'),
    
    addToWatchHistory: (channelId, duration = 0) => 
        api.post('/api/users/watch-history', { channelId, duration }),
    
    clearWatchHistory: () => 
        api.delete('/api/users/watch-history')
};

// Don't export the default api instance
// export default api;
