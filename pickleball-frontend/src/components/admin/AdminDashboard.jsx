// AdminDashboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Grid, Paper, Typography, Avatar,
  Button, List, ListItem, ListItemIcon,
  ListItemText, Divider, Chip, Select,
  MenuItem, InputLabel, FormControl,
  Checkbox, FormControlLabel, TextField,
  IconButton, Backdrop, CircularProgress,
  Dialog, DialogTitle, DialogContent, Rating,
  Skeleton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as BookingsIcon,
  SportsTennis as CourtsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
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
  FileDownload as FileDownloadIcon,
  RateReview as FeedbackIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import UserService from '../../service/UserService';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ReportGenerator from './ReportGenerator';
import { useTheme, alpha } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { usePageTheme } from '../../hooks/usePageTheme';

dayjs.extend(relativeTime);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: authLogout } = useAuth();
  usePageTheme('admin'); // 设置页面类型为admin
  
  const bookingChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const bookingChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);
  const theme = useTheme();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [adminUsername, setAdminUsername] = useState(UserService.getAdminUsername() || 'Admin');
  const [adminProfile, setAdminProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bookingTrendsLoading, setBookingTrendsLoading] = useState(false);
  const [revenueTrendsLoading, setRevenueTrendsLoading] = useState(false);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const [bookingSummary, setBookingSummary] = useState({ highest: null, lowest: null });
  const [revenueSummary, setRevenueSummary] = useState({ highest: null, lowest: null });
  
  // Error states for better error handling
  const [dashboardError, setDashboardError] = useState('');
  const [bookingTrendsError, setBookingTrendsError] = useState('');
  const [revenueTrendsError, setRevenueTrendsError] = useState('');
  const [recentActivityError, setRecentActivityError] = useState('');

  // Loading state management
  const isDashboardLoading = summaryLoading || bookingTrendsLoading || revenueTrendsLoading || recentActivityLoading;
  const isAnyLoading = isDashboardLoading || profileLoading || reportGenerating;

  // Responsive sidebar management
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Auto-hide sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const resetAllLoadingStates = useCallback(() => {
    setSummaryLoading(false);
    setBookingTrendsLoading(false);
    setRevenueTrendsLoading(false);
    setRecentActivityLoading(false);
    setProfileLoading(false);
    setReportGenerating(false);
  }, []);

  const resetAllErrorStates = useCallback(() => {
    setDashboardError('');
    setBookingTrendsError('');
    setRevenueTrendsError('');
    setRecentActivityError('');
  }, []);

  // Data validation utility functions - memoized for performance
  const validateNumber = useCallback((value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }, []);

  const validateArray = useCallback((value, defaultValue = []) => {
    return Array.isArray(value) ? value : defaultValue;
  }, []);

  const validateObject = useCallback((value, defaultValue = {}) => {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : defaultValue;
  }, []);

  const validateString = useCallback((value, defaultValue = '') => {
    return typeof value === 'string' ? value : defaultValue;
  }, []);

  const validateDashboardData = useCallback((data) => {
    return {
      totalUsers: validateNumber(data?.totalUsers, 0),
      totalUsersChange: validateNumber(data?.totalUsersChange, 0),
      totalBookings: validateNumber(data?.totalBookings, 0),
      totalBookingsChange: validateNumber(data?.totalBookingsChange, 0),
      totalRevenue: validateNumber(data?.totalRevenue, 0),
      totalRevenueChange: validateNumber(data?.totalRevenueChange, 0),
      averageRating: validateNumber(data?.averageRating, 0),
      averageRatingChange: validateNumber(data?.averageRatingChange, 0)
    };
  }, [validateNumber]);

  const validateTrendsData = useCallback((data) => {
    return {
      labels: validateArray(data?.labels, []),
      data: validateArray(data?.data, [])
    };
  }, [validateArray]);

  const validateAdminProfile = useCallback((data) => {
    return {
      id: validateNumber(data?.id, null),
      name: validateString(data?.name, 'Admin'),
      email: validateString(data?.email, ''),
      profileImage: validateString(data?.profileImage, ''),
      role: validateString(data?.role, 'Admin'),
      createdAt: validateString(data?.createdAt, ''),
      updatedAt: validateString(data?.updatedAt, '')
    };
  }, [validateNumber, validateString]);

  // 格式化 labels 工具函数 - memoized for performance
  const formatLabels = useCallback((labels, range) => {
    // Validate inputs
    if (!Array.isArray(labels)) {
      console.warn('Invalid labels array provided to formatLabels');
      return [];
    }
    
    if (!range || typeof range !== 'string') {
      console.warn('Invalid range provided to formatLabels');
      return labels;
    }
    
    try {
      if (range === '7d' || range === '30d') {
        // yyyy-MM-dd -> MM-dd
        return labels.map(dateStr => {
          if (!dateStr || typeof dateStr !== 'string') {
            return 'Invalid';
          }
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            return `${parts[1]}-${parts[2]}`;
          }
          return dateStr;
        });
      } else if (range === '12m') {
        // yyyy-MM -> MMM yy
        return labels.map(monthStr => {
          if (!monthStr || typeof monthStr !== 'string') {
            return 'Invalid';
          }
          const [year, month] = monthStr.split('-');
          if (year && month) {
            const d = new Date(Number(year), Number(month) - 1);
            return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
          }
          return monthStr;
        });
      }
      return labels;
    } catch (error) {
      console.error('Error formatting labels:', error);
      return labels;
    }
  }, []);

  // Helper to determine current tab - memoized for performance
  const getCurrentTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/courts')) return 'courts';
    if (path.includes('/admin/tiers')) return 'tiers';
    if (path.includes('/admin/bookings')) return 'bookings';
    if (path.includes('/admin/feedback')) return 'feedback';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  }, [location.pathname]);

  // Data fetching functions - memoized for performance
  const fetchDashboardData = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setDashboardError('');
      
      const token = UserService.getAdminToken() || UserService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await axios.get('http://localhost:8081/api/admin/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      if (data && typeof data === 'object') {
        const validatedData = validateDashboardData(data);
        setDashboardData(validatedData);
      } else {
        throw new Error('Invalid dashboard data format received');
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      setDashboardError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
      // Set default values on error
      setDashboardData({
        totalUsers: 0,
        totalUsersChange: 0,
        totalBookings: 0,
        totalBookingsChange: 0,
        totalRevenue: 0,
        totalRevenueChange: 0,
        averageRating: 0,
        averageRatingChange: 0
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [validateDashboardData]);

  const fetchRecentActivity = useCallback(async () => {
    try {
      setRecentActivityLoading(true);
      setRecentActivityError('');
      
      const token = UserService.getAdminToken() || UserService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const res = await axios.get('http://localhost:8081/api/admin/dashboard/recent-activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(res.data)) {
        const validatedData = res.data.map(activity => ({
          id: validateNumber(activity?.id, 0),
          type: validateString(activity?.type, 'unknown'),
          description: validateString(activity?.description, ''),
          timestamp: validateString(activity?.timestamp, ''),
          userId: validateNumber(activity?.userId, null),
          user: validateString(activity?.user, 'Unknown User').trim() || 'Unknown User',
          detail: validateString(activity?.detail, ''),
          icon: validateString(activity?.icon, '📋')
        }));
        setRecentActivity(validatedData);
        setRecentActivityError('');
      } else {
        throw new Error('Invalid recent activity data format received');
      }
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setRecentActivity([]);
      setRecentActivityError(err.response?.data?.message || err.message || 'Failed to load recent activity');
    } finally {
      setRecentActivityLoading(false);
    }
  }, [validateNumber, validateString]);

  // Chart and data fetching functions - memoized for performance
  const fetchBookingTrends = useCallback(async () => {
    try {
      setBookingTrendsLoading(true);
      const token = UserService.getAdminToken() || UserService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const res = await axios.get(
        `http://localhost:8081/api/admin/dashboard/booking-trends?range=${bookingTimeRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && typeof res.data === 'object') {
        const validatedData = validateTrendsData(res.data);
        setBookingTrends(validatedData);
        setBookingTrendsError('');
        
        // Calculate summary statistics
        const summary = calculateBookingSummary(validatedData.data, validatedData.labels);
        setBookingSummary(summary);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Failed to fetch booking trends:', err);
      setBookingTrends({ labels: [], data: [] });
      setBookingTrendsError(err.response?.data?.message || err.message || 'Failed to load booking trends');
    } finally {
      setBookingTrendsLoading(false);
    }
  }, [bookingTimeRange, validateTrendsData]);

  const fetchRevenueTrends = useCallback(async () => {
    console.log('fetchRevenueTrends called');
    try {
      setRevenueTrendsLoading(true);
      const token = UserService.getAdminToken() || UserService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const res = await axios.get(
        `http://localhost:8081/api/admin/dashboard/revenue-trends?range=${revenueTimeRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data && typeof res.data === 'object') {
        const validatedData = validateTrendsData(res.data);
        setRevenueTrends(validatedData);
        setRevenueTrendsError('');
        
        // Calculate summary statistics
        const summary = calculateRevenueSummary(validatedData.data, validatedData.labels);
        setRevenueSummary(summary);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Failed to fetch revenue trends:', err);
      setRevenueTrends({ labels: [], data: [] });
      setRevenueTrendsError(err.response?.data?.message || err.message || 'Failed to load revenue trends');
    } finally {
      setRevenueTrendsLoading(false);
    }
  }, [revenueTimeRange, validateTrendsData]);

  const initBookingChart = useCallback(() => {
    try {
      console.log('Initializing booking chart...', { 
        hasInstance: !!bookingChartInstance.current,
        hasCanvas: !!bookingChartRef.current,
        dataLength: bookingTrends.data.length,
        labelsLength: bookingTrends.labels.length
      });
      
      // Destroy existing chart instance
      if (bookingChartInstance.current) {
        bookingChartInstance.current.destroy();
        bookingChartInstance.current = null;
      }
      
      const ctx = bookingChartRef.current;
      if (!ctx) {
        console.warn('Booking chart canvas not found');
        return;
      }
      
      // Check if we have valid data
      const validatedTrends = validateTrendsData(bookingTrends);
      if (!validatedTrends.labels.length || !validatedTrends.data.length) {
        console.warn('No booking trends data available for chart');
        return;
      }
      
      // 使用固定的颜色，避免主题切换时的重新渲染
      const chartColor = '#667eea';
      
      bookingChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: formatLabels(validatedTrends.labels, bookingTimeRange),
          datasets: [
            {
              label: 'Bookings',
              data: validatedTrends.data,
              borderColor: chartColor,
              backgroundColor: alpha(chartColor, 0.1),
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
          },
          scales: {
            x: { 
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                minRotation: 0,
              }
            },
            y: { 
              beginAtZero: true,
              grid: {
                color: alpha('#000', 0.1),
              },
              title: {
                display: true,
                text: 'Number of Bookings',
                font: {
                  size: 12,
                  weight: 'bold'
                },
                color: '#666'
              }
            },
          },
        },
      });
      
      console.log('Booking chart initialized successfully');
    } catch (error) {
      console.error('Failed to initialize booking chart:', error);
      // Clean up on error
      if (bookingChartInstance.current) {
        bookingChartInstance.current.destroy();
        bookingChartInstance.current = null;
      }
    }
  }, [bookingTrends, bookingTimeRange, formatLabels, validateTrendsData, alpha]);

  const initRevenueChart = useCallback(() => {
    try {
      console.log('Initializing revenue chart...', { 
        hasInstance: !!revenueChartInstance.current,
        hasCanvas: !!revenueChartRef.current,
        dataLength: revenueTrends.data.length,
        labelsLength: revenueTrends.labels.length
      });
      
      // Destroy existing chart instance
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
        revenueChartInstance.current = null;
      }
      
      const ctx = revenueChartRef.current;
      if (!ctx) {
        console.warn('Revenue chart canvas not found');
        return;
      }
      
      // Check if we have valid data
      const validatedTrends = validateTrendsData(revenueTrends);
      if (!validatedTrends.labels.length || !validatedTrends.data.length) {
        console.warn('No revenue trends data available for chart');
        return;
      }
      
      // 使用固定的颜色，避免主题切换时的重新渲染
      const chartColor = '#28a745';
      
      revenueChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: formatLabels(validatedTrends.labels, revenueTimeRange),
          datasets: [
            {
              label: 'Revenue',
              data: validatedTrends.data,
              borderColor: chartColor,
              backgroundColor: alpha(chartColor, 0.1),
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
          },
          scales: {
            x: { 
              grid: { display: false },
              ticks: {
                maxRotation: 45,
                minRotation: 0,
              }
            },
            y: { 
              beginAtZero: true,
              grid: {
                color: alpha('#000', 0.1),
              },
              title: {
                display: true,
                text: 'Revenue (RM)',
                font: {
                  size: 12,
                  weight: 'bold'
                },
                color: '#666'
              }
            },
          },
        },
      });
      
      console.log('Revenue chart initialized successfully');
    } catch (error) {
      console.error('Failed to initialize revenue chart:', error);
      // Clean up on error
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
        revenueChartInstance.current = null;
      }
    }
  }, [revenueTrends, revenueTimeRange, formatLabels, validateTrendsData, alpha]);

  const destroyCharts = useCallback(() => {
    try {
      if (bookingChartInstance.current) {
        bookingChartInstance.current.destroy();
        bookingChartInstance.current = null;
      }
    } catch (error) {
      console.error('Error destroying booking chart:', error);
      bookingChartInstance.current = null;
    }
    
    try {
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
        revenueChartInstance.current = null;
      }
    } catch (error) {
      console.error('Error destroying revenue chart:', error);
      revenueChartInstance.current = null;
    }
  }, []);

  // Safe display functions for UI - memoized for performance
  const safeDisplayNumber = useCallback((value, defaultValue = 0, formatter = (val) => val.toLocaleString()) => {
    const num = validateNumber(value, defaultValue);
    try {
      return formatter(num);
    } catch (error) {
      console.error('Error formatting number:', error);
      return defaultValue.toString();
    }
  }, [validateNumber]);

  const safeDisplayPercentage = useCallback((value, defaultValue = 0) => {
    const num = validateNumber(value, defaultValue);
    try {
      return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return `${defaultValue >= 0 ? '+' : ''}${defaultValue.toFixed(1)}%`;
    }
  }, [validateNumber]);

  const safeDisplayRating = useCallback((value, defaultValue = 0) => {
    const num = validateNumber(value, defaultValue);
    try {
      return num.toFixed(1);
    } catch (error) {
      console.error('Error formatting rating:', error);
      return defaultValue.toFixed(1);
    }
  }, [validateNumber]);

  // Fetch Booking Trends from backend
  useEffect(() => {
    if (location.pathname === '/admin/dashboard' || location.pathname === '/admin') {
      fetchBookingTrends();
    }
  }, [bookingTimeRange]);

  // Fetch Revenue Trends from backend
  useEffect(() => {
    if (location.pathname === '/admin/dashboard' || location.pathname === '/admin') {
      fetchRevenueTrends();
    }
  }, [revenueTimeRange]);

  // 优化图表初始化，减少不必要的重新渲染
  useEffect(() => {
    if (bookingTrends.labels.length > 0 && bookingTrends.data.length > 0) {
      // 添加防抖，避免频繁更新
      const timeoutId = setTimeout(() => {
        initBookingChart();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [bookingTrends, bookingTimeRange, initBookingChart]);

  useEffect(() => {
    if (revenueTrends.labels.length > 0 && revenueTrends.data.length > 0) {
      // 添加防抖，避免频繁更新
      const timeoutId = setTimeout(() => {
        initRevenueChart();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [revenueTrends, revenueTimeRange, initRevenueChart]);

  useEffect(() => {
    if (location.pathname === '/admin/dashboard' || location.pathname === '/admin') {
      fetchDashboardData();
    }
  }, []);



  useEffect(() => {
    if (location.pathname === '/admin/dashboard' || location.pathname === '/admin') {
      fetchRecentActivity();
    }
  }, []);

  // Cleanup charts and reset states on component unmount
  useEffect(() => {
    return () => {
      destroyCharts();
      resetAllLoadingStates();
      resetAllErrorStates();
    };
  }, [destroyCharts, resetAllLoadingStates, resetAllErrorStates]);

  // Cleanup charts when leaving dashboard tab
  useEffect(() => {
    if (location.pathname !== '/admin/dashboard' && location.pathname !== '/admin') {
      destroyCharts();
    }
  }, [destroyCharts]);

  // 额外的保护机制：确保chart在dashboard页面时始终存在
  useEffect(() => {
    if ((location.pathname === '/admin/dashboard' || location.pathname === '/admin') && 
        getCurrentTab === 'dashboard') {
      // 如果chart实例不存在但有数据，重新初始化
      if (!bookingChartInstance.current && bookingTrends.labels.length > 0 && bookingTrends.data.length > 0) {
        const timeoutId = setTimeout(() => {
          initBookingChart();
        }, 200);
        return () => clearTimeout(timeoutId);
      }
      
      if (!revenueChartInstance.current && revenueTrends.labels.length > 0 && revenueTrends.data.length > 0) {
        const timeoutId = setTimeout(() => {
          initRevenueChart();
        }, 200);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [location.pathname, getCurrentTab, bookingTrends, revenueTrends, initBookingChart, initRevenueChart]);

  const getBookingLabels = useCallback((timeRange) => {
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
  }, []);

  const getBookingData = useCallback((timeRange) => {
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
  }, []);

  const getEngagementData = useCallback((timeRange) => {
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
  }, []);

  const handleLogout = useCallback(() => {
    // Clear all admin-related data
    UserService.adminLogout();
    // Clear AuthContext data
    authLogout();
    // Navigate to login page
    navigate('/login');
  }, [authLogout, navigate]);

  // Calculate summary statistics for charts
  const calculateBookingSummary = useCallback((data, labels) => {
    if (!data || !labels || data.length === 0) return { highest: null, lowest: null };
    
    const maxIndex = data.indexOf(Math.max(...data));
    const minIndex = data.indexOf(Math.min(...data));
    
    return {
      highest: { value: data[maxIndex], label: labels[maxIndex] },
      lowest: { value: data[minIndex], label: labels[minIndex] }
    };
  }, []);

  const calculateRevenueSummary = useCallback((data, labels) => {
    if (!data || !labels || data.length === 0) return { highest: null, lowest: null };
    
    const maxIndex = data.indexOf(Math.max(...data));
    const minIndex = data.indexOf(Math.min(...data));
    
    return {
      highest: { value: data[maxIndex], label: labels[maxIndex] },
      lowest: { value: data[minIndex], label: labels[minIndex] }
    };
  }, []);

  const generateReport = useCallback(async (report) => {
    try {
      setReportGenerating(true);
      const token = UserService.getAdminToken() || UserService.getToken();
      
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
      console.error('Failed to generate report:', err);
      alert('Failed to generate report');
          } finally {
        setReportGenerating(false);
      }
    }, []);

  const usernameInitial = useMemo(() => 
    adminUsername.charAt(0).toUpperCase(), 
    [adminUsername]
  );

  console.log('Dashboard data state:', dashboardData);

  // Fetch admin profile
  const fetchAdminProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      
      // Try to get admin token from UserService first, then from AuthContext
      const token = UserService.getAdminToken() || UserService.getToken();
      if (!token) {
        console.error('No admin token found');
        return;
      }
      
      const response = await axios.get('http://localhost:8081/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && typeof response.data === 'object') {
        const validatedData = validateAdminProfile(response.data);
        setAdminProfile(validatedData);
      } else {
        throw new Error('Invalid admin profile data format received');
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
      // Don't set profile to null on error, keep existing profile if available
      if (!adminProfile) {
        setAdminProfile(null);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [validateAdminProfile, adminProfile]);

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
  const loading = getCurrentTab === 'dashboard' && isDashboardLoading;
  


  return (
    <Box 
      component="main"
      role="main"
      aria-label="Admin Dashboard"
      sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}
    >
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
        aria-label="Loading dashboard data"
      >
        <CircularProgress 
          color="inherit" 
          aria-label="Loading indicator"
          role="progressbar"
        />
      </Backdrop>
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <Backdrop
          sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: (theme) => theme.zIndex.drawer 
          }}
          open={sidebarOpen}
          onClick={handleSidebarToggle}
          aria-label="Close sidebar overlay"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              handleSidebarToggle();
            }
          }}
        />
      )}
      {/* Sidebar */}
      <Paper 
        component="nav"
        role="navigation"
        aria-label="Admin navigation menu"
        sx={{
        width: isMobile ? '100%' : 250,
        minHeight: '100vh',
        borderRadius: 0,
        boxShadow: theme.shadows[2],
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease-in-out',
        ...(isMobile && {
          maxWidth: '280px',
          width: '280px'
        })
      }}>
        <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar 
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                    fontSize: '1.25rem'
                  }}
                  src={adminProfile?.profileImage ? `http://localhost:8081/uploads/${adminProfile.profileImage}` : null}
                  alt={`${adminProfile?.name || 'Admin'} profile picture`}
                >
                  {adminProfile?.name ? adminProfile.name.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                <Typography 
                  variant="h6" 
                  component="h1"
                  sx={{ fontWeight: 700, color: theme.palette.primary.main }}
                >
                  Admin Portal
                </Typography>
              </Box>
              {isMobile && (
                <IconButton 
                  onClick={handleSidebarToggle} 
                  size="small"
                  aria-label="Close sidebar"
                  aria-expanded={sidebarOpen}
                >
                  <ArrowForwardIcon />
                </IconButton>
              )}
            </Box>
        </Box>
        <List 
          sx={{ flexGrow: 1 }}
          role="menubar"
          aria-label="Admin navigation menu"
        >
                      <ListItem
              onClick={() => navigate('/admin/dashboard')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/admin/dashboard');
                }
              }}
              role="menuitem"
              aria-current={getCurrentTab === 'dashboard' ? 'page' : undefined}
              tabIndex={0}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor: getCurrentTab === 'dashboard' ? theme.palette.action.hover : 'inherit',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.action.selected
                },
                '&:focus': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px'
                }
              }}
            >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'dashboard' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight: getCurrentTab === 'dashboard' ? 'bold' : 'normal'
              }}
            />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/users')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/admin/users');
              }
            }}
            role="menuitem"
            aria-current={getCurrentTab === 'users' ? 'page' : undefined}
            tabIndex={0}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab === 'users' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              },
              '&:focus': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px'
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'users' ? theme.palette.primary.main : theme.palette.text.secondary
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
              bgcolor: getCurrentTab === 'courts' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'courts' ? theme.palette.primary.main : theme.palette.text.secondary
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
              bgcolor: getCurrentTab === 'tiers' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'tiers' ? theme.palette.primary.main : theme.palette.text.secondary
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
              bgcolor: getCurrentTab === 'bookings' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'bookings' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <BookingsIcon />
            </ListItemIcon>
            <ListItemText primary="Booking Management" />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/feedback')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              bgcolor: getCurrentTab === 'feedback' ? theme.palette.action.hover : 'inherit',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'feedback' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <FeedbackIcon />
            </ListItemIcon>
            <ListItemText primary="Feedback Management" />
          </ListItem>
          <ListItem
            onClick={() => navigate('/admin/settings')}
            sx={{
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: getCurrentTab === 'settings' ? theme.palette.action.hover : 'inherit',
              '&:hover': {
                backgroundColor: theme.palette.action.selected
              }
            }}
          >
            <ListItemIcon sx={{
              minWidth: 40,
              color: getCurrentTab === 'settings' ? theme.palette.primary.main : theme.palette.text.secondary
            }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      </Paper>
      {/* Main Content */}
      <Box 
        component="section"
        role="region"
        aria-label="Dashboard content"
        sx={{ 
          flexGrow: 1, 
          ml: isMobile ? 0 : '280px', 
          p: isMobile ? 2 : 3,
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
        {/* Top Bar */}
        <Box 
          component="header"
          role="banner"
          aria-label="Dashboard header"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: isMobile ? '100%' : 'auto' }}>
            {isMobile && (
              <IconButton 
                onClick={handleSidebarToggle} 
                size="small"
                aria-label="Open sidebar menu"
                aria-expanded={sidebarOpen}
                aria-controls="admin-navigation"
              >
                <ArrowForwardIcon />
              </IconButton>
            )}
          </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="text"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Avatar 
                    sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                    src={adminProfile?.profileImage ? `http://localhost:8081/uploads/${adminProfile.profileImage}` : null}
                    alt={`${adminProfile?.name || adminUsername} profile picture`}
                  >
                    {adminProfile?.name ? adminProfile.name.charAt(0).toUpperCase() : usernameInitial}
                  </Avatar>
                  <Typography>{adminProfile?.name || adminUsername}</Typography>
                </Button>
                              {showUserMenu && (
                  <Paper 
                    role="menu"
                    aria-label="User menu options"
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      mt: 1,
                      minWidth: 120,
                      boxShadow: 3,
                      zIndex: 10
                    }}
                  >
                    <Button
                      fullWidth
                      onClick={handleLogout}
                      role="menuitem"
                      aria-label="Logout from admin panel"
                      sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}
                    >
                      Logout
                    </Button>
                  </Paper>
                )}
            </Box>
          </Box>
        </Box>
                    {getCurrentTab === 'dashboard' && (location.pathname === '/admin/dashboard' || location.pathname === '/admin') ? (
          <>
            {/* Error Messages */}
            {(dashboardError || bookingTrendsError || revenueTrendsError || recentActivityError) && (
              <Box sx={{ mb: 3 }}>
                {dashboardError && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
                    <Typography variant="body2">Dashboard Data Error: {dashboardError}</Typography>
                  </Paper>
                )}
                {bookingTrendsError && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
                    <Typography variant="body2">Booking Trends Error: {bookingTrendsError}</Typography>
                  </Paper>
                )}
                {revenueTrendsError && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
                    <Typography variant="body2">Revenue Trends Error: {revenueTrendsError}</Typography>
                  </Paper>
                )}
                {recentActivityError && (
                  <Paper sx={{ p: 2, mb: 1, backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
                    <Typography variant="body2">Recent Activity Error: {recentActivityError}</Typography>
                  </Paper>
                )}
              </Box>
            )}
            
            {/* Overview Section */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h4" 
                component="h2" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#000000',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📊 Overview
              </Typography>
              
              <Grid 
                container 
                spacing={isMobile ? 2 : 3} 
                role="region"
                aria-label="Dashboard overview statistics"
              >
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Paper sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper, 
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.3s ease',
                  height: 200,
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: '#2d4aa1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontSize: '1.5rem',
                    color: '#ffffff'
                  }}>
                    👥
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {summaryLoading ? (
                        <Skeleton variant="text" width={80} height={40} />
                      ) : (
                        safeDisplayNumber(dashboardData.totalUsers)
                      )}
                    </Typography>
                    {/* Mini trend indicator */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      p: 0.5,
                      borderRadius: 1,
                      backgroundColor: dashboardData.totalUsersChange >= 0 ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                      border: `1px solid ${dashboardData.totalUsersChange >= 0 ? '#4caf50' : '#f44336'}`
                    }}>
                      <Box sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: `8px solid ${dashboardData.totalUsersChange >= 0 ? '#4caf50' : '#f44336'}`,
                        transform: dashboardData.totalUsersChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Users
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: dashboardData.totalUsersChange >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      {dashboardData.totalUsersChange >= 0 ? '▲' : '▼'} {safeDisplayPercentage(dashboardData.totalUsersChange)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Paper sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper, 
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.3s ease',
                  height: 200,
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: '#2d4aa1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontSize: '1.5rem',
                    color: '#ffffff'
                  }}>
                    📅
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {summaryLoading ? (
                        <Skeleton variant="text" width={80} height={40} />
                      ) : (
                        safeDisplayNumber(dashboardData.totalBookings)
                      )}
                    </Typography>
                    {/* Mini trend indicator */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      p: 0.5,
                      borderRadius: 1,
                      backgroundColor: dashboardData.totalBookingsChange >= 0 ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                      border: `1px solid ${dashboardData.totalBookingsChange >= 0 ? '#4caf50' : '#f44336'}`
                    }}>
                      <Box sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: `8px solid ${dashboardData.totalBookingsChange >= 0 ? '#4caf50' : '#f44336'}`,
                        transform: dashboardData.totalBookingsChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Bookings
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: dashboardData.totalBookingsChange >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      {dashboardData.totalBookingsChange >= 0 ? '▲' : '▼'} {safeDisplayPercentage(dashboardData.totalBookingsChange)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Paper sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper, 
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.3s ease',
                  height: 200,
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: '#2d4aa1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontSize: '1.5rem',
                    color: '#ffffff'
                  }}>
                    💰
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {summaryLoading ? (
                        <Skeleton variant="text" width={100} height={40} />
                      ) : (
                        `RM ${safeDisplayNumber(dashboardData.totalRevenue, 0, (val) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`
                      )}
                    </Typography>
                    {/* Mini trend indicator */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      p: 0.5,
                      borderRadius: 1,
                      backgroundColor: dashboardData.totalRevenueChange >= 0 ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                      border: `1px solid ${dashboardData.totalRevenueChange >= 0 ? '#4caf50' : '#f44336'}`
                    }}>
                      <Box sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: `8px solid ${dashboardData.totalRevenueChange >= 0 ? '#4caf50' : '#f44336'}`,
                        transform: dashboardData.totalRevenueChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Revenue
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: dashboardData.totalRevenueChange >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      {dashboardData.totalRevenueChange >= 0 ? '▲' : '▼'} {safeDisplayPercentage(dashboardData.totalRevenueChange)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      from last month
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={6} lg={3}>
                <Paper sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper, 
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  transition: 'all 0.3s ease',
                  height: 200,
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: '#2d4aa1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    fontSize: '1.5rem',
                    color: '#ffffff'
                  }}>
                    ⭐
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {safeDisplayRating(dashboardData.averageRating, 0)}
                    </Typography>
                    {/* Mini trend indicator */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      p: 0.5,
                      borderRadius: 1,
                      backgroundColor: validateNumber(dashboardData.averageRatingChange, 0) >= 0 ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                      border: `1px solid ${validateNumber(dashboardData.averageRatingChange, 0) >= 0 ? '#4caf50' : '#f44336'}`
                    }}>
                      <Box sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: `8px solid ${validateNumber(dashboardData.averageRatingChange, 0) >= 0 ? '#4caf50' : '#f44336'}`,
                        transform: validateNumber(dashboardData.averageRatingChange, 0) >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'
                      }} />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Average Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating
                      value={validateNumber(dashboardData.averageRating, 0)}
                      precision={0.1}
                      readOnly
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {validateNumber(dashboardData.averageRatingChange, 0) !== 0 ? (
                      <>
                        <Typography
                          variant="caption"
                          sx={{ 
                            color: validateNumber(dashboardData.averageRatingChange, 0) > 0 ? 'success.main' : 'error.main',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        >
                          {validateNumber(dashboardData.averageRatingChange, 0) > 0 ? '▲' : '▼'} {safeDisplayRating(Math.abs(validateNumber(dashboardData.averageRatingChange, 0)), 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          from last month
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        No change from last month
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
              </Box>

            {/* Charts Section */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h4" 
                component="h2" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#000000',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📈 Analytics
              </Typography>
              
              <Grid 
                container 
                spacing={isMobile ? 2 : 3} 
                role="region"
                aria-label="Dashboard charts and analytics"
              >
              <Grid item xs={12} lg={6}>
                <Paper 
                  component="section"
                  role="region"
                  aria-label="Booking trends chart"
                  sx={{ 
                    p: isMobile ? 1 : 2, 
                    minHeight: isMobile ? 300 : 400, 
                    width: '100%',
                    backgroundColor: theme.palette.background.paper, 
                    color: theme.palette.text.primary,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
                    <Typography variant="h6" component="h2">Booking Trends</Typography>
                                          <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 120 }}>
                        <InputLabel id="booking-time-range-label">Time Range</InputLabel>
                        <Select
                          labelId="booking-time-range-label"
                          value={bookingTimeRange}
                          onChange={(e) => setBookingTimeRange(e.target.value)}
                          aria-label="Select booking trends time range"
                        >
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="12m">Last 12 Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ height: isMobile ? 250 : 320, position: 'relative', overflow: 'hidden' }}>
                    {bookingTrendsLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CircularProgress aria-label="Loading booking trends chart" />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                        <canvas 
                          ref={bookingChartRef} 
                          style={{ 
                            width: '100% !important', 
                            height: '100% !important',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                          role="img"
                          aria-label="Booking trends chart showing booking data over time"
                        />
                      </Box>
                    )}
                  </Box>
                  
                  {/* Booking Summary */}
                  {bookingSummary.highest && bookingSummary.lowest && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2.5, 
                      backgroundColor: alpha('#667eea', 0.08),
                      borderRadius: 2,
                      border: `1px solid ${alpha('#667eea', 0.2)}`,
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#000000' }}>
                        📊 Booking Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: '#4caf50',
                            boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                          }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Peak Day
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                              {bookingSummary.highest.value} bookings on {bookingSummary.highest.label}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: '#f44336',
                            boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)'
                          }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Low Day
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336' }}>
                              {bookingSummary.lowest.value} bookings on {bookingSummary.lowest.label}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <Paper 
                  component="section"
                  role="region"
                  aria-label="Revenue trends chart"
                  sx={{ 
                    p: isMobile ? 1 : 2, 
                    minHeight: isMobile ? 300 : 400, 
                    width: '100%',
                    backgroundColor: theme.palette.background.paper, 
                    color: theme.palette.text.primary,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
                    <Typography variant="h6" component="h2">Revenue Trends</Typography>
                                          <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 120 }}>
                        <InputLabel id="revenue-time-range-label">Time Range</InputLabel>
                        <Select
                          labelId="revenue-time-range-label"
                          value={revenueTimeRange}
                          onChange={(e) => setRevenueTimeRange(e.target.value)}
                          aria-label="Select revenue trends time range"
                        >
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="12m">Last 12 Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ height: isMobile ? 250 : 320, position: 'relative', overflow: 'hidden' }}>
                    {revenueTrendsLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <CircularProgress aria-label="Loading revenue trends chart" />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                        <canvas 
                          ref={revenueChartRef} 
                          style={{ 
                            width: '100% !important', 
                            height: '100% !important',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                          role="img"
                          aria-label="Revenue trends chart showing revenue data over time"
                        />
                      </Box>
                    )}
                  </Box>
                  
                  {/* Revenue Summary */}
                  {revenueSummary.highest && revenueSummary.lowest && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2.5, 
                      backgroundColor: alpha('#28a745', 0.08),
                      borderRadius: 2,
                      border: `1px solid ${alpha('#28a745', 0.2)}`,
                      boxShadow: '0 2px 8px rgba(40, 167, 69, 0.1)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#000000' }}>
                        💰 Revenue Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: '#4caf50',
                            boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                          }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Peak Day
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                              RM {revenueSummary.highest.value.toLocaleString()} on {revenueSummary.highest.label}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            backgroundColor: '#f44336',
                            boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)'
                          }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              Low Day
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336' }}>
                              RM {revenueSummary.lowest.value.toLocaleString()} on {revenueSummary.lowest.label}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
              </Box>

            {/* Recent Activity */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h4" 
                component="h2" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#000000',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📋 Recent Activity
              </Typography>
              
              <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 2, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Recent Activity</Typography>
                    <Button size="small" onClick={() => setActivityDialogOpen(true)} disabled={recentActivity.length <= 4}>View All</Button>
                  </Box>
                  <List>
                    {recentActivityLoading ? (
                      // Skeleton loading for recent activity
                      <>
                        {[1, 2, 3, 4].map((index) => (
                          <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton variant="text" width="60%" height={20} />
                              <Skeleton variant="text" width="80%" height={16} />
                              <Skeleton variant="text" width="40%" height={14} />
                            </Box>
                          </ListItem>
                        ))}
                      </>
                    ) : recentActivity.length === 0 ? (
                      <ListItem>
                        <ListItemText primary="No recent activity." />
                      </ListItem>
                    ) : (
                      recentActivity.slice(0, 4).map((item, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem sx={{ 
                            alignItems: 'flex-start', 
                            p: 2, 
                            borderRadius: 1,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                              transition: 'background-color 0.2s ease'
                            }
                          }}>
                            <Box sx={{ position: 'relative', mr: 2 }}>
                              <Avatar 
                                sx={{ 
                                  width: 48, 
                                  height: 48, 
                                  bgcolor: item.type === 'booking' ? '#4caf50' : 
                                          item.type === 'user' ? '#2196f3' : 
                                          item.type === 'cancellation' ? '#f44336' : '#ff9800',
                                  fontSize: '1.2rem',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                              >
                                {item.type === 'booking' ? '📅' : 
                                 item.type === 'user' ? '👤' : 
                                 item.type === 'cancellation' ? '❌' : '⭐'}
                              </Avatar>
                              {/* Status indicator */}
                              <Box sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: item.type === 'booking' ? '#4caf50' : 
                                                item.type === 'user' ? '#2196f3' : 
                                                item.type === 'cancellation' ? '#f44336' : '#ff9800',
                                border: '2px solid white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                              }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#000000' }}>
                                  {item.type === 'booking' ? 'New Booking' :
                                   item.type === 'user' ? 'New User Registration' :
                                   item.type === 'cancellation' ? 'Booking Cancellation' :
                                   'New Review'}
                                </Typography>
                                <Chip 
                                  label={item.type.toUpperCase()} 
                                  size="small" 
                                  sx={{ 
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    backgroundColor: item.type === 'booking' ? alpha('#4caf50', 0.1) : 
                                                   item.type === 'user' ? alpha('#2196f3', 0.1) : 
                                                   item.type === 'cancellation' ? alpha('#f44336', 0.1) : alpha('#ff9800', 0.1),
                                    color: item.type === 'booking' ? '#4caf50' : 
                                           item.type === 'user' ? '#2196f3' : 
                                           item.type === 'cancellation' ? '#f44336' : '#ff9800',
                                    border: `1px solid ${item.type === 'booking' ? alpha('#4caf50', 0.3) : 
                                                       item.type === 'user' ? alpha('#2196f3', 0.3) : 
                                                       item.type === 'cancellation' ? alpha('#f44336', 0.3) : alpha('#ff9800', 0.3)}`
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                                <strong>{item.user && item.user.trim() !== '' ? item.user : 'A user'}</strong> {item.detail}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: '50%', 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.6) 
                                }} />
                                <Typography variant="caption" sx={{ 
                                  color: 'text.secondary', 
                                  fontWeight: 500,
                                  fontSize: '0.75rem'
                                }}>
                                  {dayjs(item.timestamp).fromNow()}
                                </Typography>
                              </Box>
                            </Box>
                          </ListItem>
                          {idx !== Math.min(recentActivity.length, 4) - 1 && (
                            <Divider component="li" sx={{ 
                              my: 0.5, 
                              mx: 2,
                              borderColor: alpha(theme.palette.divider, 0.3)
                            }} />
                          )}
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
                            <ListItem sx={{ 
                              alignItems: 'flex-start', 
                              p: 2, 
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                transition: 'background-color 0.2s ease'
                              }
                            }}>
                              <Box sx={{ position: 'relative', mr: 2 }}>
                                <Avatar 
                                  sx={{ 
                                    width: 48, 
                                    height: 48, 
                                    bgcolor: item.type === 'booking' ? '#4caf50' : 
                                            item.type === 'user' ? '#2196f3' : 
                                            item.type === 'cancellation' ? '#f44336' : '#ff9800',
                                    fontSize: '1.2rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  {item.type === 'booking' ? '📅' : 
                                   item.type === 'user' ? '👤' : 
                                   item.type === 'cancellation' ? '❌' : '⭐'}
                                </Avatar>
                                {/* Status indicator */}
                                <Box sx={{
                                  position: 'absolute',
                                  bottom: -2,
                                  right: -2,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  backgroundColor: item.type === 'booking' ? '#4caf50' : 
                                                  item.type === 'user' ? '#2196f3' : 
                                                  item.type === 'cancellation' ? '#f44336' : '#ff9800',
                                  border: '2px solid white',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#000000' }}>
                                    {item.type === 'booking' ? 'New Booking' :
                                     item.type === 'user' ? 'New User Registration' :
                                     item.type === 'cancellation' ? 'Booking Cancellation' :
                                     'New Review'}
                                  </Typography>
                                  <Chip 
                                    label={item.type.toUpperCase()} 
                                    size="small" 
                                    sx={{ 
                                      height: 20,
                                      fontSize: '0.65rem',
                                      fontWeight: 600,
                                      backgroundColor: item.type === 'booking' ? alpha('#4caf50', 0.1) : 
                                                     item.type === 'user' ? alpha('#2196f3', 0.1) : 
                                                     item.type === 'cancellation' ? alpha('#f44336', 0.1) : alpha('#ff9800', 0.1),
                                      color: item.type === 'booking' ? '#4caf50' : 
                                             item.type === 'user' ? '#2196f3' : 
                                             item.type === 'cancellation' ? '#f44336' : '#ff9800',
                                      border: `1px solid ${item.type === 'booking' ? alpha('#4caf50', 0.3) : 
                                                         item.type === 'user' ? alpha('#2196f3', 0.3) : 
                                                         item.type === 'cancellation' ? alpha('#f44336', 0.3) : alpha('#ff9800', 0.3)}`
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                                  <strong>{item.user && item.user.trim() !== '' ? item.user : 'A user'}</strong> {item.detail}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ 
                                    width: 6, 
                                    height: 6, 
                                    borderRadius: '50%', 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.6) 
                                  }} />
                                  <Typography variant="caption" sx={{ 
                                    color: 'text.secondary', 
                                    fontWeight: 500,
                                    fontSize: '0.75rem'
                                  }}>
                                    {dayjs(item.timestamp).fromNow()}
                                  </Typography>
                                </Box>
                              </Box>
                            </ListItem>
                            {idx !== recentActivity.length - 1 && (
                              <Divider component="li" sx={{ 
                                my: 0.5, 
                                mx: 2,
                                borderColor: alpha(theme.palette.divider, 0.3)
                              }} />
                            )}
                          </React.Fragment>
                        ))}
                      </List>
                    </DialogContent>
                  </Dialog>
                </Paper>
              </Grid>



              <Grid item xs={12} lg={8}>
                <ReportGenerator 
                  onGenerateReport={generateReport} 
                  companyInfo={{ 
                    name: 'Picklefy',
                    address: 'Professional Picklefy Court Management',
                    phone: '+60 12-345 6789',
                    email: 'info@picklefy.com',
                    website: 'www.picklefy.com'
                  }}
                  isLoading={reportGenerating}
                />
              </Grid>

            </Grid>
              </Box>
          </>
        ) : null}
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminDashboard;