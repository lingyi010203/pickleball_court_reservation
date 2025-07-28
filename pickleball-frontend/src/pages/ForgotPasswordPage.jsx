// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container,
  useTheme
} from '@mui/material';
import Navbar from '../components/common/Navbar';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
      <Navbar />

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        backgroundColor: theme.palette.background.default,
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.text.primary }}>
              Forgot your password?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
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
                backgroundColor: theme.palette.primary.main,
                '&:hover': { backgroundColor: theme.palette.primary.dark },
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
              sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
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