import React, { useState } from 'react';
import {
  TextField,
  Box,
  Container,
  Link,
  FormControlLabel,
  Checkbox,
  Typography,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserService from '../service/UserService';
import Navbar from '../components/common/Navbar';

const LoginPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Update handleLogin function:
const handleLogin = async () => {
  try {
    const response = await axios.post('http://localhost:8081/api/auth/login', {
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password
    });
    
    if (response.data.token) {
      // Decode token to get role
      const decodedToken = JSON.parse(atob(response.data.token.split('.')[1]));
      const role = decodedToken.role || 'User';
      
      // Use UserService to save token and user info
      UserService.login(
        response.data.token,
        role,
        decodedToken.sub || credentials.usernameOrEmail,
        response.data.profileImage // Add this if your API returns it
      );
      
      navigate('/');
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    console.error('Login error:', err);
  }
};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        py: 4,
        backgroundColor: '#f8f9fa',
        mt: 8
      }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              height: { xs: 'auto', md: '500px' },
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography 
                component="h1" 
                variant="h4" 
                sx={{ 
                  mb: 3, 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: 'black'
                }}
              >
                Sign in
              </Typography>

              <TextField
                margin="normal"
                required
                fullWidth
                label="Username or Email"
                name="usernameOrEmail"
                value={credentials.usernameOrEmail}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={credentials.rememberMe}
                      onChange={handleChange}
                      name="rememberMe"
                      color="primary"
                    />
                  }
                  label="Remember Me"
                />
                <Link
                  href="#"
                  variant="body2"
                  sx={{ color: '#4a90e2', cursor: 'pointer' }}
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </Link>
              </Box>

              {error && (
                <Typography color="error" sx={{ mt: 1, textAlign: 'center', mb: 2 }}>
                  {error}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 1,
                  mb: 2,
                  py: 1.5,
                  backgroundColor: '#8e44ad',
                  '&:hover': {
                    backgroundColor: '#732d91',
                  },
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
                onClick={handleLogin}
              >
                Sign In
              </Button>

              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                Don't have an account?{' '}
                <Link 
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{ 
                    color: '#4a90e2', 
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Register now
                </Link>
              </Typography>
            </Box>

            <Box
              sx={{
                width: { xs: '100%', md: '50%' },
                height: { xs: '300px', md: '100%' },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to bottom right, #8e44ad, #3498db)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: 'url("/registration.jpeg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.7,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 40,
                  left: 40,
                  color: 'white',
                  zIndex: 2,
                }}
              >
                <Typography variant="h4" fontWeight="bold">
                  Welcome Back!
                </Typography>
                <Typography variant="subtitle1">
                  Sign in to continue your pickleball journey
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;