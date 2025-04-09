import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, queueResponse] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getModerationQueue(),
      ]);
      setStats(statsResponse.data);
      setModerationQueue(queueResponse.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (id, action) => {
    try {
      if (action === 'approve') {
        await adminService.approveContent(id);
      } else {
        await adminService.rejectContent(id);
      }
      // Refresh the moderation queue
      const response = await adminService.getModerationQueue();
      setModerationQueue(response.data);
    } catch (err) {
      setError(`Failed to ${action} content`);
      console.error('Moderation error:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Songs
                </Typography>
                <Typography variant="h4">
                  {stats?.totalSongs || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Moderation
                </Typography>
                <Typography variant="h4">
                  {stats?.pendingModeration || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {stats?.totalUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4">
                  {stats?.activeUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Moderation Queue */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Moderation Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Submitted By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {moderationQueue.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.artist}</TableCell>
                    <TableCell>{item.language}</TableCell>
                    <TableCell>{item.submittedBy.name}</TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleModeration(item._id, 'approve')}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleModeration(item._id, 'reject')}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {moderationQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No items pending moderation
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard; 