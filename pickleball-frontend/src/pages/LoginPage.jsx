import React, { useState } from 'react';
import {
  TextField,
  Box,
  Container,
  Link,
  Typography,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Fade,
  Slide,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../service/api';
import UserService from '../service/UserService';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const [credentials, setCredentials] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Update handleLogin function with coach and admin routing logic:
  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // First try regular user login
      try {
        const response = await api.post('/auth/login', {
          usernameOrEmail: credentials.usernameOrEmail,
          password: credentials.password
        });
        
        if (response.data.token) {
          // 用 context 的 login 方法同步状态
          login(response.data.token);
          // 解析 userType
          const payload = JSON.parse(atob(response.data.token.split('.')[1]));
          const userType = payload.userType || payload.role || '';
          if (userType === 'Coach' || userType === 'COACH') {
            navigate('/coaching');
          } else {
            navigate('/home');
          }
          return;
        }
      } catch (userErr) {
        // If user login fails, try admin login
        try {
          const adminResponse = await api.post('/admin/login', {
            username: credentials.usernameOrEmail,
            password: credentials.password
          });
          
                  if (adminResponse.data.token) {
          // Store admin credentials using UserService
          UserService.adminLogin(adminResponse.data.token, credentials.usernameOrEmail);
          // Also set the token in AuthContext for consistency
          login(adminResponse.data.token, true); // true indicates this is an admin token
          navigate('/admin/dashboard');
          return;
        }
        } catch (adminErr) {
          // Both user and admin login failed
          setError('Invalid credentials. Please try again.');
          console.error('Login error:', userErr, adminErr);
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };



  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f5f9 0%, #e8eaf6 100%)',
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      py: 4,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        pt: { xs: 10, sm: 12 },
        position: 'relative',
        overflow: 'hidden'
      }}>


        <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
          <Slide direction="up" in={true} mountOnEnter unmountOnExit>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', lg: 'row' }, 
              gap: 4, 
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              
              {/* Left Side - Login Form */}
              <Box sx={{ 
                flex: { xs: 'none', lg: 1 }, 
                width: { xs: '100%', sm: '400px', lg: '450px' },
                maxWidth: '450px',
                order: { xs: 2, lg: 1 }
              }}>
                <Fade in={true} timeout={800}>
                  <Paper
                    elevation={24}
                    sx={{
                      p: 4,
                      borderRadius: '24px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {/* Background Mascot with Low Opacity */}
                    <Box
                      component="img"
                      src={`${process.env.PUBLIC_URL}/mascot_lowopacity.png`}
                      alt="Background Mascot"
                      sx={{
                        position: 'absolute',
                        top: '60%',
                        right: '-20px',
                        transform: 'translateY(-50%)',
                        width: '500px',
                        height: 'auto',
                        opacity: 0.35,
                        zIndex: 0,
                        pointerEvents: 'none'
                      }}
                    />
                    
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
                      <Box
                        component="img"
                        src={`${process.env.PUBLIC_URL}/web-name.png`}
                        alt="Brand"
                        sx={{
                          height: 40,
                          display: 'block',
                          margin: '0 auto',
                          mb: 1
                        }}
                      />
                                              <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          color: theme.palette.text.primary,
                          mb: 1
                        }}>
                          User Login
                        </Typography>
                    </Box>
              
                    {/* Login Form */}
                    <Box component="form" onKeyPress={handleKeyPress} sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography component="label" sx={{ 
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: '0.95rem',
                          mb: 1,
                          display: 'block'
                        }}>
                          Email or Username
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          placeholder="username@gmail.com"
                          name="usernameOrEmail"
                          value={credentials.usernameOrEmail}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('usernameOrEmail')}
                          onBlur={() => setFocusedField('')}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {credentials.usernameOrEmail.includes('@') ? 
                                  <Email sx={{ color: focusedField === 'usernameOrEmail' ? theme.palette.primary.main : theme.palette.text.secondary }} /> :
                                  <Person sx={{ color: focusedField === 'usernameOrEmail' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                                }
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafb',
                              '&:focus-within': {
                                backgroundColor: theme.palette.background.paper,
                                boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                              }
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Typography component="label" sx={{ 
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: '0.95rem',
                          mb: 1,
                          display: 'block'
                        }}>
                          Password
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          placeholder="Password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={credentials.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField('')}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: focusedField === 'password' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={togglePasswordVisibility}
                                  edge="end"
                                >
                                  {showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9fafb',
                              '&:focus-within': {
                                backgroundColor: theme.palette.background.paper,
                                boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`
                              }
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        mb: 3
                      }}>
                        <Link
                          component="button"
                          type="button"
                          variant="body2"
                          sx={{ 
                            color: theme.palette.primary.main, 
                            fontWeight: 500,
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => navigate('/forgot-password')}
                        >
                          Forgot Password?
                        </Link>
                      </Box>

                      {error && (
                        <Fade in={!!error}>
                          <Alert 
                            severity="error" 
                            sx={{ 
                              mb: 2, 
                              borderRadius: 2,
                              '& .MuiAlert-message': {
                                fontWeight: 500
                              }
                            }}
                          >
                            {error}
                          </Alert>
                        </Fade>
                      )}

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleLogin}
                        disabled={isLoading}
                        sx={{
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                          borderRadius: '12px',
                          textTransform: 'none',
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          boxShadow: `0 4px 14px ${theme.palette.primary.main}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            boxShadow: `0 6px 20px ${theme.palette.primary.main}60`,
                            transform: 'translateY(-1px)'
                          },
                          '&:disabled': {
                            backgroundColor: theme.palette.action.disabledBackground,
                            transform: 'none'
                          }
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : (
                          'Sign in'
                        )}
                      </Button>



                      <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Don't have an account yet?{' '}
                          <Link 
                            component="button"
                            type="button"
                            variant="body2"
                            onClick={() => navigate('/register')}
                            sx={{ 
                              color: theme.palette.primary.main, 
                              fontWeight: 600,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            Register for free
                          </Link>
                        </Typography>
                      </Box>
                      {/*<Box sx={{ my: 3, position: 'relative' }}>
                        <Divider sx={{ borderColor: theme.palette.divider }}>
                          <Chip 
                            label="OR" 
                            size="small" 
                            sx={{ 
                              backgroundColor: theme.palette.background.paper,
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }} 
                          />
                        </Divider>
                      </Box>
                      {/* Social Login Buttons
                    <Box sx={{ mb: 3 }}>
                      <Stack spacing={2}>
                        <SocialLoginButton icon={Google} provider="Google" color="#4285f4" />
                        <SocialLoginButton icon={Facebook} provider="Facebook" color="#1877f2" />
                      </Stack>
                      
                      
                    </Box>*/}
                    </Box>
                  </Paper>
                </Fade>
              </Box>

              {/* Right Side - Mascot */}
              <Box sx={{ 
                flex: 1,
                display: { xs: 'none', lg: 'flex' },
                justifyContent: 'center',
                alignItems: 'center',
                order: { xs: 1, lg: 2 }
              }}>
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/mascot.png`}
                  alt="Pickleball Mascot"
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '600px',
                    filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </Box>
            </Box>
          </Slide>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;