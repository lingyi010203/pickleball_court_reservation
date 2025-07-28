import React, { useState } from 'react';
import {
  TextField,
  Box,
  Container,
  Link,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Fade,
  Slide,
  CircularProgress,
  Stack,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  SportsTennis,
  Login as LoginIcon,
  ArrowForward,
  Security,
  CheckCircle,
  Google,
  Facebook,
  Apple
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserService from '../service/UserService';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme, alpha } from '@mui/material';

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

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', {
        usernameOrEmail: credentials.usernameOrEmail,
        password: credentials.password
      });
      
      if (response.data.token) {
        login(response.data.token);
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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

  const SocialLoginButton = ({ icon: Icon, provider, color }) => (
    <Button
      variant="outlined"
      fullWidth
      startIcon={<Icon />}
      sx={{
        py: 1.5,
        borderColor: theme.palette.divider,
        color: theme.palette.text.primary,
        '&:hover': {
          borderColor: color,
          backgroundColor: `${color}10`,
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.3s ease',
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 500
      }}
    >
      Continue with {provider}
    </Button>
  );

  const FeatureCard = ({ icon: Icon, title, description }) => (
    <Card 
      elevation={0} 
      sx={{ 
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        p: 2,
        height: '100%',
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', color: theme.palette.text.primary }}>
        <Box sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.light,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2
        }}>
          <Icon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        py: 4,
        pt: { xs: 10, sm: 12 },
        backgroundColor: theme.palette.background.default,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Removed decorative background circles for clarity and theme consistency */}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Slide direction="up" in={true} mountOnEnter unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'center', pt: 10 }}>
              
              {/* Left Side - Welcome Content */}
              <Box sx={{ 
                flex: 1, 
                color: theme.palette.text.primary,
                textAlign: { xs: 'center', lg: 'left' },
                mb: { xs: 4, lg: 0 }
              }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 800, 
                    mb: 2,
                    color: theme.palette.primary.main,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}>
                    Welcome Back!
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    opacity: 0.9, 
                    fontWeight: 400,
                    mb: 4
                  }}>
                    Continue your pickleball journey with us
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                    <Chip 
                      icon={<CheckCircle />} 
                      label="Trusted by 10,000+ players" 
                      sx={{ 
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        fontWeight: 500
                      }} 
                    />
                    <Chip 
                      icon={<Security />} 
                      label="Secure & Safe" 
                      sx={{ 
                        backgroundColor: alpha(theme.palette.success.main, 0.12),
                        color: theme.palette.success.main,
                        fontWeight: 500
                      }} 
                    />
                  </Stack>
                </Box>

                {/* Feature Cards */}
                <Box sx={{ 
                  display: { xs: 'none', lg: 'grid' },
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                  mt: 4
                }}>
                  <FeatureCard 
                    icon={SportsTennis}
                    title="Book Courts"
                    description="Reserve your favorite courts instantly"
                  />
                  <FeatureCard 
                    icon={Person}
                    title="Find Partners"
                    description="Connect with players at your level"
                  />
                </Box>
              </Box>

              {/* Right Side - Login Form */}
              <Box sx={{ 
                flex: { xs: 'none', lg: 1 }, 
                width: { xs: '100%', sm: '400px', lg: '450px' },
                maxWidth: '450px'
              }}>
                <Fade in={true} timeout={800}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 4,
                      pt: 6,
                      borderRadius: 4,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                    
                      <Typography variant="h4" sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.text.primary,
                        mb: 1
                      }}>
                        Sign In
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Enter your credentials to access your account
                      </Typography>
                    </Box>
              
                    {/* Login Form */}
                    <Box component="form" onKeyPress={handleKeyPress}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Username or Email"
                        name="usernameOrEmail"
                        value={credentials.usernameOrEmail}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('usernameOrEmail')}
                        onBlur={() => setFocusedField('')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {credentials.usernameOrEmail.includes('@') ? 
                                <Email color={focusedField === 'usernameOrEmail' ? 'primary' : 'action'} /> :
                                <Person color={focusedField === 'usernameOrEmail' ? 'primary' : 'action'} />
                              }
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.shadows[4]
                            }
                          }
                        }}
                      />

                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField('')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color={focusedField === 'password' ? 'primary' : 'action'} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={togglePasswordVisibility}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.shadows[4]
                            }
                          }
                        }}
                      />

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3
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
                          label={
                            <Typography variant="body2" fontWeight={500}>
                              Remember Me
                            </Typography>
                          }
                        />
                        <Link
                          component="button"
                          type="button"
                          variant="body2"
                          sx={{ 
                            color: theme.palette.primary.main, 
                            fontWeight: 600,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => navigate('/forgot-password')}
                        >
                          Forgot password?
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
                        endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                        sx={{
                          mt: 1,
                          mb: 3,
                          py: 1.8,
                          fontSize: '1rem',
                          fontWeight: 700,
                          borderRadius: 2,
                          textTransform: 'none',
                          backgroundColor: theme.palette.primary.main,
                          boxShadow: theme.shadows[8],
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[12],
                            backgroundColor: theme.palette.primary.dark,
                          },
                          '&:disabled': {
                            transform: 'none',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                      >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </Button>

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Don't have an account?{' '}
                          <Link 
                            component="button"
                            type="button"
                            variant="body2"
                            onClick={() => navigate('/register')}
                            sx={{ 
                              color: theme.palette.primary.main, 
                              fontWeight: 700,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            Create Account
                          </Link>
                        </Typography>
                      </Box>
                      <Box sx={{ my: 3, position: 'relative' }}>
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
                      {/* Social Login Buttons */}
                    <Box sx={{ mb: 3 }}>
                      <Stack spacing={2}>
                        <SocialLoginButton icon={Google} provider="Google" color="#4285f4" />
                        <SocialLoginButton icon={Facebook} provider="Facebook" color="#1877f2" />
                      </Stack>
                      
                      
                    </Box>
                    </Box>
                  </Paper>
                </Fade>
              </Box>
            </Box>
          </Slide>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginPage;