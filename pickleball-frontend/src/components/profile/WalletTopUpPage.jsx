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
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { getWalletBalance, topUpWallet } from '../../service/WalletService';

const WalletTopUpPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(-4px)'
          },
          transition: 'all 0.3s ease'
        }}
        startIcon={<BackIcon />}
      >
        Back
      </Button>

      <Card sx={{
        borderRadius: 3,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0.8)})`
      }}>
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
            Top Up Wallet
          </Typography>
          
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }}>
            Add money to your wallet for easy payments
          </Typography>
          </Box>

          {/* Current Balance */}
          <Box sx={{ 
            mb: 5, 
            p: 4, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.light, 0.05)})`,
            borderRadius: 3,
            border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '60px',
              height: '60px',
              background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.1)} 0%, transparent 70%)`,
              borderRadius: '50%',
              transform: 'translate(20px, -20px)'
            }
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
              Current Balance
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.success.dark }}>
              RM{walletBalance.toFixed(2)}
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
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.text.primary }}>
              Select Amount
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {predefinedAmounts.map((predefinedAmount) => (
                <Grid item xs={4} sm={2} key={predefinedAmount}>
                  <Button
                    fullWidth
                    variant={amount === predefinedAmount.toString() ? "contained" : "outlined"}
                    onClick={() => setAmount(predefinedAmount.toString())}
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      ...(amount === predefinedAmount.toString() && {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: theme.palette.common.white,
                        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                        transform: 'translateY(-2px)'
                      }),
                      '&:hover': {
                        transform: amount === predefinedAmount.toString() ? 'translateY(-2px)' : 'translateY(-1px)',
                        boxShadow: amount === predefinedAmount.toString() ? 
                          `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}` : 
                          `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
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
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }
              }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, fontWeight: 600, color: theme.palette.primary.main }}>RM</Typography>
              }}
            />
          </Box>

          {/* Payment Source */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.text.primary }}>
              Payment Method
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 500 }}>Payment Source</InputLabel>
              <Select
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value)}
                label="Payment Source"
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.3)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }}
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
              py: 3,
              px: 4,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '1.1rem',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: theme.palette.grey[300],
                color: theme.palette.grey[500],
                boxShadow: 'none',
                transform: 'none'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? (
              <CircularProgress size={28} color="inherit" />
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