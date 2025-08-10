import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Snackbar, Alert, alpha, useTheme } from '@mui/material';
import ProfileStats from './ProfileStats';
import RecentBookings from './RecentBookings';
import RecentInvoices from './RecentInvoices';
import api from '../../service/api';
import UserService from '../../service/UserService';
import { getWalletBalance, initializeWallet, topUpWallet } from '../../service/WalletService';

const ProfileOverview = () => {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = UserService.getToken();
        if (!token) return;
        const response = await api.get('/profile');
        setProfile(response.data);
      } catch {}
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setWalletLoading(true);
        let balance;
        try {
          balance = await getWalletBalance();
        } catch (err) {
          await initializeWallet();
          balance = await getWalletBalance();
        }
        setWalletBalance(balance);
        setWalletError('');
      } catch (err) {
        setWalletError('Failed to load wallet balance: ' + err.message);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
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
            Wallet Balance
          </Typography>
          {walletLoading ? (
            <CircularProgress size={24} />
          ) : walletError ? (
            <Typography color="error" variant="body2" sx={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>
              {walletError}
            </Typography>
          ) : (
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              color="success.main" 
              sx={{ mb: 0.5, fontSize: { xs: '1.5rem', lg: '2rem' }, letterSpacing: '-0.5px', wordBreak: 'break-word' }}
            >
              RM{walletBalance?.toFixed(2) || '0.00'}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', lineHeight: 1.3 }}>
            Available balance for bookings
          </Typography>
        </Box>
      </Box>

      {/* Activity Overview */}
      <Box sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        p: { xs: 2.5, lg: 3 },
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <ProfileStats profile={profile || {}} />
      </Box>

      {/* Recent Bookings & Invoices */}
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', lg: 'row' }, width: '100%' }}>
        <Box sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[1],
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: { xs: 2.5, lg: 3 },
          flex: 1,
          minWidth: { xs: '100%', lg: 300 },
          height: 400,
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <RecentBookings />
        </Box>
        <Box sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[1],
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: { xs: 2.5, lg: 3 },
          flex: 1,
          minWidth: { xs: '100%', lg: 300 },
          height: 400,
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <RecentInvoices />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileOverview;