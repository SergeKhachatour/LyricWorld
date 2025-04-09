import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import { CloudUpload, PlayArrow, Pause, VolumeUp, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import songService from '../services/songService';
import { getCountryCoordinates, generateRandomCoordinates } from '../utils/coordinates';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// List of supported countries
const COUNTRIES = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Spain', 'Italy', 'Brazil', 'India', 'China', 'Japan',
    'South Korea', 'Russia', 'Mexico', 'Argentina', 'South Africa',
    'Egypt', 'Nigeria', 'Kenya'
];

// List of supported languages
const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Swahili', 'Yoruba', 'Zulu'
];

// List of supported genres
const GENRES = [
    'hymn', 'worship', 'gospel', 'praise', 'other'
];

const Upload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    originalArtist: '',
    originalLanguage: '',
    genre: '',
    country: '',
    originalLyrics: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('/song-placeholder.jpg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [audioPreview, setAudioPreview] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElement, setAudioElement] = useState(null);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioElement, audioPreview]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.originalArtist.trim()) {
      errors.originalArtist = 'Original artist is required';
    }
    if (!formData.originalLanguage.trim()) {
      errors.originalLanguage = 'Original language is required';
    }
    if (!formData.originalLyrics.trim()) {
      errors.originalLyrics = 'Original lyrics are required';
    }
    if (!formData.country) {
      errors.country = 'Country is required';
    }
    if (!audioFile) {
      errors.audioFile = 'Audio file is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      
      // Create a preview URL for the audio
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL for the image
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  const togglePlayPause = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setUploadProgress(0);

    if (!validateForm()) {
        setLoading(false);
        return;
    }

    if (!audioFile) {
        setError('Please select an audio file');
        setLoading(false);
        return;
    }

    try {
        const formDataToSend = new FormData();
        formDataToSend.append('audio', audioFile);
        
        // Add image if selected
        if (imageFile) {
            formDataToSend.append('image', imageFile);
        }
        
        formDataToSend.append('title', formData.title);
        formDataToSend.append('artist', formData.originalArtist);
        formDataToSend.append('country', formData.country);
        formDataToSend.append('language', formData.originalLanguage);
        formDataToSend.append('genre', formData.genre);
        formDataToSend.append('originalLyrics', formData.originalLyrics);
        formDataToSend.append('lyrics', formData.originalLyrics);

        // Generate random coordinates for the selected country
        const coordinates = generateRandomCoordinates(formData.country);
        formDataToSend.append('coordinates', JSON.stringify(coordinates));

        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please log in to upload songs');
        }

        // Simulate upload progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + 10;
            });
        }, 500);

        const response = await fetch(`${API_BASE_URL}/songs`, {
            method: 'POST',
            body: formDataToSend,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload song');
        }

        const data = await response.json();
        setSuccess('Song uploaded successfully!');
        setTimeout(() => {
            navigate(`/songs/${data._id}`);
        }, 2000);
    } catch (err) {
        console.error('Upload error:', err);
        setError(err.message || 'Failed to upload song. Please try again.');
    } finally {
        setLoading(false);
        setUploadProgress(0);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upload Song
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
            error={!!formErrors.title}
            helperText={formErrors.title}
          />

          <TextField
            fullWidth
            label="Original Artist"
            name="originalArtist"
            value={formData.originalArtist}
            onChange={handleChange}
            required
            margin="normal"
            error={!!formErrors.originalArtist}
            helperText={formErrors.originalArtist}
          />

          <TextField
            fullWidth
            label="Original Language"
            name="originalLanguage"
            value={formData.originalLanguage}
            onChange={handleChange}
            required
            margin="normal"
            error={!!formErrors.originalLanguage}
            helperText={formErrors.originalLanguage}
          />

          <TextField
            fullWidth
            label="Original Lyrics"
            name="originalLyrics"
            value={formData.originalLyrics}
            onChange={handleChange}
            required
            multiline
            rows={4}
            margin="normal"
            error={!!formErrors.originalLyrics}
            helperText={formErrors.originalLyrics}
          />

          <FormControl fullWidth margin="normal" error={!!formErrors.country}>
            <InputLabel>Country</InputLabel>
            <Select
              name="country"
              value={formData.country}
              onChange={handleChange}
              label="Country"
              required
            >
              {COUNTRIES.map(country => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </Select>
            {formErrors.country && (
              <Typography color="error" variant="caption">
                {formErrors.country}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Genre</InputLabel>
            <Select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              label="Genre"
              required
            >
              {GENRES.map((g) => (
                <MenuItem key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Audio File
            </Typography>
            <input
              accept="audio/*"
              style={{ display: 'none' }}
              id="audio-file-upload"
              type="file"
              onChange={handleAudioChange}
            />
            <label htmlFor="audio-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
              >
                {audioFile ? audioFile.name : 'Upload Audio File'}
              </Button>
            </label>
            {audioFile && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={togglePlayPause}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {audioFile.name}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Song Image (Optional)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 150,
                  height: 150,
                  border: '1px dashed #ccc',
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f5f5f5'
                }}
              >
                <img 
                  src={imagePreview} 
                  alt="Song preview" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              </Box>
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-file-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                  >
                    Upload Image
                  </Button>
                </label>
                {imageFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {imageFile.name}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center">
                {uploadProgress}% uploaded
              </Typography>
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Uploading...' : 'Upload Song'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Upload; 