// AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Paper, Typography, Avatar,
  Button, List, ListItem, ListItemIcon,
  ListItemText, Divider, Chip, Select,
  MenuItem, InputLabel, FormControl,
  Checkbox, FormControlLabel, TextField,
  IconButton, Backdrop, CircularProgress,
  Dialog, DialogTitle, DialogContent, Rating
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
import ReportGenerator from './ReportGenerator';
import { useTheme, alpha } from '@mui/material/styles';

dayjs.extend(relativeTime);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const bookingChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);
  const theme = useTheme();

  const [adminUsername, setAdminUsername] = useState(UserService.getAdminUsername() || 'Admin');
  const [adminProfile, setAdminProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bookingTrendsLoading, setBookingTrendsLoading] = useState(false);
  const [revenueTrendsLoading, setRevenueTrendsLoading] = useState(false);
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


  const [bookingTimeRange, setBookingTimeRange] = useState('7d');
  const [revenueTimeRange, setRevenueTimeRange] = useState('7d');
  const [bookingTrends, setBookingTrends] = useState({ labels: [], data: [] });
  const [revenueTrends, setRevenueTrends] = useState({ labels: [], data: [] });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  // Fetch Booking Trends from backend
  useEffect(() => {
    if (getCurrentTab() === 'dashboard') {
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
    }
  }, [bookingTimeRange, location.pathname]);

  // Fetch Revenue Trends from backend
  useEffect(() => {
    if (getCurrentTab() === 'dashboard') {
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
    }
  }, [revenueTimeRange, location.pathname]);

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
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
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
            borderColor: theme.palette.success.main,
            backgroundColor: alpha(theme.palette.success.main, 0.1),
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
    if (getCurrentTab() === 'dashboard') {
      fetchDashboardData();
    }
  }, [location.pathname]);

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

  const generateReport = async (report) => {
    try {
      const token = UserService.getAdminToken();
      
      // 从ReportGenerator的复杂数据结构中提取需要的字段
      const reportRequest = {
        type: report.configuration?.type || report.type,
        startDate: report.metadata?.period?.start || report.startDate,
        endDate: report.metadata?.period?.end || report.endDate,
        format: report.configuration?.format || report.format,
        filters: {
          includeUsers: true,
          includeBookings: true,
          includeRevenue: true
        },
        metadata: report.metadata,
        content: report.content
      };
      
      const res = await axios.post(
        'http://localhost:8081/api/admin/dashboard/generate-report',
        reportRequest,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${reportRequest.format === 'excel' ? 'xlsx' : reportRequest.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate report');
    }
  };

  const usernameInitial = adminUsername.charAt(0).toUpperCase();

  console.log('Dashboard data state:', dashboardData);

  // Helper to determine current tab
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/courts')) return 'courts';
    if (path.includes('/admin/tiers')) return 'tiers';
    if (path.includes('/admin/bookings')) return 'bookings';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  // Fetch admin profile
  const fetchAdminProfile = async () => {
    try {
      const token = UserService.getAdminToken();
      const response = await axios.get('http://localhost:8081/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    }
  };

  // Fetch admin profile on component mount
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  // Listen for avatar updates from AdminSettings
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'adminAvatarUpdated') {
        fetchAdminProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event
    const handleAvatarUpdate = () => {
      fetchAdminProfile();
    };
    
    window.addEventListener('adminAvatarUpdated', handleAvatarUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminAvatarUpdated', handleAvatarUpdate);
    };
  }, []);
  // 页面主 loading 状态 - 只在dashboard页面显示
  const loading = getCurrentTab() === 'dashboard' && (summaryLoading || bookingTrendsLoading || revenueTrendsLoading);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
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
        boxShadow: theme.shadows[2],
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        zIndex: 100,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary
      }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              bgcolor: theme.palette.primary.main,
              width: 48,
              height: 48,
              fontSize: '1.25rem'
            }}
            src={adminProfile?.profileImage ? `http://localhost:8081/uploads/${adminProfile.profileImage}` : null}
            >
              {adminProfile?.name ? adminProfile.name.charAt(0).toUpperCase() : 'A'}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              Admin Portal
            </Typography>
          </Box>
        </Box>
        <List sx={{ flexGrow: 1 }}>
          <ListItem
            onClick={() => navigate('/admin/dashboard')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'dashboard' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'dashboard' ? theme.palette.primary.main : theme.palette.text.secondary
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
            onClick={() => navigate('/admin/users')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'users' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'users' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="User Management" />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/courts')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'courts' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'courts' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <CourtsIcon />
            </ListItemIcon>
            <ListItemText primary="Court Management" />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/tiers')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'tiers' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'tiers' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <TierIcon />
            </ListItemIcon>
            <ListItemText primary="Membership Management" />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/bookings')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab() === 'bookings' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'bookings' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <BookingsIcon />
            </ListItemIcon>
            <ListItemText primary="Booking Management" />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/settings')}
            sx={{
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: getCurrentTab() === 'settings' ? theme.palette.action.hover : 'inherit',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab() === 'settings' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
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
            width: 300,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary
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
            <Box sx={{ position: 'relative' }}>
              <Button
                variant="text"
                onClick={() => setShowUserMenu(!showUserMenu)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                src={adminProfile?.profileImage ? `http://localhost:8081/uploads/${adminProfile.profileImage}` : null}
                >
                  {adminProfile?.name ? adminProfile.name.charAt(0).toUpperCase() : usernameInitial}
                </Avatar>
                <Typography>{adminProfile?.name || adminUsername}</Typography>
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
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                  <Avatar sx={{
                    bgcolor: theme.palette.primary.main,
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
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                  <Avatar sx={{
                    bgcolor: theme.palette.primary.main,
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
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                  <Avatar sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}>
                    💰
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      RM {dashboardData.totalRevenue.toLocaleString()}
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
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                  <Avatar sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}>
                    ⭐
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Average Feedback Rating</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating
                        value={dashboardData.averageRating || 0}
                        precision={0.1}
                        readOnly
                        size="small"
                      />
                      <Typography variant="h6" fontWeight="bold" sx={{ ml: 1 }}>
                        {dashboardData.averageRating ? dashboardData.averageRating.toFixed(2) : '-'} / 5
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      {dashboardData.averageRatingChange !== 0 && (
                        <span style={{
                          color: dashboardData.averageRatingChange > 0 ? '#43a047' : '#e53935',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {dashboardData.averageRatingChange > 0 ? '▲' : '▼'}
                          {Math.abs(dashboardData.averageRatingChange).toFixed(1)}
                        </span>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {dashboardData.averageRatingChange !== 0
                          ? 'from last month'
                          : 'No change from last month'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6} lg={6}>
                <Paper sx={{ p: 2, height: 400, width: 450, minWidth: 450, maxWidth: 450, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
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
                <Paper sx={{ p: 2, height: 400, width: 450, minWidth: 450, maxWidth: 450, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
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
                <Paper sx={{ p: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
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
                              <Typography fontWeight="bold">
                                {item.type === 'booking' ? 'New Booking' :
                                  item.type === 'user' ? 'New User Registration' :
                                    item.type === 'cancellation' ? 'Booking Cancellation' :
                                      'New Review'}
                              </Typography>
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
                                <Typography fontWeight="bold">
                                  {item.type === 'booking' ? 'New Booking' :
                                    item.type === 'user' ? 'New User Registration' :
                                      item.type === 'cancellation' ? 'Booking Cancellation' :
                                        'New Review'}
                                </Typography>
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

              <Grid item xs={12} md={8}>
                <ReportGenerator onGenerateReport={generateReport} companyInfo={{ name: 'Pickleball Club' }} />
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