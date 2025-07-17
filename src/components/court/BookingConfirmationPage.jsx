import React from 'react';
import { 
  Container, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Grid,
  Divider
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([], 
      { hour: '2-digit', minute: '2-digit' });
  };

  if (!booking) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Booking information not available
        </Typography>
        <Button variant="contained" onClick={() => navigate('/courts')}>
          Browse Courts
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{ 
        textAlign: 'center', 
        p: 4,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)'
      }}>
        <CheckCircleIcon sx={{ 
          fontSize: 80, 
          color: '#4caf50', 
          mb: 2,
          backgroundColor: '#e8f5e9',
          borderRadius: '50%',
          padding: '10px'
        }} />
        
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 'bold',
          color: '#2e7d32',
          mb: 2
        }}>
          Booking Confirmed!
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your booking at {booking.courtName} has been confirmed
        </Typography>
        
        <Box sx={{ 
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          mb: 4,
          textAlign: 'left',
          backgroundColor: '#f9f9f9'
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Booking Summary
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Court:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {booking.courtName}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {booking.courtLocation}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Date:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {formatDate(booking.slotDate)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Time:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {booking.durationHours} hours
                </Typography>
              </Grid>
              
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold">
                  Total Amount:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body1" fontWeight="bold" color="#2e7d32">
                  RM{booking.totalAmount.toFixed(2)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold">
                  Payment Method:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body1" fontWeight="medium">
                  {booking.paymentMethod === 'WALLET' ? 'Wallet' : 'Credit Card'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold">
                  Payment Status:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body1" fontWeight="medium" 
                  sx={{ 
                    color: booking.paymentStatus === 'COMPLETED' ? '#2e7d32' : '#ff9800',
                    fontWeight: 'bold'
                  }}>
                  {booking.paymentStatus}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/profile/my-bookings')}
            sx={{ 
              px: 4,
              py: 1.5,
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': {
                backgroundColor: '#e8f5e9',
                borderColor: '#2e7d32'
              }
            }}
          >
            View My Bookings
          </Button>
          
          <Button 
            variant="contained" 
            onClick={() => navigate('/courts')}
            sx={{ 
              px: 4,
              py: 1.5,
              backgroundColor: '#ff6f00',
              '&:hover': {
                backgroundColor: '#e65100'
              }
            }}
          >
            Book Another Court
          </Button>
        </Box>
      </Card>
    </Container>
  );
};

export default BookingConfirmationPage;