import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  CircularProgress,
  Container,
  Button,
  Typography,
  Snackbar,
  Alert,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import RecentBookings from './RecentBookings';
import RecentInvoices from './RecentInvoices';
import ProfileNavigation from './ProfileNavigation';
import axios from 'axios';
import UserService from '../../service/UserService';
import { useNavigate } from 'react-router-dom';
import EditProfileForm from './EditProfileForm';

const ProfilePage = ({ editMode = false }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = UserService.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:8081/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Enhance profile with status information
        const enhancedProfile = {
          ...response.data,
          accountStatus: response.data.requestedUserType ?
            'PENDING' :
            'ACTIVE'
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

  const handleUpdateProfile = async (updatedProfile) => {
    try {
      const token = UserService.getToken();
      const oldUsername = profile.username;

      // Format date properly for backend
      const payload = {
        ...updatedProfile,
        dob: updatedProfile.dob ? new Date(updatedProfile.dob).toISOString() : null
      };

      // Send update request
      const response = await axios.put(
        'http://localhost:8081/api/profile',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const filename = response.data.filename;
      UserService.setProfileImage(filename);

      // Enhance profile with status information
      const updatedProfileData = {
        ...response.data,
        accountStatus: response.data.requestedUserType ?
          'Pending' :
          'Active'
      };

      // Check if username changed
      if (updatedProfile.username && updatedProfile.username !== oldUsername) {
        setUsernameChanged(true);
        setNewUsername(updatedProfile.username);
        setSnackbar({
          open: true,
          message: 'Username changed. Please log in again with your new username.',
          severity: 'info'
        });
      } else {
        // Update profile state with enhanced response data
        setProfile({
          ...response.data,
          status: response.data.status
        });

        // Show status message
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

  const handleLogoutAfterUsernameChange = () => {
    UserService.logout();
    navigate('/login');
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Update handlePhotoUpdate function
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

      // Extract filename from response (assuming backend returns string)
      const filename = response.data;

      // Update UserService (triggers event)
      UserService.setProfileImage(filename);

      // Update local state
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

  // Update handleRemovePhoto function
  const handleRemovePhoto = async () => {
    try {
      const token = UserService.getToken();

      await axios.delete('http://localhost:8081/api/profile/photo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update UserService (triggers event)
      UserService.setProfileImage(null);

      // Update local state
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

  // Then in the EditProfileForm component, add the new handlers:
  <EditProfileForm
    profile={profile}
    onSave={handleUpdateProfile}
    onCancel={() => setActiveView('overview')}
    onPhotoUpdate={handlePhotoUpdate}
    onRemovePhoto={handleRemovePhoto}
  />

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh'
      }}>
        <CircularProgress size={60} sx={{ color: '#8e44ad' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h5" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#8e44ad', '&:hover': { backgroundColor: '#732d91' } }}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      backgroundColor: 'white',
      minHeight: '100vh',
      pt: { xs: '100px', md: '40px' }, // Increased top padding
      px: 3,
      pb: 3
    }}>
      <Grid container spacing={2}>
        {/* Left Column - Profile Sidebar */}
        <Grid item xs={12} md={3} sx={{ maxWidth: 300 }}>
          <Box sx={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            height: 'auto',
            p: 3,
            position: 'sticky',
            top: { xs: '100px', md: '150px' },
          }}>
            <ProfileHeader profile={profile} />
            <ProfileNavigation setActiveView={setActiveView} />
          </Box>
        </Grid>

        {/* Right Column - Profile Content */}
        <Grid item xs={12} md={9} sx={{ maxWidth: 950 }}>
          {activeView === 'overview' ? (
            <>
              {/* Activity Overview Section */}
              <Box sx={{
                backgroundColor: 'white',
                borderRadius: '16px',
                p: 0.5,
                mb: 1
              }}>
                <ProfileStats profile={profile} />
              </Box>

              {/* Recent Activity Section */}
              <Grid container spacing={3} >
                <Grid item xs={12} md={6} sx={{ maxWidth: 450 }}>
                  <Box sx={{
                    height: 'auto',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    p: 3
                  }}>
                    <RecentBookings />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} sx={{ maxWidth: 450 }}>
                  <Box sx={{
                    height: 'auto',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    p: 3
                  }}>
                    <RecentInvoices />
                  </Box>
                </Grid>
              </Grid>
            </>
          ) : (
            <EditProfileForm
              profile={profile}
              onSave={handleUpdateProfile}
              onCancel={() => setActiveView('overview')}
              onPhotoUpdate={handlePhotoUpdate}
              onRemovePhoto={handleRemovePhoto}
            />

          )}
        </Grid>
      </Grid>

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
          sx={{
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' :
              snackbar.severity === 'info' ? '#2196f3' : '#f44336',
            color: 'white'
          }}
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