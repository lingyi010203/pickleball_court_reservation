// src/pages/ResetPasswordEmailSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, AppBar, Toolbar } from '@mui/material';

const ResetPasswordEmailSent = () => {
  const navigate = useNavigate();

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
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
              Check Your Email!
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              We've sent password reset instructions to your email address.
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4 }}>
              Didn't receive the email? Check your spam folder or contact support.
            </Typography>
            
            <Button
              variant="contained"
              sx={{
                py: 1.5,
                backgroundColor: '#8e44ad',
                '&:hover': { backgroundColor: '#732d91' },
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
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

export default ResetPasswordEmailSent;