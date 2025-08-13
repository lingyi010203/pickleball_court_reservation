// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container,
  useTheme,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const customTheme = useCustomTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setMessage('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage('');
    setEmailError('');
    setIsSuccess(false);
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        'http://localhost:8081/api/auth/password/forgot', 
        { email }
      );
      
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Reset link sent to your email!');
        setTimeout(() => {
          navigate('/reset-password-email-sent');
        }, 2000);
      }
    } catch (error) {
      setMessage(error.response?.data || 'Error sending reset email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        pt: { xs: 20, sm: 24 },
        backgroundColor: theme.palette.background.default,
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '24px',
              boxShadow: theme.shadows[2],
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.text.primary }}>
              Reset your password
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
              We'll email you a link to create a new one
            </Typography>
            
            {message && (
              <Typography 
                color={isSuccess ? "success" : "error"} 
                sx={{ mt: 1, mb: 2, fontWeight: 500 }}
              >
                {message}
              </Typography>
            )}
            
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={handleEmailChange}
              autoFocus
              error={!!emailError}
              helperText={emailError}
              sx={{ mb: 3 }}
              placeholder="Enter your email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: emailError ? theme.palette.error.main : theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                backgroundColor: theme.palette.primary.main,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
                fontSize: '1rem',
                fontWeight: 'bold',
                mb: 2,
                textTransform: 'none',
                borderRadius: '8px'
              }}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Sending...
                </Box>
              ) : (
                'Send Link'
              )}
            </Button>
            
            <Button 
              color="inherit"
              sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1
              }}
              onClick={() => navigate('/login')}
            >
              <ArrowBack sx={{ fontSize: 18 }} />
              Back to Login
            </Button>
          </Box>
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default ForgotPasswordPage;