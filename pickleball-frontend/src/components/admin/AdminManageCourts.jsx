import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, MenuItem, FormControl, InputLabel, Select, InputAdornment,
  Checkbox, ListItemText, Divider, FormControlLabel, FormGroup
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
    status: 'ACTIVE',
    openingTime: '10:00',
    closingTime: '00:00',
    operatingDays: '',
    peakHourlyPrice: 0,
    offPeakHourlyPrice: 0,
    dailyPrice: 0,
    peakStartTime: '18:00',
    peakEndTime: '00:00'
  });
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, courtId: null });
  const [deleting, setDeleting] = useState(false);

  const daysOptions = [
    'Mon', 'Tue', 'Wed',
    'Thu', 'Fri', 'Sat', 'Sun'
  ];

  useEffect(() => {
    fetchCourts();
  }, []);


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
      // operatingDays 转为首字母大写数组，并去重
      const daysArr = Array.from(new Set(
        (court.operatingDays || '')
          .split(',')
          .map(day => {
            const map = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };
            return map[day.trim().toUpperCase()] || (day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());
          })
          .filter(Boolean)
      ));
      setDaysOfWeek(daysArr);
      setFormData({
        name: court.name,
        location: court.location,
        status: court.status,
        openingTime: court.openingTime || '10:00',
        closingTime: court.closingTime || '00:00',
        // operatingDays 再次去重
        operatingDays: Array.from(new Set(daysArr.map(d => d.toUpperCase()))).join(','),
        peakHourlyPrice: court.peakHourlyPrice || 0,
        offPeakHourlyPrice: court.offPeakHourlyPrice || 0,
        dailyPrice: court.dailyPrice || 0,
        peakStartTime: court.peakStartTime || '18:00',
        peakEndTime: court.peakEndTime || '00:00'
      });
    } else {
      setCurrentCourt(null);
      setDaysOfWeek([]);
      setFormData({
        name: '',
        location: '',
        status: 'ACTIVE',
        openingTime: '10:00',
        closingTime: '00:00',
        operatingDays: '',
        peakHourlyPrice: 0,
        offPeakHourlyPrice: 0,
        dailyPrice: 0,
        peakStartTime: '18:00',
        peakEndTime: '00:00'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCourt(null);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Court name is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!daysOfWeek.length) errors.operatingDays = 'Select at least one day';
    if (!formData.openingTime) errors.openingTime = 'Opening time required';
    if (!formData.closingTime) errors.closingTime = 'Closing time required';
    if (formData.openingTime && formData.closingTime && formData.openingTime >= formData.closingTime) errors.closingTime = 'Closing time must be after opening time';
    ['peakHourlyPrice', 'offPeakHourlyPrice', 'dailyPrice'].forEach(key => {
      if (formData[key] < 0) errors[key] = 'Price must be >= 0';
    });
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      // operatingDays 用 daysOfWeek 去重后的大写字符串
      const uniqueDays = Array.from(new Set(daysOfWeek));
      const payload = {
        ...formData,
        operatingDays: uniqueDays.map(d => d.toUpperCase()).join(','),
        peakHourlyPrice: parseFloat(formData.peakHourlyPrice) || 0,
        offPeakHourlyPrice: parseFloat(formData.offPeakHourlyPrice) || 0,
        dailyPrice: parseFloat(formData.dailyPrice) || 0,
      };
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

  const handleDeleteClick = (courtId) => {
    setDeleteDialog({ open: true, courtId });
  };
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    await handleDelete(deleteDialog.courtId);
    setDeleting(false);
    setDeleteDialog({ open: false, courtId: null });
  };
  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, courtId: null });
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
              <TableCell sx={{ fontWeight: 'bold' }}>Court Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Venue</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Operating Day(s)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Peak Hourly Price (RM)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Off-Peak Hourly Price (RM)</TableCell>
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
                      backgroundColor: court.status === 'ACTIVE' ? '#d5f5e3' :
                        court.status === 'MAINTENANCE' ? '#fff3cd' : '#f5d5d5',
                      color: court.status === 'ACTIVE' ? '#27ae60' :
                        court.status === 'MAINTENANCE' ? '#856404' : '#c0392b',
                      fontWeight: 'bold'
                    }}
                  />
                </TableCell>
                <TableCell>
                  {court.operatingDays
                    ? Array.from(new Set(
                        court.operatingDays.split(',')
                          .map(day => day.trim().toUpperCase())
                      ))
                        .map(day => {
                          const map = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };
                          return map[day] || (day.charAt(0) + day.slice(1).toLowerCase());
                        })
                        .join(', ')
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {court.peakHourlyPrice ? `${court.peakHourlyPrice}` : 'N/A'}
                </TableCell>
                <TableCell>
                  {court.offPeakHourlyPrice ? `${court.offPeakHourlyPrice}` : 'N/A'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(court)}>
                      <EditIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteClick(court.id)} disabled={deleting}>
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
            <Grid item xs={12}><Typography variant="caption" color="textSecondary">* Indicates Mandatory fields</Typography></Grid>
            <Divider sx={{ my: 2, width: '100%' }}>Basic Info</Divider>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Court Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location *"
                name="location"
                value={formData.location}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.location}
                helperText={formErrors.location}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.status}>
                <InputLabel>Status *</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status *"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="CLOSED">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Divider sx={{ my: 2, width: '100%' }}>Operating Days</Divider>
            <Grid item xs={12}>
              <FormControl component="fieldset" margin="normal" error={!!formErrors.operatingDays}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Operating Days *</Typography>
                <FormGroup row>
                  {daysOptions.map((day) => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={daysOfWeek.indexOf(day) > -1}
                          onChange={e => {
                            let newDays;
                            if (e.target.checked) {
                              // 只加不重复的 day
                              newDays = Array.from(new Set([...daysOfWeek, day]));
                            } else {
                              newDays = daysOfWeek.filter(d => d !== day);
                            }
                            setDaysOfWeek(newDays);
                            setFormData(prev => ({
                              ...prev,
                              operatingDays: newDays.map(d => d.toUpperCase()).join(',')
                            }));
                          }}
                          name={day}
                          color="primary"
                        />
                      }
                      label={day}
                    />
                  ))}
                </FormGroup>
                {formErrors.operatingDays && <Typography color="error" variant="caption">{formErrors.operatingDays}</Typography>}
              </FormControl>
            </Grid>
            <Divider sx={{ my: 2, width: '100%' }}>Operating Hours</Divider>
            <Grid item xs={12} md={6}>
              <Tooltip title="12小时格式 (HH:mm)">
                <TextField
                  fullWidth
                  label="Opening Time *"
                  name="openingTime"
                  type="time"
                  value={formData.openingTime}
                  onChange={handleChange}
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.openingTime}
                  helperText={formErrors.openingTime}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} md={6}>
              <Tooltip title="12小时格式 (HH:mm)">
                <TextField
                  fullWidth
                  label="Closing Time *"
                  name="closingTime"
                  type="time"
                  value={formData.closingTime}
                  onChange={handleChange}
                  margin="normal"
                  required
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.closingTime}
                  helperText={formErrors.closingTime}
                />
              </Tooltip>
            </Grid>
            <Divider sx={{ my: 2, width: '100%' }}>Peak Hours Configuration</Divider>
            <Grid item xs={12} md={6}>
              <Tooltip title="24小时格式 (HH:mm)">
                <TextField
                  fullWidth
                  label="Peak Start Time"
                  name="peakStartTime"
                  type="time"
                  value={formData.peakStartTime}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} md={6}>
              <Tooltip title="24小时格式 (HH:mm)">
                <TextField
                  fullWidth
                  label="Peak End Time"
                  name="peakEndTime"
                  type="time"
                  value={formData.peakEndTime}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Tooltip>
            </Grid>
            <Divider sx={{ my: 2, width: '100%' }}>Pricing (RM)</Divider>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Peak Hourly Price"
                name="peakHourlyPrice"
                value={formData.peakHourlyPrice}
                onChange={handleChange}
                margin="normal"
                placeholder="如 50.00"
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>
                }}
                error={!!formErrors.peakHourlyPrice}
                helperText={formErrors.peakHourlyPrice}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Off-Peak Hourly Price"
                name="offPeakHourlyPrice"
                value={formData.offPeakHourlyPrice}
                onChange={handleChange}
                margin="normal"
                placeholder="如 30.00"
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>
                }}
                error={!!formErrors.offPeakHourlyPrice}
                helperText={formErrors.offPeakHourlyPrice}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Daily Price"
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleChange}
                margin="normal"
                placeholder="如 200.00"
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>
                }}
                error={!!formErrors.dailyPrice}
                helperText={formErrors.dailyPrice}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Court</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this court? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
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