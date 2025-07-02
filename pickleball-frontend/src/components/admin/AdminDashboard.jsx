// AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Paper, Typography, Avatar,
  Button, List, ListItem, ListItemIcon,
  ListItemText, Divider, Chip, Select,
  MenuItem, InputLabel, FormControl,
  Checkbox, FormControlLabel, TextField,
  IconButton, Backdrop, CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BarChart as ReportsIcon,
  People as UsersIcon,
  Event as BookingsIcon,
  SportsTennis as CourtsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  ArrowBack as BackIcon,
  CardMembership as TierIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserService from '../../service/UserService';
import AdminManageUsers from './AdminManageUsers';
import AdminManageCourts from './AdminManageCourts';
import AdminManageTiers from './AdminManageTiers';
import axios from 'axios';
import { Chart } from 'chart.js/auto';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const bookingChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const bookingChartInstance = useRef(null);
  const engagementChartInstance = useRef(null);

  const [adminUsername, setAdminUsername] = useState(UserService.getAdminUsername() || 'Admin');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalUsersChange: 0,
    totalBookings: 0,
    totalBookingsChange: 0,
    totalRevenue: 0,
    totalRevenueChange: 0,
    averageRating: 0,
    averageRatingChange: 0
  });

  const [reportType, setReportType] = useState('bookings');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [filters, setFilters] = useState({
    includeUsers: true,
    includeBookings: true,
    includeRevenue: true
  });

  const [bookingTimeRange, setBookingTimeRange] = useState('month');
  const [engagementTimeRange, setEngagementTimeRange] = useState('month');

  useEffect(() => {
    const username = UserService.getAdminUsername() || 'Admin';
    setAdminUsername(username);
    fetchDashboardData();
    return () => destroyCharts();
  }, []);

  useEffect(() => {
    initCharts();
  }, [bookingTimeRange, engagementTimeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = UserService.getAdminToken();

      // Fetch user statistics
      const usersResponse = await axios.get('http://localhost:8081/api/admin/dashboard/users/count', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch booking statistics
      const bookingsResponse = await axios.get('http://localhost:8081/api/admin/dashboard/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Calculate changes (mock data for demo)
      const totalUsers = usersResponse.data;
      const totalBookings = bookingsResponse.data.length;
      const totalRevenue = bookingsResponse.data.reduce((sum, booking) => sum + booking.totalAmount, 0);

      setDashboardData({
        totalUsers,
        totalUsersChange: 12, // Mock percentage change
        totalBookings,
        totalBookingsChange: 8, // Mock percentage change
        totalRevenue,
        totalRevenueChange: 15, // Mock percentage change
        averageRating: 4.7, // Mock data
        averageRatingChange: 0.2 // Mock data
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const destroyCharts = () => {
    if (bookingChartInstance.current) {
      bookingChartInstance.current.destroy();
      bookingChartInstance.current = null;
    }
    if (engagementChartInstance.current) {
      engagementChartInstance.current.destroy();
      engagementChartInstance.current = null;
    }
  };

  const getBookingLabels = (timeRange) => {
    switch (timeRange) {
      case 'week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'month':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      case 'year':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      default:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }
  };

  const getBookingData = (timeRange) => {
    switch (timeRange) {
      case 'week':
        return [40, 55, 70, 65, 85, 60, 75];
      case 'month':
        return [65, 59, 80, 81, 56, 55];
      case 'year':
        return [1200, 1900, 1500, 2100];
      default:
        return [65, 59, 80, 81, 56, 55];
    }
  };

  const getEngagementData = (timeRange) => {
    switch (timeRange) {
      case 'week':
        return [120, 190, 300, 250, 200, 150, 100];
      case 'month':
        return [1200, 1900, 1500, 2100, 1800, 2200];
      case 'year':
        return [5000, 6000, 7000, 8000];
      default:
        return [120, 190, 300, 250, 200, 150, 100];
    }
  };

  const initCharts = () => {
    destroyCharts();

    // Booking Trends Chart
    if (bookingChartRef.current) {
      const bookingCtx = bookingChartRef.current.getContext('2d');
      bookingChartInstance.current = new Chart(bookingCtx, {
        type: 'line',
        data: {
          labels: getBookingLabels(bookingTimeRange),
          datasets: [{
            label: 'Bookings',
            data: getBookingData(bookingTimeRange),
            borderColor: '#667eea',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // User Engagement Chart
    if (engagementChartRef.current) {
      const engagementCtx = engagementChartRef.current.getContext('2d');
      engagementChartInstance.current = new Chart(engagementCtx, {
        type: 'bar',
        data: {
          labels: getBookingLabels(engagementTimeRange),
          datasets: [{
            label: 'Active Users',
            data: getEngagementData(engagementTimeRange),
            backgroundColor: '#764ba2'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  };

  const handleLogout = () => {
    UserService.adminLogout();
    navigate('/admin/login');
  };

  const generateReport = () => {
    console.log('Generating report...', {
      type: reportType,
      startDate,
      endDate,
      format: exportFormat,
      filters
    });
  };

  const handleFilterChange = (filter) => (event) => {
    setFilters({
      ...filters,
      [filter]: event.target.checked
    });
  };

  const usernameInitial = adminUsername.charAt(0).toUpperCase();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Sidebar */}
      <Paper sx={{
        width: 250,
        minHeight: '100vh',
        borderRadius: 0,
        boxShadow: '0 0 20px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        zIndex: 100,
        p: 2
      }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              fontSize: '1.25rem'
            }}>
              👨‍💼
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Admin Portal
            </Typography>
          </Box>
        </Box>

        <List sx={{ flexGrow: 1 }}>
          <ListItem
            button
            onClick={() => setCurrentView('dashboard')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: currentView === 'dashboard' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: currentView === 'dashboard' ? 'primary.main' : 'inherit'
            }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight: currentView === 'dashboard' ? 'bold' : 'normal'
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setCurrentView('reports')}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ReportsIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItem>


          <ListItem
            button
            onClick={() => setCurrentView('users')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: currentView === 'users' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="User Management" />
          </ListItem>

          <ListItem button sx={{ borderRadius: 1, mb: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BookingsIcon />
            </ListItemIcon>
            <ListItemText primary="Bookings" />
          </ListItem>

          <ListItem
            button
            onClick={() => setCurrentView('courts')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: currentView === 'courts' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <CourtsIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Courts" />
          </ListItem>

          <ListItem
            button
            onClick={() => setCurrentView('tiers')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: currentView === 'tiers' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TierIcon />
            </ListItemIcon>
            <ListItemText primary="Membership Tiers" />
          </ListItem>

          <ListItem button sx={{ borderRadius: 1 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>

        <Box sx={{ mt: 'auto', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                backgroundColor: '#fdeded',
                borderColor: '#c0392b'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, ml: '280px', p: 3 }}>
        {/* Top Bar */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Paper sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1,
            width: 300
          }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <TextField
              placeholder="Search..."
              variant="standard"
              fullWidth
              InputProps={{ disableUnderline: true }}
            />
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton>
              <NotificationsIcon />
            </IconButton>
            <Box sx={{ position: 'relative' }}>
              <Button
                variant="text"
                onClick={() => setShowUserMenu(!showUserMenu)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  {usernameInitial}
                </Avatar>
                <Typography>{adminUsername}</Typography>
              </Button>

              {showUserMenu && (
                <Paper sx={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  mt: 1,
                  minWidth: 120,
                  boxShadow: 3,
                  zIndex: 10
                }}>
                  <Button
                    fullWidth
                    onClick={handleLogout}
                    sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}
                  >
                    Logout
                  </Button>
                </Paper>
              )}
            </Box>
          </Box>
        </Box>

        {currentView === 'dashboard' ? (
          <>
            {/* Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6} lg={3}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}>
                    👥
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Users</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {dashboardData.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: dashboardData.totalUsersChange >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {dashboardData.totalUsersChange >= 0 ? '+' : ''}
                      {dashboardData.totalUsersChange}% from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}>
                    📅
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {dashboardData.totalBookings.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: dashboardData.totalBookingsChange >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {dashboardData.totalBookingsChange >= 0 ? '+' : ''}
                      {dashboardData.totalBookingsChange}% from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}>
                    💰
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ${dashboardData.totalRevenue.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: dashboardData.totalRevenueChange >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {dashboardData.totalRevenueChange >= 0 ? '+' : ''}
                      {dashboardData.totalRevenueChange}% from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}>
                    ⭐
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {dashboardData.averageRating.toFixed(1)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: dashboardData.averageRatingChange >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {dashboardData.averageRatingChange >= 0 ? '+' : ''}
                      {dashboardData.averageRatingChange} from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Booking Trends</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={bookingTimeRange}
                        onChange={(e) => setBookingTimeRange(e.target.value)}
                      >
                        <MenuItem value="week">Last Week</MenuItem>
                        <MenuItem value="month">Last Month</MenuItem>
                        <MenuItem value="year">Last Year</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ height: 'calc(100% - 40px)' }}>
                    <canvas ref={bookingChartRef} />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">User Engagement</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={engagementTimeRange}
                        onChange={(e) => setEngagementTimeRange(e.target.value)}
                      >
                        <MenuItem value="week">Last Week</MenuItem>
                        <MenuItem value="month">Last Month</MenuItem>
                        <MenuItem value="year">Last Year</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ height: 'calc(100% - 40px)' }}>
                    <canvas ref={engagementChartRef} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Recent Activity */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Recent Activity</Typography>
                    <Button size="small">View All</Button>
                  </Box>

                  <List>
                    <ListItem sx={{ alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', mr: 2 }}>
                        📅
                      </Avatar>
                      <Box>
                        <Typography fontWeight="bold">New Booking</Typography>
                        <Typography variant="body2">John Doe booked Conference Room A</Typography>
                        <Typography variant="caption" color="text.secondary">
                          2 minutes ago
                        </Typography>
                      </Box>
                    </ListItem>

                    <Divider component="li" sx={{ my: 1 }} />

                    <ListItem sx={{ alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', mr: 2 }}>
                        👤
                      </Avatar>
                      <Box>
                        <Typography fontWeight="bold">New User Registration</Typography>
                        <Typography variant="body2">Jane Smith created an account</Typography>
                        <Typography variant="caption" color="text.secondary">
                          15 minutes ago
                        </Typography>
                      </Box>
                    </ListItem>

                    <Divider component="li" sx={{ my: 1 }} />

                    <ListItem sx={{ alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', mr: 2 }}>
                        ⭐
                      </Avatar>
                      <Box>
                        <Typography fontWeight="bold">New Review</Typography>
                        <Typography variant="body2">Mike Johnson rated a venue 5 stars</Typography>
                        <Typography variant="caption" color="text.secondary">
                          1 hour ago
                        </Typography>
                      </Box>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Report Section */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Generate Reports</Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Report Type</InputLabel>
                        <Select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          label="Report Type"
                        >
                          <MenuItem value="bookings">Booking Report</MenuItem>
                          <MenuItem value="users">User Report</MenuItem>
                          <MenuItem value="revenue">Revenue Report</MenuItem>
                          <MenuItem value="analytics">Analytics Report</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1 }}>Date Range</Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            type="date"
                            size="small"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={2} sx={{ textAlign: 'center', pt: 1 }}>
                          to
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            type="date"
                            size="small"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Export Format</InputLabel>
                        <Select
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value)}
                          label="Export Format"
                        >
                          <MenuItem value="pdf">PDF</MenuItem>
                          <MenuItem value="excel">Excel</MenuItem>
                          <MenuItem value="csv">CSV</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1 }}>Filters</Typography>
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.includeUsers}
                              onChange={handleFilterChange('includeUsers')}
                              size="small"
                            />
                          }
                          label="Include User Details"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.includeBookings}
                              onChange={handleFilterChange('includeBookings')}
                              size="small"
                            />
                          }
                          label="Include Booking Details"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.includeRevenue}
                              onChange={handleFilterChange('includeRevenue')}
                              size="small"
                            />
                          }
                          label="Include Revenue Data"
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={generateReport}
                        sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                      >
                        Generate Report
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : currentView === 'users' ? (
          <Box>
            <Button
              startIcon={<BackIcon />}
              onClick={() => setCurrentView('dashboard')}
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Back to Dashboard
            </Button>
            <AdminManageUsers embedded={true} />
          </Box>
        ) : currentView === 'courts' ? (
          <Box>
            <Button
              startIcon={<BackIcon />}
              onClick={() => setCurrentView('dashboard')}
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Back to Dashboard
            </Button>
            <AdminManageCourts />
          </Box>
        ) : currentView === 'tiers' ? (
          <Box>
            <Button
              startIcon={<BackIcon />}
              onClick={() => setCurrentView('dashboard')}
              sx={{ mb: 2, color: 'primary.main' }}
            >
              Back to Dashboard
            </Button>
            <AdminManageTiers />
          </Box>
        ) : (
          <Typography variant="h5" sx={{ p: 4, textAlign: 'center' }}>
            {currentView.charAt(0).toUpperCase() + currentView.slice(1)} View
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;