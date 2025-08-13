import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  CircularProgress,
  Chip,
  alpha,
  Avatar
} from '@mui/material';
import { 
  CalendarToday, 
  SportsTennis, 
  AccessTime,
  LocationOn,
  AttachMoney,
  CheckCircle,
  Schedule,
  Cancel,
  Error
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';

const RecentBookings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/member/bookings');
      console.log("Recent Bookings API Response:", response.data);

      // 数据规范化处理
      const normalizedBookings = response.data.map(booking => ({
        id: booking.id || booking.bookingId,
        bookingId: booking.id || booking.bookingId,
        courtId: booking.courtId,
        courtName: booking.courtName || "Pickleball Court",
        courtLocation: booking.location || "Sports Complex",
        slotDate: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        numberOfPlayers: booking.playerCount || booking.numberOfPlayers || 4,
        totalAmount: booking.amount ? Number(booking.amount) : (booking.price || 50.00) + ((booking.numPaddles || 0) * 5) + (booking.buyBallSet ? 12 : 0),
        status: booking.bookingStatus || booking.status || "CONFIRMED",
        purpose: booking.purpose || "Recreational",
        numPaddles: booking.numPaddles || 0,
        buyBallSet: booking.buyBallSet || false,
        bookingDate: booking.bookingDate || booking.createdAt,
        paymentMethod: booking.payment?.paymentMethod || booking.paymentMethod || "Wallet",
        paymentStatus: booking.payment?.status || booking.paymentStatus || "COMPLETED",
        durationHours: booking.durationHours || 1,
        hasReviewed: booking.hasReviewed || false,
      }));

      // 只显示最近的5个预订
      const recentBookings = normalizedBookings
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        .slice(0, 5);

      setBookings(recentBookings);
    } catch (err) {
      console.error('Failed to fetch recent bookings:', err);
      setError('Failed to load recent bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 16 }} />;
      case 'PENDING':
        return <Schedule sx={{ color: theme.palette.warning.main, fontSize: 16 }} />;
      case 'CANCELLED':
      case 'CANCELLATION_REQUESTED':
        return <Cancel sx={{ color: theme.palette.error.main, fontSize: 16 }} />;
      default:
        return <Error sx={{ color: theme.palette.grey[500], fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'CANCELLATION_REQUESTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // 只显示 HH:mm
  };

  const handleViewAll = () => {
    navigate('/profile/my-bookings');
  };

  const handleBookNow = () => {
    navigate('/courts');
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexShrink: 0
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '1.1rem', lg: '1.25rem' }
        }}>
          My Bookings
        </Typography>
        <Button
          size="small"
          onClick={handleViewAll}
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '0.85rem',
            minWidth: 'auto',
            px: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          See all
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {loading ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2
          }}>
            <Error sx={{ 
              fontSize: 48, 
              color: theme.palette.error.main, 
              mb: 2 
            }} />
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchRecentBookings}
              sx={{ fontSize: '0.8rem' }}
            >
              Retry
            </Button>
          </Box>
        ) : bookings.length > 0 ? (
          <Box sx={{ 
            flex: 1,
            overflowY: 'auto',
            pr: 1
          }}>
            {bookings.map((booking, index) => (
              <Box 
                key={booking.id || index} 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, 
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`
                  }
                }}
              >
                {/* Court Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1.5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  >
                    <SportsTennis sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {booking.courtName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.75rem'
                    }}>
                      <LocationOn sx={{ fontSize: 12, mr: 0.5 }} />
                      {booking.courtLocation}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(booking.status)}
                    label={booking.status?.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(booking.status)}
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.7rem',
                      height: 24,
                      '& .MuiChip-icon': { ml: 0.5 }
                    }}
                  />
                </Box>

                {/* Date & Time */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ 
                    fontSize: 14, 
                    color: theme.palette.text.secondary, 
                    mr: 1 
                  }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                    {formatDate(booking.slotDate)}
                  </Typography>
                  <AccessTime sx={{ 
                    fontSize: 14, 
                    color: theme.palette.text.secondary, 
                    mr: 1 
                  }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </Typography>
                </Box>

                {/* Amount & Players */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ 
                      fontSize: 14, 
                      color: theme.palette.success.main, 
                      mr: 0.5 
                    }} />
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      color: theme.palette.success.main,
                      fontSize: '0.8rem'
                    }}>
                      RM{booking.totalAmount?.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {booking.numberOfPlayers} players
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 2
          }}>
            <CalendarToday sx={{ 
              fontSize: { xs: 48, lg: 56 }, 
              color: theme.palette.grey[400], 
              mb: 2 
            }} />
            <Typography variant="h6" sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '1rem', lg: '1.1rem' }
            }}>
              No bookings yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              mb: 3,
              fontSize: '0.9rem',
              lineHeight: 1.4,
              maxWidth: 250
            }}>
              Start your pickleball journey by booking your first court session.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleBookNow}
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': { 
                  backgroundColor: theme.palette.primary.dark 
                },
                fontWeight: 'bold',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                borderRadius: 2
              }}
            >
              Book Now
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecentBookings;