import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Chip, Button, 
  CircularProgress, Alert, Grow, useTheme, alpha
} from '@mui/material';
import { ConfirmationNumber as VoucherIcon } from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { formatVoucherExpiryDate } from '../../utils/dateUtils';

const ActiveVouchers = ({ onSuccess, onError }) => {
  const theme = useTheme();
  const [usingId, setUsingId] = useState(null);
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch active vouchers
  useEffect(() => {
    const fetchActiveVouchers = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;

        const response = await axios.get('http://localhost:8081/api/voucher-redemption/my-active-redemptions', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setActiveVouchers(response.data);
      } catch (err) {
        console.error('Error fetching active vouchers:', err);
        setError('Failed to load active vouchers. Please try again later.');
        if (onError) onError('Failed to load active vouchers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVouchers();
  }, []);

  const handleUseVoucher = async (redemptionId) => {
    setUsingId(redemptionId);
    setError('');
    setSuccess('');
    
    try {
      const token = UserService.getToken();
      if (!token) return;

      const response = await axios.post(
        `http://localhost:8081/api/voucher-redemption/use/${redemptionId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        const successMsg = `Successfully used voucher: ${response.data.voucherCode}`;
        setSuccess(successMsg);
        if (onSuccess) onSuccess(successMsg);
        
        // Remove the used voucher from the list
        setActiveVouchers(prev => prev.filter(v => v.id !== redemptionId));
      }
    } catch (err) {
      console.error('Error using voucher:', err);
      const errorMsg = err.response?.data?.message || 'Failed to use voucher';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setUsingId(null);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={handleCloseSnackbar} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={handleCloseSnackbar} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        My Active Vouchers
      </Typography>
      
      {activeVouchers.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3, boxShadow: 1 }}>
          You don't have any active vouchers. Redeem some vouchers to get started!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {activeVouchers.map((voucher, index) => {
            let backgroundColor;
            if (voucher.discountType === 'percentage') {
              backgroundColor = voucher.discountValue > 30 
                ? '#e8f5e8' 
                : voucher.discountValue > 15 
                  ? '#fff3e0' 
                  : '#f3e5f5';
            } else {
              backgroundColor = voucher.discountValue > 50 
                ? '#e8f5e8' 
                : voucher.discountValue > 20 
                  ? '#fff3e0' 
                  : '#f3e5f5';
            }
            
            return (
              <Grid item xs={12} sm={6} md={4} key={voucher.id}>
                <Grow in timeout={index * 200}>
                  <Card sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <Box sx={{ 
                      height: 140,
                      background: `linear-gradient(135deg, ${backgroundColor}, ${alpha(backgroundColor, 0.8)})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: alpha(theme.palette.primary.light, 0.2)
                      }} />
                      <Typography variant="h1" fontWeight="bold" sx={{ 
                        fontSize: '4rem', 
                        opacity: 0.15,
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        lineHeight: 1
                      }}>
                        {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : `RM${voucher.discountValue}`}
                      </Typography>
                      <Typography variant="h2" fontWeight="bold" color="primary.main">
                        {voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : `RM${voucher.discountValue}`}
                      </Typography>
                      <Chip 
                        label={voucher.discountType === 'percentage' ? 'DISCOUNT' : 'VOUCHER'}
                        size="small"
                        sx={{ 
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          fontWeight: 'bold',
                          letterSpacing: 0.5
                        }}
                      />
                    </Box>
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                      <Box sx={{ 
                        position: 'absolute',
                        top: -20,
                        right: 20,
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: alpha(theme.palette.primary.light, 0.2),
                        zIndex: -1
                      }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h5" fontWeight="bold">
                          {voucher.voucherTitle}
                        </Typography>
                        <Chip 
                          label={voucher.status} 
                          size="small"
                          color={voucher.status === 'ACTIVE' ? 'success' : 'warning'}
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {voucher.voucherDescription}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 2,
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        p: 1.5,
                        borderRadius: 2
                      }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Expires
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formatVoucherExpiryDate(voucher.expiryDate)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={voucher.voucherCode} 
                          size="medium"
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.light, 0.2),
                            fontWeight: 'bold',
                            color: 'primary.dark'
                          }}
                        />
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<VoucherIcon />}
                        onClick={() => handleUseVoucher(voucher.id)}
                        disabled={usingId === voucher.id || voucher.status !== 'ACTIVE'}
                        sx={{ 
                          borderRadius: 3,
                          py: 1.5,
                          fontWeight: 'bold',
                          background: 'linear-gradient(45deg, #8e44ad, #732d91)',
                          boxShadow: '0 4px 12px rgba(142, 68, 173, 0.3)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(142, 68, 173, 0.4)'
                          }
                        }}
                      >
                        {usingId === voucher.id ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : voucher.status === 'ACTIVE' ? (
                          'Use Voucher'
                        ) : (
                          'Used'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ActiveVouchers; 