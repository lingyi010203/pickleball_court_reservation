import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  alpha,
  Container,
  TableContainer,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  InputAdornment,
  Grid,
  TableSortLabel,
  Divider
} from '@mui/material';
import {
  RateReview as FeedbackIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  SportsTennis as CourtIcon,
  Event as EventIcon,
  Person as CoachIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  History as HistoryIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../../service/api';
import UserService from '../../service/UserService';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLanguage } from '../../context/LanguageContext';

const AdminModerationDashboard = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);
  
  // 新增状态
  const [searchTerm, setSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  
  // 用户管理相关状态
  const [userActionDialog, setUserActionDialog] = useState({ open: false, action: '', user: null });
  const [warningMessage, setWarningMessage] = useState('');
  const [userHistory, setUserHistory] = useState([]);
  const [loadingUserHistory, setLoadingUserHistory] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [warningCount, setWarningCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', content: '', onConfirm: null });


  // 计算统计数据
  const calculateStats = () => {
    const total = feedbackList.length;
    const courtFeedback = feedbackList.filter(f => f.targetType === 'COURT').length;
    const eventFeedback = feedbackList.filter(f => f.targetType === 'EVENT').length;
    const coachFeedback = feedbackList.filter(f => f.targetType === 'COACH').length;
    
    // 评分分布
    const lowRating = feedbackList.filter(f => f.rating >= 1 && f.rating <= 2).length;
    const mediumRating = feedbackList.filter(f => f.rating >= 3 && f.rating <= 4).length;
    const highRating = feedbackList.filter(f => f.rating === 5).length;
    
    // 平均评分
    const totalRating = feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0);
    const averageRating = total > 0 ? (totalRating / total).toFixed(1) : 0;
    
    return {
      total,
      courtFeedback,
      eventFeedback,
      coachFeedback,
      lowRating,
      mediumRating,
      highRating,
      averageRating
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    // Debug: Check admin login status
    console.log('=== Admin Moderation Debug ===');
    console.log('Is Admin Logged In:', UserService.isAdminLoggedIn());
    console.log('Admin Token:', UserService.getAdminToken());
    console.log('Admin Username:', UserService.getAdminUsername());
    console.log('Regular Token:', UserService.getToken());
    console.log('Regular Role:', UserService.getRole());
    console.log('Is Admin (regular):', UserService.isAdmin());
    
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Debug: Log the request
      console.log('=== Fetching Feedback ===');
      console.log('Request URL:', '/admin/moderation/feedback');
      console.log('Admin Token:', UserService.getAdminToken());
      
      const response = await api.get('/admin/moderation/feedback');
      console.log('Response:', response.data);
      setFeedbackList(response.data || []);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      console.error('Error response:', err.response);
      setError(`Failed to load feedback data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = async (feedbackId) => {
    try {
      const response = await api.get(`/admin/moderation/feedback/${feedbackId}`);
      const feedbackData = response.data;
      
      // 如果反馈数据中包含用户邮箱，尝试获取用户详细信息
      if (feedbackData.userEmail) {
        try {
          const candidateUsername = feedbackData.userEmail.includes('@')
            ? feedbackData.userEmail.split('@')[0]
            : feedbackData.userEmail;
          const userResponse = await api.get(`/admin/user-profile/${candidateUsername}`);
          const userData = userResponse.data;
          // 获取用户警告计数
          let userWarningCount = 0;
          let userStatus = userData.status || 'ACTIVE';
          try {
            if (userData.username) {
              // 尝试从历史记录获取警告数量
              const historyRes = await api.get(`/admin/users/${userData.username}/history`);
              const historyData = historyRes.data || [];
              userWarningCount = historyData.filter(h => h.action === 'Warning').length;
            }
          } catch (e) {
            console.error('Failed to fetch user warnings in feedback view:', e);
          }

          // 合并反馈数据和用户数据
          setSelectedFeedback({
            ...feedbackData,
            userPhone: userData.phone,
            userUsername: userData.username || feedbackData.userEmail, // username用于显示
            userRealEmail: userData.email, // 真实邮箱地址
            userEmail: userData.email || feedbackData.userEmail, // 保持兼容性
            userAvatar: userData.avatar, // 添加用户头像
            userCreatedAt: userData.createdAt,
            userId: userData.id,
            userStatus: userStatus, // 用户状态
            userWarningCount: userWarningCount // 用户警告计数
          });
          setSelectedUser(userData);
        } catch (userErr) {
          console.error('Failed to fetch user details:', userErr);
          // 如果获取用户信息失败，仍然显示反馈信息，但尝试从userEmail中提取username
          setSelectedFeedback({
            ...feedbackData,
            userUsername: feedbackData.userEmail ? feedbackData.userEmail.split('@')[0] : null,
            userRealEmail: feedbackData.userEmail,
            userPhone: null,
            userAvatar: null,
            userCreatedAt: null
          });
        }
      } else {
        setSelectedFeedback({
          ...feedbackData,
          userUsername: null,
          userRealEmail: null,
          userPhone: null,
          userAvatar: null,
          userCreatedAt: null
        });
      }
    } catch (err) {
      console.error('Failed to fetch feedback details:', err);
    }
  };

  const handleViewUser = async (username) => {
    try {
      console.log('Fetching user profile for:', username);
      const response = await api.get(`/admin/user-profile/${username}`);
      console.log('User profile response:', response.data);
      console.log('Created at:', response.data.createdAt);
      console.log('Formatted date:', formatDate(response.data.createdAt));
      setSelectedUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      // 显示用户友好的错误消息
      alert(`Failed to load user details for ${username}. User may not exist or you may not have permission to view this user.`);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await api.delete(`/admin/moderation/feedback/${feedbackId}`);
      setFeedbackList(feedbackList.filter(fb => fb.id !== feedbackId));
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      alert('Failed to delete feedback.');
    }
  };

  const openDeleteDialog = (feedback) => {
    setFeedbackToDelete(feedback);
    setDeleteDialogOpen(true);
  };

  const getTargetIcon = (targetType) => {
    switch (targetType?.toUpperCase()) {
      case 'COURT':
        return <CourtIcon sx={{ fontSize: 16 }} />;
      case 'EVENT':
        return <EventIcon sx={{ fontSize: 16 }} />;
      case 'COACH':
        return <CoachIcon sx={{ fontSize: 16 }} />;
      default:
        return <FeedbackIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'PENDING':
        return <ScheduleIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />;
      case 'FAILED':
        return <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      default:
        return <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 新增函数
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };



  const handleStartDateChange = (e) => {
    setDateRange(prev => ({ ...prev, start: e.target.value }));
    setPage(0);
  };

  const handleEndDateChange = (e) => {
    setDateRange(prev => ({ ...prev, end: e.target.value }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // 过滤和搜索逻辑
  const filteredFeedbacks = feedbackList.filter(feedback => {
    const matchesSearch = searchTerm === '' || 
      feedback.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.review?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTargetType = targetTypeFilter === '' || feedback.targetType === targetTypeFilter;
    
    const matchesRating = ratingFilter === '' || 
      (ratingFilter === '1-2' && feedback.rating >= 1 && feedback.rating <= 2) ||
      (ratingFilter === '3-4' && feedback.rating >= 3 && feedback.rating <= 4) ||
      (ratingFilter === '5' && feedback.rating === 5);
    
    // 日期范围过滤
    const feedbackDate = new Date(feedback.createdAt);
    const matchesStartDate = !dateRange.start || feedbackDate >= new Date(dateRange.start);
    const matchesEndDate = !dateRange.end || feedbackDate <= new Date(dateRange.end + 'T23:59:59');
    
    return matchesSearch && matchesTargetType && matchesRating && matchesStartDate && matchesEndDate;
  });

  // 排序逻辑
  const sortedFeedbacks = filteredFeedbacks.sort((a, b) => {
    let aValue, bValue;
    
    switch (orderBy) {
      case 'userName':
        aValue = a.userName || '';
        bValue = b.userName || '';
        break;
      case 'targetName':
        aValue = a.targetName || '';
        bValue = b.targetName || '';
        break;
      case 'rating':
        aValue = a.rating || 0;
        bValue = b.rating || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      default:
        aValue = a[orderBy] || '';
        bValue = b[orderBy] || '';
    }
    
    if (order === 'desc') {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });

  const paginatedFeedbacks = sortedFeedbacks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 新增用户管理函数
  const handleUserAction = async (action) => {
    const targetUser = userActionDialog.user || selectedUser;
    if (!targetUser) return;
    
    console.log('Selected user:', targetUser);
    console.log('User ID:', targetUser.id);
    console.log('User email:', targetUser.email);
    
    // 检查用户ID是否有效
    if (!targetUser.id || isNaN(targetUser.id)) {
      alert('Invalid user ID. Please try refreshing the user details.');
      return;
    }
    
    // 先定义执行逻辑，避免TDZ
    const proceed = async () => {
      try {
        switch (action) {
          case 'warn':
            console.log('Sending warning to user ID:', targetUser.id);
            const warnResp = await api.post(`/admin/users/${targetUser.id}/warn`, {
              message: warningMessage,
              reason: 'Inappropriate feedback content',
              targetName: selectedFeedback?.targetName || null,
              targetType: selectedFeedback?.targetType || null,
              feedbackContent: selectedFeedback?.review || null,
              feedbackId: selectedFeedback?.id || null,
              feedbackCreatedAt: selectedFeedback?.createdAt || null
            });
            // 更新计数
            if (warnResp?.data) {
              setWarningCount(warnResp.data.warningCount ?? warningCount);
            }
            setSnackbar({ open: true, message: `Warning sent (${warnResp?.data?.deliveryStatus || 'UNKNOWN'}).`, severity: 'success' });
            break;
          case 'disable':
            await api.put(`/admin/users/${targetUser.id}/status`, { status: 'SUSPENDED', reason: 'Multiple policy violations' });
            setSnackbar({ open: true, message: 'User suspended successfully.', severity: 'success' });
            break;
          case 'enable':
            await api.put(`/admin/users/${targetUser.id}/status`, { status: 'ACTIVE', reason: 'Account reactivated' });
            setSnackbar({ open: true, message: 'User enabled successfully.', severity: 'success' });
            break;
          default:
            break;
        }
        
        // 刷新用户信息（非致命）
        try {
          if (targetUser.id) {
            const response = await api.get(`/admin/users/${targetUser.id}`);
            setSelectedUser(response.data);
          }
        } catch (refreshErr) {
          console.warn('Refresh user info failed:', refreshErr);
          setSnackbar({ open: true, message: 'User updated, but failed to refresh profile view.', severity: 'warning' });
        }
        
        setUserActionDialog({ open: false, action: '', user: null });
        setWarningMessage('');
        
      } catch (err) {
        console.error('Failed to perform user action:', err);
        setSnackbar({
          open: true,
          message: `Failed to ${action} user: ${err.response?.data?.message || err.message}`,
          severity: 'error'
        });
      }
    };

    // 操作确认（后定义，回调中调用已定义的 proceed）
    const confirmMap = {
      warn: {
        title: 'Send Warning',
        content: `Send warning to ${targetUser.name || targetUser.username}?`,
      },
      disable: {
        title: 'Suspend User',
        content: `Suspend ${targetUser.name || targetUser.username}?`,
      },
      enable: {
        title: 'Enable User',
        content: `Enable ${targetUser.name || targetUser.username}?`,
      }
    };
    const cfg = confirmMap[action];
    if (cfg) {
      setConfirmDialog({ open: true, title: cfg.title, content: cfg.content, onConfirm: async () => {
        setConfirmDialog({ open: false, title: '', content: '', onConfirm: null });
        await proceed();
      }});
      return;
    }

    // 若未匹配到弹窗，则直接执行
    if (!cfg) await proceed();
  };

  const handleViewUserHistory = async (usernameOrEmail) => {
    try {
      setLoadingUserHistory(true);
      
      // 首先尝试使用传入的参数作为username获取用户信息
      let userResponse;
      try {
        const candidateUsername = usernameOrEmail && usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail;
        userResponse = await api.get(`/admin/user-profile/${candidateUsername}`);
      } catch (firstErr) {
        // 如果第一次失败，可能是email，尝试从反馈数据中找到对应的username
        const userFeedback = feedbackList.filter(feedback => 
          feedback.userEmail === usernameOrEmail || feedback.userName === usernameOrEmail
        );
        
        if (userFeedback.length > 0) {
          // 尝试使用反馈中的userEmail作为username
          try {
            const candidate2 = userFeedback[0].userEmail && userFeedback[0].userEmail.includes('@')
              ? userFeedback[0].userEmail.split('@')[0]
              : userFeedback[0].userEmail;
            userResponse = await api.get(`/admin/user-profile/${candidate2}`);
          } catch (secondErr) {
            throw new Error('User not found');
          }
        } else {
          throw new Error('User not found');
        }
      }
      
      const userData = userResponse.data;
      const actualUsername = userData.username || userData.email;

      // 获取用户历史记录（使用实际的username）
      const historyResponse = await api.get(`/admin/users/${actualUsername}/history`);
      const historyData = historyResponse.data || [];
      
      // 从历史记录中计算警告数量
      const warningCount = historyData.filter(h => h.action === 'Warning').length;
      console.log('Warning count from history:', warningCount);
      setWarningCount(warningCount);
      
      // 从当前反馈列表中筛选出该用户的反馈
      const userFeedback = feedbackList.filter(feedback => 
        feedback.userEmail === userData.email || 
        feedback.userEmail === userData.username ||
        feedback.userName === userData.name
      );
      
      // 构建用户活动历史
      const userHistory = {
        user: userData,
        history: historyData,
        feedback: userFeedback,
        statistics: {
          totalFeedback: userFeedback.length,
          avgRating: userFeedback.length > 0 
            ? userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length 
            : 0,
          totalHistoryItems: historyData.length,
          warningCount: warningCount // 添加警告计数
        }
      };
      
      console.log('Final userHistory statistics:', userHistory.statistics);
      console.log('History data length:', historyData.length);
      console.log('Warning count from API:', warningCount);
      
      setUserHistory(userHistory);
      setUserActionDialog({ open: true, action: 'history', user: userData });
    } catch (err) {
      console.error('Failed to fetch user history:', err);
      
      // 检查是否是用户不存在的错误
      if (err.response?.status === 404 || err.message?.includes('User not found')) {
        // 创建简化的用户信息，显示从反馈中获取的信息
        const userFeedback = feedbackList.filter(feedback => 
          feedback.userEmail === usernameOrEmail || feedback.userName === usernameOrEmail
        );
        
        const simplifiedUser = {
          id: 'N/A',
          name: userFeedback[0]?.userName || 'Unknown User',
          email: usernameOrEmail,
          username: usernameOrEmail,
          phone: 'Not available',
          createdAt: 'N/A',
          status: 'Unknown'
        };
        
        const userHistory = {
          user: simplifiedUser,
          history: [],
          feedback: userFeedback,
          statistics: {
            totalFeedback: userFeedback.length,
            avgRating: userFeedback.length > 0 
              ? userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length 
              : 0,
            totalHistoryItems: 0
          }
        };
        
        setUserHistory(userHistory);
        setUserActionDialog({ open: true, action: 'history', user: simplifiedUser });
        
        setSnackbar({
          open: true,
          message: 'User profile not found, showing available feedback data only.',
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to load user history. Please try again.',
          severity: 'error'
        });
      }
    } finally {
      setLoadingUserHistory(false);
    }
  };

  const openUserActionDialog = (action) => {
    const fallbackFromFeedback = selectedFeedback?.userId
      ? {
          id: selectedFeedback.userId,
          name: selectedFeedback.userName,
          email: selectedFeedback.userRealEmail || selectedFeedback.userEmail,
          username: selectedFeedback.userUsername,
        }
      : null;
    setUserActionDialog({ open: true, action, user: selectedUser || fallbackFromFeedback });
  };

  const getUserStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'DISABLED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getUserTypeIcon = (userType) => {
    switch (userType?.toUpperCase()) {
      case 'COACH':
        return <CoachIcon />;
      case 'EVENTORGANIZER':
        return <EventIcon />;
      case 'ADMIN':
        return <PersonIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress size={48} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {t('admin.feedbackManagement')}
          </Typography>
      </Box>

      {/* Statistics Dashboard */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, 
        gap: 2, 
        mb: 3 
      }}>
        {/* Total Feedback */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
            {stats.total}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.totalFeedback')}
          </Typography>
        </Paper>

        {/* Average Rating */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
            '&:hover': { 
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ff9800' }}>
            {stats.averageRating}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.avgRating')}
          </Typography>
        </Paper>

        {/* Low Rating (1-2 Stars) */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#f44336' }}>
            {stats.lowRating}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.oneToTwoStars')}
          </Typography>
        </Paper>

        {/* Medium Rating (3-4 Stars) */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#ff9800' }}>
            {stats.mediumRating}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.threeToFourStars')}
          </Typography>
        </Paper>

        {/* High Rating (5 Stars) */}
        <Paper sx={{ 
          p: 3, 
          textAlign: 'center', 
          borderRadius: '12px',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: theme.palette.grey[200],
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderColor: theme.palette.primary.main
          }
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#4caf50' }}>
            {stats.highRating}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {t('admin.fiveStars')}
          </Typography>
        </Paper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Actions Bar */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tooltip title={t('admin.searchByUserTargetOrReview')} arrow>
          <TextField
              placeholder={t('admin.search')}
            variant="outlined"
              size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange({ target: { value: '' } })}
                    sx={{ mr: 1 }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>✕</Typography>
                  </IconButton>
                )
              }}
              sx={{ minWidth: 200 }}
            />
          </Tooltip>





          <TextField
            type="date"
            size="small"
            label={t('admin.fromDate')}
            value={dateRange.start}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            type="date"
            size="small"
            label={t('admin.toDate')}
            value={dateRange.end}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('admin.quickDate')}</InputLabel>
            <Select
              value=""
              onChange={(e) => {
                const today = new Date();
                const value = e.target.value;
                let startDate = '';
                let endDate = '';
                
                switch (value) {
                  case 'today':
                    startDate = today.toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                  case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    startDate = weekAgo.toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                  case 'month':
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    startDate = monthAgo.toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                  default:
                    break;
                }
                
                setDateRange({ start: startDate, end: endDate });
              }}
              label={t('admin.quickDate')}
            >
              <MenuItem value="today">{t('admin.today')}</MenuItem>
              <MenuItem value="week">{t('admin.last7Days')}</MenuItem>
              <MenuItem value="month">{t('admin.last30Days')}</MenuItem>
            </Select>
          </FormControl>

            <Button
              variant="outlined"
            size="small"
              color="error"
            onClick={() => {
              setSearchTerm('');
              setTargetTypeFilter('');
              setRatingFilter('');
              setDateRange({ start: '', end: '' });
            }}
            sx={{
              borderRadius: '8px',
              px: 2,
              py: 1,
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }}
                      >
            {t('admin.clear')}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchFeedback}
            disabled={loading}
            sx={{
              borderRadius: '8px',
              px: 2,
              py: 1,
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }}
                      >
            {t('admin.refresh')}
            </Button>
          </Box>
        </Paper>

      {/* Quick Filter Buttons */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${t('admin.all')} (${stats.total})`}
            onClick={() => {
              setTargetTypeFilter('');
              setRatingFilter('');
              setDateRange({ start: '', end: '' });
            }}
            color={!targetTypeFilter && !ratingFilter && !dateRange.start && !dateRange.end ? 'primary' : 'default'}
            variant={!targetTypeFilter && !ratingFilter && !dateRange.start && !dateRange.end ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`${t('admin.court')} (${stats.courtFeedback})`}
            onClick={() => setTargetTypeFilter('COURT')}
            color={targetTypeFilter === 'COURT' ? 'primary' : 'default'}
            variant={targetTypeFilter === 'COURT' ? 'filled' : 'outlined'}
            icon={<CourtIcon />}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`${t('admin.event')} (${stats.eventFeedback})`}
            onClick={() => setTargetTypeFilter('EVENT')}
            color={targetTypeFilter === 'EVENT' ? 'primary' : 'default'}
            variant={targetTypeFilter === 'EVENT' ? 'filled' : 'outlined'}
            icon={<EventIcon />}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`${t('admin.coach')} (${stats.coachFeedback})`}
            onClick={() => setTargetTypeFilter('COACH')}
            color={targetTypeFilter === 'COACH' ? 'primary' : 'default'}
            variant={targetTypeFilter === 'COACH' ? 'filled' : 'outlined'}
            icon={<CoachIcon />}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label={`${t('admin.lowRating')} (${stats.lowRating})`}
            onClick={() => setRatingFilter('1-2')}
            color={ratingFilter === '1-2' ? 'error' : 'default'}
            variant={ratingFilter === '1-2' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer', color: ratingFilter === '1-2' ? 'white' : '#f44336' }}
          />
          <Chip
            label={`${t('admin.highRating')} (${stats.highRating})`}
            onClick={() => setRatingFilter('5')}
            color={ratingFilter === '5' ? 'success' : 'default'}
            variant={ratingFilter === '5' ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer', color: ratingFilter === '5' ? 'white' : '#4caf50' }}
          />
        </Box>
      </Paper>



      {/* Feedback Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <Table>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
          <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  {t('admin.feedbackId')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'asc'}
                  onClick={() => handleSort('createdAt')}
                >
                  {t('admin.date')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'userName'}
                  direction={orderBy === 'userName' ? order : 'asc'}
                  onClick={() => handleSort('userName')}
                >
                  {t('admin.user')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'targetName'}
                  direction={orderBy === 'targetName' ? order : 'asc'}
                  onClick={() => handleSort('targetName')}
                >
                  {t('admin.target')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>{t('admin.review')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                <TableSortLabel
                  active={orderBy === 'rating'}
                  direction={orderBy === 'rating' ? order : 'asc'}
                  onClick={() => handleSort('rating')}
                >
                  {t('admin.rating')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }} align="center">{t('admin.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            {paginatedFeedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FilterIcon sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 2 }} />
                    <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                      {filteredFeedbacks.length === 0 && feedbackList.length > 0 ? t('admin.noFeedbackMatchesFilters') : t('admin.noFeedbackFound')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {filteredFeedbacks.length === 0 && feedbackList.length > 0 ? t('admin.tryAdjustingSearchCriteria') : t('admin.noFeedbackToModerate')}
                    </Typography>
                    {filteredFeedbacks.length === 0 && feedbackList.length > 0 && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSearchTerm('');
                          setTargetTypeFilter('');
                          setRatingFilter('');
                          setDateRange({ start: '', end: '' });
                        }}
                        sx={{
                          borderRadius: '8px',
                          px: 2,
                          py: 1,
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        {t('admin.clearFilters')}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedFeedbacks.map((feedback) => {
                return (
                  <TableRow 
                    key={feedback.id} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      },
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, fontFamily: 'monospace' }}>
                        #{feedback.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                        {formatDate(feedback.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                            {feedback.userName || t('admin.unknownUser')}
                          </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                            {feedback.targetName || t('admin.unknownTarget')}
                          </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {truncateText(feedback.review, 60)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {[...Array(5)].map((_, index) => (
                          <StarIcon
                            key={index}
                            sx={{
                              fontSize: 16,
                              color: index < (feedback.rating || 0) ? '#ff9800' : '#e0e0e0'
                            }}
                          />
                        ))}
                        <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, color: theme.palette.text.primary }}>
                          ({feedback.rating || 0})
                        </Typography>
                      </Box>
                    </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={t('admin.viewFeedbackAndUserDetails')}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFeedback(feedback.id);
                            }}
                            sx={{ color: theme.palette.primary.main }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={t('admin.deleteFeedback')}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(feedback);
                            }}
                            sx={{ color: theme.palette.error.main }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
              </TableCell>
            </TableRow>
                );
              })
            )}
        </TableBody>
      </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredFeedbacks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Unified Feedback & User Detail Dialog */}
      <Dialog 
        open={!!selectedFeedback} 
        onClose={() => setSelectedFeedback(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 0, background: '#f8f9fa' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, pb: 1, background: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          {t('admin.feedbackDetails')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {selectedFeedback && (
            <>
              {/* Feedback Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {t('admin.feedbackInfo')}
                </Typography>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  {/* ID and Rating */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>
                      #{selectedFeedback.id || '-'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {[...Array(5)].map((_, index) => (
                        <StarIcon
                          key={index}
                          sx={{
                            color: index < selectedFeedback.rating ? theme.palette.warning.main : theme.palette.grey[300],
                            fontSize: 20
                          }}
                        />
                      ))}
                      <Typography variant="body1" sx={{ fontWeight: 500, ml: 1 }}>
                        ({selectedFeedback.rating}/5)
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Target Information */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    {getTargetIcon(selectedFeedback.targetType)}
                    <Typography variant="body1" fontWeight={500}>
                    {selectedFeedback.targetName}
                  </Typography>
                  <Chip 
                    label={selectedFeedback.targetType} 
                    color="primary" 
                    variant="outlined"
                      size="small"
                  />
                </Box>

                  {/* Created Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.created')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {formatDate(selectedFeedback.createdAt)}
                    </Typography>
                </Box>
              </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              
              {/* Review Content */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {t('admin.reviewContent')}
              </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {selectedFeedback.review || t('admin.noReviewProvided')}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              
              {/* User Information */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {t('admin.userInformation')}
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#5d3587', 
                        width: 48, 
                        height: 48,
                        fontSize: '1.2rem',
                        fontWeight: 600
                      }}
                    >
                      {selectedFeedback.userAvatar ? (
                        <img 
                          src={selectedFeedback.userAvatar} 
                          alt="User Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (selectedFeedback.userName || selectedFeedback.userUsername || (selectedFeedback.userEmail ? selectedFeedback.userEmail.split('@')[0] : 'U')).charAt(0).toUpperCase()
                      )}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={500}>
                        {selectedFeedback.userName || t('admin.unknownUser')}
                  </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        @{selectedFeedback.userUsername || (selectedFeedback.userEmail ? selectedFeedback.userEmail.split('@')[0] : 'unknown')}
                      </Typography>
                    </Box>
                    <Chip 
                      label={selectedFeedback.userStatus || "Active"} 
                      color={selectedFeedback.userStatus === 'SUSPENDED' ? 'error' : 'success'} 
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t('admin.email')}
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                        {selectedFeedback.userRealEmail || selectedFeedback.userEmail || t('admin.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t('admin.phoneNumber')}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedFeedback.userPhone || t('admin.notProvided')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t('admin.warnings')}
                      </Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ 
                        color: selectedFeedback.userWarningCount >= 3 ? 'error.main' : 'text.primary' 
                      }}>
                        {selectedFeedback.userWarningCount || 0} / 3
                      </Typography>
                    </Box>
                  </Box>
                    </Box>
                    </Box>
              <Divider sx={{ my: 2 }} />
              
              {/* Admin Actions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {t('admin.adminActions')}
              </Typography>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                      size="small"
                  variant="outlined"
                      color="primary"
                  startIcon={<HistoryIcon />}
                      onClick={() => handleViewUserHistory(selectedFeedback.userUsername || selectedFeedback.userEmail)}
                >
                      {t('admin.viewUserProfile')}
                </Button>
                <Button
                      size="small"
                  variant="outlined"
                      color="warning"
                  startIcon={<WarningIcon />}
                  onClick={() => openUserActionDialog('warn')}
                >
                  {t('admin.sendWarning')}
                </Button>
                  <Button
                      size="small"
                    variant="outlined"
                    color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => openDeleteDialog(selectedFeedback)}
                    >
                      {t('admin.deleteFeedback')}
                </Button>
              </Box>
            </Box>
              </Box>
            </>
          )}
          </DialogContent>
        <DialogActions sx={{ background: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, flexDirection: 'column', alignItems: 'stretch', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setSelectedFeedback(null)} color="primary" variant="outlined">
              {t('admin.close')}
            </Button>
          </Box>
          </DialogActions>
        </Dialog>

      {/* User Action Dialog */}
      <Dialog 
        open={userActionDialog.open} 
        onClose={() => setUserActionDialog({ open: false, action: '', user: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 0, background: '#f8f9fa' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, pb: 1, background: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          {userActionDialog.action === 'warn' && 'Send Warning'}
          {userActionDialog.action === 'disable' && 'Disable User'}
          {userActionDialog.action === 'enable' && 'Enable User'}
          {userActionDialog.action === 'history' && 'User History'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {userActionDialog.action === 'warn' && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Send a warning message to {userActionDialog.user?.name}:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="Enter warning message..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                This warning will be sent via email and recorded in the user's history.
              </Typography>
            </Box>
          )}
          
          {userActionDialog.action === 'disable' && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to disable {userActionDialog.user?.name}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Disabled users cannot log in or use the platform. They will receive an email notification.
              </Typography>
            </Box>
          )}
          
          {userActionDialog.action === 'enable' && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to enable {userActionDialog.user?.name}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The user will be able to log in and use the platform again.
              </Typography>
            </Box>
          )}
          
          {userActionDialog.action === 'delete' && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete {userActionDialog.user?.name}?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                This action cannot be undone. All user data will be permanently deleted.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This includes bookings, feedback, and account information.
              </Typography>
            </Box>
          )}
          
          {userActionDialog.action === 'history' && (
            <Box>
              {loadingUserHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : userHistory && userHistory.user ? (
                <Box>
                  {/* User Basic Info */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#5d3587', 
                          width: 48, 
                          height: 48,
                          fontSize: '1.2rem',
                          fontWeight: 600
                        }}
                      >
                        {userHistory.user.avatar ? (
                          <img 
                            src={userHistory.user.avatar} 
                            alt="User Avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (userHistory.user.name || userHistory.user.username || 'U').charAt(0).toUpperCase()
                        )}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {userHistory.user.name || 'Unknown User'}
                  </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          @{userHistory.user.username || 'unknown'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={userHistory.user.status || "Active"} 
                        color={userHistory.user.status === 'SUSPENDED' ? 'error' : 'success'} 
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Email
                        </Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                          {userHistory.user.email || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Phone
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {userHistory.user.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Disabled Banner */}
                  {(userHistory.user?.status === 'SUSPENDED' || (userHistory.statistics?.warningCount || 0) >= 3) && (
                    <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: '#fff3f3', border: '1px solid #ffcdd2' }}>
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                        This account is suspended {(userHistory.statistics?.warningCount || 0) >= 3 ? '(warnings threshold reached)' : ''}
                      </Typography>
                    </Box>
                  )}

                  {/* User Statistics */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      User Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            {userHistory.statistics?.totalFeedback || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reviews Given
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            {userHistory.statistics?.avgRating?.toFixed(1) || '0.0'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avg Rating
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            {userHistory.statistics?.warningCount || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Warnings
                          </Typography>
                        </Box>
                      </Grid>

                    </Grid>
                  </Box>

                  {/* User Warnings */}
                  {userHistory.history && userHistory.history.filter(h => h.action === 'Warning').length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                        Warnings ({userHistory.history.filter(h => h.action === 'Warning').length})
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {userHistory.history
                          .filter(h => h.action === 'Warning')
                          .slice(0, 5)
                          .map((warning, index) => (
                          <Box key={index} sx={{ 
                            p: 1.5, 
                            mb: 1, 
                            border: `1px solid ${theme.palette.warning.light}`, 
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.warning.main, 0.05)
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.warning.dark }}>
                                Warning #{index + 1}
                              </Typography>
                              <Chip 
                                label={warning.deliveryStatus || 'UNKNOWN'} 
                                size="small" 
                                color={warning.deliveryStatus === 'SENT' ? 'success' : 'error'}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                            
                            {/* 警告详情 */}
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Reason:</strong> {warning.reason || 'No reason provided'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Message:</strong> {warning.message || 'No message provided'}
                              </Typography>
                              {warning.targetName && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  <strong>Target:</strong> {warning.targetName} ({warning.targetType})
                                </Typography>
                              )}
                              {warning.feedbackContent && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  <strong>Feedback:</strong> {truncateText(warning.feedbackContent, 100)}
                                </Typography>
                              )}
                              {warning.feedbackCreatedAt && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  <strong>Feedback Date:</strong> {formatDate(warning.feedbackCreatedAt)}
                                </Typography>
                              )}
                            </Box>
                            
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(warning.timestamp)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Other Activity History */}
                  {userHistory.history && userHistory.history.filter(h => h.action !== 'Warning').length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        Other Activity ({userHistory.history.filter(h => h.action !== 'Warning').length})
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {userHistory.history
                          .filter(h => h.action !== 'Warning')
                          .slice(0, 10)
                          .map((activity, index) => (
                      <Box key={index} sx={{ 
                        p: 1.5, 
                        mb: 1, 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.background.paper, 0.5)
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {activity.action || 'Unknown Action'}
                        </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {activity.description || 'No description available'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                  )}

                  {/* Recent Feedback */}
                  {userHistory.feedback && userHistory.feedback.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                        Recent Reviews ({userHistory.feedback.length})
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {userHistory.feedback.slice(0, 5).map((feedback, index) => (
                          <Box key={index} sx={{ 
                            p: 1.5, 
                            mb: 1, 
                            border: `1px solid ${theme.palette.divider}`, 
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.background.paper, 0.5)
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {feedback.targetName || 'Unknown Target'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {truncateText(feedback.review, 80)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(feedback.createdAt)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    sx={{
                                      color: i < feedback.rating ? theme.palette.warning.main : theme.palette.grey[300],
                                      fontSize: 16
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* No Activity Message */}
                  {(!userHistory.history || userHistory.history.length === 0) && 
                   (!userHistory.feedback || userHistory.feedback.length === 0) && (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No activity history found for this user.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Failed to load user history.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ background: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, flexDirection: 'column', alignItems: 'stretch', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setUserActionDialog({ open: false, action: '', user: null })} color="primary" variant="outlined">
            Cancel
          </Button>
          {userActionDialog.action !== 'history' && (
            <Button 
              onClick={() => handleUserAction(userActionDialog.action)}
              color={
                userActionDialog.action === 'warn' ? 'warning' :
                userActionDialog.action === 'disable' || userActionDialog.action === 'delete' ? 'error' :
                userActionDialog.action === 'enable' ? 'success' : 'primary'
              }
              variant="contained"
            >
              {userActionDialog.action === 'warn' && 'Send Warning'}
              {userActionDialog.action === 'disable' && 'Disable User'}
              {userActionDialog.action === 'enable' && 'Enable User'}
              {userActionDialog.action === 'delete' && 'Delete User'}
            </Button>
          )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 0, background: '#f8f9fa' }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          fontSize: 22, 
          pb: 1, 
          background: '#fff', 
          borderTopLeftRadius: 16, 
          borderTopRightRadius: 16,
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: theme.palette.error.main
        }}>
          <DeleteIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />
          {t('admin.confirmDeleteFeedback')}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e9ecef', mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: theme.palette.text.primary }}>
            {t('admin.deleteFeedbackConfirmation')}
          </Typography>
            
          {feedbackToDelete && (
              <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  {t('admin.feedbackInfo')}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.feedbackId')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                      #{feedbackToDelete.id}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.user')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {feedbackToDelete.userName || t('admin.unknownUser')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.target')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {feedbackToDelete.targetName || t('admin.unknownTarget')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.rating')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {[...Array(5)].map((_, index) => (
                        <StarIcon
                          key={index}
                          sx={{
                            fontSize: 14,
                            color: index < (feedbackToDelete.rating || 0) ? '#ff9800' : '#e0e0e0'
                          }}
                        />
                      ))}
                      <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600 }}>
                        ({feedbackToDelete.rating || 0})
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.reviewContent')}
                    </Typography>
                  <Typography variant="body2" sx={{ 
                    p: 1, 
                    bgcolor: 'white', 
              borderRadius: 1,
                    border: '1px solid #e9ecef',
                    mt: 0.5,
                    lineHeight: 1.4,
                    maxHeight: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {feedbackToDelete.review || t('admin.noReviewProvided')}
              </Typography>
                </Box>
              </Box>
            )}
            
            <Box sx={{ p: 2, bgcolor: '#fff3cd', borderRadius: 2, border: '1px solid #ffeaa7' }}>
              <Typography variant="body2" color="#856404" sx={{ fontWeight: 500, mb: 1 }}>
                ⚠️ Warning
              </Typography>
              <Typography variant="body2" color="#856404">
                This action will permanently delete the feedback and cannot be undone. The feedback will be removed from the system and will no longer be visible to users.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          background: '#fff', 
          borderBottomLeftRadius: 16, 
          borderBottomRightRadius: 16, 
          flexDirection: 'column', 
          alignItems: 'stretch', 
          p: 2 
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
              onClick={() => setDeleteDialogOpen(false)} 
              color="primary" 
              variant="outlined"
              sx={{
                borderRadius: '8px',
                px: 3,
                py: 1,
                fontWeight: 600,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }
              }}
            >
              {t('admin.cancel')}
            </Button>
            <Button 
              onClick={handleDeleteFeedback} 
            color="error"
            variant="contained"
              startIcon={<DeleteIcon />}
              sx={{
                borderRadius: '8px',
                px: 3,
                py: 1,
                fontWeight: 600,
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }
              }}
            >
              {t('admin.delete')}
          </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, title: '', content: '', onConfirm: null })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.content}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, title: '', content: '', onConfirm: null })}>Cancel</Button>
          <Button variant="contained" onClick={() => confirmDialog.onConfirm && confirmDialog.onConfirm()}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminModerationDashboard;