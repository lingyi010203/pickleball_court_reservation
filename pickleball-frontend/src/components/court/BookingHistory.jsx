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
  TextField,
  Snackbar,
  Alert
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
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import api from '../../api/axiosConfig';
import ModernBookingDetailsDialog from '../admin/ModernBookingDetailsDialog';

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
    },
    UPCOMING: {
      backgroundColor: COLORS.warningLight,
      color: COLORS.warning,
      border: `1px solid ${COLORS.warning}20`
    },
    ONGOING: {
      backgroundColor: COLORS.primaryLight,
      color: COLORS.primary,
      border: `1px solid ${COLORS.primary}20`
    },
    REGISTERED: {
      backgroundColor: COLORS.successLight,
      color: COLORS.success,
      border: `1px solid ${COLORS.success}20`
    },
    CANCELLED_DUE_TO_COURT_DELETION: {
      backgroundColor: '#fff3e0',
      color: '#ff5722',
      border: `1px solid #ff572220`
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
  const theme = useTheme();
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [cancellationDetails, setCancellationDetails] = useState(null);
  const [cancellationDetailsOpen, setCancellationDetailsOpen] = useState(false);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/member/bookings');
      console.log("API Response:", response.data);

      // 数据规范化处理 - 根据实际API响应调整字段映射
      const normalizedBookings = response.data.map(booking => {
        console.log('Processing booking:', booking);
        console.log('Court ID from API:', booking.courtId);
        
        const normalizedBooking = {
        id: booking.id || booking.bookingId, // 确保ID字段正确
        bookingId: booking.id || booking.bookingId,
          courtId: booking.courtId, // 直接从API获取
          courtName: booking.courtName || "AAA Pickleball Court",
          courtLocation: booking.location || "123 Sports Complex, Kuala Lumpur",
          slotDate: booking.date, // 使用API中的date字段
          startTime: booking.startTime, // 使用API中的startTime字段
          endTime: booking.endTime, // 使用API中的endTime字段
        numberOfPlayers: booking.playerCount || booking.numberOfPlayers || 4,
        totalAmount: booking.amount ? Number(booking.amount) : (booking.price || 50.00) + ((booking.numPaddles || 0) * 5) + (booking.buyBallSet ? 12 : 0),
        status: booking.bookingStatus || booking.status || "CONFIRMED",
        purpose: booking.purpose || "Recreational",
        numPaddles: booking.numPaddles || 0,
        buyBallSet: booking.buyBallSet || false,
        bookingDate: booking.bookingDate || booking.createdAt,
        // 支付相关字段
        paymentMethod: booking.payment?.paymentMethod || booking.paymentMethod || "Wallet",
        paymentType: booking.payment?.paymentType || booking.paymentType,
        paymentStatus: booking.payment?.status || booking.paymentStatus || "COMPLETED",
        transactionId: booking.payment?.transactionId || booking.transactionId,
        // 会员信息
        memberId: booking.memberId || booking.member?.id,
        // 多slot支持
        bookingSlots: booking.bookingSlots || [],
        durationHours: booking.durationHours || 1,
          // 评价状态
          hasReviewed: booking.hasReviewed || false,
          // 新增：預訂類型
          bookingType: booking.bookingType || "COURT_BOOKING",
        };
        
        console.log('Normalized booking:', normalizedBooking);
        console.log('Extracted courtId:', normalizedBooking.courtId);
        console.log('Extracted slotDate:', normalizedBooking.slotDate);
        console.log('Extracted startTime:', normalizedBooking.startTime);
        console.log('Extracted endTime:', normalizedBooking.endTime);
        
        return normalizedBooking;
      });

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
      setSnackbar({
        open: true,
        message: 'Please provide a reason for cancellation.',
        severity: 'warning'
      });
      return;
    }
    setCancellingId(cancelBookingId);
    setCancelStatus(prev => ({ ...prev, [cancelBookingId]: 'processing' }));
    api.post(`/member/bookings/${cancelBookingId}/cancel`, { reason: cancelReason })
      .then(response => {
        const cancellationData = response.data;
        
        // 更新预订状态
        setBookings(prev => prev.map(booking =>
          booking.bookingId === cancelBookingId
            ? { ...booking, status: cancellationData.status === 'APPROVED' ? 'CANCELLED' : 'CANCELLATION_REQUESTED' }
            : booking
        ));
        setCancelStatus(prev => ({ ...prev, [cancelBookingId]: 'requested' }));
        
        // 如果是自动批准的取消，显示详细信息
        if (cancellationData.isAutoApproved) {
          setCancellationDetails(cancellationData);
          setCancellationDetailsOpen(true);
        } else {
          setSnackbar({
            open: true,
            message: 'Cancellation request submitted successfully!',
            severity: 'success'
          });
        }
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
        setSnackbar({
          open: true,
          message: `Cancellation failed: ${errorMsg}`,
          severity: 'error'
        });
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

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCancellationDetailsClose = () => {
    setCancellationDetailsOpen(false);
    setCancellationDetails(null);
  };

  const handleLeaveReview = (booking) => {
    console.log('=== Review Button Clicked ===');
    console.log('Booking data:', booking);
    console.log('Booking ID:', booking.bookingId);
    console.log('Court Name:', booking.courtName);
    console.log('Court Location:', booking.courtLocation);
    console.log('Slot Date:', booking.slotDate);
    console.log('Start Time:', booking.startTime);
    console.log('End Time:', booking.endTime);
    console.log('Duration Hours:', booking.durationHours);
    console.log('Has Reviewed:', booking.hasReviewed);
    
    // 检查预订是否包含必要的信息
    if (!booking.bookingId) {
      console.error('Missing booking ID');
      console.log('Falling back to select page');
      // 如果信息不全，回退到选择页面
      navigate('/profile/my-bookings');
      return;
    }

    const navigationState = {
      targetType: 'COURT',
      courtName: booking.courtName,
      courtLocation: booking.courtLocation,
      slotDate: booking.slotDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationHours: booking.durationHours,
      bookingId: String(booking.bookingId), // 确保bookingId是字符串类型
      isEditing: false, // 新建评价
      isViewReview: booking.hasReviewed // 如果已经评价过，设置为View Review模式
    };

    console.log('Navigation state:', navigationState);
    console.log('Navigating to /feedback...');

    // 直接导航到反馈页面，并传递预订信息
    navigate('/feedback', {
      state: navigationState
    });
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedBooking(null);
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
      if (tabValue === 'events') return booking.bookingType === 'EVENT';
      if (tabValue === 'upcoming') {
        // 對於 upcoming，只顯示狀態為 CONFIRMED 或 UPCOMING 的預訂
        // 明確排除 COMPLETED、CANCELLED 等狀態
        return (booking.status === 'CONFIRMED' || booking.status === 'UPCOMING') &&
               booking.status !== 'COMPLETED' &&
               booking.status !== 'CANCELLED' &&
               booking.status !== 'CANCELLATION_REQUESTED';
      }
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
                      bgcolor: booking.bookingType === 'EVENT' ? COLORS.warning : COLORS.primary,
                      mr: 2,
                      width: 56,
                      height: 56,
                      boxShadow: `0 4px 12px ${booking.bookingType === 'EVENT' ? COLORS.warning : COLORS.primary}30`
                    }}>
                      {booking.bookingType === 'EVENT' ? (
                        <EventIcon sx={{ fontSize: 28 }} />
                      ) : (
                        <CourtIcon sx={{ fontSize: 28 }} />
                      )}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.neutral }}>
                          {booking.courtName}
                        </Typography>
                        {booking.bookingType === 'EVENT' && (
                          <Chip
                            label="Event"
                            size="small"
                            sx={{
                              backgroundColor: COLORS.warningLight,
                              color: COLORS.warning,
                              border: `1px solid ${COLORS.warning}20`,
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: COLORS.neutral, opacity: 0.7 }}>
                        {booking.bookingType === 'EVENT' ? 'Event Registration' : booking.courtLocation}
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
                          {booking.bookingType === 'EVENT' ? 'Individual' : `${booking.numberOfPlayers} players`}
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
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <StatusChip
                        label={
                          booking.status === 'CONFIRMED' ? 'Upcoming' :
                          booking.status === 'COMPLETED' ? 'Completed' :
                          booking.status === 'CANCELLED' ? 'Cancelled' :
                          booking.status === 'CANCELLATION_REQUESTED' ? 'Cancellation Requested' :
                          booking.status === 'UPCOMING' ? 'Upcoming' :
                          booking.status === 'ONGOING' ? 'Ongoing' :
                          booking.status
                        }
                        status={booking.status}
                      />
                      {booking.bookingType === 'EVENT' && (
                        <Chip
                          label="REGISTERED"
                          size="small"
                          sx={{
                            backgroundColor: COLORS.successLight,
                            color: COLORS.success,
                            border: `1px solid ${COLORS.success}20`,
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <ModernButton
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(booking)}
                      >
                        Details
                      </ModernButton>

                    {booking.status === 'CONFIRMED' && booking.bookingType !== 'EVENT' && (
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

                    {booking.status === 'COMPLETED' && booking.bookingType !== 'EVENT' && (
                      booking.hasReviewed ? (
                        <ModernButton
                          variant="outlined"
                          color="success"
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleLeaveReview(booking)}
                        >
                          View Review
                        </ModernButton>
                      ) : (
                      <ModernButton
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ReviewIcon />}
                          onClick={() => handleLeaveReview(booking)}
                      >
                        Review
                      </ModernButton>
                      )
                    )}
                    </Box>
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

      {/* Booking Details Dialog */}
      <ModernBookingDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        booking={selectedBooking}
        loading={false}
        editableRemark={false}
        isAdmin={false}
      />

      {/* Cancellation Details Dialog */}
      <Dialog 
        open={cancellationDetailsOpen} 
        onClose={handleCancellationDetailsClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          color: COLORS.success,
          fontWeight: 700
        }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: COLORS.success,
              mb: 1
            }}>
              ✅ Cancellation Successful
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}>
              Your booking has been cancelled and refund processed
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {cancellationDetails && (
            <Box>
              {/* Booking Information */}
              <Paper sx={{ p: 3, mb: 3, backgroundColor: COLORS.surface, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: COLORS.neutral, fontWeight: 600 }}>
                  📅 Booking Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Court:</strong> {cancellationDetails.courtName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Date:</strong> {cancellationDetails.slotDate}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Time:</strong> {cancellationDetails.slotTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Booking ID:</strong> #{cancellationDetails.bookingId}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Status:</strong> 
                      <Chip 
                        label="CANCELLED" 
                        size="small" 
                        sx={{ 
                          ml: 1,
                          backgroundColor: COLORS.errorLight,
                          color: COLORS.error,
                          fontWeight: 600
                        }} 
                      />
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Processed:</strong> {new Date(cancellationDetails.requestDate).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Refund Information */}
              <Paper sx={{ p: 3, mb: 3, backgroundColor: COLORS.successLight, borderRadius: 2, border: `1px solid ${COLORS.success}20` }}>
                <Typography variant="h6" sx={{ mb: 2, color: COLORS.success, fontWeight: 600 }}>
                  💰 Refund Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Original Amount:</strong> MYR {cancellationDetails.originalAmount?.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Refund Amount:</strong> 
                      <span style={{ color: COLORS.success, fontWeight: 600, fontSize: '1.1em' }}>
                        {' '}MYR {cancellationDetails.refundAmount?.toFixed(2)}
                      </span>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Refund Method:</strong> {cancellationDetails.refundMethod}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                      <strong>Refund Status:</strong> 
                      <Chip 
                        label={cancellationDetails.refundStatus} 
                        size="small" 
                        sx={{ 
                          ml: 1,
                          backgroundColor: COLORS.success,
                          color: '#ffffff',
                          fontWeight: 600
                        }} 
                      />
                    </Typography>
                  </Grid>
                </Grid>
                <Typography variant="body2" sx={{ 
                  color: COLORS.success, 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: '#ffffff', 
                  borderRadius: 1,
                  border: `1px solid ${COLORS.success}30`
                }}>
                  <strong>Note:</strong> Your refund has been automatically processed and credited to your wallet. 
                  You can use this amount for future bookings.
                </Typography>
              </Paper>

              {/* Additional Information */}
              <Paper sx={{ p: 3, backgroundColor: COLORS.primaryLight, borderRadius: 2, border: `1px solid ${COLORS.primary}20` }}>
                <Typography variant="h6" sx={{ mb: 2, color: COLORS.primary, fontWeight: 600 }}>
                  ℹ️ Additional Information
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                  <strong>Processing Type:</strong> {cancellationDetails.isAutoApproved ? 'Auto-approved' : 'Manual review'}
                </Typography>
                {cancellationDetails.adminRemark && (
                  <Typography variant="body2" sx={{ color: COLORS.neutral, mb: 1 }}>
                    <strong>Admin Note:</strong> {cancellationDetails.adminRemark}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ 
                  color: COLORS.primary, 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: '#ffffff', 
                  borderRadius: 1,
                  border: `1px solid ${COLORS.primary}30`
                }}>
                  <strong>Next Steps:</strong> You can now book another court or check your wallet balance. 
                  The refunded amount is immediately available for use.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancellationDetailsClose} 
            variant="contained"
            sx={{
              backgroundColor: COLORS.success,
              color: '#ffffff',
              '&:hover': {
                backgroundColor: COLORS.successHover
              }
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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