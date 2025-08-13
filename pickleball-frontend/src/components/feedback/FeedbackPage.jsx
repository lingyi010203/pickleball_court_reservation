import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../service/api';
import StarRating from './StarRating';
import { format } from 'date-fns';
import {
  AlertTitle,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Chip,
  Divider,
  Paper,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Star as StarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const FeedbackPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const preFilledData = location.state || {};
  
  console.log('=== FeedbackPage Loaded ===');
  console.log('Location state:', location.state);
  console.log('Pre-filled data:', preFilledData);
  
  // 检查是否是从编辑模式进入的
  const isEditingMode = preFilledData.isEditing || false;
  
  const [targetType, setTargetType] = useState(preFilledData.targetType || 'COURT');
  const [targetId, setTargetId] = useState(preFilledData.targetId || '');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [availableTargets, setAvailableTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCourtName, setSelectedCourtName] = useState(preFilledData.courtName || '');
  
  // 检查是否只有bookingId（没有targetId）
  const hasOnlyBookingId = preFilledData.bookingId && !preFilledData.targetId;
  
  // 检查是否是从View Review按钮进入的（用户已经评价过）
  const isViewReviewMode = preFilledData.isViewReview || false;

  // Fetch available targets based on selected type
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setLoading(true);
        let endpoint = '';
        
        switch(targetType) {
          case 'COURT':
            endpoint = '/member/courts';
            break;
          case 'EVENT':
            endpoint = '/events/published';
            break;
          case 'COACH':
            setAvailableTargets([]);
            setLoading(false);
            return;
          default:
            return;
        }

        const response = await api.get(endpoint);
        setAvailableTargets(response.data);
        
        if (targetId && targetType === 'COURT') {
          const court = response.data.find(c => c.id === parseInt(targetId));
          if (court) {
            setSelectedCourtName(court.name);
          }
        }
      } catch (err) {
        setError('Failed to fetch available targets: ' + (err.response?.data || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      fetchTargets();
    }
  }, [targetType, isAuthenticated, targetId]);

  // 加载用户的现有评价数据 (仅编辑模式)
  const loadUserExistingFeedback = useCallback(async () => {
    if (!isEditingMode || !preFilledData.bookingId || !currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.get('/feedback', {
        params: { 
          targetType, 
          targetId,
          bookingId: preFilledData.bookingId,
          userId: currentUser.id
        }
      });
      
      if (response.data.length > 0) {
        const userFeedback = response.data[0];
        setEditingFeedback(userFeedback);
        setRating(userFeedback.rating);
        setReview(userFeedback.review || '');
        setSuccessMessage('Your existing review has been loaded. You can edit it below.');
      } else {
        setError('No existing review found for this booking');
      }
    } catch (err) {
      setError('Failed to load your existing review: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [isEditingMode, preFilledData.bookingId, currentUser, targetType, targetId]);

  // 常规加载反馈数据
  const fetchFeedbackData = useCallback(async () => {
    if (!targetId || !isAuthenticated() || !currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Fetch feedback list
      const feedbackResponse = await api.get('/feedback', {
        params: { targetType, targetId }
      });
      setFeedbackList(feedbackResponse.data);
      
      // Fetch stats
      const statsResponse = await api.get('/feedback/stats', {
        params: { targetType, targetId }
      });
      setStats(statsResponse.data);
      
      // 检查当前用户是否有现有反馈
      let userFeedback = null;
      if (preFilledData.bookingId) {
        // 检查特定预订的评价
        userFeedback = feedbackResponse.data.find(
          feedback => feedback.userName === currentUser.username && 
                     feedback.bookingId === preFilledData.bookingId
        );
      } else {
        // 检查目标的一般评价
        userFeedback = feedbackResponse.data.find(
          feedback => feedback.userName === currentUser.username
        );
      }
      
      if (userFeedback) {
        setEditingFeedback(userFeedback);
        setRating(userFeedback.rating);
        setReview(userFeedback.review || '');
        setSuccessMessage('You have already reviewed this. You can edit your review below.');
      } else {
        setEditingFeedback(null);
        setRating(0);
        setReview('');
      }
      
    } catch (err) {
      setError('Failed to load feedback data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, isAuthenticated, currentUser, preFilledData.bookingId]);

  // 加载特定预订的评价数据
  const loadBookingFeedback = useCallback(async () => {
    if (!preFilledData.bookingId || !currentUser) return;
    
    console.log('=== Loading Booking Feedback ===');
    console.log('Booking ID:', preFilledData.bookingId);
    console.log('Current User:', currentUser.username);
    console.log('Is View Review Mode:', isViewReviewMode);
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // 获取该预订的所有评价
      const response = await api.get('/feedback', {
        params: { 
          bookingId: preFilledData.bookingId
        }
      });
      
      console.log('API Response:', response.data);
      setFeedbackList(response.data);
      
      // 检查当前用户是否已经评价过这个预订
      console.log('All feedback data:', response.data);
      console.log('Looking for username:', currentUser.username);
      console.log('Looking for bookingId:', parseInt(preFilledData.bookingId));
      
      const userFeedback = response.data.find(feedback => {
        console.log('Checking feedback:', feedback);
        console.log('Feedback userId:', feedback.userId);
        console.log('Feedback userName:', feedback.userName);
        console.log('Feedback userEmail:', feedback.userEmail);
        console.log('Feedback bookingId:', feedback.bookingId);
        console.log('UserName match:', feedback.userName === currentUser.username);
        console.log('UserEmail match:', feedback.userEmail === currentUser.username);
        console.log('BookingId match:', feedback.bookingId === parseInt(preFilledData.bookingId));
        
        return (feedback.userName === currentUser.username || feedback.userEmail === currentUser.username) && 
               feedback.bookingId === parseInt(preFilledData.bookingId);
      });
      
      console.log('Found User Feedback:', userFeedback);
      
      if (userFeedback) {
        setEditingFeedback(userFeedback);
        setRating(userFeedback.rating);
        setReview(userFeedback.review || '');
        setSuccessMessage('You have already reviewed this booking. You can edit your review below.');
        console.log('Set editing feedback:', userFeedback);
      } else {
        setEditingFeedback(null);
        setRating(0);
        setReview('');
        console.log('No user feedback found');
      }
      
    } catch (err) {
      console.error('Error loading booking feedback:', err);
      setError('Failed to load booking feedback: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [preFilledData.bookingId, currentUser, isViewReviewMode]);

  // 分离编辑模式和普通模式的加载逻辑
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('isAuthenticated:', isAuthenticated());
    console.log('currentUser:', currentUser);
    console.log('hasOnlyBookingId:', hasOnlyBookingId);
    console.log('isViewReviewMode:', isViewReviewMode);
    console.log('targetId:', targetId);
    console.log('isEditingMode:', isEditingMode);
    
    if (isAuthenticated() && currentUser) {
      if (hasOnlyBookingId || isViewReviewMode) {
        // 如果只有bookingId或者是View Review模式，直接加载该预订的评价
        console.log('Loading booking feedback...');
        loadBookingFeedback();
      } else if (isEditingMode && targetId) {
        console.log('Loading user existing feedback...');
        loadUserExistingFeedback();
      } else if (targetId) {
        console.log('Fetching feedback data...');
        fetchFeedbackData();
      }
    }
  }, [isAuthenticated, currentUser, targetId, isEditingMode, hasOnlyBookingId, isViewReviewMode, loadUserExistingFeedback, fetchFeedbackData, loadBookingFeedback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      setError('Please log in to submit feedback');
      return;
    }
    
    if (!rating) {
      setError('Please select a rating before submitting');
      return;
    }
    
    // 编辑模式需要bookingId
    if (isEditingMode && !preFilledData.bookingId) {
      setError('Booking information missing for editing');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const feedbackData = {
        targetType,
        targetId: hasOnlyBookingId ? null : targetId, // 如果只有bookingId，targetId为null
        rating,
        review,
        tags: [],
        bookingId: preFilledData.bookingId
      };
      
      let response;
      
      if (editingFeedback) {
        // 更新现有反馈
        response = await api.put(
          `/feedback/${editingFeedback.id}`, 
          feedbackData
        );
        setSuccessMessage('Review updated successfully!');
      } else {
        // 创建新反馈
        response = await api.post('/feedback', feedbackData);
        setSuccessMessage('Feedback submitted successfully!');
      }
      
      // 更新本地状态
      if (editingFeedback) {
        setFeedbackList(feedbackList.map(fb => 
          fb.id === response.data.id ? response.data : fb
        ));
      } else {
        setFeedbackList([response.data, ...feedbackList]);
      }
      
      // 更新本地状态
      if (editingFeedback) {
        // 更新现有反馈后，保持编辑状态
        setEditingFeedback(response.data);
        setRating(response.data.rating);
        setReview(response.data.review || '');
        setSuccessMessage('Review updated successfully!');
      } else {
        // 新建反馈后，重置表单
        setRating(0);
        setReview('');
        setEditingFeedback(null);
        
        // 如果是通过bookingId直接进入的，提交成功后隐藏表单
        if (hasOnlyBookingId) {
          setFeedbackList([response.data, ...feedbackList]);
        }
      }
      
      // 刷新统计 - 只在有targetId时刷新
      if (targetId && !hasOnlyBookingId) {
        try {
          const statsResponse = await api.get('/feedback/stats', {
            params: { targetType, targetId }
          });
          setStats(statsResponse.data);
        } catch (statsErr) {
          console.warn('Failed to refresh stats:', statsErr);
        }
      }
      
    } catch (err) {
      // 检查重复评价错误
      if (err.response?.data?.message?.includes('already reviewed this booking')) {
        setError('You have already reviewed this booking. Loading your existing review for editing...');
        
        // 尝试获取用户现有的评价
        try {
          const feedbackResponse = await api.get('/feedback', {
            params: { targetType, targetId }
          });
          
          const userFeedback = feedbackResponse.data.find(
            feedback => feedback.userName === currentUser.username && 
                       feedback.bookingId === preFilledData.bookingId
          );
          
          if (userFeedback) {
            setEditingFeedback(userFeedback);
            setRating(userFeedback.rating);
            setReview(userFeedback.review || '');
            setSuccessMessage('Your existing review has been loaded. You can edit it below.');
            setError('');
          } else {
            setError('Error loading your existing review. Please try refreshing the page.');
          }
        } catch (loadErr) {
          setError('Error loading your existing review. Please try refreshing the page.');
        }
      } else {
        setError(err.response?.data?.message || 'An error occurred while submitting feedback');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!isAuthenticated()) {
      setError('Please log in to delete feedback');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/feedback/${feedbackId}`);
      
      // 更新状态
      setFeedbackList(feedbackList.filter(fb => fb.id !== feedbackId));
      setEditingFeedback(null);
      setRating(0);
      setReview('');
      
      // 刷新统计 - 只在有targetId时刷新
      if (targetId && !hasOnlyBookingId) {
        try {
          const statsResponse = await api.get('/feedback/stats', {
            params: { targetType, targetId }
          });
          setStats(statsResponse.data);
        } catch (statsErr) {
          console.warn('Failed to refresh stats:', statsErr);
        }
      }
      
      setSuccessMessage('Review deleted successfully');
    } catch (err) {
      setError('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (feedback) => {
    setEditingFeedback(feedback);
    setRating(feedback.rating);
    setReview(feedback.review || '');
    setError('');
    setSuccessMessage('');
    
    // 滚动到页面顶部
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const cancelEditing = () => {
    setEditingFeedback(null);
    setRating(0);
    setReview('');
    setError('');
    setSuccessMessage('');
    
    // 如果是编辑模式，导航回booking history
    if (isEditingMode) {
      navigate('/profile/my-bookings', { replace: true });
    }
  };

  const isFormChanged = () => {
    if (!editingFeedback) return false;
    return rating !== editingFeedback.rating || review !== (editingFeedback.review || '');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom sx={{ 
        fontWeight: 'bold', 
        color: '#1976d2',
        mb: 4
      }}>
        Rate and Review
      </Typography>
      
      {/* 编辑模式标识 */}
      {isEditingMode && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <strong>Editing Mode:</strong> You are editing your existing review for this booking.
        </Alert>
      )}
      
      {/* 预填充信息显示 */}
      {preFilledData.courtName && (
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
          border: '1px solid #1976d2'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                Reviewing: {preFilledData.courtName}
              </Typography>
              {preFilledData.courtLocation && (
                <Typography variant="body2" color="text.secondary">
                  Location: {preFilledData.courtLocation}
                </Typography>
              )}
              {preFilledData.slotDate && (
                <Typography variant="body2" color="text.secondary">
                  Date: {new Date(preFilledData.slotDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              )}
              {preFilledData.startTime && preFilledData.endTime && (
                <Typography variant="body2" color="text.secondary">
                  Time: {preFilledData.startTime} - {preFilledData.endTime}
                </Typography>
              )}
              {preFilledData.durationHours && (
                <Typography variant="body2" color="text.secondary">
                  Duration: {preFilledData.durationHours} hour{preFilledData.durationHours > 1 ? 's' : ''}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {isEditingMode 
                  ? "You're editing your existing review for this completed booking" 
                  : "You're reviewing a court from your completed booking"}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/profile/my-bookings', { replace: true })}
              sx={{ minWidth: 'auto' }}
            >
              Choose Different Booking
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* 选择区域 - 只在没有预填充数据时显示 */}
      {!hasOnlyBookingId && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Select Target
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Target Type</InputLabel>
                  <Select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    disabled={preFilledData.targetType}
                    label="Target Type"
                  >
                    <MenuItem value="COURT">Court</MenuItem>
                    <MenuItem value="EVENT">Event</MenuItem>
                    <MenuItem value="COACH" disabled>Coach (Coming Soon)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>
                    {targetType === 'COURT' ? 'Court' : 
                     targetType === 'EVENT' ? 'Event' : 'Coach'}
                  </InputLabel>
                  <Select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    disabled={loading || !isAuthenticated() || preFilledData.targetId}
                    label={targetType === 'COURT' ? 'Court' : 
                           targetType === 'EVENT' ? 'Event' : 'Coach'}
                  >
                    <MenuItem value="">
                      Select {targetType.toLowerCase()}
                    </MenuItem>
                    {availableTargets.map(target => (
                      <MenuItem key={target.id} value={target.id}>
                        {target.name || target.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* 统计区域 - 只在有targetId时显示 */}
      {targetId && !hasOnlyBookingId && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Rating Overview
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="h2" sx={{ fontWeight: 'bold', mr: 2, color: '#1976d2' }}>
                {stats.averageRating.toFixed(1)}
              </Typography>
              <Box>
                <StarRating rating={stats.averageRating} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {stats.totalReviews} reviews
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* 加载状态指示器 */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      )}
      
      {/* 反馈表单 - 显示新建评价或编辑现有评价 */}
      {(targetId || hasOnlyBookingId) && isAuthenticated() && !loading && (
        editingFeedback || !isViewReviewMode
      ) && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              {isViewReviewMode && editingFeedback ? 'Your Review' : 'Leave a Review'}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, maxWidth: 800 }}>
              <AlertTitle>Review Guidelines</AlertTitle>
              <Typography variant="body2">
                • Be honest and constructive in your review<br/>
                • Share your experience to help other users<br/>
                • You can only review each booking once<br/>
                • You can edit your review anytime
              </Typography>
            </Alert>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
                {successMessage}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Rating <span style={{ color: '#f44336' }}>*</span>
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current rating: {rating} (Click stars to rate)
                  </Typography>
                </Box>
                <StarRating 
                  rating={rating} 
                  interactive={true} 
                  onRatingChange={setRating} 
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Review"
                  multiline
                  rows={4}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  fullWidth
                  placeholder="Share your experience..."
                  variant="outlined"
                />
              </Box>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                {(editingFeedback || isEditingMode) ? (
                  // 编辑模式按钮
                  <>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !isFormChanged()}
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0, #1976d2)'
                        },
                        '&:disabled': {
                          background: '#e0e0e0',
                          color: '#757575'
                        }
                      }}
                    >
                      {loading ? 'Updating...' : 'Update Review'}
                    </Button>
                    {editingFeedback && (
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={loading}
                        onClick={() => handleDelete(editingFeedback.id)}
                        startIcon={<DeleteIcon />}
                      >
                        Delete Review
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={cancelEditing}
                      disabled={loading}
                    >
                      Cancel Edit
                    </Button>
                  </>
                ) : (
                  // 新建模式按钮
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !rating}
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1565c0, #1976d2)'
                      },
                      '&:disabled': {
                        background: '#e0e0e0',
                        color: '#757575'
                      }
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </Button>
                )}
                
                {/* View Review模式下的额外按钮 */}
                {isViewReviewMode && editingFeedback && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/profile/my-bookings')}
                    disabled={loading}
                    sx={{
                      borderColor: '#10b981',
                      color: '#10b981',
                      '&:hover': {
                        borderColor: '#059669',
                        backgroundColor: '#ecfdf5'
                      }
                    }}
                  >
                    Back to Booking History
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* 成功提交后的显示区域 */}
      {hasOnlyBookingId && isAuthenticated() && !loading && editingFeedback && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                Review Submitted Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Thank you for your feedback. Your review has been submitted and will help other users.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/profile/my-bookings')}
                sx={{
                  background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0, #1976d2)'
                  }
                }}
              >
                Back to Booking History
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {targetId && !isAuthenticated() && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          You need to <Button color="primary" onClick={() => navigate('/login')}>log in</Button> to submit reviews
        </Alert>
      )}
      
      {/* 评论列表 */}
      {targetId && !loading && (
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Reviews ({feedbackList.length})
            </Typography>
            
            {feedbackList.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No reviews yet. Be the first to review!
                </Typography>
              </Box>
            ) : (
              <Box>
                {feedbackList.map((feedback, index) => (
                  <Box key={feedback.id}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {feedback.userName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      
                      {currentUser && currentUser.username === feedback.userName && (
                        <Box display="flex" gap={1}>
                          <IconButton
                            onClick={() => startEditing(feedback)}
                            color="primary"
                            size="small"
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.1)'
                              }
                            }}
                            title="Edit your review"
                          >
                            <EditIcon />
                          </IconButton>
                          {editingFeedback && editingFeedback.id === feedback.id && (
                            <Chip
                              label="Editing"
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <StarRating rating={feedback.rating} />
                    </Box>
                    
                    {feedback.review && (
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {feedback.review}
                      </Typography>
                    )}
                    
                    {index < feedbackList.length - 1 && <Divider sx={{ my: 3 }} />}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default FeedbackPage;