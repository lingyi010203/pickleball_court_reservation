import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  InputAdornment,
  Fade,
  Zoom,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Event,
  LocationOn,
  AccessTime,
  Person,
  Category,
  AttachMoney,
  Image,
  Add,
  Close,
  CalendarToday,
  Public,
  Lock,
  Error
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EventService from '../../service/EventService';

const EventCreatePage = () => {
  const theme = useTheme();
  // Removed profile and loading state
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [priceError, setPriceError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    endTime: '',
    eventType: '', // will use category for this
    capacity: '',
    location: '',
    skillLevel: '',
    eligibility: '',
    price: '', // used for feeAmount
    status: 'PUBLISHED'
  });

  // Schedule builder state
  const [scheduleArray, setScheduleArray] = useState([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleActivity, setScheduleActivity] = useState('');

  const categories = [
    'Tournament',
    'Social Play',
    'Ladder League',
    'Round Robin',
    'Clinic',
    'Open Play',
    'Youth Event',
    'Senior Event',
    'Charity Event',
    'Skills & Drills',
    'Exhibition Match',
    'Club Night',
    'Beginner Session',
    'Advanced Play'
  ];

  const skillLevels = [
    'Beginner', 'Intermediate', 'Advanced', 'All Levels'
  ];

  // Removed useEffect for fetching profile

  const handleInputChange = (field) => (event) => {
    if (field === 'price') {
      const value = event.target.value;
      if (value !== '' && parseFloat(value) < 0) {
        setPriceError('Price cannot be negative');
      } else {
        setPriceError('');
      }
    }
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.checked
    });
  };

  // Add schedule item
  const handleAddScheduleItem = () => {
    if (scheduleTime && scheduleActivity) {
      setScheduleArray([...scheduleArray, { time: scheduleTime, activity: scheduleActivity }]);
      setScheduleTime('');
      setScheduleActivity('');
    }
  };

  // Remove schedule item
  const handleRemoveScheduleItem = (idx) => {
    setScheduleArray(scheduleArray.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    // Price validation
    if (formData.price !== '' && parseFloat(formData.price) < 0) {
      setPriceError('Price cannot be negative');
      setSubmitting(false);
      return;
    }
    try {
      const eventData = {
        title: formData.title,
        startTime: `${formData.date}T${formData.time}`,
        endTime: `${formData.date}T${formData.endTime}`,
        eventType: formData.eventType,
        skillLevel: formData.skillLevel,
        capacity: parseInt(formData.capacity, 10),
        location: formData.location,
        eligibility: formData.eligibility,
        schedule: JSON.stringify(scheduleArray),
        feeAmount: formData.price ? parseFloat(formData.price) : 0,
        status: formData.status || 'PUBLISHED'
      };
      await EventService.createEvent(eventData);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/events');
      }, 3000);
    } catch (err) {
      let errorMsg = "Failed to create event.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (typeof err.response.data === "object") {
          errorMsg = err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
        }
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Only check currentUser role for access
  if (currentUser?.role !== "EVENTORGANIZER") {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}>
        <Container maxWidth="lg">
          <Paper 
            elevation={24} 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}
          >
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2, 
                bgcolor: 'error.main'
              }}
            >
              <Error sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ color: 'error.main', fontWeight: 'bold', mb: 2 }}>
              Access Denied
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              You need to be an Event Organizer to create events.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/events')}
              sx={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: 2,
                px: 4,
                py: 1.5
              }}
            >
              Back to Events
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Paper 
            elevation={24} 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2, 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)'
                }}
              >
                <Event sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Create New Event
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Bring your vision to life with our event creation platform
              </Typography>
            </Box>

            {showSuccess && (
              <Zoom in>
                <Alert 
                  severity="success" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setShowSuccess(false)}
                >
                  Event created successfully! 🎉
                </Alert>
              </Zoom>
            )}

            {error && (
              <Zoom in>
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Zoom>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Card elevation={8} sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
                        Basic Information
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Event Title"
                            value={formData.title}
                            onChange={handleInputChange('title')}
                            required
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Event color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Category</InputLabel>
                            <Select
                              value={formData.eventType}
                              onChange={handleInputChange('eventType')}
                              label="Category"
                              startAdornment={
                                <InputAdornment position="start">
                                  <Category color="primary" />
                                </InputAdornment>
                              }
                              sx={{ borderRadius: 2 }}
                            >
                              {categories.map((category) => (
                                <MenuItem key={category} value={category}>
                                  {category}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Skill Level</InputLabel>
                            <Select
                              value={formData.skillLevel}
                              onChange={handleInputChange('skillLevel')}
                              label="Skill Level"
                              sx={{ borderRadius: 2 }}
                            >
                              {skillLevels.map((level) => (
                                <MenuItem key={level} value={level}>
                                  {level}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {/* Schedule */}
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Schedule</Typography>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={4}>
                              <TextField
                                label="Time"
                                type="time"
                                value={scheduleTime}
                                onChange={e => setScheduleTime(e.target.value)}
                                fullWidth
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                label="Activity"
                                value={scheduleActivity}
                                onChange={e => setScheduleActivity(e.target.value)}
                                fullWidth
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <Button variant="contained" onClick={handleAddScheduleItem} disabled={!scheduleTime || !scheduleActivity}>Add</Button>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: 2 }}>
                            {scheduleArray.length === 0 && <Typography color="text.secondary">No schedule items added.</Typography>}
                            {scheduleArray.map((item, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography sx={{ mr: 2 }}>{item.time} - {item.activity}</Typography>
                                <Button color="error" size="small" onClick={() => handleRemoveScheduleItem(idx)}>Remove</Button>
                              </Box>
                            ))}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Date & Time */}
                <Grid item xs={12} md={6}>
                  <Card elevation={8} sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
                        Date & Time
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={handleInputChange('date')}
                            required
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarToday color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            value={formData.time}
                            onChange={handleInputChange('time')}
                            required
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AccessTime color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="End Time"
                            type="time"
                            value={formData.endTime}
                            onChange={handleInputChange('endTime')}
                            required
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AccessTime color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Location & Capacity */}
                <Grid item xs={12} md={6}>
                  <Card elevation={8} sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
                        Location & Capacity
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Location"
                            value={formData.location}
                            onChange={handleInputChange('location')}
                            required
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationOn color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Capacity"
                            type="number"
                            value={formData.capacity}
                            onChange={handleInputChange('capacity')}
                            required
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Pricing & Settings */}
                <Grid item xs={12}>
                  <Card elevation={8} sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
                        Pricing & Settings
                      </Typography>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange('price')}
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoney color="primary" />
                                </InputAdornment>
                              ),
                              inputProps: { min: 0 },
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            error={!!priceError}
                            helperText={priceError}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Eligibility */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Eligibility"
                    value={formData.eligibility}
                    onChange={handleInputChange('eligibility')}
                    required
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting}
                      sx={{
                        px: 6,
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8, #6a42a0)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                        },
                        '&:disabled': {
                          background: 'rgba(0, 0, 0, 0.12)',
                          transform: 'none',
                          boxShadow: 'none'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {submitting ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                          Creating Event...
                        </Box>
                      ) : (
                        'Create Event'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default EventCreatePage;
