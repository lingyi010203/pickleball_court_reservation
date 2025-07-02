import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';

const AdminManageCourts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCourt, setCurrentCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'Active',
    openingTime: '09:00',
    closingTime: '17:00',
    operatingDays: '',
    peakHourlyPrice: 0,
    offPeakHourlyPrice: 0,
    dailyPrice: 0,
    peakStartTime: '17:00',
    peakEndTime: '20:00'
  });
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  
  const daysOptions = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 
    'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    if (formData.operatingDays) {
      setDaysOfWeek(formData.operatingDays.split(','));
    } else {
      setDaysOfWeek([]);
    }
  }, [formData.operatingDays]);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      const response = await axios.get('http://localhost:8081/api/admin/courts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourts(response.data);
    } catch (err) {
      setError('Failed to fetch courts. Please try again.');
      console.error('Error fetching courts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (court = null) => {
    if (court) {
      setCurrentCourt(court);
      setFormData({
        name: court.name,
        location: court.location,
        status: court.status,
        openingTime: court.openingTime || '09:00',
        closingTime: court.closingTime || '17:00',
        operatingDays: court.operatingDays || '',
        peakHourlyPrice: court.peakHourlyPrice || 0,
        offPeakHourlyPrice: court.offPeakHourlyPrice || 0,
        dailyPrice: court.dailyPrice || 0,
        peakStartTime: court.peakStartTime || '17:00',
        peakEndTime: court.peakEndTime || '20:00'
      });
    } else {
      setCurrentCourt(null);
      setFormData({
        name: '',
        location: '',
        status: 'Active',
        openingTime: '09:00',
        closingTime: '17:00',
        operatingDays: '',
        peakHourlyPrice: 0,
        offPeakHourlyPrice: 0,
        dailyPrice: 0,
        peakStartTime: '17:00',
        peakEndTime: '20:00'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCourt(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peakHourlyPrice' || name === 'offPeakHourlyPrice' || name === 'dailyPrice' 
        ? Number(value) 
        : value
    }));
  };

  const handleDayChange = (e) => {
    const selected = e.target.value;
    setDaysOfWeek(selected);
    setFormData(prev => ({
      ...prev,
      operatingDays: selected.join(',')
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      const payload = { ...formData };
      
      // Convert empty strings to null for backend
      if (payload.operatingDays === '') payload.operatingDays = null;
      
      if (currentCourt) {
        // Update existing court
        await axios.put(
          `http://localhost:8081/api/admin/courts/${currentCourt.id}`, 
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSnackbar({
          open: true,
          message: 'Court updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new court
        await axios.post(
          'http://localhost:8081/api/admin/courts', 
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSnackbar({
          open: true,
          message: 'Court created successfully!',
          severity: 'success'
        });
      }
      
      fetchCourts();
      handleCloseDialog();
    } catch (err) {
      let errorMsg = 'Operation failed';
      
      if (err.response) {
        if (err.response.data) {
          errorMsg = err.response.data.message || JSON.stringify(err.response.data);
        } else {
          errorMsg = `Server error: ${err.response.status}`;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courtId) => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      await axios.delete(
        `http://localhost:8081/api/admin/courts/${courtId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({
        open: true,
        message: 'Court deleted successfully!',
        severity: 'success'
      });
      fetchCourts();
    } catch (err) {
      let errorMsg = 'Deletion failed';
      
      if (err.response) {
        if (err.response.data) {
          errorMsg = err.response.data.message || JSON.stringify(err.response.data);
        } else {
          errorMsg = `Server error: ${err.response.status}`;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setSnackbar({
        open: true,
        message: `Error: ${errorMsg}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && !courts.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#8e44ad' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
          onClick={fetchCourts}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#5d3587' }}>
          Manage Courts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
        >
          Add New Court
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Opening Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Closing Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Operating Days</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Peak Pricing</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courts.map((court) => (
              <TableRow key={court.id}>
                <TableCell>{court.name}</TableCell>
                <TableCell>{court.location}</TableCell>
                <TableCell>
                  <Chip 
                    label={court.status} 
                    sx={{ 
                      backgroundColor: court.status === 'Active' ? '#d5f5e3' : 
                                      court.status === 'Maintenance' ? '#fff3cd' : '#f5d5d5',
                      color: court.status === 'Active' ? '#27ae60' : 
                            court.status === 'Maintenance' ? '#856404' : '#c0392b',
                      fontWeight: 'bold'
                    }} 
                  />
                </TableCell>
                <TableCell>{court.openingTime || 'N/A'}</TableCell>
                <TableCell>{court.closingTime || 'N/A'}</TableCell>
                <TableCell>
                  {court.operatingDays ? 
                    court.operatingDays.split(',').map(day => day.substring(0, 3)).join(', ') : 
                    'N/A'}
                </TableCell>
                <TableCell>
                  {court.peakHourlyPrice ? `$${court.peakHourlyPrice}` : 'N/A'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(court)}>
                      <EditIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(court.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Court Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {currentCourt ? 'Edit Court' : 'Add New Court'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Court Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Operating Days</InputLabel>
                <Select
                  multiple
                  value={daysOfWeek}
                  onChange={handleDayChange}
                  label="Operating Days"
                  renderValue={(selected) => selected.join(', ')}
                >
                  {daysOptions.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Opening Time (HH:mm)"
                name="openingTime"
                value={formData.openingTime}
                onChange={handleChange}
                margin="normal"
                placeholder="09:00"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Closing Time (HH:mm)"
                name="closingTime"
                value={formData.closingTime}
                onChange={handleChange}
                margin="normal"
                placeholder="17:00"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Peak Start Time (HH:mm)"
                name="peakStartTime"
                value={formData.peakStartTime}
                onChange={handleChange}
                margin="normal"
                placeholder="17:00"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Peak End Time (HH:mm)"
                name="peakEndTime"
                value={formData.peakEndTime}
                onChange={handleChange}
                margin="normal"
                placeholder="20:00"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Peak Hourly Price ($)"
                name="peakHourlyPrice"
                value={formData.peakHourlyPrice}
                onChange={handleChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Off-Peak Hourly Price ($)"
                name="offPeakHourlyPrice"
                value={formData.offPeakHourlyPrice}
                onChange={handleChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Daily Price ($)"
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
            sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
          >
            {loading ? <CircularProgress size={24} /> : currentCourt ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminManageCourts;