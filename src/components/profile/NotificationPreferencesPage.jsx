import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Button,
  Snackbar,
  Alert,
  FormGroup,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import UserService from '../../service/UserService';

const NotificationPreferences = ({ profile, onSave, onCancel }) => {
  const [preferences, setPreferences] = useState({
    emailNotifications: profile.emailNotifications,
    pushNotifications: profile.pushNotifications
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Initialize preferences with profile data
    setPreferences({
      emailNotifications: profile.emailNotifications,
      pushNotifications: profile.pushNotifications
    });
  }, [profile]);

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = UserService.getToken();
      await axios.put(
        'http://localhost:8081/api/preferences',
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSave(preferences);
      setSnackbar({
        open: true,
        message: 'Notification preferences updated successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update preferences. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ 
      backgroundColor: 'white', 
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      p: 3,
      maxWidth: '900px',
      mx: 'auto'
    }}>
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        mb: 3,
        color: '#8e44ad',
        borderBottom: '1px solid #eee',
        pb: 1
      }}>
        Notification Preferences
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Customize how you receive notifications from our platform
      </Typography>
      
      <FormGroup>
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.emailNotifications}
                onChange={handleChange}
                name="emailNotifications"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Email Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive important updates, booking confirmations, and promotional offers via email
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>
        
        <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={preferences.pushNotifications}
                onChange={handleChange}
                name="pushNotifications"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Push Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get real-time updates about your bookings and game invitations
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>
      </FormGroup>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          disabled={loading}
          sx={{ 
            color: 'text.secondary',
            borderColor: 'text.secondary',
            minWidth: '120px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            py: 1.5,
            fontSize: '1rem'
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ 
            backgroundColor: '#8e44ad', 
            '&:hover': { backgroundColor: '#732d91' },
            minWidth: '180px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            py: 1.5,
            fontSize: '1rem'
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
        </Button>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336',
            color: 'white'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationPreferences;