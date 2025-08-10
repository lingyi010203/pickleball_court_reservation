import React, { useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container,
  Box,
  Alert,
  Grid,
  FormHelperText,
  useMediaQuery,
  useTheme,
  Typography,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  CircularProgress,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  Phone,
  CalendarToday,
  Wc
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../service/api';
import Navbar from '../components/common/Navbar';

const RegisterPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    gender: '',
    userType: 'User',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '2000-01-01',
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
    // Clear message when user starts typing
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Full Name is required';
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        gender: formData.gender,
        userType: formData.userType,
        password: formData.password,
        phone: formData.phone,
        dob: formData.dob
      });

      setMessage('success:Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      let errorMsg = 'Registration failed. ';
      
      if (error.response) {
        errorMsg += error.response.data;
      } else if (error.message.includes('Network Error')) {
        errorMsg = `Network error: Ensure backend is running at http://localhost:8081
        1. Check Java application is running
        2. Verify database connection
        3. Check server logs for errors`;
      }
      
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
              
              {/* Left Side - Mascot (Flipped) */}
              <Box sx={{ 
                flex: 0.5,
                display: { xs: 'none', lg: 'flex' },
                justifyContent: 'center',
                alignItems: 'center',
                order: { xs: 1, lg: 1 }
              }}>
                <Box
                  component="img"
                  src={`${process.env.PUBLIC_URL}/mascot.png`}
                  alt="Pickleball Mascot"
                  sx={{
                    maxWidth: '90%',
                    height: 'auto',
                    maxHeight: '500px',
                    filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))',
                    transform: 'scaleX(-1)' // Flip horizontally
                  }}
                />
              </Box>

              {/* Right Side - Registration Form */}
              <Box sx={{ 
                flex: { xs: 'none', lg: 1.5 }, 
                width: { xs: '100%', sm: '400px', lg: '680px' },
                maxWidth: '680px',
                order: { xs: 2, lg: 2 }
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
                        top: '50%',
                        left: '-20px',
                        transform: 'translateY(-50%) scaleX(-1)',
                        width: '700px',
                        height: 'auto',
                        opacity: 0.35,
                        zIndex: 0,
                        pointerEvents: 'none'
                      }}
                    />
                    
                                         {/* Header */}
                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
                       <Box
                         component="img"
                         src={`${process.env.PUBLIC_URL}/logo.png`}
                         alt="Logo"
                         sx={{
                           height: 50,
                           width: 'auto',
                           mr: 2
                         }}
                       />
                       <Typography variant="h4" sx={{ 
                         fontWeight: 700, 
                         color: theme.palette.text.primary,
                         mb: 0
                       }}>
                         User Registration
                       </Typography>
                     </Box>
              
                    {/* Registration Form */}
                    <Box component="form" onSubmit={handleSubmit} sx={{ position: 'relative', zIndex: 1 }}>
                      {message && (
                        <Alert 
                          severity={message.includes('success') ? 'success' : 'error'} 
                          sx={{ mb: 3, borderRadius: '12px' }}
                        >
                          {message.replace('success:', '')}
                        </Alert>
                      )}

                      {/* First Row */}
                      <Grid container spacing={2} sx={{ mb: 0 }}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Full Name
                            </Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="John Doe"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('name')}
                              onBlur={() => setFocusedField('')}
                              error={!!errors.name}
                              helperText={errors.name}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Person sx={{ color: focusedField === 'name' ? theme.palette.primary.main : theme.palette.text.secondary }} />
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
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Username
                            </Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="johndoe123"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('username')}
                              onBlur={() => setFocusedField('')}
                              error={!!errors.username}
                              helperText={errors.username}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Person sx={{ color: focusedField === 'username' ? theme.palette.primary.main : theme.palette.text.secondary }} />
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
                        </Grid>
                      </Grid>

                      {/* Second Row */}
                      <Grid container spacing={2} sx={{ mb: 0 }}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Email
                            </Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="john@example.com"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField('')}
                              error={!!errors.email}
                              helperText={errors.email}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Email sx={{ color: focusedField === 'email' ? theme.palette.primary.main : theme.palette.text.secondary }} />
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
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Phone Number
                            </Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="+1234567890"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('phone')}
                              onBlur={() => setFocusedField('')}
                              error={!!errors.phone}
                              helperText={errors.phone}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Phone sx={{ color: focusedField === 'phone' ? theme.palette.primary.main : theme.palette.text.secondary }} />
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
                        </Grid>
                      </Grid>

                      {/* Third Row */}
                      <Grid container spacing={2} sx={{ mb: 0 }}>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Date of Birth
                            </Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              type="date"
                              name="dob"
                              value={formData.dob}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('dob')}
                              onBlur={() => setFocusedField('')}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarToday sx={{ color: focusedField === 'dob' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                                  </InputAdornment>
                                ),
                              }}
                              inputProps={{
                                max: new Date().toISOString().split('T')[0],
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
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Gender
                            </Typography>
                            <FormControl 
                              fullWidth 
                              error={!!errors.gender}
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
                            >
                              <Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('gender')}
                                onBlur={() => setFocusedField('')}
                                displayEmpty
                                startAdornment={
                                  <InputAdornment position="start">
                                    <Wc sx={{ color: focusedField === 'gender' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                                  </InputAdornment>
                                }
                              >
                                <MenuItem value=""><em>Select Gender</em></MenuItem>
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                              </Select>
                              {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                            </FormControl>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              User Type
                            </Typography>
                            <FormControl 
                              fullWidth
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
                            >
                              <Select
                                name="userType"
                                value={formData.userType}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('userType')}
                                onBlur={() => setFocusedField('')}
                                startAdornment={
                                  <InputAdornment position="start">
                                    <Person sx={{ color: focusedField === 'userType' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                                  </InputAdornment>
                                }
                              >
                                <MenuItem value="User">User</MenuItem>
                                <MenuItem value="Coach">Coach</MenuItem>
                                <MenuItem value="EventOrganizer">Event Organizer</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Fourth Row */}
                      <Grid container spacing={2} sx={{ mb: 0 }}>
                        <Grid item xs={12} md={6}>
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
                              value={formData.password}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField('')}
                              error={!!errors.password}
                              helperText={errors.password || "At least 6 characters"}
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
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 3 }}>
                            <Typography component="label" sx={{ 
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              mb: 1,
                              display: 'block'
                            }}>
                              Confirm Password
                            </Typography>
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="Confirm Password"
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('confirmPassword')}
                              onBlur={() => setFocusedField('')}
                              error={!!errors.confirmPassword}
                              helperText={errors.confirmPassword}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Lock sx={{ color: focusedField === 'confirmPassword' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      aria-label="toggle confirm password visibility"
                                      onClick={toggleConfirmPasswordVisibility}
                                      edge="end"
                                    >
                                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
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
                        </Grid>
                      </Grid>

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isLoading}
                        sx={{
                          mt: 2,
                          py: 1.8,
                          fontSize: '1rem',
                          fontWeight: 700,
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
                          'Sign Up'
                        )}
                      </Button>

                      <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Already have an account?{' '}
                          <Link 
                            component="button"
                            type="button"
                            variant="body2"
                            onClick={() => navigate('/login')}
                            sx={{ 
                              color: theme.palette.primary.main, 
                              fontWeight: 600,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            Sign in here
                          </Link>
                        </Typography>
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

export default RegisterPage;