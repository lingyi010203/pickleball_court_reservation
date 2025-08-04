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
  Checkbox,
  TablePagination,
  InputAdornment,
  Grid
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
  Edit as EditIcon
} from '@mui/icons-material';
import api from '../../service/api';
import UserService from '../../service/UserService';

const AdminModerationDashboard = () => {
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
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  
  // 用户管理相关状态
  const [userActionDialog, setUserActionDialog] = useState({ open: false, action: '', user: null });
  const [warningMessage, setWarningMessage] = useState('');
  const [userHistory, setUserHistory] = useState([]);
  const [loadingUserHistory, setLoadingUserHistory] = useState(false);

  // 过滤选项
  const targetTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'COURT', label: 'Court' },
    { value: 'EVENT', label: 'Event' },
    { value: 'COACH', label: 'Coach' }
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '1-2', label: '1-2 Stars' },
    { value: '3-4', label: '3-4 Stars' },
    { value: '5', label: '5 Stars' }
  ];

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
      setSelectedFeedback(response.data);
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

  const handleTargetTypeFilterChange = (e) => {
    setTargetTypeFilter(e.target.value);
    setPage(0);
  };

  const handleRatingFilterChange = (e) => {
    setRatingFilter(e.target.value);
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelectedFeedbacks(feedbackList.map(fb => fb.id));
    } else {
      setSelectedFeedbacks([]);
    }
  };

  const handleSelectFeedback = (event, id) => {
    const selectedIndex = selectedFeedbacks.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedFeedbacks, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedFeedbacks.slice(1));
    } else if (selectedIndex === selectedFeedbacks.length - 1) {
      newSelected = newSelected.concat(selectedFeedbacks.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedFeedbacks.slice(0, selectedIndex),
        selectedFeedbacks.slice(selectedIndex + 1),
      );
    }

    setSelectedFeedbacks(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedFeedbacks.length === 0) return;
    
    try {
      // 这里需要后端支持批量删除 API
      for (const feedbackId of selectedFeedbacks) {
        await api.delete(`/admin/moderation/feedback/${feedbackId}`);
      }
      setFeedbackList(feedbackList.filter(fb => !selectedFeedbacks.includes(fb.id)));
      setSelectedFeedbacks([]);
    } catch (err) {
      console.error('Failed to delete feedbacks:', err);
      alert('Failed to delete selected feedbacks.');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selectedFeedbacks.indexOf(id) !== -1;

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
    
    return matchesSearch && matchesTargetType && matchesRating;
  });

  const paginatedFeedbacks = filteredFeedbacks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 新增用户管理函数
  const handleUserAction = async (action) => {
    if (!selectedUser) return;
    
    console.log('Selected user:', selectedUser);
    console.log('User ID:', selectedUser.id);
    console.log('User email:', selectedUser.email);
    
    // 检查用户ID是否有效
    if (!selectedUser.id || isNaN(selectedUser.id)) {
      alert('Invalid user ID. Please try refreshing the user details.');
      return;
    }
    
    try {
      switch (action) {
        case 'warn':
          console.log('Sending warning to user ID:', selectedUser.id);
          await api.post(`/admin/users/${selectedUser.id}/warn`, {
            message: warningMessage,
            reason: 'Inappropriate feedback content'
          });
          alert('Warning sent successfully');
          break;
          
        case 'disable':
          await api.put(`/admin/users/${selectedUser.id}/status`, {
            status: 'DISABLED',
            reason: 'Multiple policy violations'
          });
          alert('User disabled successfully');
          break;
          
        case 'enable':
          await api.put(`/admin/users/${selectedUser.id}/status`, {
            status: 'ACTIVE',
            reason: 'Account reactivated'
          });
          alert('User enabled successfully');
          break;
          

          
        default:
          break;
      }
      
      // 刷新用户信息
      if (selectedUser) {
        console.log('Refreshing user info for:', selectedUser.username || selectedUser.email);
        const response = await api.get(`/admin/user-profile/${selectedUser.username || selectedUser.email}`);
        console.log('Refreshed user data:', response.data);
        setSelectedUser(response.data);
      }
      
      setUserActionDialog({ open: false, action: '', user: null });
      setWarningMessage('');
      
    } catch (err) {
      console.error('Failed to perform user action:', err);
      alert(`Failed to ${action} user: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleViewUserHistory = async (username) => {
    try {
      setLoadingUserHistory(true);
      const response = await api.get(`/admin/users/${username}/history`);
      setUserHistory(response.data || []);
      setUserActionDialog({ open: true, action: 'history', user: selectedUser });
    } catch (err) {
      console.error('Failed to fetch user history:', err);
      alert('Failed to load user history');
    } finally {
      setLoadingUserHistory(false);
    }
  };

  const openUserActionDialog = (action) => {
    setUserActionDialog({ open: true, action, user: selectedUser });
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

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}>
            Feedback Management
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary, 
            mt: 1 
          }}>
            Manage and moderate user feedback and reviews
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchFeedback}
          sx={{ 
            backgroundColor: theme.palette.primary.main, 
            color: theme.palette.primary.contrastText, 
            fontWeight: 600, 
            borderRadius: 3, 
            px: 3, 
            py: 1.2, 
            boxShadow: theme.shadows[2], 
            '&:hover': { 
              backgroundColor: theme.palette.primary.dark, 
              boxShadow: theme.shadows[4] 
            } 
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <TextField
            sx={{ minWidth: 220 }}
            variant="outlined"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel shrink>Target Type</InputLabel>
            <Select
              value={targetTypeFilter}
              onChange={handleTargetTypeFilterChange}
              displayEmpty
              renderValue={(selected) => selected || "All Types"}
            >
              {targetTypeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel shrink>Rating</InputLabel>
            <Select
              value={ratingFilter}
              onChange={handleRatingFilterChange}
              displayEmpty
              renderValue={(selected) => selected || "All Ratings"}
            >
              {ratingOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {filteredFeedbacks.length} feedback(s) found
          </Typography>
        </Box>
      </Paper>

      {/* Batch Operation Bar */}
      {selectedFeedbacks.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1">
              {selectedFeedbacks.length} feedback(s) selected
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

      {/* Feedback Table */}
      <TableContainer component={Paper} sx={{ 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
      <Table>
          <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[100] }}>
          <TableRow>
              <TableCell padding="checkbox" sx={{ color: theme.palette.text.primary }}>
                <Checkbox
                  indeterminate={selectedFeedbacks.length > 0 && selectedFeedbacks.length < filteredFeedbacks.length}
                  checked={filteredFeedbacks.length > 0 && selectedFeedbacks.length === filteredFeedbacks.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>User</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Review</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Rating</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            {paginatedFeedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FeedbackIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      {filteredFeedbacks.length === 0 && feedbackList.length > 0 ? 'No feedback matches your filters' : 'No feedback found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filteredFeedbacks.length === 0 && feedbackList.length > 0 ? 'Try adjusting your search criteria' : 'There are no feedback entries to moderate at this time.'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedFeedbacks.map((feedback) => {
                const isItemSelected = isSelected(feedback.id);
                return (
                  <TableRow 
                    key={feedback.id} 
                    selected={isItemSelected}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                        transition: 'all 0.2s ease-in-out'
                      },
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={(event) => handleSelectFeedback(event, feedback.id)}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {feedback.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {feedback.userName || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {feedback.userEmail || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTargetIcon(feedback.targetType)}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {feedback.targetName || 'Unknown Target'}
                          </Typography>
                          <Chip 
                            label={feedback.targetType || 'Unknown'} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {truncateText(feedback.review, 60)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ color: theme.palette.warning.main, fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {feedback.rating || 0}
                        </Typography>
                        {feedback.averageRating && (
                          <Typography variant="caption" color="text.secondary">
                            (avg: {feedback.averageRating.toFixed(1)})
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
              <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                        <Typography variant="body2">
                          {formatDate(feedback.createdAt)}
                        </Typography>
                      </Box>
              </TableCell>
              <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
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
                                               <Tooltip title="View User">
                         <IconButton
                           size="small"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleViewUser(feedback.userEmail);
                           }}
                           sx={{ color: theme.palette.info.main }}
                         >
                           <PersonIcon />
                         </IconButton>
                       </Tooltip>
                        <Tooltip title="Delete Feedback">
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

      {/* Feedback Detail Dialog */}
      <Dialog 
        open={!!selectedFeedback} 
        onClose={() => setSelectedFeedback(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <FeedbackIcon color="primary" />
          Feedback Details
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedFeedback && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedFeedback.targetName}
                  </Typography>
                  <Chip 
                    label={selectedFeedback.targetType} 
                    color="primary" 
                    variant="outlined"
                    icon={getTargetIcon(selectedFeedback.targetType)}
                  />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <StarIcon sx={{ color: theme.palette.warning.main }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {selectedFeedback.rating}
                    </Typography>
                  </Box>
                  {selectedFeedback.averageRating && (
                    <Typography variant="body2" color="text.secondary">
                      Average: {selectedFeedback.averageRating.toFixed(1)}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                {selectedFeedback.review}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    By {selectedFeedback.userName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedFeedback.userEmail}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(selectedFeedback.createdAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedFeedback(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced User Detail Dialog */}
      <Dialog 
        open={!!selectedUser} 
        onClose={() => setSelectedUser(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <PersonIcon color="primary" />
          User Management
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
      {selectedUser && (
            <Box>
              {/* User Basic Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
                  {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedUser.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip 
                      icon={getUserTypeIcon(selectedUser.userType)}
                      label={selectedUser.userType || 'User'} 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={selectedUser.status || 'Active'} 
                      color={getUserStatusColor(selectedUser.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Member since {formatDate(selectedUser.createdAt)}
                  </Typography>
                </Box>
              </Box>

              {/* User Details Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  </Box>
                  <Typography variant="body1">{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  </Box>
                  <Typography variant="body1">{selectedUser.phone || 'Not provided'}</Typography>
                </Grid>
              </Grid>

              {/* User Statistics */}
              <Paper sx={{ p: 2, mb: 3, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  User Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.totalBookings || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Bookings</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.totalFeedback || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Reviews Given</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.avgRating || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Avg Rating</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        {selectedUser.points || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Points</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* User Actions */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                User Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => handleViewUserHistory(selectedUser.username || selectedUser.email)}
                  sx={{ minWidth: 120 }}
                >
                  View History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<WarningIcon />}
                  onClick={() => openUserActionDialog('warn')}
                  color="warning"
                  sx={{ minWidth: 120 }}
                >
                  Send Warning
                </Button>
                {selectedUser.status === 'ACTIVE' ? (
                  <Button
                    variant="outlined"
                    startIcon={<BlockIcon />}
                    onClick={() => openUserActionDialog('disable')}
                    color="error"
                    sx={{ minWidth: 120 }}
                  >
                    Disable User
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openUserActionDialog('enable')}
                    color="success"
                    sx={{ minWidth: 120 }}
                  >
                    Enable User
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => window.open(`/admin/users/${selectedUser.id}`, '_blank')}
                  sx={{ minWidth: 120 }}
                >
                  Edit Profile
                </Button>
              </Box>
            </Box>
          )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedUser(null)}>Close</Button>
          </DialogActions>
        </Dialog>

      {/* User Action Dialog */}
      <Dialog 
        open={userActionDialog.open} 
        onClose={() => setUserActionDialog({ open: false, action: '', user: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          {userActionDialog.action === 'warn' && <WarningIcon color="warning" />}
          {userActionDialog.action === 'disable' && <BlockIcon color="error" />}
          {userActionDialog.action === 'enable' && <CheckCircleIcon color="success" />}
          {userActionDialog.action === 'history' && <HistoryIcon color="primary" />}
          {userActionDialog.action === 'warn' && 'Send Warning'}
          {userActionDialog.action === 'disable' && 'Disable User'}
          {userActionDialog.action === 'enable' && 'Enable User'}
          {userActionDialog.action === 'history' && 'User History'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
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
              ) : userHistory.length > 0 ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Recent activity for {userActionDialog.user?.name}:
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {userHistory.map((activity, index) => (
                      <Box key={index} sx={{ 
                        p: 1.5, 
                        mb: 1, 
                        border: `1px solid ${theme.palette.divider}`, 
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.background.paper, 0.5)
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No activity history found for this user.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserActionDialog({ open: false, action: '', user: null })}>
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
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <DeleteIcon color="error" />
          Delete Feedback
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this feedback?
          </Typography>
          {feedbackToDelete && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: alpha(theme.palette.error.main, 0.1), 
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Feedback Preview:
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                "{truncateText(feedbackToDelete.review, 100)}"
              </Typography>
              <Typography variant="caption" color="text.secondary">
                By {feedbackToDelete.userName} on {formatDate(feedbackToDelete.createdAt)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleDeleteFeedback(feedbackToDelete?.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminModerationDashboard;