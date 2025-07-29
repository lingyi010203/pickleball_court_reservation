import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SportsIcon from '@mui/icons-material/Sports';
import GroupIcon from '@mui/icons-material/Group';
import api from '../../api/axiosConfig.js';
import { getWalletBalance, initializeWallet } from '../../service/WalletService';
import { useAuth } from '../../context/AuthContext';
import ThemedCard from '../common/ThemedCard';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingDetails = location.state?.bookingDetails;
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        setIsLoading(true);
        let balance;

        try {
          balance = await getWalletBalance();
        } catch (getError) {
          console.warn('Wallet not found, initializing...', getError);
          await initializeWallet();
          balance = await getWalletBalance();
        }

        setWalletBalance(balance);
      } catch (err) {
        console.error('Wallet balance error:', err);
        setError('Failed to load wallet balance: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletBalance();
  }, []);

  const handlePayment = async () => {
    if (!bookingDetails) {
      setError('Booking details missing');
      return;
    }

    try {
      setIsProcessing(true);

      const bookingRequest = {
        slotIds: bookingDetails.slotIds,
        purpose: bookingDetails.purpose,
        numberOfPlayers: bookingDetails.numberOfPlayers,
        numPaddles: bookingDetails.numPaddles,
        buyBallSet: bookingDetails.buyBallSet,
        durationHours: bookingDetails.durationHours,
        useWallet: paymentMethod === 'wallet'
      };

      console.log('=== PaymentPage Debug ===');
      console.log('Payment Method:', paymentMethod);
      console.log('Use Wallet:', paymentMethod === 'wallet');
      console.log('Booking Request:', bookingRequest);

      const response = await api.post('/member/bookings', bookingRequest);

      console.log('=== PaymentPage Debug ===');
      console.log('API Response:', response.data);
      console.log('Booking Details:', bookingDetails);

      navigate('/booking/confirmation', {
        state: {
          booking: {
            ...response.data,
            slotDate: bookingDetails.date,
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            durationHours: bookingDetails.durationHours,
            totalAmount: bookingDetails.price,
            numPaddles: bookingDetails.numPaddles,
            buyBallSet: bookingDetails.buyBallSet,
            numberOfPlayers: bookingDetails.numberOfPlayers,
            courtName: bookingDetails.courtName,
            courtLocation: bookingDetails.courtLocation,
            venueName: bookingDetails.venueName,
            venueLocation: bookingDetails.venueLocation,
            pointsEarned: response.data.pointsEarned,
            currentPointBalance: response.data.currentPointBalance
          }
        }
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Payment failed. Please try again.';

      if (errorMessage.includes('Insufficient wallet balance')) {
        setError('Your wallet balance is too low. Please top up and try again.');
      } else {
        setError(errorMessage);
      }

      setIsProcessing(false);
    }
  };

  if (!bookingDetails) {
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

  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([],
      { hour: '2-digit', minute: '2-digit' });
  };

  const PADDLE_PRICE = 5;
  const BALL_SET_PRICE = 12;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <PaymentIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Complete Payment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review your booking and choose payment method
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3, 
        minHeight: '600px' 
      }}>
        {/* Left Column - Booking Summary */}
        <Box sx={{ flex: { xs: 'none', md: 1 } }}>
          <ThemedCard sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
                📋 Booking Summary
              </Typography>

              {/* Court & Venue Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SportsIcon sx={{ color: '#1976d2', mr: 1, fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {bookingDetails.courtName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bookingDetails.venueName}{bookingDetails.venueLocation ? `，${bookingDetails.venueLocation}` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* Date & Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccessTimeIcon sx={{ color: '#1976d2', mr: 1, fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {bookingDetails.date}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)} ({bookingDetails.durationHours}h)
                  </Typography>
                </Box>
              </Box>

              {/* Players & Equipment */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
                👥 Players & Equipment
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <GroupIcon sx={{ color: '#1976d2', fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {bookingDetails.numberOfPlayers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Players
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <SportsIcon sx={{ color: '#9c27b0', fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {bookingDetails.numPaddles}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paddles (RM{PADDLE_PRICE} each)
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <SportsIcon sx={{ color: '#4caf50', fontSize: 32, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {bookingDetails.buyBallSet ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ball Set (RM{BALL_SET_PRICE})
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </ThemedCard>
        </Box>

        {/* Right Column - Payment */}
        <Box sx={{ flex: { xs: 'none', md: 1 } }}>
          <ThemedCard sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 3 }}>
                💳 Payment Details
              </Typography>

              {/* Total Amount */}
              <Paper 
                elevation={0}
                sx={{ 
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  border: '2px solid #4caf50'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total Amount:
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    RM{bookingDetails.price.toFixed(2)}
                  </Typography>
                </Box>
              </Paper>

              {/* Payment Method Selection */}
              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: '#424242' }}>
                  Select Payment Method
                </FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {/* Wallet Option */}
                  <ThemedCard 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      border: paymentMethod === 'wallet' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: paymentMethod === 'wallet' ? '#f3f8ff' : 'transparent'
                    }}
                  >
                    <FormControlLabel
                      value="wallet"
                      control={<Radio color="primary" />}
                      label={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', p: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountBalanceWalletIcon sx={{ color: '#1976d2', mr: 1 }} />
                            <Typography sx={{ fontWeight: 'bold' }}>SuperBadge Wallet</Typography>
                          </Box>
                          {isLoading ? (
                            <CircularProgress size={20} />
                          ) : error ? (
                            <Typography color="error">Error</Typography>
                          ) : (
                            <Typography fontWeight="bold" color="#1976d2">
                              RM{walletBalance.toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ p: 2, width: '100%' }}
                    />
                  </ThemedCard>

                  {/* Credit Card Option */}
                  <ThemedCard 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 2,
                      border: paymentMethod === 'card' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: paymentMethod === 'card' ? '#f3f8ff' : 'transparent'
                    }}
                  >
                    <FormControlLabel
                      value="card"
                      control={<Radio color="primary" />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                          <CreditCardIcon sx={{ color: '#1976d2', mr: 1 }} />
                          <Typography sx={{ fontWeight: 'bold' }}>Credit/Debit Card</Typography>
                        </Box>
                      }
                      sx={{ p: 2, width: '100%' }}
                    />
                  </ThemedCard>
                </RadioGroup>
              </FormControl>

              {/* Insufficient Balance Warning */}
              {paymentMethod === 'wallet' && walletBalance < bookingDetails.price && !isLoading && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Insufficient wallet balance. You need RM{(bookingDetails.price - walletBalance).toFixed(2)} more.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/wallet/topup')}
                    sx={{
                      backgroundColor: '#ff9800',
                      '&:hover': {
                        backgroundColor: '#f57c00'
                      }
                    }}
                  >
                    Top Up Wallet
                  </Button>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handlePayment}
                  disabled={
                    isProcessing ||
                    (paymentMethod === 'wallet' && walletBalance < bookingDetails.price) ||
                    isLoading
                  }
                  sx={{
                    py: 2,
                    backgroundColor: '#4caf50',
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#2e7d32'
                    },
                    '&:disabled': {
                      backgroundColor: '#e0e0e0'
                    }
                  }}
                >
                  {isProcessing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    `Pay RM${bookingDetails.price.toFixed(2)}`
                  )}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate(-1)}
                  sx={{ 
                    py: 2, 
                    borderRadius: 2,
                    borderColor: '#757575',
                    color: '#757575',
                    '&:hover': {
                      borderColor: '#424242',
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  Back to Booking
                </Button>
              </Box>
            </CardContent>
          </ThemedCard>
        </Box>
      </Box>
    </Container>
  );
};

export default PaymentPage;