import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => api.get('/auth/me'),
};

// Song services
export const songService = {
  getAllSongs: () => api.get('/songs'),
  getSongById: (id) => api.get(`/songs/${id}`),
  createSong: (songData) => api.post('/songs', songData),
  updateSong: (id, songData) => api.put(`/songs/${id}`, songData),
  deleteSong: (id) => api.delete(`/songs/${id}`),
  uploadAudio: (id, audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.post(`/songs/${id}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadLyrics: (id, lyricsFile) => {
    const formData = new FormData();
    formData.append('lyrics', lyricsFile);
    return api.post(`/songs/${id}/lyrics`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// User services
export const userService = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
};

// Admin services
export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getModerationQueue: () => api.get('/admin/moderation'),
  approveContent: (id) => api.post(`/admin/moderation/${id}/approve`),
  rejectContent: (id) => api.post(`/admin/moderation/${id}/reject`),
};

export default api; 