import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
} from '@mui/material';
import { AccountCircle, MusicNote, Map, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ChurchIcon from '@mui/icons-material/Church';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <AppBar position="static" sx={{ background: '#1976d2' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          component={RouterLink}
          to="/"
          sx={{ mr: 2 }}
        >
          <ChurchIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LyricWorld
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/upload"
                sx={{ mr: 2 }}
              >
                Upload
              </Button>
              <IconButton
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar
                  sx={{ width: 32, height: 32 }}
                  alt={user.username}
                  src={user.avatar}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                {user.role === 'admin' && (
                  <MenuItem onClick={() => {
                    handleClose();
                    navigate('/admin');
                  }}>
                    Admin Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                sx={{ mr: 2 }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/register"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 