import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { getWalletBalance, topUpWallet } from '../../service/WalletService';

const WalletTopUpPage = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [paymentSource, setPaymentSource] = useState('BANK_CARD');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const balance = await getWalletBalance();
        setWalletBalance(balance);
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        setError('Failed to load wallet balance');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletBalance();
  }, []);

  const handleTopUp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      await topUpWallet(parseFloat(amount), paymentSource);
      
      setSuccess(true);
      // Refresh wallet balance
      const newBalance = await getWalletBalance();
      setWalletBalance(newBalance);
      
      // Redirect back to payment page after 2 seconds
      setTimeout(() => {
        navigate(-1);
      }, 2000);
      
    } catch (error) {
      setError(error.message || 'Top-up failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const predefinedAmounts = [10, 20, 50, 100, 200, 500];

  if (isLoading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button
        variant="text"
        onClick={() => navigate(-1)}
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          textTransform: 'none',
          fontWeight: 500,
          color: '#1976d2',
          '&:hover': {
            backgroundColor: 'transparent',
            textDecoration: 'underline'
          }
        }}
        startIcon={<BackIcon />}
      >
        Back
      </Button>

      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        background: 'linear-gradient(135deg, #f8f9ff, #ffffff)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
            Top Up Wallet
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: '#666' }}>
            Add money to your wallet for easy payments
          </Typography>

          {/* Current Balance */}
          <Box sx={{ 
            mb: 4, 
            p: 3, 
            bgcolor: 'rgba(46, 125, 50, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(46, 125, 50, 0.2)',
            textAlign: 'center'
          }}>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              Current Balance: RM{walletBalance.toFixed(2)}
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Top-up successful! Redirecting back to payment...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Amount Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Select Amount
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {predefinedAmounts.map((predefinedAmount) => (
                <Grid item xs={4} sm={2} key={predefinedAmount}>
                  <Button
                    fullWidth
                    variant={amount === predefinedAmount.toString() ? "contained" : "outlined"}
                    onClick={() => setAmount(predefinedAmount.toString())}
                    sx={{
                      py: 1.5,
                      borderRadius: '8px',
                      fontWeight: 600,
                      ...(amount === predefinedAmount.toString() && {
                        background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                        color: 'white'
                      })
                    }}
                  >
                    RM{predefinedAmount}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <TextField
              fullWidth
              label="Custom Amount (RM)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>RM</Typography>
              }}
            />
          </Box>

          {/* Payment Source */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Payment Method
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Payment Source</InputLabel>
              <Select
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value)}
                label="Payment Source"
              >
                <MenuItem value="BANK_CARD">Credit/Debit Card</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="E_WALLET">E-Wallet</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Top Up Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleTopUp}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            sx={{
              py: 1.5,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #2575fc 0%, #6a11cb 100%)',
                boxShadow: '0 4px 12px rgba(37, 117, 252, 0.4)'
              }
            }}
          >
            {isProcessing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Top Up RM${amount || '0.00'}`
            )}
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default WalletTopUpPage; 