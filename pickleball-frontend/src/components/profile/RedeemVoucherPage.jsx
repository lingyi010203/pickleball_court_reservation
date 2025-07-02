import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Chip, Button, 
  CircularProgress, Alert, Grow, useTheme, alpha
} from '@mui/material';
import { ConfirmationNumber as VoucherIcon } from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';

const RedeemVoucherPage = ({ onSuccess, onError }) => {
  const theme = useTheme();
  const [redeemingId, setRedeemingId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tier configuration
  const tierConfig = {
    BRONZE: { 
      name: 'Bronze',
      gradient: 'linear-gradient(135deg, #f7e8d7, #cd7f32)',
      light: '#fcf8f3'
    },
    SILVER: { 
      name: 'Silver',
      gradient: 'linear-gradient(135deg, #e6e6e6, #c0c0c0)',
      light: '#f8f8f8'
    },
    GOLD: { 
      name: 'Gold',
      gradient: 'linear-gradient(135deg, #fdf5a6, #ffd700)',
      light: '#fffdf0'
    },
    PLATINUM: { 
      name: 'Platinum',
      gradient: 'linear-gradient(135deg, #f0f0f0, #e5e4e2)',
      light: '#fafafa'
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;

        const dashboardResponse = await axios.get('http://localhost:8081/api/member/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setDashboardData(dashboardResponse.data);
        
        // Map backend vouchers to frontend format
        const backendVouchers = dashboardResponse.data.redeemableVouchers.map(voucher => ({
          id: voucher.id,
          title: `$${voucher.discountAmount} Discount`,
          description: "Special offer for members",
          discount: `${voucher.discountAmount}% OFF`,
          expiry: voucher.expiryDate,
          points: voucher.requestPoints,
          discountAmount: voucher.discountAmount
        }));
        
        setVouchers(backendVouchers);
      } catch (err) {
        console.error('Error fetching voucher data:', err);
        setError('Failed to load voucher data. Please try again later.');
        if (onError) onError('Failed to load voucher data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRedeemVoucher = async (voucher) => {
    setRedeemingId(voucher.id);
    setError('');
    setSuccess('');
    
    try {
      const token = UserService.getToken();
      if (!token) return;

      const response = await axios.post(
        `http://localhost:8081/api/member/vouchers/redeem/${voucher.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        const successMsg = `Successfully redeemed voucher: ${response.data.voucherCode}`;
        setSuccess(successMsg);
        if (onSuccess) onSuccess(successMsg);
        
        // Refresh voucher data
        const dashboardResponse = await axios.get('http://localhost:8081/api/member/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const updatedVouchers = dashboardResponse.data.redeemableVouchers.map(v => ({
          id: v.id,
          title: `$${v.discountAmount} Discount`,
          description: "Special offer for members",
          discount: `${v.discountAmount}% OFF`,
          expiry: v.expiryDate,
          points: v.requestPoints,
          discountAmount: v.discountAmount
        }));
        
        setVouchers(updatedVouchers);
        setDashboardData(dashboardResponse.data);
      }
    } catch (err) {
      console.error('Error redeeming voucher:', err);
      const errorMsg = err.response?.data?.message || 'Failed to redeem voucher';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setRedeemingId(null);
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

  // Use tier from dashboard if available
  const memberTier = dashboardData?.tierName || 'GOLD';
  const currentTier = tierConfig[memberTier.toUpperCase()] || tierConfig.GOLD;
  const currentPoints = dashboardData?.pointBalance || 0;

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
        Redeem Vouchers
      </Typography>
      
      <Box sx={{ 
        bgcolor: alpha(theme.palette.primary.light, 0.1), 
        p: 3, 
        borderRadius: 3,
        mb: 4
      }}>
        <Grid container alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              {currentTier.name} Tier Benefits
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {dashboardData?.benefits || "Premium benefits for loyal members"}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                label={`${currentPoints} Points`} 
                color="primary"
                sx={{ fontWeight: 'bold', mr: 2 }}
              />
              <Typography variant="body2">
                Available for redemption
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: currentTier.gradient,
              boxShadow: 3
            }}>
              <Typography variant="h4" fontWeight="bold" color="white">
                {memberTier.charAt(0)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {vouchers.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3, boxShadow: 1 }}>
          No redeemable vouchers available for your tier
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {vouchers.map((voucher, index) => {
            const backgroundColor = voucher.discountAmount > 30 
              ? '#e8f5e8' 
              : voucher.discountAmount > 15 
                ? '#fff3e0' 
                : '#f3e5f5';
            
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
                        {voucher.discountAmount}%
                      </Typography>
                      <Typography variant="h2" fontWeight="bold" color="primary.main">
                        {voucher.discountAmount}%
                      </Typography>
                      <Chip 
                        label="DISCOUNT"
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
                      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                        {voucher.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {voucher.description}
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
                            {new Date(voucher.expiry).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${voucher.points} pts`} 
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
                        onClick={() => handleRedeemVoucher(voucher)}
                        disabled={redeemingId === voucher.id}
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
                        {redeemingId === voucher.id ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : currentPoints >= voucher.points ? (
                          'Redeem Now'
                        ) : (
                          'Not enough points'
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

export default RedeemVoucherPage;