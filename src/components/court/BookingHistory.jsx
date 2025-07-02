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
  CircularProgress
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
import axios from 'axios';

// Styled components
const GradientCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, #f5f7ff, #ffffff)',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(149, 157, 165, 0.3)'
  },
}));

const StatusChip = styled(Chip)(({ status, theme }) => {
  const statusColors = {
    upcoming: theme.palette.warning.light,
    completed: theme.palette.success.light,
    cancelled: theme.palette.error.light,
    CONFIRMED: theme.palette.warning.light,
    COMPLETED: theme.palette.success.light,
    CANCELLED: theme.palette.error.light
  };
  
  const statusTextColors = {
    upcoming: theme.palette.warning.dark,
    completed: theme.palette.success.dark,
    cancelled: theme.palette.error.dark,
    CONFIRMED: theme.palette.warning.dark,
    COMPLETED: theme.palette.success.dark,
    CANCELLED: theme.palette.error.dark
  };
  
  return {
    backgroundColor: statusColors[status] || theme.palette.grey[300],
    color: statusTextColors[status] || theme.palette.grey[700],
    fontWeight: 600,
    borderRadius: '12px',
    padding: '4px 8px'
  };
});

const BookingHistory = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_BASE_URL = 'http://localhost:8081/api/member';

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setBookings(response.data);
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
    console.log(`Cancel booking ${id}`);
    // Implement cancellation logic here
  };
  
  const handleLeaveReview = (id) => {
    console.log(`Leave review for booking ${id}`);
    navigate('/feedback/select');
  };

  // Filter bookings based on status
  const filteredBookings = tabValue === 'all' 
    ? bookings 
    : bookings.filter(booking => {
        if (tabValue === 'upcoming') return booking.status === 'CONFIRMED';
        if (tabValue === 'completed') return booking.status === 'COMPLETED';
        if (tabValue === 'cancelled') return booking.status === 'CANCELLED';
        return true;
      });

  // Format time to AM/PM format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const timeParts = timeString.split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading booking history...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={fetchBookingHistory}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/profile')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          My Bookings
        </Typography>
        <IconButton 
          color={showFilters ? 'primary' : 'default'} 
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon />
        </IconButton>
      </Box>
      
      {/* Filter Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
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
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Additional Filters</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label="This Week" variant="outlined" />
            <Chip label="This Month" variant="outlined" />
            <Chip label="Past Bookings" variant="outlined" />
            <Chip label="Group Bookings" variant="outlined" />
            <Chip label="Solo Bookings" variant="outlined" />
          </Stack>
        </Paper>
      )}
      
      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <Grid container spacing={3}>
          {filteredBookings.map((booking) => {
            const bookingDate = new Date(booking.slotDate);
            const formattedDate = bookingDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            
            return (
              <Grid item xs={12} sm={6} md={4} key={booking.bookingId}>
                <GradientCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <CourtIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{booking.courtName}</Typography>
                        <Typography variant="body2" color="text.secondary">{booking.courtLocation}</Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{formattedDate}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PlayersIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{booking.numberOfPlayers} players</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AmountIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">MYR {booking.totalAmount.toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <StatusChip 
                        label={booking.status.charAt(0) + booking.status.slice(1).toLowerCase()} 
                        status={booking.status} 
                      />
                      
                      {booking.status === 'CONFIRMED' && (
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelBooking(booking.bookingId)}
                        >
                          Cancel
                        </Button>
                      )}
                      
                      {booking.status === 'COMPLETED' && (
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          size="small"
                          startIcon={<ReviewIcon />}
                          onClick={() => handleLeaveReview(booking.bookingId)}
                        >
                          Review
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </GradientCard>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8, 
          bgcolor: 'background.paper', 
          borderRadius: 4,
          boxShadow: 1
        }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            bgcolor: 'primary.light', 
            borderRadius: '50%', 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}>
            <CourtIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>No Bookings Found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            Dive into the world of sports and start booking your favorite venues.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={handleBookCourt}
            sx={{ 
              px: 4,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Book a Court Now
          </Button>
        </Box>
      )}
      
      {/* Footer */}
      <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          © 2025 Pickleball App. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default BookingHistory;