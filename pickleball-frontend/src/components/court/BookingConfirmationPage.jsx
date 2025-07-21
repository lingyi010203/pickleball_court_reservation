import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PADDLE_PRICE = 5; // 每个 paddle 租金
const BALL_SET_PRICE = 12; // 一组 ball set 售价

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  // 添加调试日志
  console.log('=== BookingConfirmationPage Debug ===');
  console.log('Location state:', location.state);
  console.log('Booking object:', booking);
  console.log('slotDate:', booking?.slotDate);
  console.log('startTime:', booking?.startTime);
  console.log('endTime:', booking?.endTime);
  console.log('durationHours:', booking?.durationHours);

  const formatDate = (dateString) => {
    console.log('formatDate called with:', dateString);
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([],
      { hour: '2-digit', minute: '2-digit' });
  };

  const numPlayers = booking.numberOfPlayers || 2;
  const numPaddles = booking.numPaddles || 0;
  const buyBallSet = !!booking.buyBallSet;
  const total = booking.price !== undefined ? booking.price : booking.totalAmount;

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
      <Card
        sx={{
          textAlign: 'center',
          p: 4,
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: '#4caf50',
            mb: 2,
            backgroundColor: '#e8f5e9',
            borderRadius: '50%',
            padding: '10px',
          }}
        />
  
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: '#2e7d32',
            mb: 2,
          }}
        >
          Booking Confirmed!
        </Typography>
  
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your booking at {booking.courtName} has been confirmed
        </Typography>
  
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            mb: 4,
            textAlign: 'left',
            backgroundColor: '#f9f9f9',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Booking Summary
            </Typography>
  
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <SummaryRow label="Number of Players" value={numPlayers} />
                <SummaryRow
                  label="Paddles to Rent"
                  value={`${numPaddles} (RM${PADDLE_PRICE} each)`}
                />
                <SummaryRow
                  label={`Buy Ball Set (RM${BALL_SET_PRICE})`}
                  value={buyBallSet ? 'Yes' : 'No'}
                  isLast
                />
              </CardContent>
            </Card>
  
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <SummaryRow label="Court" value={booking.courtName} bold />
                <SummaryRow label="Location" value={booking.courtLocation} />
                <SummaryRow label="Date" value={formatDate(booking.slotDate)} />
                <SummaryRow
                  label="Time"
                  value={`${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`}
                />
                <SummaryRow
                  label="Duration"
                  value={`${booking.durationHours} hours`}
                  isLast
                />
              </CardContent>
            </Card>
  
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <SummaryRow
                  label="Total Amount"
                  value={`RM${total.toFixed(2)}`}
                  bold
                  color="#2e7d32"
                />
                <SummaryRow
                  label="Payment Method"
                  value={booking.paymentMethod === 'WALLET' ? 'Wallet' : 'Credit Card'}
                />
                <SummaryRow
                  label="Payment Status"
                  value={booking.paymentStatus}
                  color={booking.paymentStatus === 'COMPLETED' ? '#2e7d32' : '#ff9800'}
                  bold
                  isLast
                />
              </CardContent>
            </Card>
  
            {booking.pointsEarned && (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  backgroundColor: '#f3e5f5',
                  border: '1px solid #ce93d8',
                  borderRadius: '8px',
                  mt: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="#9c27b0"
                  textAlign="center"
                  gutterBottom
                >
                  🎉 Points Earned!
                </Typography>
  
                <SummaryRow
                  label="Points Earned"
                  value={`+${booking.pointsEarned}`}
                  bold
                  color="#9c27b0"
                />
                <SummaryRow
                  label="Current Balance"
                  value={`${booking.currentPointBalance} points`}
                  isLast
                />
  
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 1 }}
                >
                  Earn 1 point for every RM1 spent!
                </Typography>
              </Paper>
            )}
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
                borderColor: '#2e7d32',
              },
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
                backgroundColor: '#e65100',
              },
            }}
          >
            Book Another Court
          </Button>
        </Box>
              </Card>
      </Container>
    );
  };
  
const SummaryRow = ({ label, value, bold = false, color, isLast = false }) => (
  <Grid container spacing={1} sx={{ mb: isLast ? 0 : 1 }}>
    <Grid item xs={6}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Grid>
    <Grid item xs={6} textAlign="right">
      <Typography
        variant="body2"
        fontWeight={bold ? 'bold' : 'normal'}
        sx={{ color: color || 'inherit' }}
      >
        {value}
      </Typography>
    </Grid>
  </Grid>
);

export default BookingConfirmationPage;