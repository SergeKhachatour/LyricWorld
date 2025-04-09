import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const songService = {
    getAllSongs: async () => {
        const response = await fetch(`${API_BASE_URL}/songs`);
        if (!response.ok) {
            throw new Error('Failed to fetch songs');
        }
        return response.json();
    },

    getSongById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/songs/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch song');
        }
        return response.json();
    },

    getUserSongs: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/songs/user`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user songs:', error.response?.data || error.message);
            throw error;
        }
    },

    createSong: async (formData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/songs`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to create song');
        }
        return response.json();
    },

    updateSong: async (id, songData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(songData)
        });
        if (!response.ok) {
            throw new Error('Failed to update song');
        }
        return response.json();
    },

    deleteSong: async (id) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to delete song');
        }
        return response.json();
    },

    getSongsByCountry: async (country) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/songs/country/${country}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching songs by country:', error.response?.data || error.message);
            throw error;
        }
    },

    getAudioUrl: (audioUrl) => {
        if (!audioUrl) {
            console.error('No audio URL provided');
            return null;
        }
        
        // If the URL is already absolute, return it
        if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
            return audioUrl;
        }

        // Replace all backslashes with forward slashes and remove any leading slash
        const cleanPath = audioUrl.replace(/\\/g, '/').replace(/^\/+/, '');
        
        // Get the base URL without /api
        const baseUrl = API_BASE_URL.replace('/api', '');
        
        // Construct the full URL
        const fullUrl = `${baseUrl}/${cleanPath}`;
        console.log('Constructed audio URL:', fullUrl);
        return fullUrl;
    },

    getImageUrl: (imageUrl) => {
        console.log('getImageUrl called with:', imageUrl);
        
        if (!imageUrl) {
            console.error('No image URL provided');
            return '/uploads/song-placeholder.jpg';
        }
        
        // If the URL is already absolute, return it
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            console.log('URL is already absolute, returning:', imageUrl);
            return imageUrl;
        }

        // Get the base URL without /api
        const baseUrl = API_BASE_URL.replace('/api', '');
        console.log('Base URL:', baseUrl);
        
        // If the imageUrl already starts with /uploads, just combine with baseUrl
        if (imageUrl.startsWith('/uploads/')) {
            const fullUrl = `${baseUrl}${imageUrl}`;
            console.log('URL starts with /uploads/, returning:', fullUrl);
            return fullUrl;
        }

        // Otherwise, ensure proper path construction
        const cleanPath = imageUrl.replace(/\\/g, '/').replace(/^\/+/, '');
        const fullUrl = `${baseUrl}/${cleanPath}`;
        console.log('Constructed image URL:', fullUrl);
        return fullUrl;
    }
};

export default songService; 