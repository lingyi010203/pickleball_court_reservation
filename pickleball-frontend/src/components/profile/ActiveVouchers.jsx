import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  useTheme,
  Chip,
  alpha
} from '@mui/material';
import { 
  LocalOffer as VoucherIcon,
  CheckCircle as UsedIcon,
  Schedule as ActiveIcon,
  Warning as ExpiredIcon
} from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import ThemedCard from '../common/ThemedCard';

const ActiveVouchers = () => {
  const theme = useTheme();
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingVoucher, setUsingVoucher] = useState(null);

  useEffect(() => {
    const fetchActiveVouchers = async () => {
      try {
        const token = UserService.getToken();
        const response = await axios.get('http://localhost:8081/api/voucher-redemption/my-active-redemptions', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setActiveVouchers(response.data);
      } catch (err) {
        setError('Failed to load active vouchers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVouchers();
  }, []);

  const handleUseVoucher = async (redemptionId) => {
    setUsingVoucher(redemptionId);
    try {
      const token = UserService.getToken();
      await axios.post(`http://localhost:8081/api/voucher-redemption/use/${redemptionId}`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh the list
      const response = await axios.get('http://localhost:8081/api/voucher-redemption/my-active-redemptions', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setActiveVouchers(response.data);
      
      // Show success message
      alert('Voucher used successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to use voucher';
      alert(errorMsg);
    } finally {
      setUsingVoucher(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (activeVouchers.length === 0) {
    return (
      <Box mt={4} textAlign="center">
        <VoucherIcon sx={{ fontSize: 60, color: theme.palette.text.disabled, mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No active vouchers found
        </Typography>
        <Typography variant="body1" color="textSecondary" mt={1}>
          You don't have any active vouchers to use.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Active Vouchers
      </Typography>
      
      <Grid container spacing={3}>
        {activeVouchers.map((voucher) => {
          const expired = isExpired(voucher.expiryDate);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={voucher.id}>
              <ThemedCard sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                },
                opacity: expired ? 0.7 : 1
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VoucherIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {voucher.voucherCode}
                      </Typography>
                    </Box>
                    {expired ? (
                      <ExpiredIcon sx={{ color: theme.palette.error.main }} />
                    ) : (
                      <ActiveIcon sx={{ color: theme.palette.success.main }} />
                    )}
                  </Box>

                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {voucher.voucherTitle}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {voucher.voucherDescription}
                  </Typography>

                  <Box sx={{ 
                    backgroundColor: expired ? 
                      alpha(theme.palette.error.main, 0.1) : 
                      alpha(theme.palette.success.main, 0.1),
                    p: 2,
                    borderRadius: 2,
                    mb: 2
                  }}>
                    <Chip 
                      label={expired ? 'EXPIRED' : 'ACTIVE'}
                      size="small"
                      sx={{ 
                        backgroundColor: expired ? 
                          theme.palette.error.main : 
                          theme.palette.success.main,
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 1
                      }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      <strong>Redeemed:</strong> {formatDate(voucher.redemptionDate)}
                    </Typography>
                    
                    {voucher.expiryDate && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Expires:</strong> {formatDate(voucher.expiryDate)}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 1,
                    borderTop: '2px solid',
                    borderColor: theme.palette.divider,
                    opacity: 0.8
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Discount: {voucher.discountType === 'percentage' ? 
                        `${voucher.discountValue}%` : 
                        `RM${voucher.discountValue}`}
                    </Typography>
                    
                    <Button
                      variant="contained"
                      size="small"
                      disabled={expired || usingVoucher === voucher.id}
                      onClick={() => handleUseVoucher(voucher.id)}
                      sx={{ 
                        backgroundColor: expired ? 
                          theme.palette.error.main : 
                          theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: expired ? 
                            theme.palette.error.dark : 
                            theme.palette.primary.dark
                        }
                      }}
                    >
                      {usingVoucher === voucher.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : expired ? (
                        'Expired'
                      ) : (
                        'Use Voucher'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </ThemedCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ActiveVouchers; 