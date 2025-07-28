// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  AppBar, 
  Toolbar,
  useTheme
} from '@mui/material';
import axios from 'axios';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
   const [tokenValid, setTokenValid] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(
        'http://localhost:8081/api/auth/password/reset', 
        { 
          token, 
          newPassword: password,
          confirmPassword: password // Send only the password, backend will validate
        }
      );
      
      if (response.status === 200) {
        navigate('/reset-password-success');
      }
    } catch (error) {
      // Extract error message from backend response
      const errorMessage = error.response?.data || 
                           error.response?.data?.message || 
                           'Error resetting password. Please try again.';
                           
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
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
        backgroundColor: theme.palette.background.default,
      }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              padding: 4,
            }}
          >
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center', color: theme.palette.text.primary }}>
              Reset Your Password
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: theme.palette.text.secondary, textAlign: 'center' }}>
              Create a new password for your account
            </Typography>
            
            {message && (
              <Typography color="error" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
                {message}
              </Typography>
            )}
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 3 }}
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
              }}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;