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
  Alert
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getWalletBalance, initializeWallet  } from '../../service/WalletService';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingDetails = location.state?.bookingDetails;
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

 useEffect(() => {
  const fetchWalletBalance = async () => {
    try {
      setIsLoading(true);
      
      // First try to get balance
      let balance;
      try {
        balance = await getWalletBalance();
        console.log('Initial wallet balance:', balance);
      } catch (getError) {
        console.warn('Wallet not found, initializing...', getError);
      }

      // Initialize wallet if needed
      if (balance === undefined || balance === null || balance === 0) {
        console.log('Initializing wallet...');
        await initializeWallet();
        balance = await getWalletBalance();
        console.log('Wallet balance after initialization:', balance);
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
      const token = localStorage.getItem('token');

      const bookingRequest = {
        slotId: bookingDetails.slotId,
        purpose: bookingDetails.purpose,
        numberOfPlayers: bookingDetails.numberOfPlayers,
        durationHours: bookingDetails.durationHours,
        useWallet: paymentMethod === 'wallet'
      };

      const response = await axios.post('/api/member/bookings', bookingRequest, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/booking/confirmation', {
        state: {
          booking: {
            ...response.data,
            date: bookingDetails.date,
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            duration: bookingDetails.durationHours,
            price: bookingDetails.price
          }
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
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

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{
        p: 4,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)'
      }}>
        <Typography variant="h5" gutterBottom sx={{
          fontWeight: 'bold',
          mb: 3,
          textAlign: 'center'
        }}>
          Complete Your Booking
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
                  {bookingDetails.courtName}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Location:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {bookingDetails.courtLocation}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Date:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {bookingDetails.date}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Time:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration:
                </Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="body2" fontWeight="medium">
                  {bookingDetails.durationHours} hours
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
                  RM{bookingDetails.price.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
            Select Payment Method
          </FormLabel>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <Card variant="outlined" sx={{ mb: 2, borderRadius: '8px' }}>
              <FormControlLabel
                value="wallet"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography>Wallet Balance</Typography>
                    {isLoading ? (
                      <CircularProgress size={20} />
                    ) : error ? (
                      <Typography color="error">Error</Typography>
                    ) : (
                      <Typography fontWeight="bold">
                        RM{walletBalance.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ p: 2, width: '100%' }}
              />
            </Card> 

            <Card variant="outlined" sx={{ borderRadius: '8px' }}>
              <FormControlLabel
                value="card"
                control={<Radio />}
                label="Credit/Debit Card"
                sx={{ p: 2, width: '100%' }}
              />
            </Card>
          </RadioGroup>
        </FormControl>

        {paymentMethod === 'wallet' && walletBalance < bookingDetails.price && !isLoading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Insufficient wallet balance. Please add RM{(bookingDetails.price - walletBalance).toFixed(2)} or choose another payment method.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
            py: 1.5,
            backgroundColor: '#4caf50',
            '&:hover': {
              backgroundColor: '#2e7d32'
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0'
            }
          }}
        >
          {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Pay Now'}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          onClick={() => navigate(-1)}
          sx={{ mt: 2, py: 1.5 }}
        >
          Back to Booking
        </Button>
      </Card>
    </Container>
  );
};

export default PaymentPage;