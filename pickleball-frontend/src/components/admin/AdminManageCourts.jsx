import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, Snackbar, Alert,
  CircularProgress, Grid, Chip, MenuItem, FormControl, InputLabel, Select, 
  InputAdornment, Checkbox, Divider, TablePagination, TableSortLabel,
  FormGroup, FormControlLabel, TableFooter
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon
} from '@mui/icons-material';
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
  const [selectedCourts, setSelectedCourts] = useState([]);
  
  // 分页和排序状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCourts, setTotalCourts] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  
  // 过滤状态
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. 新增 useState
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: '', address: '' });

  const daysOptions = [
    'Mon', 'Tue', 'Wed',
    'Thu', 'Fri', 'Sat', 'Sun'
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  // 2. 获取场馆列表
  useEffect(() => {
    const token = UserService.getAdminToken();
    axios.get('/api/admin/venues', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setVenues(res.data));
  }, []);

  // 3. 新建场馆提交
  const handleAddVenue = async () => {
    const token = UserService.getAdminToken();
    const res = await axios.post('/api/admin/venues', newVenue, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const newVenueObj = { id: res.data, ...newVenue };
    setVenues([...venues, newVenueObj]);
    setSelectedVenueId(res.data);
    setShowAddVenue(false);
    setNewVenue({ name: '', address: '' });
  };

  // 4. 新建场地表单
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field changes
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayChange = (e) => {
    const selected = e.target.value;
    setDaysOfWeek(selected);
    setFormData(prev => ({
      ...prev,
      operatingDays: selected.join(',')
    }));
    
    if (formErrors.operatingDays) {
      setFormErrors(prev => ({ ...prev, operatingDays: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Court name is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!daysOfWeek.length) errors.operatingDays = 'Select at least one day';
    if (!formData.openingTime) errors.openingTime = 'Opening time required';
    if (!formData.closingTime) errors.closingTime = 'Closing time required';
    if (formData.openingTime && formData.closingTime && formData.openingTime >= formData.closingTime) {
      errors.closingTime = 'Closing time must be after opening time';
    }
    ['peakHourlyPrice', 'offPeakHourlyPrice', 'dailyPrice'].forEach(key => {
      if (formData[key] < 0) errors[key] = 'Price must be >= 0';
    });
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (!selectedVenueId) errors.venueId = '请选择场馆';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      const uniqueDays = Array.from(new Set(daysOfWeek));
      const payload = {
        ...formData,
        venueId: selectedVenueId,
        operatingDays: uniqueDays.map(d => d.toUpperCase()).join(','),
        peakHourlyPrice: parseFloat(formData.peakHourlyPrice) || 0,
        offPeakHourlyPrice: parseFloat(formData.offPeakHourlyPrice) || 0,
        dailyPrice: parseFloat(formData.dailyPrice) || 0,
      };
      
      if (payload.operatingDays === '') payload.operatingDays = null;

      if (currentCourt) {
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
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
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
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
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

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = courts.map((c) => c.id);
      setSelectedCourts(newSelecteds);
      return;
    }
    setSelectedCourts([]);
  };

  const handleSelectCourt = (event, id) => {
    const selectedIndex = selectedCourts.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedCourts, id];
    } else {
      newSelected = selectedCourts.filter((c) => c !== id);
    }

    setSelectedCourts(newSelected);
  };

  const handleBatchDelete = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      await axios.post(
        'http://localhost:8081/api/admin/courts/batch-delete',
        { courtIds: selectedCourts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSnackbar({
        open: true,
        message: `${selectedCourts.length} courts deleted successfully!`,
        severity: 'success'
      });
      
      setSelectedCourts([]);
      fetchCourts();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete courts. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (id) => selectedCourts.indexOf(id) !== -1;

  // Missing functions
  const fetchCourts = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();
      const response = await axios.get(
        'http://localhost:8081/api/admin/courts',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourts(response.data);
      setTotalCourts(response.data.length);
    } catch (err) {
      setError('Failed to fetch courts');
      setSnackbar({
        open: true,
        message: 'Failed to fetch courts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (court = null) => {
    if (court) {
      setCurrentCourt(court);
      setFormData({
        name: court.name || '',
        location: court.location || '',
        status: court.status || 'ACTIVE',
        openingTime: court.openingTime || '10:00',
        closingTime: court.closingTime || '00:00',
        operatingDays: court.operatingDays || '',
        peakHourlyPrice: court.peakHourlyPrice || 0,
        offPeakHourlyPrice: court.offPeakHourlyPrice || 0,
        dailyPrice: court.dailyPrice || 0,
        peakStartTime: court.peakStartTime || '18:00',
        peakEndTime: court.peakEndTime || '00:00'
      });
      setSelectedVenueId(court.venue?.id || '');
      setDaysOfWeek(court.operatingDays ? court.operatingDays.split(',').map(d => d.trim()) : []);
    } else {
      setCurrentCourt(null);
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
      setSelectedVenueId('');
      setDaysOfWeek([]);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCourt(null);
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
    setDaysOfWeek([]);
    setFormErrors({});
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Load courts on component mount
  useEffect(() => {
    fetchCourts();
  }, []);

  // 打开新建场馆弹窗时自动带入当前venue name
  const handleVenueSelect = (e) => {
    if (e.target.value === 'add_new_venue') {
      // 自动带入当前下拉已选venue的名字
      const selectedVenue = venues.find(v => v.id === selectedVenueId);
      setNewVenue({
        name: selectedVenue ? selectedVenue.name : '',
        address: ''
      });
      setShowAddVenue(true);
    } else {
      setSelectedVenueId(e.target.value);
      if (formErrors.venueId) setFormErrors(prev => ({ ...prev, venueId: '' }));
    }
  };

  if (loading && !courts.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} sx={{ color: '#8e44ad' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#5d3587' }}>
            Manage Courts
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            Manage and organize all sports courts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
        >
          Add New Court
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <TextField
            sx={{ minWidth: 220 }}
            variant="outlined"
            placeholder="Search courts..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              displayEmpty
              renderValue={(selected) => selected || "All Statuses"}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCourts}
            sx={{ 
              borderColor: '#8e44ad', 
              color: '#8e44ad', 
              minWidth: 120,
              '&:hover': { borderColor: '#732d91' }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Batch Operation Bar */}
      {selectedCourts.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1">
              {selectedCourts.length} court(s) selected
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBatchDelete}
            >
              Delete Selected
            </Button>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedCourts.length > 0 && selectedCourts.length < courts.length}
                  checked={courts.length > 0 && selectedCourts.length === courts.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Court Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Venue</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Operating Day(s)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Peak Hourly Price (RM)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Off-Peak Hourly Price (RM)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courts.length > 0 ? courts.map((court) => {
              const isItemSelected = isSelected(court.id);
              return (
                <TableRow key={court.id} hover selected={isItemSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      onChange={(event) => handleSelectCourt(event, court.id)}
                    />
                  </TableCell>
                  <TableCell>{court.name}</TableCell>
                  <TableCell>{court.venue ? `${court.venue.name} (${court.venue.location})` : 'N/A'}</TableCell>
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
                            const map = { 
                              MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', 
                              THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', 
                              SUNDAY: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', 
                              THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' 
                            };
                            return map[day] || (day.charAt(0) + day.slice(1).toLowerCase());
                          })
                          .join(', ')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {court.peakHourlyPrice ? `RM ${court.peakHourlyPrice.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {court.offPeakHourlyPrice ? `RM ${court.offPeakHourlyPrice.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                    </Box>
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No courts found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={8}
                count={totalCourts}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
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
              <FormControl fullWidth margin="normal" required error={!selectedVenueId && !!formErrors.venueId}>
                <InputLabel>Venue *</InputLabel>
                <Select
                  value={selectedVenueId}
                  onChange={handleVenueSelect}
                  label="Venue *"
                  displayEmpty
                >
                  <MenuItem value="" disabled>请选择场馆</MenuItem>
                  {venues.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.name} ({v.address || v.location})</MenuItem>
                  ))}
                  <MenuItem value="add_new_venue" style={{ color: '#8e44ad', fontWeight: 'bold' }}>+ 新建场馆</MenuItem>
                </Select>
                {formErrors.venueId && <Typography color="error" variant="caption">{formErrors.venueId}</Typography>}
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
              <Tooltip title="12-hour format (HH:mm)">
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
              <Tooltip title="12-hour format (HH:mm)">
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
              <Tooltip title="24-hour format (HH:mm)">
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
              <Tooltip title="24-hour format (HH:mm)">
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
                placeholder="e.g. 50.00"
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
                placeholder="e.g. 30.00"
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
                placeholder="e.g. 200.00"
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

      {/* 新建场馆弹窗 */}
      <Dialog open={showAddVenue} onClose={() => setShowAddVenue(false)}>
        <DialogTitle>Add New Venue</DialogTitle>
        <DialogContent>
          <TextField label="Venue Name" value={newVenue.name} onChange={e => setNewVenue({ ...newVenue, name: e.target.value })} fullWidth />
          <TextField label="Address" value={newVenue.address} onChange={e => setNewVenue({ ...newVenue, address: e.target.value })} fullWidth sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddVenue(false)}>Cancel</Button>
          <Button onClick={handleAddVenue} variant="contained">Add</Button>
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