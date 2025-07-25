import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid,
  Chip,
  Button
} from '@mui/material';
import ProfileHeader from './ProfileHeader';
import ProfileNavigation from './ProfileNavigation';
import ActiveVouchers from './ActiveVouchers';
import RedeemHistory from './RedeemHistory';
import RedeemVoucherPage from './RedeemVoucherPage';
import axios from 'axios';
import UserService from '../../service/UserService';
import Diamond from '@mui/icons-material/Diamond';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LinearProgress from '@mui/material/LinearProgress';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const RewardsPage = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [tierInfo, setTierInfo] = useState(null);

  // Tier configuration with gradient colors
  const tierConfig = {
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
    },
    VIP: {
      color: '#FF6B6B',
      name: 'VIP',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      light: '#fff6f0',
      discountPercentage: 25
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
          discountValue: voucher.discountValue,
          discountType: voucher.discountType
        };
      });
      setVouchers(backendVouchers);
    } catch (err) {
      setError('Failed to load dashboard data');
    }
  };

  // Fetch tier information
  const fetchTierInfo = async () => {
    try {
      const token = UserService.getToken();
      const response = await axios.get('http://localhost:8081/api/member/debug/tier-info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTierInfo(response.data);
    } catch (err) {
      // ignore
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

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!tierInfo || !getNextTierInfo()) return 0;
    const currentTierMinPoints = tierInfo.currentTierMinPoints || 0;
    const nextTierMinPoints = getNextTierInfo().minPoints;
    const currentPoints = tierInfo.pointBalance || 0;
    if (nextTierMinPoints <= currentTierMinPoints) return 100;
    const progress = ((currentPoints - currentTierMinPoints) / (nextTierMinPoints - currentTierMinPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  const progressToNextTier = calculateProgress();

  // Fetch user data and dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;
        const profileResponse = await axios.get('http://localhost:8081/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(profileResponse.data);
        await Promise.all([
          fetchDashboardData(),
          fetchTierInfo()
        ]);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Use dashboard data if available
  const currentPoints = dashboardData?.pointBalance || 0;
  const memberTier = tierInfo?.currentTierName || dashboardData?.tierName || 'GOLD';
  const currentTier = tierConfig[memberTier.toUpperCase()] || tierConfig.GOLD;
  const nextTier = getNextTierInfo();
  const pointsToNext = nextTier ? nextTier.pointsNeeded : 0;

  const handleTabChange = (event, newValue) => setTab(newValue);
  const handleCloseSnackbar = () => { setError(''); setSuccess(''); };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 1, backgroundColor: theme.palette.background.default }}>
      <Container maxWidth={false} sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 1, sm: 2, lg: 3 } }}>
        <Box sx={{ display: 'flex', gap: { xs: 2, lg: 3 }, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' }, width: '100%' }}>
          {/* 左侧栏 */}
          <Box sx={{ width: { xs: '100%', lg: '260px' }, flexShrink: 0, position: { lg: 'sticky' }, top: { lg: 20 }, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: theme.shadows[1], p: 2.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, position: 'relative' }}>
              <ProfileHeader profile={userData} />
            </Box>
            <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 2, boxShadow: theme.shadows[1], p: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <ProfileNavigation />
            </Box>
          </Box>
          
          {/* 右侧内容区 - 改进版 */}
          <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', lg: 'calc(100% - 260px - 24px)' }, overflow: 'hidden' }}>
            <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
              <Alert severity={error ? 'error' : 'success'} onClose={handleCloseSnackbar} sx={{ width: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', background: alpha(theme.palette.background.paper, 0.9) }}>{error || success}</Alert>
            </Snackbar>
            
            {/* 主内容卡片 */}
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
            }}>
              {/* 标签栏 */}
              <Box sx={{ 
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(10px)'
              }}>
                <Tabs 
                  value={tab} 
                  onChange={handleTabChange} 
                  variant="scrollable" 
                  scrollButtons="auto"
                  sx={{ 
                    px: 3,
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      minHeight: 60,
                      color: theme.palette.text.secondary,
                      '&.Mui-selected': {
                        color: theme.palette.primary.main
                      }
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0'
                    }
                  }}
                >
                  <Tab label="Rewards Dashboard" icon={<WorkspacePremiumIcon />} iconPosition="start" />
                  <Tab label="Active Vouchers" icon={<LocalOfferIcon />} iconPosition="start" />
                  <Tab label="Redeem History" icon={<TrendingUpIcon />} iconPosition="start" />
                  <Tab label="Redeem Voucher" icon={<StarIcon />} iconPosition="start" />
                </Tabs>
              </Box>

              {/* 内容区域 */}
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                {tab === 0 && (
                  <Box
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 3,
                      boxShadow: theme.shadows[2],
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      p: { xs: 2, md: 4 },
                      mb: 3,
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* 头部徽章与积分 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: theme.palette.background.default,
                          border: `5px solid ${currentTier.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                          boxShadow: theme.shadows[2],
                        }}
                      >
                        <Diamond sx={{ color: currentTier.color, fontSize: 44 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color={theme.palette.text.primary}>
                        {currentPoints}
                      </Typography>
                      <Chip
                        label={`${currentTier.name} Tier`}
                        size="small"
                        sx={{
                          mt: 1,
                          fontWeight: 600,
                          color: currentTier.color,
                          borderColor: currentTier.color,
                          background: alpha(currentTier.color, 0.08),
                          borderWidth: 1,
                          borderStyle: 'solid',
                          letterSpacing: 1,
                        }}
                        variant="outlined"
                      />
                    </Box>
                    {/* 进度条与标签 */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: currentTier.color,
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progressToNextTier}
                            sx={{
                              height: 12,
                              borderRadius: 6,
                              background: alpha(currentTier.color, 0.08),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: currentTier.color,
                              },
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: nextTier ? (tierConfig[nextTier.name?.toUpperCase()]?.color || theme.palette.grey[400]) : currentTier.color,
                          }}
                        />
                        <Typography variant="body2" sx={{ ml: 2, minWidth: 60, textAlign: 'right', color: currentTier.color }}>
                          {progressToNextTier.toFixed(0)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <Chip
                          label={
                            pointsToNext > 0
                              ? `还需 ${pointsToNext} 分升级到 ${nextTier?.name || ''}`
                              : '已达最高等级'
                          }
                          size="small"
                          sx={{
                            background: pointsToNext > 0 ? alpha(currentTier.color, 0.12) : alpha(theme.palette.success.main, 0.12),
                            color: pointsToNext > 0 ? currentTier.color : theme.palette.success.main,
                            fontWeight: 500,
                            fontSize: 14,
                          }}
                        />
                      </Box>
                    </Box>
                    {/* 统计卡片 */}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={4}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: theme.shadows[1],
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: theme.shadows[4] },
                            p: 2,
                            textAlign: 'center',
                          }}
                        >
                          <EmojiEventsIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                            {dashboardData?.rewardsEarned || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Rewards Earned
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: theme.shadows[1],
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: theme.shadows[4] },
                            p: 2,
                            textAlign: 'center',
                          }}
                        >
                          <TrendingUpIcon color="success" sx={{ fontSize: 36, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold" color={theme.palette.success.main}>
                            {dashboardData?.monthsActive || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Months Active
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: theme.shadows[1],
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: theme.shadows[4] },
                            p: 2,
                            textAlign: 'center',
                          }}
                        >
                          <LocalOfferIcon color="info" sx={{ fontSize: 36, mb: 1 }} />
                          <Typography variant="h5" fontWeight="bold" color={theme.palette.info.main}>
                            {vouchers.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Available Vouchers
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                {tab === 1 && <ActiveVouchers />}
                {tab === 2 && <RedeemHistory />}
                {tab === 3 && <RedeemVoucherPage onSuccess={setSuccess} onError={setError} />}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RewardsPage;