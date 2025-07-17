import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Avatar,
  Paper,
  Stack,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  SportsTennis as CourtIcon,
  CalendarToday as DateIcon,
  AccessTime as TimeIcon,
  People as PlayersIcon,
  MonetizationOn as AmountIcon,
  Cancel as CancelIcon,
  RateReview as ReviewIcon,
  ArrowBack as BackIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import api from '../../api/axiosConfig';

// Modern color palette
const COLORS = {
  primary: '#6366f1',        // Modern indigo
  primaryHover: '#4f46e5',   // Darker indigo
  primaryLight: '#f0f0ff',   // Light indigo background
  success: '#10b981',        // Modern green
  successHover: '#059669',   // Darker green
  successLight: '#ecfdf5',   // Light green background
  warning: '#f59e0b',        // Modern amber
  warningHover: '#d97706',   // Darker amber
  warningLight: '#fffbeb',   // Light amber background
  error: '#ef4444',          // Modern red
  errorHover: '#dc2626',     // Darker red
  errorLight: '#fef2f2',     // Light red background
  neutral: '#6b7280',        // Modern gray
  neutralHover: '#4b5563',   // Darker gray
  neutralLight: '#f9fafb',   // Light gray background
  background: '#ffffff',     // Clean white
  surface: '#f8fafc',        // Subtle surface color
};

