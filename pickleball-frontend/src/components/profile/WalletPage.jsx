import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  useMediaQuery
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  Add as AddIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getWalletBalance, getWalletDetails, getWalletTransactions } from '../../service/WalletService';
import ProfileNavigation from './ProfileNavigation';
import ProfileHeader from './ProfileHeader';
import UserService from '../../service/UserService';
import axios from 'axios';

const WalletPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletDetails, setWalletDetails] = useState(null);
  const [transactionStats, setTransactionStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('wallet');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
    fetchProfileData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [balance, details, transactions] = await Promise.all([
        getWalletBalance(),
        getWalletDetails(),
        getWalletTransactions(0, 1) // Just get first page to get total count
      ]);

      setWalletBalance(balance);
      setWalletDetails(details);
      setTransactionStats(transactions);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const token = UserService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8081/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const enhancedProfile = {
        ...response.data,
        accountStatus: response.data.requestedUserType ? 'PENDING' : 'ACTIVE'
      };

      UserService.setProfileImage(response.data.profileImage);
      setProfile(enhancedProfile);
    } catch (err) {
      if (err.response?.status === 401) {
        UserService.logout();
        navigate('/login');
      } else {
        console.error('Failed to load profile data:', err);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTopUp = () => {
    navigate('/wallet/topup');
  };

  const handleTransactionHistory = () => {
    navigate('/profile/wallet/transactions');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  if (isLoading || profileLoading) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      pt: { xs: 2, lg: 3 },
      pb: 3
    }}>
      <Container maxWidth={false} sx={{ 
        maxWidth: '1200px', 
        px: { xs: 1, sm: 2, lg: 3 },
        overflow: 'hidden'
      }}>
        {/* Main Layout Container using Flexbox */}
        <Box sx={{
          display: 'flex',
          gap: { xs: 2, lg: 3 },
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', lg: 'row' },
          width: '100%',
          overflow: 'hidden'
        }}>
          {/* Left Sidebar - Fixed Width */}
          <Box sx={{
            width: { xs: '100%', lg: '260px' },
            flexShrink: 0,
            position: { lg: 'sticky' },
            top: { lg: 20 },
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {/* Profile Header Card */}
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              p: 2.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              position: 'relative'
            }}>
              <ProfileHeader profile={profile} />
            </Box>
            {/* Profile Navigation Card */}
            <Box sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              p: 1.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <ProfileNavigation setActiveView={setActiveView} />
            </Box>
          </Box>
          
          {/* Right Content Area - Flexible Width */}
          <Box sx={{ 
            flex: 1, 
            minWidth: 0,
            width: { xs: '100%', lg: 'calc(100% - 260px - 24px)' },
            overflow: 'hidden'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
              {/* Page Title */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    fontWeight: "bold",
                    mb: 0.5,
                    fontSize: { xs: '1.25rem', lg: '1.5rem' }
                  }}
                >
                  My Wallet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontSize: '0.9rem',
                  lineHeight: 1.3
                }}>
                  Manage your balance and view transaction history
                </Typography>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-icon': { fontSize: 28 }
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* Wallet Balance */}
              <Box sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[2],
                p: { xs: 2.5, lg: 3 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 3,
                width: '100%',
                boxSizing: 'border-box',
                minHeight: 100
              }}>
                <Box sx={{ flex: 1, minWidth: 250 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5, fontSize: { xs: '1.25rem', lg: '1.5rem' } }}>
                    Current Balance
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color="success.main" 
                    sx={{ mb: 0.5, fontSize: { xs: '1.5rem', lg: '2rem' }, letterSpacing: '-0.5px', wordBreak: 'break-word' }}
                  >
                    {formatAmount(walletBalance)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.3 }}>
                    Available balance for bookings
                  </Typography>
                </Box>
                {walletDetails && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`ID: ${String(walletDetails.walletId || '').slice(-8) || 'N/A'}`}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 24,
                      }}
                    />
                    <Chip
                      label={walletDetails.status}
                      size="small"
                      icon={walletDetails.status === 'ACTIVE' ? 
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4caf50' }} /> : 
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ff9800' }} />
                      }
                      sx={{
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 24,
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Quick Actions */}
              <Box sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                p: { xs: 2.5, lg: 3 },
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontSize: { xs: '1.1rem', lg: '1.25rem' } }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleTopUp}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.2)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                        boxShadow: `0 3px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Top Up Wallet
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={handleTransactionHistory}
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderWidth: 1,
                      '&:hover': {
                        borderWidth: 1,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Transaction History
                  </Button>
                </Box>
              </Box>

              {/* Wallet Statistics */}
              {walletDetails && transactionStats && (
                <Box sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: theme.shadows[1],
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  p: { xs: 2.5, lg: 3 },
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, fontSize: { xs: '1.1rem', lg: '1.25rem' } }}>
                    Wallet Statistics
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 3px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                        }
                      }}>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                          {transactionStats?.totalElements ?? 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Total Transactions
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.success.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 3px 12px ${alpha(theme.palette.success.main, 0.1)}`
                        }
                      }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                          {formatAmount(walletDetails.totalDeposited || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Total Deposits
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.error.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 3px 12px ${alpha(theme.palette.error.main, 0.1)}`
                        }
                      }}>
                        <Typography variant="h4" color="error.main" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                          {formatAmount(walletDetails.totalWithdrawals || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          Total Withdrawals
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default WalletPage; 