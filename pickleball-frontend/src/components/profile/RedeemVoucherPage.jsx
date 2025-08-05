import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, Chip, Button, 
  CircularProgress, Alert, Grow, useTheme, alpha
} from '@mui/material';
import { ConfirmationNumber as VoucherIcon } from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import { formatVoucherExpiryDate } from '../../utils/dateUtils';

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
    },
    VIP: {
      name: 'VIP',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      light: '#fff6f0'
    }
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;

        // Fetch dashboard data and user's redemption history in parallel
        const [dashboardResponse, redemptionHistoryResponse] = await Promise.all([
          axios.get('http://localhost:8081/api/member/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8081/api/voucher-redemption/my-redemptions', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setDashboardData(dashboardResponse.data);
        
        // Debug: 檢查後端返回的原始數據
        console.log('=== Frontend Debug: Backend Response ===');
        console.log('Dashboard data:', dashboardResponse.data);
        console.log('Redeemable vouchers:', dashboardResponse.data.redeemableVouchers);
        console.log('User redemption history:', redemptionHistoryResponse.data);
        
        // Create a set of voucher codes that user has already redeemed
        // Only for 0-point vouchers (which can only be redeemed once)
        const redeemedZeroPointVoucherCodes = new Set(
          redemptionHistoryResponse.data
            .filter(redemption => {
              // Find the corresponding voucher to check its points
              const voucher = dashboardResponse.data.redeemableVouchers.find(v => v.code === redemption.voucherCode?.split('-')[0]);
              return voucher && voucher.requestPoints === 0;
            })
            .map(redemption => redemption.voucherCode?.split('-')[0])
        );
        
        console.log('Redeemed 0-point voucher codes:', Array.from(redeemedZeroPointVoucherCodes));
        
        // Map backend vouchers to frontend format
        const backendVouchers = dashboardResponse.data.redeemableVouchers.map(voucher => {
          // Debug: 檢查每個voucher的原始數據
          console.log('Processing voucher:', voucher);
          console.log('Voucher expiry date:', voucher.expiryDate, 'Type:', typeof voucher.expiryDate);
          
          // Handle different discount types
          let title, discount;
          if (voucher.discountType === 'percentage') {
            title = `${voucher.discountValue}% Discount`;
            discount = `${voucher.discountValue}% OFF`;
          } else {
            title = `RM${voucher.discountValue} Discount`;
            discount = `RM${voucher.discountValue} OFF`;
          }
          
          // Check if user has already redeemed this voucher
          // Only mark as redeemed if it's a 0-point voucher that has been redeemed
          const isRedeemed = voucher.requestPoints === 0 && redeemedZeroPointVoucherCodes.has(voucher.code);
          
          const mappedVoucher = {
            id: voucher.id,
            title: title,
            description: "Special offer for members",
            discount: discount,
            expiry: voucher.expiryDate,
            points: voucher.requestPoints,
            discountValue: voucher.discountValue,  // Changed from discountAmount
            discountType: voucher.discountType,
            tierName: voucher.tierName,  // Add tier name
            isRedeemed: isRedeemed  // Add redemption status
          };
          
          // Debug: 檢查映射後的voucher
          console.log('Mapped voucher:', mappedVoucher);
          console.log('Mapped expiry:', mappedVoucher.expiry, 'Type:', typeof mappedVoucher.expiry);
          console.log('Is redeemed:', isRedeemed);
          
          return mappedVoucher;
        });
        
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
    // Prevent redeeming if it's a 0-point voucher that has already been redeemed
    if (voucher.points === 0 && voucher.isRedeemed) {
      setError('This voucher has already been redeemed');
      return;
    }

    setRedeemingId(voucher.id);
    setError('');
    setSuccess('');
    
    try {
      const token = UserService.getToken();
      if (!token) return;

      const response = await axios.post(
        `http://localhost:8081/api/voucher-redemption/redeem/${voucher.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        const successMsg = `Successfully redeemed voucher: ${response.data.voucherCode}`;
        setSuccess(successMsg);
        if (onSuccess) onSuccess(successMsg);
        
        // Refresh voucher data with redemption history
        const [dashboardResponse, redemptionHistoryResponse] = await Promise.all([
          axios.get('http://localhost:8081/api/member/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8081/api/voucher-redemption/my-redemptions', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        // Create a set of voucher codes that user has already redeemed
        // Only for 0-point vouchers (which can only be redeemed once)
        const redeemedZeroPointVoucherCodes = new Set(
          redemptionHistoryResponse.data
            .filter(redemption => {
              // Find the corresponding voucher to check its points
              const voucher = dashboardResponse.data.redeemableVouchers.find(v => v.code === redemption.voucherCode?.split('-')[0]);
              return voucher && voucher.requestPoints === 0;
            })
            .map(redemption => redemption.voucherCode?.split('-')[0])
        );
        
        const updatedVouchers = dashboardResponse.data.redeemableVouchers.map(v => {
          let title, discount;
          if (v.discountType === 'percentage') {
            title = `${v.discountValue}% Discount`;
            discount = `${v.discountValue}% OFF`;
          } else {
            title = `RM${v.discountValue} Discount`;
            discount = `RM${v.discountValue} OFF`;
          }
          
          // Check if user has already redeemed this voucher
          // Only mark as redeemed if it's a 0-point voucher that has been redeemed
          const isRedeemed = v.requestPoints === 0 && redeemedZeroPointVoucherCodes.has(v.code);
          
          return {
            id: v.id,
            title: title,
            description: "Special offer for members",
            discount: discount,
            expiry: v.expiryDate,
            points: v.requestPoints,
            discountValue: v.discountValue,
            discountType: v.discountType,
            tierName: v.tierName,
            isRedeemed: isRedeemed
          };
        });
        
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
  const tierPoints = dashboardData?.tierPointBalance || 0;
  const rewardPoints = dashboardData?.rewardPointBalance || 0;

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
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Chip 
                 label={`${tierPoints} Tier Points`} 
                 color="primary"
                 sx={{ fontWeight: 'bold' }}
               />
               <Chip 
                 label={`${rewardPoints} Reward Points`} 
                 color="secondary"
                 sx={{ fontWeight: 'bold' }}
               />
               <Typography variant="body2">
                 Tier points for upgrades, Reward points for vouchers
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
                           {voucher.title}
                         </Typography>
                         <Box sx={{ display: 'flex', gap: 1 }}>
                           <Chip 
                             label={voucher.tierName || 'GENERAL'} 
                             size="small"
                             sx={{ 
                               bgcolor: voucher.tierName && voucher.tierName !== 'GENERAL' 
                                 ? alpha(theme.palette.primary.light, 0.2)
                                 : alpha(theme.palette.success.light, 0.2),
                               color: voucher.tierName && voucher.tierName !== 'GENERAL'
                                 ? 'primary.dark'
                                 : 'success.dark',
                               fontWeight: 'bold',
                               fontSize: '0.7rem'
                             }}
                           />
                           {voucher.isRedeemed && (
                             <Chip 
                               label="REDEEMED" 
                               size="small"
                               color="warning"
                               sx={{ 
                                 fontWeight: 'bold',
                                 fontSize: '0.7rem'
                               }}
                             />
                           )}
                         </Box>
                       </Box>
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
                            {formatVoucherExpiryDate(voucher.expiry)}
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
                         disabled={redeemingId === voucher.id || voucher.isRedeemed}
                         sx={{ 
                           borderRadius: 3,
                           py: 1.5,
                           fontWeight: 'bold',
                           background: voucher.isRedeemed 
                             ? 'linear-gradient(45deg, #9e9e9e, #757575)'
                             : 'linear-gradient(45deg, #8e44ad, #732d91)',
                           boxShadow: voucher.isRedeemed 
                             ? '0 4px 12px rgba(158, 158, 158, 0.3)'
                             : '0 4px 12px rgba(142, 68, 173, 0.3)',
                           '&:hover': {
                             boxShadow: voucher.isRedeemed 
                               ? '0 4px 12px rgba(158, 158, 158, 0.3)'
                               : '0 6px 16px rgba(142, 68, 173, 0.4)'
                           }
                         }}
                       >
                         {redeemingId === voucher.id ? (
                           <CircularProgress size={24} color="inherit" />
                         ) : voucher.isRedeemed ? (
                           'Already Redeemed'
                         ) : rewardPoints >= voucher.points ? (
                           'Redeem Now'
                         ) : (
                           'Not enough reward points'
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