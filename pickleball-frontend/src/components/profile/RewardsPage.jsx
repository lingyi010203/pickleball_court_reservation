import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Fade,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ConfirmationNumber as VoucherIcon,
  EmojiEvents as RewardsIcon,
  TrendingUp,
  LocalOffer,
  Diamond,
  History as HistoryIcon,
  CheckCircle as ActiveIcon,
  TrendingUp as UpgradeIcon,
  Refresh as RefreshIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import axios from 'axios';
import UserService from '../../service/UserService';
import ProfileHeader from './ProfileHeader';
import RedeemVoucherPage from './RedeemVoucherPage';
import RedeemHistory from './RedeemHistory';
import ActiveVouchers from './ActiveVouchers';

const RewardsPage = () => {
  const theme = useTheme();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState([]);
  const [currentView, setCurrentView] = useState('rewards');
  
  // Tier upgrade states
  const [tierInfo, setTierInfo] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [tierError, setTierError] = useState(null);
  const [tierSuccess, setTierSuccess] = useState(null);

  // Tier configuration with gradient colors
  const tierConfig = {
    BRONZE: {
      color: '#CD7F32',
      name: 'Bronze',
      gradient: 'linear-gradient(135deg, #f7e8d7, #cd7f32)',
      light: '#fcf8f3',
      discountPercentage: 5
    },
    SILVER: {
      color: '#C0C0C0',
      name: 'Silver',
      gradient: 'linear-gradient(135deg, #e6e6e6, #c0c0c0)',
      light: '#f8f8f8',
      discountPercentage: 10
    },
    GOLD: {
      color: '#FFD700',
      name: 'Gold',
      gradient: 'linear-gradient(135deg, #fdf5a6, #ffd700)',
      light: '#fffdf0',
      discountPercentage: 15
    },
    PLATINUM: {
      color: '#E5E4E2',
      name: 'Platinum',
      gradient: 'linear-gradient(135deg, #f0f0f0, #e5e4e2)',
      light: '#fafafa',
      discountPercentage: 20
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = UserService.getToken();
      if (!token) return;

      const dashboardResponse = await axios.get('http://localhost:8081/api/member/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDashboardData(dashboardResponse.data);

      // Map backend vouchers to frontend format
      const backendVouchers = dashboardResponse.data.redeemableVouchers.map(voucher => {
        // Handle different discount types
        let title, discount;
        if (voucher.discountType === 'percentage') {
          title = `${voucher.discountValue}% Discount`;
          discount = `${voucher.discountValue}% OFF`;
        } else {
          title = `RM${voucher.discountValue} Discount`;
          discount = `RM${voucher.discountValue} OFF`;
        }
        
        return {
          id: voucher.id,
          title: title,
          description: "Special offer for members",
          discount: discount,
          expiry: voucher.expiryDate,
          points: voucher.requestPoints,
          discountValue: voucher.discountValue,  // Changed from discountAmount
          discountType: voucher.discountType
        };
      });

      setVouchers(backendVouchers);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    }
  };

  // Fetch tier information
  const fetchTierInfo = async () => {
    try {
      setTierError(null);
      
      const token = UserService.getToken();
      const response = await axios.get('http://localhost:8081/api/member/debug/tier-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTierInfo(response.data);
    } catch (err) {
      console.error('Error fetching tier info:', err);
      setTierError('Failed to load tier information');
    }
  };

  // Handle manual tier upgrade
  const handleManualUpgrade = async () => {
    try {
      setUpgrading(true);
      setTierError(null);
      setTierSuccess(null);
      
      const token = UserService.getToken();
      const response = await axios.post('http://localhost:8081/api/member/debug/recalculate-tier', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTierSuccess(response.data);
      
      // Refresh tier info and dashboard data after upgrade
      setTimeout(() => {
        fetchTierInfo();
        fetchDashboardData();
      }, 1000);
      
    } catch (err) {
      console.error('Error during tier upgrade:', err);
      setTierError('Failed to upgrade tier: ' + (err.response?.data || err.message));
    } finally {
      setUpgrading(false);
    }
  };

  // Get tier color function
  const getTierColor = (tierName) => {
    switch (tierName?.toUpperCase()) {
      case 'SILVER':
        return '#C0C0C0';
      case 'GOLD':
        return '#FFD700';
      case 'PLATINUM':
        return '#E5E4E2';
      case 'VIP':
        return '#FF6B6B';
      default:
        return '#6c757d';
    }
  };

  // Get next tier info
  const getNextTierInfo = () => {
    if (!tierInfo?.allTiers) return null;
    
    const currentTier = tierInfo.allTiers.find(t => t.id === tierInfo.currentTierId);
    if (!currentTier) return null;
    
    const currentIndex = tierInfo.allTiers.findIndex(t => t.id === tierInfo.currentTierId);
    const nextTier = tierInfo.allTiers[currentIndex + 1];
    
    if (!nextTier) return null;
    
    return {
      name: nextTier.name,
      minPoints: nextTier.minPoints,
      pointsNeeded: nextTier.minPoints - tierInfo.pointBalance
    };
  };

  // Fetch user data and dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;

        // Fetch profile data
        const profileResponse = await axios.get('http://localhost:8081/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUserData({
          ...profileResponse.data,
          username: profileResponse.data.name,
          profileImage: profileResponse.data.profileImage
        });

        // Fetch dashboard data and tier info
        await Promise.all([
          fetchDashboardData(),
          fetchTierInfo()
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Navigation items
  const navItems = [
    {
      icon: <RewardsIcon />,
      label: 'Rewards',
      view: 'rewards'
    },
    {
      icon: <VoucherIcon />,
      label: 'Redeem Voucher',
      view: 'redeem'
    },
    {
      icon: <HistoryIcon />,
      label: 'Redeem History',
      view: 'redeemHistory'
    },
    {
      icon: <ActiveIcon />,
      label: 'Active Vouchers',
      view: 'activeVouchers'
    }
  ];

  // Handle loading state
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // Use dashboard data if available
  const currentPoints = dashboardData?.pointBalance || 0;
  
  // Use tier from tierInfo if available, otherwise fallback to dashboard
  const memberTier = tierInfo?.currentTierName || dashboardData?.tierName || 'GOLD';
  const currentTier = tierConfig[memberTier.toUpperCase()] || tierConfig.GOLD;
  
  // Calculate progress based on actual tier data
  const nextTier = getNextTierInfo();
  const pointsToNext = nextTier ? nextTier.pointsNeeded : 0;
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!tierInfo || !nextTier) return 0;
    
    const currentTierMinPoints = tierInfo.currentTierMinPoints || 0;
    const nextTierMinPoints = nextTier.minPoints;
    const currentPoints = tierInfo.pointBalance || 0;
    
    if (nextTierMinPoints <= currentTierMinPoints) return 100;
    
    const progress = ((currentPoints - currentTierMinPoints) / (nextTierMinPoints - currentTierMinPoints)) * 100;
    const finalProgress = Math.min(Math.max(progress, 0), 100);
    
    // Debug logging
    console.log('Progress Calculation:', {
      currentPoints,
      currentTierMinPoints,
      nextTierMinPoints,
      progress: progress.toFixed(2),
      finalProgress: finalProgress.toFixed(2)
    });
    
    return finalProgress;
  };
  
  const progressToNextTier = calculateProgress();

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      py: 1
    }}>
      <Container maxWidth="lg">
        <Fade in timeout={500}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
            pt: 2
          }}>
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Left Sidebar - User Profile */}
          <Grid item xs={12} md={3} sx={{ maxWidth: 700 }}>
            <Fade in timeout={700}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                p: 2,
                background: alpha(theme.palette.background.paper, 0.85),
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                {/* User Info Section */}
                {userData && (
                  <ProfileHeader
                    profile={userData}
                    showTier={true}
                    tierConfig={tierConfig}
                    avatarSize={100}
                    sx={{
                      position: 'relative',
                      backgroundColor: 'transparent',
                      border: 'none',
                      p: 2,
                      mb: 0,
                      mt: 0
                    }}
                  />
                )}

                <Divider sx={{ my: 1, borderColor: 'divider', opacity: 0.5 }} />

                {/* Navigation Section */}
                <List>
                  {navItems.map((item) => (
                    <ListItem disablePadding key={item.label}>
                      <ListItemButton
                        onClick={() => setCurrentView(item.view)}
                        sx={{
                          borderRadius: 2,
                          my: 0.5,
                          ...(currentView === item.view && {
                            bgcolor: alpha(theme.palette.primary.light, 0.15),
                            borderLeft: `4px solid ${theme.palette.primary.main}`
                          })
                        }}
                      >
                        <ListItemIcon sx={{
                          minWidth: 40,
                          color: currentView === item.view ? 'primary.main' : 'inherit'
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontWeight: currentView === item.view ? 'bold' : 'medium',
                            color: currentView === item.view ? 'primary.main' : 'text.primary'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Fade>
          </Grid>

          {/* Right Content - Rewards Dashboard */}
          <Grid item xs={12} md={9} sx={{ maxWidth: 800 }}>
            {/* Header Section */}
            <Snackbar
              open={!!error || !!success}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                severity={error ? 'error' : 'success'}
                onClose={handleCloseSnackbar}
                sx={{
                  width: 'auto',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(10px)',
                  background: alpha(theme.palette.background.paper, 0.9)
                }}
              >
                {error || success}
              </Alert>
            </Snackbar>

            {/* Main Content */}
            {currentView === 'rewards' && (
              <>
                {/* Tier Error/Success Alerts */}
                {tierError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {tierError}
                  </Alert>
                )}
                {tierSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {tierSuccess}
                  </Alert>
                )}

                {/* Enhanced Points Card with Tier Upgrade */}
                <Fade in timeout={900}>
                  <Card sx={{
                    mb: 4,
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    background: currentTier.light,
                    border: `1px solid ${alpha(currentTier.color, 0.2)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: currentTier.gradient
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header with Points and Tier */}
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: currentTier.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}>
                          <Diamond sx={{ color: 'white', fontSize: 30 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                            {currentPoints.toLocaleString()}
                            <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                              Points
                            </Typography>
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {currentTier.name} Tier
                          </Typography>
                        </Box>
                        {/* Tier Upgrade Button */}
                        <Button
                          variant="contained"
                          startIcon={upgrading ? <CircularProgress size={20} /> : <UpgradeIcon />}
                          onClick={handleManualUpgrade}
                          disabled={upgrading}
                          sx={{
                            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)'
                            }
                          }}
                        >
                          {upgrading ? 'Checking...' : 'Check Upgrade'}
                        </Button>
                      </Box>

                      {/* Enhanced Progress Section */}
                      <Box sx={{ mb: 2 }}>
                        {(() => {
                          const nextTier = getNextTierInfo();
                          if (nextTier) {
                            return (
                              <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Progress to {nextTier.name}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {nextTier.pointsNeeded} points to go
                                  </Typography>
                                </Box>
                                {/* Debug info - remove in production */}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  Debug: {tierInfo?.pointBalance || 0} / {nextTier.minPoints} points ({progressToNextTier.toFixed(1)}%)
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={progressToNextTier}
                                  sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: alpha(currentTier.color, 0.15),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 5,
                                      background: currentTier.gradient
                                    }
                                  }}
                                />
                              </>
                            );
                          } else {
                            return (
                              <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    Max Level Achieved!
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    VIP Tier
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={100}
                                  sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: alpha(currentTier.color, 0.15),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 5,
                                      background: currentTier.gradient
                                    }
                                  }}
                                />
                              </>
                            );
                          }
                        })()}
                      </Box>

                      {/* Tier Information Grid */}
                      {tierInfo?.allTiers && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            All Available Tiers
                          </Typography>
                          <Grid container spacing={1}>
                            {tierInfo.allTiers.map((tier) => (
                              <Grid item xs={12} sm={6} md={3} key={tier.id}>
                                <Card sx={{ 
                                  opacity: tier.id === tierInfo.currentTierId ? 1 : 0.7,
                                  border: tier.id === tierInfo.currentTierId ? `2px solid ${getTierColor(tier.name)}` : 'none',
                                  background: tier.id === tierInfo.currentTierId ? `${getTierColor(tier.name)}20` : 'transparent'
                                }}>
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      {tier.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {tier.minPoints} - {tier.maxPoints === 2147483647 ? '∞' : tier.maxPoints} points
                                    </Typography>
                                    {tier.id === tierInfo.currentTierId && (
                                      <Chip
                                        label="Current"
                                        size="small"
                                        color="primary"
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Fade>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {[
                    {
                      icon: <RewardsIcon sx={{ fontSize: 40 }} />,
                      value: '12',
                      label: 'Rewards Earned',
                      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    },
                    {
                      icon: <TrendingUp sx={{ fontSize: 40 }} />,
                      value: '3',
                      label: 'Months Active',
                      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    },
                    {
                      icon: <LocalOffer sx={{ fontSize: 40 }} />,
                      value: vouchers.length,
                      label: 'Available Vouchers',
                      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    }
                  ].map((stat, index) => (
                    <Grid item xs={12} md={4} key={stat.label}>
                      <Fade in timeout={index * 300 + 1000}>
                        <Paper sx={{
                          p: 3,
                          textAlign: 'center',
                          background: stat.color,
                          color: 'white',
                          borderRadius: 3,
                          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                          }
                        }}>
                          <Box sx={{
                            width: 70,
                            height: 70,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2
                          }}>
                            {stat.icon}
                          </Box>
                          <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body1">
                            {stat.label}
                          </Typography>
                        </Paper>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {currentView === 'redeem' && (
              <RedeemVoucherPage
                onSuccess={(message) => {
                  setSuccess(message);
                  // Refresh dashboard data after successful redemption
                  fetchDashboardData();
                }}
                onError={(message) => setError(message)}
              />
            )}

            {currentView === 'redeemHistory' && (
              <RedeemHistory />
            )}

            {currentView === 'activeVouchers' && (
              <ActiveVouchers />
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default RewardsPage;