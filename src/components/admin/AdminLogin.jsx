import React, { useState } from 'react';
import { 
  Box, Grid, Typography, Paper, Avatar, 
  TextField, Button, Checkbox, FormControlLabel,
  CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import { 
  Lock as LockIcon, 
  Person as PersonIcon, 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserService from '../../service/UserService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8081/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store admin credentials using UserService
      UserService.adminLogin(data.token, username);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login request failed, please try again');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navbar - Simplified version */}
      <Box sx={{
        height: 70,
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{
            bgcolor: 'primary.main',
            width: 32,
            height: 32,
            marginRight: '12px'
          }}>
          </Avatar>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8e44ad, #3498db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            CourtConnect Admin
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1,
        marginTop: '70px'
      }}>
        {/* Image Section */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          backgroundImage: 'url(https://source.unsplash.com/random/1200x800?stadium)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9))'
          }} />
          
          <Box sx={{ 
            position: 'relative', 
            zIndex: 2, 
            color: 'white', 
            textAlign: 'center', 
            padding: '2rem', 
            maxWidth: 600 
          }}>
            <Typography variant="h2" sx={{ 
              fontWeight: 700,
              marginBottom: '1rem',
              lineHeight: 1.2
            }}>
              Admin Portal
            </Typography>
            <Typography variant="h5" sx={{ 
              opacity: 0.9,
              lineHeight: 1.6
            }}>
              Manage your venue bookings and system settings
            </Typography>
          </Box>
        </Box>

        {/* Login Form Section */}
        <Box sx={{
          width: { xs: '100%', md: '40%' },
          maxWidth: 500,
          minWidth: { xs: 'auto', md: 400 },
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <Paper sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: { xs: '1.5rem', md: '3rem' },
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: '100%',
            animation: 'slideUp 0.6s ease-out',
            '@keyframes slideUp': {
              from: { opacity: 0, transform: 'translateY(30px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}>
            {/* Logo */}
            <Box sx={{ 
              textAlign: 'center', 
              marginBottom: '2.5rem' 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <Avatar sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  width: 48,
                  height: 48,
                  fontSize: '1.5rem'
                }}>
                  👨‍💼
                </Avatar>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Admin Portal
                </Typography>
              </Box>
              
              <Typography variant="h4" sx={{ 
                fontWeight: 600,
                color: '#1a202c',
                marginBottom: '0.5rem'
              }}>
                Welcome Back
              </Typography>
              <Typography sx={{ 
                color: '#64748b',
                fontSize: '1rem'
              }}>
                Sign in to your admin account
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleLogin} sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {/* Username Field */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" sx={{ 
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      '&:focus-within': {
                        backgroundColor: 'white',
                        boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
                      }
                    }
                  }}
                />
              </Box>

              {/* Password Field */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" sx={{ 
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      '&:focus-within': {
                        backgroundColor: 'white',
                        boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
                      }
                    }
                  }}
                />
              </Box>

              {/* Login Button */}
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={isLoading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                  '&:hover:not(:disabled)': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 20px 25px -5px rgba(102, 126, 234, 0.4)'
                  },
                  '&:active:not(:disabled)': {
                    transform: 'translateY(0)'
                  },
                  '&:disabled': {
                    opacity: 0.7
                  }
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    Signing in...
                  </Box>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>

            {/* Error Message */}
            {error && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}>
                <Box sx={{ fontSize: '1.2rem' }}>⚠️</Box>
                {error}
              </Box>
            )}

            {/* Features */}
            <Grid container spacing={1} sx={{ marginTop: '2rem' }}>
              <Grid item xs={12} md={4}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  fontWeight: 500
                }}>
                  <SecurityIcon sx={{ fontSize: '1.8rem', opacity: 0.8 }} />
                  Secure Access
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  fontWeight: 500
                }}>
                  <AnalyticsIcon sx={{ fontSize: '1.8rem', opacity: 0.8 }} />
                  Analytics Dashboard
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  fontWeight: 500
                }}>
                  <SettingsIcon sx={{ fontSize: '1.8rem', opacity: 0.8 }} />
                  System Control
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLogin;