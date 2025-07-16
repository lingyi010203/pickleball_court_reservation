// AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Paper, Typography, Avatar,
  Button, List, ListItem, ListItemIcon,
  ListItemText, Divider, Chip, Select,
  MenuItem, InputLabel, FormControl,
  Checkbox, FormControlLabel, TextField,
  IconButton, Backdrop, CircularProgress,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as BookingsIcon,
  SportsTennis as CourtsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  CardMembership as TierIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  EventNote as EventNoteIcon,
  AttachMoney as AttachMoneyIcon,
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowForwardIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon,
  GridOn as GridOnIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import UserService from '../../service/UserService';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const bookingChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  const [adminUsername, setAdminUsername] = useState(UserService.getAdminUsername() || 'Admin');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [bookingTrendsLoading, setBookingTrendsLoading] = useState(true);
  const [revenueTrendsLoading, setRevenueTrendsLoading] = useState(true);
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

  const [bookingTimeRange, setBookingTimeRange] = useState('7d');
  const [revenueTimeRange, setRevenueTimeRange] = useState('7d');
  const [bookingTrends, setBookingTrends] = useState({ labels: [], data: [] });
  const [revenueTrends, setRevenueTrends] = useState({ labels: [], data: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  // Fetch Booking Trends from backend
  useEffect(() => {
    setBookingTrendsLoading(true);
    const fetchBookingTrends = async () => {
      try {
        const token = UserService.getAdminToken();
        const res = await axios.get(
          `http://localhost:8081/api/admin/dashboard/booking-trends?range=${bookingTimeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookingTrends(res.data);
      } catch (err) {
        setBookingTrends({ labels: [], data: [] });
      } finally {
        setBookingTrendsLoading(false);
      }
    };
    fetchBookingTrends();
  }, [bookingTimeRange]);

  // Fetch Revenue Trends from backend
  useEffect(() => {
    setRevenueTrendsLoading(true);
    const fetchRevenueTrends = async () => {
      try {
        const token = UserService.getAdminToken();
        const res = await axios.get(
          `http://localhost:8081/api/admin/dashboard/revenue-trends?range=${revenueTimeRange}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRevenueTrends(res.data);
      } catch (err) {
        setRevenueTrends({ labels: [], data: [] });
      } finally {
        setRevenueTrendsLoading(false);
      }
    };
    fetchRevenueTrends();
  }, [revenueTimeRange]);

  // 拆分图表初始化函数
  const initBookingChart = () => {
    if (bookingChartInstance.current) {
      bookingChartInstance.current.destroy();
    }
    const ctx = bookingChartRef.current;
    if (!ctx) return;
    // 动态设置 canvas 宽高为父容器实际像素宽高
    const parent = ctx.parentElement;
    if (parent) {
      ctx.width = parent.offsetWidth;
      ctx.height = parent.offsetHeight;
    }
    bookingChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formatLabels(bookingTrends.labels, bookingTimeRange),
        datasets: [
          {
            label: 'Bookings',
            data: bookingTrends.data,
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true },
        },
      },
    });
  };

  const initRevenueChart = () => {
    if (revenueChartInstance.current) {
      revenueChartInstance.current.destroy();
    }
    const ctx = revenueChartRef.current;
    if (!ctx) return;
    // 动态设置 canvas 宽高为父容器实际像素宽高
    const parent = ctx.parentElement;
    if (parent) {
      ctx.width = parent.offsetWidth;
      ctx.height = parent.offsetHeight;
    }
    revenueChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formatLabels(revenueTrends.labels, revenueTimeRange),
        datasets: [
          {
            label: 'Revenue',
            data: revenueTrends.data,
            borderColor: '#43a047',
            backgroundColor: 'rgba(67, 160, 71, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true },
        },
      },
    });
  };

  // useEffect 分别监听
  useEffect(() => {
    initBookingChart();
    // eslint-disable-next-line
  }, [bookingTrends.labels, bookingTrends.data, bookingTimeRange]);

  useEffect(() => {
    initRevenueChart();
    // eslint-disable-next-line
  }, [revenueTrends.labels, revenueTrends.data, revenueTimeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setSummaryLoading(true);
      const token = UserService.getAdminToken();
      const response = await axios.get('http://localhost:8081/api/admin/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setDashboardData({
        totalUsers: data.totalUsers,
        totalUsersChange: data.totalUsersChange,
        totalBookings: data.totalBookings,
        totalBookingsChange: data.totalBookingsChange,
        totalRevenue: data.totalRevenue,
        totalRevenueChange: data.totalRevenueChange,
        averageRating: data.averageRating,
        averageRatingChange: data.averageRatingChange
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      setDashboardData(prev => ({
        ...prev,
        totalBookings: 0,
        totalRevenue: 0
      }));
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = UserService.getAdminToken();
      const res = await axios.get('http://localhost:8081/api/admin/dashboard/recent-activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentActivity(res.data);
    } catch (err) {
      setRecentActivity([]);
    }
  };

  useEffect(() => {
    if (getCurrentTab() === 'dashboard') {
      fetchRecentActivity();
    }
  }, [location.pathname]);

  const destroyCharts = () => {
    if (bookingChartInstance.current) {
      bookingChartInstance.current.destroy();
      bookingChartInstance.current = null;
    }
    if (revenueChartInstance.current) {
      revenueChartInstance.current.destroy();
      revenueChartInstance.current = null;
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

  // 格式化 labels 工具函数
  const formatLabels = (labels, range) => {
    if (range === '7d' || range === '30d') {
      // yyyy-MM-dd -> MM-dd
      return labels.map(dateStr => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return `${parts[1]}-${parts[2]}`;
        }
        return dateStr;
      });
    } else if (range === '12m') {
      // yyyy-MM -> MMM yy
      return labels.map(monthStr => {
        const [year, month] = monthStr.split('-');
        if (year && month) {
          const d = new Date(Number(year), Number(month) - 1);
          return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        }
        return monthStr;
      });
    }
    return labels;
  };

  const handleLogout = () => {
    UserService.adminLogout();
    navigate('/admin/login');
  };

  const generateReport = async () => {
    try {
      const token = UserService.getAdminToken();
      const res = await axios.post(
        'http://localhost:8081/api/admin/dashboard/generate-report',
        {
          type: reportType,
          startDate,
          endDate,
          format: exportFormat,
          filters
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate report');
    }
  };

  const handleFilterChange = (filter) => (event) => {
    setFilters({
      ...filters,
      [filter]: event.target.checked
    });
  };

  const usernameInitial = adminUsername.charAt(0).toUpperCase();

  console.log('Dashboard data state:', dashboardData);

  // Helper to determine current tab
  const getCurrentTab = () => {
    if (location.pathname.startsWith('/admin/users')) return 'users';
    if (location.pathname.startsWith('/admin/tiers')) return 'tiers';
    if (location.pathname.startsWith('/admin/courts')) return 'courts';
    if (location.pathname.startsWith('/admin/dashboard')) return 'dashboard';
    if (location.pathname.startsWith('/admin/bookings')) return 'bookings';
    return 'dashboard';
  };
  // 页面主 loading 状态
  const loading = summaryLoading || bookingTrendsLoading || revenueTrendsLoading;

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
            onClick={() => navigate('/admin/dashboard')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'dashboard' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'dashboard' ? 'primary.main' : 'inherit'
            }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight: getCurrentTab() === 'dashboard' ? 'bold' : 'normal'
              }}
            />
          </ListItem>
          <ListItem
            button
            onClick={() => navigate('/admin/users')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'users' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="User Management" />
          </ListItem>
          <ListItem
            button
            onClick={() => navigate('/admin/courts')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'courts' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <CourtsIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Courts" />
          </ListItem>
          <ListItem
            button
            onClick={() => navigate('/admin/tiers')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'tiers' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TierIcon />
            </ListItemIcon>
            <ListItemText primary="Membership Tiers" />
          </ListItem>
          <ListItem
            button
            onClick={() => navigate('/admin/bookings')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'bookings' ? '#f0f2f5' : 'inherit'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BookingsIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Bookings" />
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
        {getCurrentTab() === 'dashboard' && (location.pathname === '/admin/dashboard' || location.pathname === '/admin') ? (
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
                      {dashboardData.totalUsersChange.toFixed(1)}% from last month
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
                      {dashboardData.totalBookingsChange.toFixed(1)}% from last month
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
                      {dashboardData.totalRevenueChange.toFixed(1)}% from last month
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
                      {dashboardData.averageRatingChange.toFixed(1)} from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6} lg={6}>
                <Paper sx={{ p: 2, height: 400, width: 450, minWidth: 450, maxWidth: 450 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Booking Trends</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={bookingTimeRange}
                        onChange={(e) => setBookingTimeRange(e.target.value)}
                      >
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="12m">Last 12 Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ height: 'calc(100% - 40px)' }}>
                    <canvas ref={bookingChartRef} style={{ width: '100%', height: '100%' }} />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={6}>
                <Paper sx={{ p: 2, height: 400, width: 450, minWidth: 450, maxWidth: 450 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Revenue Trends</Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={revenueTimeRange}
                        onChange={(e) => setRevenueTimeRange(e.target.value)}
                      >
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="12m">Last 12 Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ height: 'calc(100% - 40px)' }}>
                    <canvas ref={revenueChartRef} style={{ width: '100%', height: '100%' }} />
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
                    <Button size="small" onClick={() => setActivityDialogOpen(true)} disabled={recentActivity.length <= 4}>View All</Button>
                  </Box>
                  <List>
                    {recentActivity.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No recent activity." />
                      </ListItem>
                    ) : (
                      recentActivity.slice(0, 4).map((item, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem sx={{ alignItems: 'flex-start' }}>
                            <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', mr: 2 }}>
                              {item.icon}
                            </Avatar>
                            <Box>
                              <Typography fontWeight="bold">{item.type === 'booking' ? 'New Booking' : item.type === 'user' ? 'New User Registration' : 'New Review'}</Typography>
                              <Typography variant="body2">{item.user} {item.detail}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(item.timestamp).fromNow()}
                              </Typography>
                            </Box>
                          </ListItem>
                          {idx !== Math.min(recentActivity.length, 4) - 1 && <Divider component="li" sx={{ my: 1 }} />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                  {/* Dialog for all activity */}
                  <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>All Recent Activity</DialogTitle>
                    <DialogContent>
                      <List>
                        {recentActivity.map((item, idx) => (
                          <React.Fragment key={idx}>
                            <ListItem sx={{ alignItems: 'flex-start' }}>
                              <Avatar sx={{ bgcolor: 'grey.100', color: 'text.primary', mr: 2 }}>
                                {item.icon}
                              </Avatar>
                              <Box>
                                <Typography fontWeight="bold">{item.type === 'booking' ? 'New Booking' : item.type === 'user' ? 'New User Registration' : 'New Review'}</Typography>
                                <Typography variant="body2">{item.user} {item.detail}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {dayjs(item.timestamp).fromNow()}
                                </Typography>
                              </Box>
                            </ListItem>
                            {idx !== recentActivity.length - 1 && <Divider component="li" sx={{ my: 1 }} />}
                          </React.Fragment>
                        ))}
                      </List>
                    </DialogContent>
                  </Dialog>
                </Paper>
              </Grid>

              {/* Report Section - 美化版 */}
              {/* 在您的 AdminDashboard.jsx 文件中替换现有的报告生成部分 */}
              <Grid item xs={12} md={8}>
                <Paper sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(145deg, #ffffff, #f8f9ff)',
                  border: '1px solid rgba(100, 110, 230, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  }
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2.5,
                    position: 'relative'
                  }}>
                    <BarChartIcon sx={{
                      color: '#667eea',
                      fontSize: 28,
                      mr: 1.5,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      p: 1,
                      borderRadius: 1
                    }} />
                    <Typography variant="h6" sx={{
                      fontWeight: 700,
                      color: '#2d3748'
                    }}>
                      Generate Reports
                    </Typography>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontWeight: 500 }}>Report Type</InputLabel>
                        <Select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          label="Report Type"
                          sx={{
                            '& .MuiSelect-select': {
                              py: 1.2,
                              fontWeight: 500
                            }
                          }}
                        >
                          <MenuItem value="bookings" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EventNoteIcon sx={{ color: '#667eea', mr: 1.5 }} />
                              <span>Booking Report</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="users" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PeopleIcon sx={{ color: '#667eea', mr: 1.5 }} />
                              <span>User Report</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="revenue" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AttachMoneyIcon sx={{ color: '#667eea', mr: 1.5 }} />
                              <span>Revenue Report</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="analytics" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AnalyticsIcon sx={{ color: '#667eea', mr: 1.5 }} />
                              <span>Analytics Report</span>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      
                      <Grid container spacing={1.5}>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            type="date"
                            size="small"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              sx: {
                                py: 1.2,
                                fontWeight: 500
                              }
                            }}
                            label="Start Date"
                          />
                        </Grid>
                        <Grid item xs={2} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ArrowForwardIcon sx={{ color: '#a0aec0' }} />
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            type="date"
                            size="small"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              sx: {
                                py: 1.2,
                                fontWeight: 500
                              }
                            }}
                            label="End Date"
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontWeight: 500 }}>Export Format</InputLabel>
                        <Select
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value)}
                          label="Export Format"
                          sx={{
                            '& .MuiSelect-select': {
                              py: 1.2,
                              fontWeight: 500
                            }
                          }}
                        >
                          <MenuItem value="pdf" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PictureAsPdfIcon sx={{ color: '#e53e3e', mr: 1.5 }} />
                              <span>PDF Document</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="excel" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TableChartIcon sx={{ color: '#38a169', mr: 1.5 }} />
                              <span>Excel Spreadsheet</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="csv" sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GridOnIcon sx={{ color: '#3182ce', mr: 1.5 }} />
                              <span>CSV File</span>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        color: '#4a5568'
                      }}>
                        Report Options
                      </Typography>
                      <Paper sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: '#f8f9ff',
                        border: '1px solid rgba(102, 126, 234, 0.15)'
                      }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.includeUsers}
                              onChange={handleFilterChange('includeUsers')}
                              size="small"
                              color="primary"
                              sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Include User Details
                            </Typography>
                          }
                          sx={{ mb: 1.2 }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.includeBookings}
                              onChange={handleFilterChange('includeBookings')}
                              size="small"
                              color="primary"
                              sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Include Booking Details
                            </Typography>
                          }
                          sx={{ mb: 1.2 }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.includeRevenue}
                              onChange={handleFilterChange('includeRevenue')}
                              size="small"
                              color="primary"
                              sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Include Revenue Data
                            </Typography>
                          }
                        />
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={generateReport}
                        startIcon={<FileDownloadIcon />}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          letterSpacing: '0.5px',
                          borderRadius: 1.5,
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                          background: 'linear-gradient(90deg, #667eea, #764ba2)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                            background: 'linear-gradient(90deg, #5c6bc0, #6a45a2)'
                          }
                        }}
                      >
                        Generate Report
                      </Button>
                      <Typography variant="caption" sx={{
                        display: 'block',
                        textAlign: 'center',
                        mt: 1.5,
                        color: '#718096'
                      }}>
                        Reports are generated and will be downloaded soon.
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

            </Grid>
          </>
        ) : null}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminDashboard;