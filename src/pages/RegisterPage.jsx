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
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      const response = await axios.post(
        'http://localhost:8081/api/auth/register',
        {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          gender: formData.gender,
          userType: formData.userType,
          password: formData.password,
          phone: formData.phone,
          dob: formData.dob
        }
      );

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        py: 4,
        backgroundColor: '#f8f9fa',
        overflow: 'auto',
        mt: 8
      }}>
        <Container maxWidth="lg" sx={{ height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              height: '100%',
              maxHeight: { xs: 'none', md: '700px' },
              width: '90%',
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', md: '45%' },
                minHeight: { xs: '300px', md: 'auto' },
                position: 'relative',
                overflow: 'hidden',
                display: isMobile ? 'none' : 'block',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: 'url(/registration.jpeg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <Box sx={{
                  textAlign: 'center',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: 4,
                  borderRadius: 2
                }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>
                    Join Our Community
                  </Typography>
                  <Typography variant="h5">
                    Register to start your pickleball journey
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: { xs: '100%', md: '55%' },
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                maxHeight: { xs: 'none', md: '700px' },
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  mb: 3, 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#8e44ad'
                }}
              >
                REGISTRATION FORM
              </Typography>

              {message && (
                <Alert 
                  severity={message.includes('success') ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  {message.replace('success:', '')}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="name"
                    label="Full Name *"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="username"
                    label="Username *"
                    value={formData.username}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors.username}
                    helperText={errors.username}
                    inputProps={{ minLength: 3 }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    name="email"
                    label="Email *"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="phone"
                    label="Phone Number *"
                    value={formData.phone}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors.phone}
                    helperText={errors.phone}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    name="dob"
                    label="Date of Birth"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      max: new Date().toISOString().split('T')[0],
                    }}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl 
                    fullWidth 
                    margin="normal" 
                    error={!!errors.gender} 
                    size="small"
                    sx={{ minWidth: 140 }}
                  >
                    <InputLabel>Gender *</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      label="Gender *"
                    >
                      <MenuItem value=""><em>Select Gender</em></MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                    {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl 
                    fullWidth 
                    margin="normal" 
                    size="small"
                    sx={{ minWidth: 140 }}
                  >
                    <InputLabel>User Type</InputLabel>
                    <Select
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      label="User Type"
                    >
                      <MenuItem value="User">User</MenuItem>
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="Coach">Coach</MenuItem>
                      <MenuItem value="EventOrganizer">Event Organizer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    name="password"
                    label="Password *"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors.password}
                    helperText={errors.password || "At least 6 characters"}
                    inputProps={{ minLength: 6 }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="confirmPassword"
                    label="Confirm Password *"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.5,
                  backgroundColor: '#8e44ad',
                  '&:hover': {
                    backgroundColor: '#732d91',
                  },
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register →'}
              </Button>

              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                Already have an account?{' '}
                <Button 
                  onClick={() => navigate('/login')}
                  sx={{ 
                    color: '#4a90e2', 
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '1rem',
                    p: 0,
                    minWidth: 'auto'
                  }}
                >
                  Login here
                </Button>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default RegisterPage;