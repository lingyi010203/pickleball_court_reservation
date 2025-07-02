// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container,
  AppBar,
  Toolbar
} from '@mui/material';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        'http://localhost:8081/api/auth/password/forgot', 
        { email }
      );
      
      if (response.status === 200) {
        navigate('/reset-password-email-sent');
      }
    } catch (error) {
      setMessage(error.response?.data || 'Error sending reset email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#8e44ad' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            PICKLEBALL
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Home</Button>
          <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
          <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        backgroundColor: '#f8f9fa',
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
              Forgot your password?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
              Enter your email and we'll send you instructions to reset your password
            </Typography>
            
            {message && (
              <Typography color="error" sx={{ mt: 1, mb: 2 }}>
                {message}
              </Typography>
            )}
            
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="e.g. your.email@example.com"
            />
            
            <Button
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                backgroundColor: '#8e44ad',
                '&:hover': { backgroundColor: '#732d91' },
                fontSize: '1rem',
                fontWeight: 'bold',
                mb: 2
              }}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
            
            <Button 
              color="inherit"
              sx={{ color: '#4a90e2', fontWeight: 'bold' }}
              onClick={() => navigate('/login')}
            >
              Return to Login
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;