// Styled components
const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(145deg, ${COLORS.surface}, ${COLORS.background})`,
  borderRadius: '20px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(99, 102, 241, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.2)'
  },
}));

const StatusChip = styled(Chip)(({ status, theme }) => {
  const statusStyles = {
    upcoming: {
      backgroundColor: COLORS.warningLight,
      color: COLORS.warning,
      border: `1px solid ${COLORS.warning}20`
    },
    completed: {
      backgroundColor: COLORS.successLight,
      color: COLORS.success,
      border: `1px solid ${COLORS.success}20`
    },
    cancelled: {
      backgroundColor: COLORS.errorLight,
      color: COLORS.error,
      border: `1px solid ${COLORS.error}20`
    },
    CONFIRMED: {
      backgroundColor: COLORS.warningLight,
      color: COLORS.warning,
      border: `1px solid ${COLORS.warning}20`
    },
    COMPLETED: {
      backgroundColor: COLORS.successLight,
      color: COLORS.success,
      border: `1px solid ${COLORS.success}20`
    },
    CANCELLED: {
      backgroundColor: COLORS.errorLight,
      color: COLORS.error,
      border: `1px solid ${COLORS.error}20`
    },
    CANCELLATION_REQUESTED: {
      backgroundColor: COLORS.errorLight,
      color: COLORS.error,
      border: `1px solid ${COLORS.error}20`
    }
  };

  const style = statusStyles[status] || {
    backgroundColor: COLORS.neutralLight,
    color: COLORS.neutral,
    border: `1px solid ${COLORS.neutral}20`
  };

  return {
    ...style,
    fontWeight: 600,
    borderRadius: '12px',
    padding: '6px 12px',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };
});

const ModernButton = styled(Button)(({ variant, color }) => {
  const baseStyles = {
    borderRadius: '12px',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '0.875rem',
    padding: '8px 16px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    boxShadow: 'none',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }
  };

  if (variant === 'contained') {
    if (color === 'primary') {
      return {
        ...baseStyles,
        backgroundColor: COLORS.primary,
        color: '#ffffff',
        '&:hover': {
          ...baseStyles['&:hover'],
          backgroundColor: COLORS.primaryHover,
        }
      };
    }
    if (color === 'error') {
      return {
        ...baseStyles,
        backgroundColor: COLORS.error,
        color: '#ffffff',
        '&:hover': {
          ...baseStyles['&:hover'],
          backgroundColor: COLORS.errorHover,
        }
      };
    }
    if (color === 'success') {
      return {
        ...baseStyles,
        backgroundColor: COLORS.success,
        color: '#ffffff',
        '&:hover': {
          ...baseStyles['&:hover'],
          backgroundColor: COLORS.successHover,
        }
      };
    }
  }

  if (variant === 'outlined') {
    if (color === 'error') {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: COLORS.error,
        border: `2px solid ${COLORS.error}`,
        '&:hover': {
          ...baseStyles['&:hover'],
          backgroundColor: COLORS.errorLight,
          borderColor: COLORS.errorHover,
          color: COLORS.errorHover,
        }
      };
    }
    if (color === 'primary') {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: COLORS.primary,
        border: `2px solid ${COLORS.primary}`,
        '&:hover': {
          ...baseStyles['&:hover'],
          backgroundColor: COLORS.primaryLight,
          borderColor: COLORS.primaryHover,
          color: COLORS.primaryHover,
        }
      };
    }
  }

  return baseStyles;
});


const BookingHistory = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelStatus, setCancelStatus] = useState({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBookingId, setCancelBookingId] = useState(null);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/member/bookings');
      console.log("API Response:", response.data);

      // 数据规范化处理 - 根据实际API响应调整字段映射
      const normalizedBookings = response.data.map(booking => ({
        bookingId: booking.id || booking.bookingId,
        courtName: booking.venue?.name || booking.courtName || (booking.bookingSlots && booking.bookingSlots[0]?.slot?.courtName) || "AAA Pickleball Court",
        courtLocation: booking.venue?.address || booking.location || (booking.bookingSlots && booking.bookingSlots[0]?.slot?.courtLocation) || "123 Sports Complex, Kuala Lumpur",
        slotDate: booking.date, // 修正
        startTime: booking.startTime, // 修正
        endTime: booking.endTime, // 修正
        numberOfPlayers: booking.playerCount || booking.numberOfPlayers || 4,
        totalAmount: booking.amount ? Number(booking.amount) : booking.price || 50.00,
        status: booking.bookingStatus || booking.status || "CONFIRMED",
      }));

      console.log("Normalized Bookings:", normalizedBookings);
      setBookings(normalizedBookings);
    } catch (err) {
      console.error('Failed to fetch booking history:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBookCourt = () => {
    navigate('/courts');
  };

  const handleCancelBooking = (id) => {
    setCancelBookingId(id);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    setCancellingId(cancelBookingId);
    setCancelStatus(prev => ({ ...prev, [cancelBookingId]: 'processing' }));
    api.post(`/member/bookings/${cancelBookingId}/cancel`, { reason: cancelReason })
      .then(response => {
        setBookings(prev => prev.map(booking =>
          booking.bookingId === cancelBookingId
            ? { ...booking, status: 'CANCELLATION_REQUESTED' }
            : booking
        ));
        setCancelStatus(prev => ({ ...prev, [cancelBookingId]: 'requested' }));
        alert('Cancellation request submitted successfully!');
      })
      .catch(error => {
        console.error('Cancellation failed:', error);
        setCancelStatus(prev => ({ ...prev, [cancelBookingId]: 'error' }));
        let errorMsg = 'Unknown error';
        if (error.response) {
          errorMsg = `Server error: ${error.response.status}`;
          if (error.response.data?.message) {
            errorMsg += ` - ${error.response.data.message}`;
          }
        } else if (error.request) {
          errorMsg = 'No response from server';
        } else {
          errorMsg = error.message;
        }
        alert(`Cancellation failed: ${errorMsg}`);
      })
      .finally(() => {
        setCancellingId(null);
        setCancelDialogOpen(false);
        setCancelBookingId(null);
      });
  };

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setCancelBookingId(null);
    setCancelReason('');
  };

  const handleLeaveReview = (id) => {
    console.log(`Leave review for booking ${id}`);
    navigate('/feedback/select');
  };

  // 日期格式化函数
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    // 尝试解析日期
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      // 处理可能的日期格式如 "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 时间格式化函数
  const formatTime = (timeString) => {
    if (!timeString) return '';

    // 处理 HH:mm 格式
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      const timeParts = timeString.split(':');
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${period}`;
    }

    return timeString; // 返回原始值
  };

  // 过滤预订
  const filteredBookings = tabValue === 'all'
    ? bookings
    : bookings.filter(booking => {
      if (tabValue === 'upcoming') return booking.status === 'CONFIRMED';
      if (tabValue === 'completed') return booking.status === 'COMPLETED';
      if (tabValue === 'cancelled') return booking.status === 'CANCELLED' || booking.status === 'CANCELLATION_REQUESTED';
      return true;
    });

  if (loading) {
    return (
      <Container style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        flexDirection: 'column'
      }}>
        <CircularProgress size={60} sx={{ color: COLORS.primary }} />
        <Typography variant="h6" sx={{ ml: 2, mt: 2, color: COLORS.neutral }}>
          Loading booking history...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: COLORS.error, mb: 2 }}>
          {error}
        </Typography>
        <ModernButton
          variant="contained"
          color="primary"
          onClick={fetchBookingHistory}
          sx={{ mt: 2 }}
        >
          Retry
        </ModernButton>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton
          onClick={() => navigate('/profile')}
          sx={{
            mr: 2,
            backgroundColor: COLORS.neutralLight,
            color: COLORS.neutral,
            '&:hover': {
              backgroundColor: COLORS.primary,
              color: '#ffffff'
            }
          }}
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 700,
          flexGrow: 1,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryHover})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          My Bookings
        </Typography>
        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          sx={{
            backgroundColor: showFilters ? COLORS.primaryLight : COLORS.neutralLight,
            color: showFilters ? COLORS.primary : COLORS.neutral,
            '&:hover': {
              backgroundColor: COLORS.primary,
              color: '#ffffff'
            }
          }}
        >
          <FilterIcon />
        </IconButton>
      </Box>

      {/* Filter Tabs */}
      <Paper sx={{
        mb: 3,
        borderRadius: 4,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(99, 102, 241, 0.1)',
        overflow: 'hidden'
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: COLORS.primary,
            },
            '& .MuiTab-root': {
              fontWeight: 600,
              color: COLORS.neutral,
              '&.Mui-selected': {
                color: COLORS.primary,
              }
            }
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Upcoming" value="upcoming" />
          <Tab label="Completed" value="completed" />
          <Tab label="Cancelled" value="cancelled" />
        </Tabs>
      </Paper>

      {/* Additional Filters */}
      {showFilters && (
        <Paper sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          backgroundColor: COLORS.surface
        }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: COLORS.neutral }}>
            Additional Filters
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="This Week"
              variant="outlined"
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  backgroundColor: COLORS.primaryLight,
                }
              }}
            />
            <Chip
              label="This Month"
              variant="outlined"
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  backgroundColor: COLORS.primaryLight,
                }
              }}
            />
            <Chip
              label="Past Bookings"
              variant="outlined"
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  backgroundColor: COLORS.primaryLight,
                }
              }}
            />
            <Chip
              label="Group Bookings"
              variant="outlined"
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  backgroundColor: COLORS.primaryLight,
                }
              }}
            />
            <Chip
              label="Solo Bookings"
              variant="outlined"
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                '&:hover': {
                  backgroundColor: COLORS.primaryLight,
                }
              }}
            />
          </Stack>
        </Paper>
      )}

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <Grid container spacing={3}>
          {filteredBookings.map((booking) => (
            <Grid item xs={12} sm={6} md={4} key={booking.bookingId}>
              <GradientCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{
                      bgcolor: COLORS.primary,
                      mr: 2,
                      width: 56,
                      height: 56,
                      boxShadow: `0 4px 12px ${COLORS.primary}30`
                    }}>
                      <CourtIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.neutral }}>
                        {booking.courtName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.neutral, opacity: 0.7 }}>
                        {booking.courtLocation}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3, borderColor: `${COLORS.primary}20` }} />

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DateIcon fontSize="small" sx={{ mr: 1, color: COLORS.primary }} />
                        <Typography variant="body2" sx={{ color: COLORS.neutral, fontWeight: 500 }}>
                          {formatDate(booking.slotDate)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeIcon fontSize="small" sx={{ mr: 1, color: COLORS.primary }} />
                        <Typography variant="body2" sx={{ color: COLORS.neutral, fontWeight: 500 }}>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PlayersIcon fontSize="small" sx={{ mr: 1, color: COLORS.primary }} />
                        <Typography variant="body2" sx={{ color: COLORS.neutral, fontWeight: 500 }}>
                          {booking.numberOfPlayers} players
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AmountIcon fontSize="small" sx={{ mr: 1, color: COLORS.primary }} />
                        <Typography variant="body2" sx={{ color: COLORS.neutral, fontWeight: 500 }}>
                          MYR {booking.totalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                    <StatusChip
                      label={
                        booking.status === 'CONFIRMED' ? 'Upcoming' :
                        booking.status === 'COMPLETED' ? 'Completed' :
                        booking.status === 'CANCELLED' ? 'Cancelled' :
                        booking.status === 'CANCELLATION_REQUESTED' ? 'Cancellation Requested' :
                        booking.status
                      }
                      status={booking.status}
                    />

                    {booking.status === 'CONFIRMED' && (
                      cancelStatus[booking.bookingId] === 'processing' ? (
                        <CircularProgress size={24} />
                      ) : (
                        <ModernButton
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          disabled={cancelStatus[booking.bookingId] === 'requested'}
                        >
                          {cancelStatus[booking.bookingId] === 'requested'
                            ? "Requested"
                            : "Cancel"}
                        </ModernButton>
                      )
                    )}

                    {booking.status === 'COMPLETED' && (
                      <ModernButton
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ReviewIcon />}
                        onClick={() => handleLeaveReview(booking.bookingId)}
                      >
                        Review
                      </ModernButton>
                    )}
                  </Box>
                </CardContent>
              </GradientCard>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{
          textAlign: 'center',
          py: 8,
          bgcolor: COLORS.surface,
          borderRadius: 6,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.1)'
        }}>
          <Box sx={{
            width: 140,
            height: 140,
            background: `linear-gradient(135deg, ${COLORS.primaryLight}, ${COLORS.primary}20)`,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            border: `2px solid ${COLORS.primary}30`
          }}>
            <CourtIcon sx={{ fontSize: 70, color: COLORS.primary }} />
          </Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: COLORS.neutral }}>
            No Bookings Found
          </Typography>
          <Typography variant="body1" sx={{
            color: COLORS.neutral,
            opacity: 0.7,
            maxWidth: 500,
            mx: 'auto',
            mb: 4,
            lineHeight: 1.6
          }}>
            Dive into the world of sports and start booking your favorite venues.
          </Typography>
          <ModernButton
            variant="contained"
            color="primary"
            size="large"
            onClick={handleBookCourt}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            Book a Court Now
          </ModernButton>
        </Box>
      )}

      {/* Cancel Reason Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCancelDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please provide a reason for cancelling this booking:
          </Typography>
          <TextField
            label="Cancellation Reason"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            fullWidth
            required
            multiline
            minRows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} color="primary">
            Back
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box sx={{ mt: 8, textAlign: 'center', color: COLORS.neutral, opacity: 0.6 }}>
        <Typography variant="body2">
          © 2025 Pickleball App. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default BookingHistory;