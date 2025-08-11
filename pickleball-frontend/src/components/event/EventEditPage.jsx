import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
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
  CalendarToday,
  Public,
  Lock,
  Error
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../service/api';
import EventService from '../../service/EventService';

export default function EventEditPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notifyParticipants, setNotifyParticipants] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sendNotification, setSendNotification] = useState(true); // 默認發送通知

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


  const [form, setForm] = useState({
    title: "",
    eventType: "",
    schedule: [],
    date: '',
    time: '',
    endTime: '',
    location: "",
    capacity: "",
    price: '',
    feeAmount: '',
    //description: ''
  });
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleActivity, setScheduleActivity] = useState('');
  const [scheduleArray, setScheduleArray] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await EventService.getEventDetails(eventId);
        if (eventData.organizerId !== currentUser?.id && currentUser?.role !== "EVENTORGANIZER") {
          setError("You don't have permission to edit this event.");
          return;
        }
        setEvent(eventData);
        // Parse start and end time
        const start = new Date(eventData.startTime);
        const end = new Date(eventData.endTime);
        setForm({
          title: eventData.title || "",
          eventType: eventData.eventType || "",
          schedule: eventData.schedule ? JSON.parse(eventData.schedule) : [],
          date: start.getFullYear() + '-' +
                String(start.getMonth() + 1).padStart(2, '0') + '-' +
                String(start.getDate()).padStart(2, '0'),
          time: String(start.getHours()).padStart(2, '0') + ':' +
                String(start.getMinutes()).padStart(2, '0'),
          endTime: String(end.getHours()).padStart(2, '0') + ':' + String(end.getMinutes()).padStart(2, '0'),
          location: eventData.location || eventData.venueLocation || "",
          capacity: eventData.capacity?.toString() || "",
          price: eventData.feeAmount?.toString() || '',
          feeAmount: eventData.feeAmount?.toString() || '',
        //  description: eventData.description || ''
        });
        setScheduleArray(eventData.schedule ? JSON.parse(eventData.schedule) : []);
      } catch (err) {
        let msg = "An error occurred";
        if (err?.response?.data?.message) {
          msg = err.response.data.message;
        } else if (typeof err?.response?.data === "string") {
          msg = err.response.data;
        } else if (typeof err?.response?.data === "object") {
          msg = err.response.data.error || JSON.stringify(err.response.data);
        } else if (err?.message) {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId, currentUser]);

  const handleInputChange = (field) => (event) => {
    setForm({
      ...form,
      [field]: event.target.value
    });
    if (error) setError('');
    if (message) setMessage('');
  };
  const handleSwitchChange = (field) => (event) => {
    setForm({
      ...form,
      [field]: event.target.checked
    });
  };
  const handleAddScheduleItem = () => {
    if (scheduleTime && scheduleActivity) {
      const newSchedule = [...scheduleArray, { time: scheduleTime, activity: scheduleActivity }];
      setScheduleArray(newSchedule);
      setForm({ ...form, schedule: newSchedule });
      setScheduleTime('');
      setScheduleActivity('');
    }
  };
  const handleRemoveScheduleItem = (idx) => {
    const newSchedule = scheduleArray.filter((_, i) => i !== idx);
    setScheduleArray(newSchedule);
    setForm({ ...form, schedule: newSchedule });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const eventData = {
        title: form.title,
        startTime: `${form.date}T${form.time}`,
        endTime: `${form.date}T${form.endTime}`,
        eventType: form.eventType,
        capacity: parseInt(form.capacity, 10),
        location: form.location,
        schedule: JSON.stringify(scheduleArray),
        feeAmount: form.price ? parseFloat(form.price) : 0,
        status: 'PUBLISHED', // Always publish when updating
        venueId: event?.venueId || null, // 保留現有的 venue 關聯
        sendNotification: sendNotification // 添加郵件通知選項
       // description: form.description
      };
      
      // 調試日誌
      console.log('Updating event with venueId:', event?.venueId);
      console.log('Event venue info:', {
        venueId: event?.venueId,
        venueName: event?.venueName,
        venueState: event?.venueState,
        venueLocation: event?.venueLocation
      });
      
      if (notifyParticipants) {
        await EventService.updateEventWithNotification(eventId, eventData);
      } else {
        await EventService.updateEvent(eventId, eventData);
      }
      setShowSuccess(true);
      setMessage('Event updated successfully!');
      setTimeout(() => {
        navigate('/events', { state: { refresh: true } });
      }, 2000);
    } catch (err) {
      let errorMsg = "Failed to update event.";
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
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    setSubmitting(true);
    try {
      await EventService.deleteEvent(eventId);
      setMessage("Event deleted successfully!");
      setTimeout(() => {
        navigate('/events');
      }, 2000);
    } catch (err) {
      let msg = "An error occurred";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (typeof err?.response?.data === "string") {
        msg = err.response.data;
      } else if (typeof err?.response?.data === "object") {
        msg = err.response.data.error || JSON.stringify(err.response.data);
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Paper elevation={24} sx={{ p: 4, borderRadius: 4, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: 'linear-gradient(45deg, #667eea, #764ba2)' }}>
                <Event sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #667eea, #764ba2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
                Edit Event
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Update your event details below
              </Typography>
            </Box>
            {showSuccess && (
              <Zoom in>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setShowSuccess(false)}>
                  <Typography variant="h6" gutterBottom>
                    Event updated successfully! 🎉
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Your event has been updated and is now live.
                  </Typography>
                  {sendNotification && (
                    <Typography variant="body2" color="info.main">
                      📧 Email notifications have been sent to all registered users.
                    </Typography>
                  )}
                  {notifyParticipants && (
                    <Typography variant="body2" color="info.main">
                      🔔 Registered participants have been notified about the changes.
                    </Typography>
                  )}
                </Alert>
              </Zoom>
            )}
            {error && (
              <Zoom in>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
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
                            value={form.title}
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
                          <FormControl fullWidth required disabled>
                            <InputLabel>Category</InputLabel>
                            <Select
                              value={form.eventType}
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
                            value={form.date}
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
                            disabled={true}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            value={form.time}
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
                            disabled={true}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="End Time"
                            type="time"
                            value={form.endTime}
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
                            disabled={true}
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
                            value={form.location}
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
                            disabled={true}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Venue"
                            value={event?.venueName || 'N/A'}
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationOn color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            disabled={true}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="State"
                            value={event?.venueState || 'N/A'}
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationOn color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            disabled={true}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Capacity"
                            type="number"
                            value={form.capacity}
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
                            value={form.price}
                            onChange={handleInputChange('price')}
                            variant="outlined"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoney color="primary" />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            disabled={true}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Actions */}
                <Grid item xs={12}>
                  <Card elevation={8} sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom sx={{ color: '#667eea', fontWeight: 'bold' }}>
                        Notification Settings
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={sendNotification}
                                onChange={e => setSendNotification(e.target.checked)}
                                color="primary"
                              />
                            }
                            label="📧 Send email notification to all users about this event update"
                          />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: 1 }}>
                            When enabled, all registered users will receive an email notification about the changes to this event.
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={notifyParticipants}
                                onChange={e => setNotifyParticipants(e.target.checked)}
                                color="primary"
                              />
                            }
                            label="🔔 Notify registered participants about changes"
                          />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: 1 }}>
                            When enabled, users who have already registered for this event will receive a notification.
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="contained" type="submit" disabled={submitting} sx={{ px: 4, borderRadius: 2 }}>
                      {submitting ? 'Updating Event...' : 'Update Event'}
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
} 