import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import api from '../../api/axiosConfig';

const UserStatusGuard = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/profile');
        const status = response.data?.userAccount?.status || 'ACTIVE';
        setUserStatus(status);
        
        // If user is suspended or inactive, log them out
        if (status === 'SUSPENDED' || status === 'INACTIVE') {
          logout();
          setError(`Your account is ${status.toLowerCase()}. You cannot access booking features. Please contact support for assistance.`);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setError('Unable to verify account status. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser, logout]);

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Verifying account status...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <WarningIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            Account Access Restricted
          </Typography>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ backgroundColor: '#1976d2' }}
            >
              Go to Home
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/contact')}
              sx={{ borderColor: '#1976d2', color: '#1976d2' }}
            >
              Contact Support
            </Button>
          </Box>
        </Card>
      </Container>
    );
  }

  return children;
};

export default UserStatusGuard;
