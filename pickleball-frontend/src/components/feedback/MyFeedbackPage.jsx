import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';
import StarRating from './StarRating';
import CourtService from '../../service/CourtService';

import axios from 'axios';
import UserService from '../../service/UserService';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';

const MyFeedbackPage = () => {
  const theme = useTheme();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    targetType: '',
    targetId: '',
    rating: 0,
    review: '',
    tags: []
  });
  const [courtOptions, setCourtOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deletedFeedback, setDeletedFeedback] = useState(null);
  const [feedbackErrorDialog, setFeedbackErrorDialog] = useState({ open: false, message: '' });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;
        const profileResponse = await axios.get('http://localhost:8081/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(profileResponse.data);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchFeedback = async () => {
      try {
        setLoading(true);
          const response = await api.get('/feedback/user');
        setFeedbackList(response.data);
      } catch (err) {
        setError('Failed to load your feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isAuthenticated]);

  // Fetch courts when dialog opens and type is 'COURT'
  useEffect(() => {
    if (openDialog && formData.targetType === 'COURT') {
      CourtService.getAllCourts().then(setCourtOptions).catch(() => setCourtOptions([]));
    }
  }, [openDialog, formData.targetType]);

  const handleOpenDialog = (feedback = null) => {
    if (feedback) {
      setFormData({
        targetType: feedback.targetType,
        targetId: feedback.targetId,
        rating: feedback.rating,
        review: feedback.review || '',
        tags: feedback.tags || []
      });
      setEditMode(true);
      setEditingId(feedback.id);
    } else {
      setFormData({ targetType: '', targetId: '', rating: 0, review: '', tags: [] });
      setEditMode(false);
      setEditingId(null);
    }
    setTagInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ targetType: '', targetId: '', rating: 0, review: '', tags: [] });
    setEditMode(false);
    setEditingId(null);
    setTagInput('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setFeedbackErrorDialog({ 
        open: true, 
        message: 'Please fill in all required fields (Target Type, Target, Rating, and Review).' 
      });
      return;
    }
    
    if (editMode && !isFormChanged()) {
      setFeedbackErrorDialog({ 
        open: true, 
        message: 'No changes detected. Please make changes before updating.' 
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        targetType: formData.targetType,
        targetId: formData.targetId,
        rating: formData.rating,
        review: formData.review,
        tags: formData.tags
      };
      
      if (editMode && editingId) {
        await api.put(`/feedback/${editingId}`, payload);
      } else {
        await api.post('/feedback', payload);
      }
      
      handleCloseDialog();
      
      // Refresh feedback list
      const response = await api.get('/feedback/user');
      setFeedbackList(response.data);
      
      // Show success message
      setFeedbackErrorDialog({ 
        open: true, 
        message: editMode ? 'Review updated successfully!' : 'Review submitted successfully!' 
      });
    } catch (err) {
      let msg = 'Failed to submit feedback. Please try again.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          msg = err.response.data;
        } else if (err.response.data.message) {
          msg = err.response.data.message;
        } else if (err.response.data.error) {
          msg = err.response.data.error;
        }
      } else if (err.message) {
        msg = err.message;
      }
      setFeedbackErrorDialog({ open: true, message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (feedback) => {
    setDeleteId(feedback.id);
    setDeletedFeedback(feedback);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/feedback/${deleteId}`);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      const response = await api.get('/feedback/user');
      setFeedbackList(response.data);
      
      setFeedbackErrorDialog({ 
        open: true, 
        message: 'Review deleted successfully! You can now leave a new review for this booking.' 
      });
    } catch (err) {
      setError('Failed to delete feedback. Please try again.');
      setDeleteId(null);
      setDeletedFeedback(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
    setDeletedFeedback(null);
  };

  const calculateAverageRating = (items) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item.rating || 0), 0);
    return (sum / items.length).toFixed(1);
  };

  const isFormValid = () => {
    return formData.targetType && formData.targetId && formData.rating > 0 && formData.review.trim();
  };

  const isFormChanged = () => {
    if (!editMode || !editingId) return true;
    
    const originalFeedback = feedbackList.find(f => f.id === editingId);
    if (!originalFeedback) return true;
    
    return (
      formData.rating !== originalFeedback.rating ||
      formData.review !== (originalFeedback.review || '') ||
      JSON.stringify(formData.tags) !== JSON.stringify(originalFeedback.tags || [])
    );
  };

  const handleCloseSnackbar = () => { setError(''); setSuccess(''); };

  if (!isAuthenticated()) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" color="text.secondary">
          You need to log in to view your feedback.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={error ? 'error' : 'success'} onClose={handleCloseSnackbar} sx={{ width: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', background: alpha(theme.palette.background.paper, 0.9) }}>{error || success}</Alert>
      </Snackbar>
      
      {/* 主内容卡片 */}
      <Card sx={{ 
        borderRadius: 3, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
      }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* 页面标题 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <RateReviewIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
            <Typography variant="h4" fontWeight="bold">
              My Feedback
            </Typography>
          </Box>

          {/* 统计卡片 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <RateReviewIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h3" fontWeight="bold" color={theme.palette.primary.main}>
                    {feedbackList.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Feedback
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <StarIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 1 }} />
                  <Typography variant="h3" fontWeight="bold" color={theme.palette.warning.main}>
                    {calculateAverageRating(feedbackList)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Average Rating
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 删除后提示 */}
          {deletedFeedback && (
            <Card sx={{ 
              mb: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
              border: `2px solid ${theme.palette.success.main}`
            }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color={theme.palette.success.main} sx={{ mb: 1 }}>
                  ✨ Ready to review again?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You just deleted a review for {deletedFeedback.targetName}. You can now leave a new review!
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                      setDeletedFeedback(null);
                      navigate('/profile/my-bookings');
                    }}
                  >
                    Leave New Review
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => setDeletedFeedback(null)}
                  >
                    Dismiss
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Feedback List */}
          {feedbackList.length === 0 ? (
            <Card sx={{ 
              borderRadius: 3,
              background: alpha(theme.palette.grey[50], 0.5),
              border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`
            }}>
              <CardContent sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontSize: 80, mb: 2, opacity: 0.3 }}>💬</Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No feedback yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Be the first to share your thoughts!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {feedbackList.map(item => (
                <Card key={item.id} sx={{ 
                  borderRadius: 3,
                  boxShadow: theme.shadows[1],
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: theme.shadows[3] }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: theme.palette.primary.main,
                        width: 50,
                        height: 50
                      }}>
                        {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                          {item.targetName || 'Untitled'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={item.targetType} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarRating rating={item.rating} />
                            <Typography variant="body2" color="text.secondary">
                              ({item.rating}/5)
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 2 }}>
                          {item.review}
                        </Typography>
                        
                        {/* 為教練評價顯示課程詳細信息 */}
                        {item.targetType === 'COACH' && (item.classSessionTitle || item.venueName || item.courtName) && (
                          <Card sx={{ 
                            mt: 2, 
                            background: alpha(theme.palette.info.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                          }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="subtitle2" color="info.main" sx={{ mb: 1, fontWeight: 'bold' }}>
                                📚 Class Session Details
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {item.classSessionTitle && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Class:</strong> {item.classSessionTitle}
                                  </Typography>
                                )}
                                {item.classSessionDate && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Date:</strong> {new Date(item.classSessionDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                {item.classSessionTime && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Time:</strong> {item.classSessionTime}
                                  </Typography>
                                )}
                                {item.venueName && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Venue:</strong> {item.venueName}
                                  </Typography>
                                )}
                                {item.courtName && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Court:</strong> {item.courtName}
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {item.tags.map(tag => (
                              <Chip 
                                key={tag} 
                                label={tag} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                        {/* Edit status indicator */}
                        {editMode && editingId === item.id && (
                          <Chip
                            label="Currently editing this review"
                            color="success"
                            icon={<EditIcon />}
                            sx={{ mb: 2 }}
                          />
                        )}
                        {/* Action buttons */}
                        {currentUser && item.userUsername === currentUser.username && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenDialog(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteClick(item)}
                            >
                              Delete
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1000
        }}
      >
        <Button
          variant="contained"
          sx={{
            borderRadius: '50%',
            width: 60,
            height: 60,
            minWidth: 60,
            boxShadow: theme.shadows[8]
          }}
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Button>
      </Box>

      {/* Feedback Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              {editMode ? 'Edit Feedback' : 'Add New Feedback'}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Target Type</InputLabel>
              <Select
                name="targetType"
                value={formData.targetType}
                onChange={handleFormChange}
                label="Target Type"
                required
              >
                <MenuItem value="">Select Type</MenuItem>
                <MenuItem value="COURT">Court</MenuItem>
                <MenuItem value="EVENT">Event</MenuItem>
                <MenuItem value="COACH">Coach</MenuItem>
              </Select>
            </FormControl>

            {formData.targetType === 'COURT' && (
              <FormControl fullWidth>
                <InputLabel>Court</InputLabel>
                <Select
                  name="targetId"
                  value={formData.targetId}
                  onChange={handleFormChange}
                  label="Court"
                  required
                >
                  <MenuItem value="">Select Court</MenuItem>
                  {courtOptions.map(court => (
                    <MenuItem key={court.id} value={court.id}>
                      {court.name} ({court.location})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.targetType === 'EVENT' && (
              <Alert severity="warning">
                Event selection not available yet.
              </Alert>
            )}

            {formData.targetType === 'COACH' && (
              <Alert severity="warning">
                Coach selection not available yet.
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Rating</Typography>
              <StarRating 
                rating={formData.rating} 
                interactive 
                onRatingChange={r => setFormData(f => ({ ...f, rating: r }))} 
              />
            </Box>

            <TextField
              name="review"
              label="Review"
              value={formData.review}
              onChange={handleFormChange}
              multiline
              rows={4}
              fullWidth
              required
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags (optional)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {formData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <TextField
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type and press Enter to add tags"
                fullWidth
                size="small"
              />
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !isFormValid() || (editMode && !isFormChanged())}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update' : 'Submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this feedback? You can leave a new review after deletion.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error/Success Dialog */}
      <Dialog
        open={feedbackErrorDialog.open}
        onClose={() => setFeedbackErrorDialog({ open: false, message: '' })}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          {feedbackErrorDialog.message.includes('successfully') ? 'Success' : 'Error'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {feedbackErrorDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          {feedbackErrorDialog.message.includes('deleted successfully') && (
            <>
              <Button
                onClick={() => {
                  setFeedbackErrorDialog({ open: false, message: '' });
                  navigate('/profile/my-bookings');
                }}
                variant="contained"
              >
                Review Again
              </Button>
              <Button
                onClick={() => {
                  setFeedbackErrorDialog({ open: false, message: '' });
                  setDeletedFeedback(null);
                }}
                variant="outlined"
              >
                Great!
              </Button>
            </>
          )}
          {!feedbackErrorDialog.message.includes('deleted successfully') && (
            <Button
              onClick={() => {
                setFeedbackErrorDialog({ open: false, message: '' });
                if (feedbackErrorDialog.message.includes('successfully')) {
                  setOpenDialog(false);
                } else {
                  setFormData({ targetType: '', targetId: '', rating: 0, review: '', tags: [] });
                  setEditMode(false);
                  setEditingId(null);
                }
              }}
              variant="contained"
            >
              {feedbackErrorDialog.message.includes('successfully') ? 'Great!' : 'OK'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyFeedbackPage;