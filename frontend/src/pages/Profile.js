import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, CloudUpload } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userService, songService } from '../services/api';
import ChurchIcon from '@mui/icons-material/Church';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
  });
  const [userSongs, setUserSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        bio: user.bio || '',
      });
      fetchUserSongs();
    }
  }, [user]);

  const fetchUserSongs = async () => {
    try {
      const response = await songService.getUserSongs(user.id);
      setUserSongs(response.data);
    } catch (err) {
      setError('Failed to fetch your songs');
      console.error('Error fetching user songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await userService.updateProfile(formData);
      setSuccess('Avatar updated successfully!');
    } catch (err) {
      setError('Failed to update avatar');
    }
  };

  const handleDeleteSong = async (songId) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try {
        await songService.deleteSong(songId);
        setUserSongs(userSongs.filter(song => song._id !== songId));
      } catch (err) {
        setError('Failed to delete song');
        console.error('Error deleting song:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: '#1976d2',
                    mb: 2
                  }}
                >
                  <ChurchIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.username}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {user.email}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  sx={{ mt: 2 }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Country
                  </Typography>
                  <Typography variant="body1">{user.country}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Preferred Language
                  </Typography>
                  <Typography variant="body1">{user.language}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last Login
                  </Typography>
                  <Typography variant="body1">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Songs
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {userSongs.length === 0 ? (
            <Typography color="textSecondary">
              You haven't uploaded any songs yet.
            </Typography>
          ) : (
            <List>
              {userSongs.map((song) => (
                <ListItem key={song._id} divider>
                  <ListItemText
                    primary={song.title}
                    secondary={`Original Artist: ${song.originalArtist}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteSong(song._id)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile; 