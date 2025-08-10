import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  Button,
  Typography,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  alpha
} from '@mui/material';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import RecentBookings from './RecentBookings';
import RecentInvoices from './RecentInvoices';
import ProfileNavigation from './ProfileNavigation';
import api from '../../service/api';
import UserService from '../../service/UserService';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import EditProfileForm from './EditProfileForm';
import { getWalletBalance, initializeWallet, topUpWallet } from '../../service/WalletService';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import NotificationPreferencesPage from './NotificationPreferencesPage';

const ProfilePage = ({ editMode = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const isEditProfile = location.pathname.endsWith('/edit-profile');
  const isNotifications = location.pathname.endsWith('/notifications');

  // State management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [activeView, setActiveView] = useState('overview');
  const [usernameChanged, setUsernameChanged] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Wallet state
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState('');
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = UserService.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await api.get('/profile');

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
          setError('Failed to load profile data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Fetch wallet balance
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

  // Profile update handler
  const handleUpdateProfile = async (updatedProfile) => {
    try {
      const token = UserService.getToken();
      const oldUsername = profile.username;

      const payload = {
        ...updatedProfile,
        dob: updatedProfile.dob ? new Date(updatedProfile.dob).toISOString() : null
      };

      const response = await api.put('/profile', payload);

      const filename = response.data.filename;
      UserService.setProfileImage(filename);

      if (updatedProfile.username && updatedProfile.username !== oldUsername) {
        setUsernameChanged(true);
        setNewUsername(updatedProfile.username);
        setSnackbar({
          open: true,
          message: 'Username changed. Please log in again with your new username.',
          severity: 'info'
        });
      } else {
        setProfile({
          ...response.data,
          status: response.data.status
        });

        if (response.data.status === 'PENDING') {
          setSnackbar({
            open: true,
            message: `Role change to ${response.data.requestedUserType} requested. Status: PENDING`,
            severity: 'info'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Profile updated successfully!',
            severity: 'success'
          });
        }

        setActiveView('overview');
      }
    } catch (err) {
      let errorMessage = 'Failed to update profile. Please try again.';
      if (err.response?.data) {
        errorMessage = err.response.data;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Photo handlers
  const handlePhotoUpdate = async (file) => {
    try {
      const token = UserService.getToken();
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post(
        'http://localhost:8081/api/profile/photo',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const filename = response.data;
      UserService.setProfileImage(filename);

      setProfile(prev => ({
        ...prev,
        profileImage: filename
      }));

      setSnackbar({
        open: true,
        message: 'Profile photo updated successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update profile photo. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const token = UserService.getToken();

      await axios.delete('http://localhost:8081/api/profile/photo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      UserService.setProfileImage(null);

      setProfile(prev => ({
        ...prev,
        profileImage: null
      }));

      setSnackbar({
        open: true,
        message: 'Profile photo removed successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to remove profile photo. Please try again.',
        severity: 'error'
      });
    }
  };

  // Wallet handlers
  const handleTopup = async () => {
    if (!topupAmount || isNaN(topupAmount) || Number(topupAmount) <= 0) {
      setWalletError('Please enter a valid amount');
      return;
    }
    setTopupLoading(true);
    try {
      await topUpWallet(Number(topupAmount));
      const newBalance = await getWalletBalance();
      setWalletBalance(newBalance);
      setSnackbar({ open: true, message: 'Top-up successful!', severity: 'success' });
      setTopupOpen(false);
      setTopupAmount('');
    } catch (err) {
      setWalletError('Top-up failed: ' + err.message);
    } finally {
      setTopupLoading(false);
    }
  };

  // Other handlers
  const handleLogoutAfterUsernameChange = () => {
    UserService.logout();
    navigate('/login');
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh'
      }}>
        <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
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
            {isEditProfile ? (
              <EditProfileForm
                profile={profile}
                onSave={handleUpdateProfile}
                onCancel={() => navigate('/profile')}
                onPhotoUpdate={handlePhotoUpdate}
                onRemovePhoto={handleRemovePhoto}
              />
            ) : isNotifications ? (
              <NotificationPreferencesPage
                profile={profile}
                onSave={prefs => setProfile(prev => ({ ...prev, ...prefs }))}
                onCancel={() => navigate('/profile')}
              />
            ) : (
              <Outlet />
            )}
          </Box>
        </Box>
      </Container>
      {/* Top Up Dialog */}
      <Dialog open={topupOpen} onClose={() => setTopupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Top Up Wallet
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (RM)"
            type="number"
            fullWidth
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            inputProps={{ min: 1, step: 1 }}
            sx={{ mt: 2 }}
            size="large"
          />
          {walletError && (
            <Alert severity="error" sx={{ mt: 2 }}>{walletError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setTopupOpen(false)} 
            disabled={topupLoading}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTopup} 
            variant="contained" 
            disabled={topupLoading}
            size="large"
            sx={{ minWidth: 120 }}
          >
            {topupLoading ? <CircularProgress size={20} /> : 'Top Up'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={usernameChanged ? 10000 : 4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          action={
            usernameChanged ? (
              <Button
                color="inherit"
                size="small"
                onClick={handleLogoutAfterUsernameChange}
                sx={{ fontWeight: 'bold' }}
              >
                LOG IN NOW
              </Button>
            ) : null
          }
          sx={{ width: '100%' }}
        >
          {snackbar.message}
          {usernameChanged && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              New username: {newUsername}
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;