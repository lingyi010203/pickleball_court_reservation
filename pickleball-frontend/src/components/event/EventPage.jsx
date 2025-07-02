import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import EventService from '../../service/EventService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Divider,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  People,
  AttachMoney,
  Close,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import FriendlyMatchPage from './FriendlyMatchPage';

const EventPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerEvent, setRegisterEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showFriendlyMatch, setShowFriendlyMatch] = useState(false);

  const { currentUser } = useAuth();
  const isEventOrganizer = currentUser?.role === 'EVENTORGANIZER' || currentUser?.role === 'EventOrganizer' || currentUser?.userType === 'EventOrganizer';
  const navigate = useNavigate();
  const location = useLocation();


  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventList = await EventService.getUpcomingEvents();
      setEvents(eventList.content || eventList);
    } catch (err) {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch events on mount or path change
    fetchEvents();

    // If coming back from edit and refresh flag is set, fetch again
    if (location.state?.refresh) {
      fetchEvents();
      // Clear the state so it doesn't refetch every time
      window.history.replaceState({}, document.title);
    }
  }, [location.pathname]); // location from react-router

  // Update handleEventClick to fetch event details from backend
  const handleEventClick = async (event) => {
    setDetailLoading(true);
    setError(null); // <-- Clear error before starting
    setSelectedEvent(null);
    setIsRegistered(false);
    setCheckingRegistration(true);
    try {
      const eventDetails = await EventService.getEventDetails(event.id);
      setSelectedEvent(eventDetails);
      setError(null); // <-- Clear error on success
      const isRegistered = await EventService.isRegisteredForEvent(event.id);
      setIsRegistered(isRegistered === true);
    } catch {
      setIsRegistered(false);
      // setError('Failed to load event details.'); // This line is removed
    } finally {
      setCheckingRegistration(false);
      setDetailLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedEvent(null);
    setIsRegistered(false);
  };

  const toggleFavorite = (eventId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
    } else {
      newFavorites.add(eventId);
    }
    setFavorites(newFavorites);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Technology: 'primary',
      Music: 'secondary',
      Business: 'success',
      Arts: 'warning',
      Food: 'error',
      Fitness: 'info',
      Tournament: 'primary',
      League: 'secondary',
      'Friendly Match': 'success',
      Workshop: 'warning',
      Social: 'info',
    };
    return colors[category] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  function formatTime(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const getAvailabilityStatus = (registered, capacity) => {
    const percentage = (registered / capacity) * 100;
    if (percentage >= 90) return { text: 'Almost Full', color: 'error' };
    if (percentage >= 70) return { text: 'Filling Fast', color: 'warning' };
    return { text: 'Available', color: 'success' };
  };

  // Map backend event fields to UI fields
  const mapEvent = (event) => {
    // Ensure startTime is a string in ISO format
    let startTime = event.startTime;
    if (startTime && typeof startTime === 'object' && startTime.toISOString) {
      startTime = startTime.toISOString();
    } else if (startTime && typeof startTime === 'string' && startTime.includes(' ')) {
      startTime = startTime.replace(' ', 'T');
    }
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      date: startTime,
      time: formatTime(startTime),
      location: event.location,
      price: event.price !== undefined ? event.price : (event.feeAmount !== undefined ? event.feeAmount : 0),
      capacity: event.capacity,
      registered: event.registeredCount || event.registered || 0,
      category: event.eventType || event.category,
      image: event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
      organizer: event.organizerName || 'Organizer',
      tags: event.tags || [],
    };
  };

  const handleRegisterClick = (event) => {
    setRegisterEvent(event);
    setShowRegisterDialog(true);
    setRegisterSuccess(false);
    setRegisterError('');
  };

  const handleRegisterCancel = () => {
    setShowRegisterDialog(false);
    setRegisterEvent(null);
    setRegisterSuccess(false);
    setRegisterError('');
  };

  const handleRegisterConfirm = async () => {
    setRegistering(true);
    setRegisterError('');
    try {
      await EventService.registerForEvent(registerEvent.id);
      setRegisterSuccess(true);
      setEvents(prevEvents =>
        prevEvents.map(ev =>
          ev.id === registerEvent.id
            ? { ...ev, registered: (ev.registered || 0) + 1 }
            : ev
        )
      );
      setIsRegistered(true);
      setTimeout(() => {
        setShowRegisterDialog(false);
        setRegisterEvent(null);
        setRegisterSuccess(false);
      }, 2000);
    } catch (err) {
      setRegisterError(
        err.response?.data?.message || err.response?.data || 'Registration failed.'
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleEditEvent = (event) => {
    navigate(`/events/edit/${event.id}`);
  };

  const handleCancelEvent = async (event) => {
    try {
      await EventService.deleteEvent(event.id);
      fetchEvents();
      setSelectedEvent(null);
    } catch (err) {
      alert('Failed to cancel event.');
    }
  };

  const handleViewRegisteredUsers = async (eventId) => {
    const res = await api.get(`/api/event-registration/event/${eventId}/users`);
    setRegisteredUsers(res.data);
    setShowDialog(true);
  };

  let scheduleItems = [];
  try {
    if (selectedEvent?.schedule) {
      scheduleItems = JSON.parse(selectedEvent.schedule);
    }
  } catch (e) {
    scheduleItems = [];
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Upcoming Events
      </Typography>

      {isEventOrganizer && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/events/create')}
          >
            Create Event
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      {!loading && !error && events.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ mt: 6 }}>
          No upcoming events found.
        </Typography>
      )}

      <Grid container spacing={3}>
        {events.map((rawEvent) => {
          const event = mapEvent(rawEvent);
          const availability = getAvailabilityStatus(event.registered, event.capacity);

          return (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleEventClick(event)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={event.image}
                  alt={event.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip
                      label={event.category}
                      color={getCategoryColor(event.category)}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(event.id);
                      }}
                    >
                      {favorites.has(event.id) ? <Favorite color="error" /> : <FavoriteBorder />}
                    </IconButton>
                  </Box>

                  <Typography variant="h6" component="h2" gutterBottom>
                    {event.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {event.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {formatDate(event.date) || 'No date'} {formatTime(event.time)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {event.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {event.price === 0 ? 'Free' : `$${event.price}`}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <People sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      {event.registered}/{event.capacity} registered
                    </Typography>
                    <Chip
                      label={availability.text}
                      color={availability.color}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={e => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedEvent || detailLoading}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {detailLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        ) : selectedEvent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">{selectedEvent.title}</Typography>
                <IconButton onClick={handleCloseDialog}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <img
                  src={selectedEvent.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop'}
                  alt={selectedEvent.title}
                  style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={selectedEvent.eventType}
                  color={getCategoryColor(selectedEvent.eventType)}
                />
                {selectedEvent.tags && selectedEvent.tags.map((tag, index) => (
                  <Chip key={index} label={tag} variant="outlined" size="small" />
                ))}
              </Box>

              <Typography variant="body1" paragraph>
                {selectedEvent.description || selectedEvent.title}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>Event Details</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                        <Typography variant="body1">
                          {formatDate(selectedEvent.startTime)} {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Location</Typography>
                        <Typography variant="body1">{selectedEvent.location}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Price</Typography>
                        <Typography variant="body1">
                          Free
                        </Typography>
                      </Box>
                    </Box>

                    {selectedEvent.skillLevel && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <People sx={{ mr: 1, fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Skill Level</Typography>
                          <Typography variant="body1">{selectedEvent.skillLevel}</Typography>
                        </Box>
                      </Box>
                    )}

                    {selectedEvent.eligibility && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <People sx={{ mr: 1, fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Eligibility</Typography>
                          <Typography variant="body1">{selectedEvent.eligibility}</Typography>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>Organizer</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {selectedEvent.organizerName?.charAt(0)}
                      </Avatar>
                      <Typography variant="body1">{selectedEvent.organizerName || 'Unknown Organizer'}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <People sx={{ mr: 1, fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Capacity</Typography>
                        <Typography variant="body1">
                          {selectedEvent.capacity} participants
                        </Typography>
                      </Box>
                    </Box>

                    {selectedEvent.currentParticipants && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <People sx={{ mr: 1, fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">Registered</Typography>
                          <Typography variant="body1">
                            {selectedEvent.currentParticipants} / {selectedEvent.capacity} registered
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {selectedEvent.timeUntilEvent && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={selectedEvent.timeUntilEvent}
                          color={selectedEvent.isUpcoming ? 'primary' : 'default'}
                        />
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {selectedEvent.schedule && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" gutterBottom>Schedule</Typography>
                    {scheduleItems.length > 0 ? (
                      <ul>
                        {scheduleItems.map((item, idx) => (
                          <li key={idx}>
                            <strong>{item.time}</strong>: {item.activity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No schedule available.</Typography>
                    )}
                  </Paper>
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog} color="inherit">
                Close
              </Button>
              {currentUser?.role === "EVENTORGANIZER" || currentUser?.userType === "EventOrganizer" ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleEditEvent(selectedEvent)}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  disabled={selectedEvent.currentParticipants >= selectedEvent.capacity || isRegistered || checkingRegistration}
                  onClick={() => handleRegisterClick(selectedEvent)}
                  sx={isRegistered ? { backgroundColor: '#bdbdbd', color: '#fff' } : {}}
                >
                  {selectedEvent.currentParticipants >= selectedEvent.capacity
                    ? 'Event Full'
                    : isRegistered
                      ? 'Already Registered'
                      : 'Register Now'}
                </Button>
              )}
              {currentUser?.userType === "EventOrganizer" && (
                <Button onClick={() => handleViewRegisteredUsers(selectedEvent.id)}>
                  View Registered Users
                </Button>
              )}
              {selectedEvent.eventType === 'Friendly Match' && (
                <Button onClick={() => setShowFriendlyMatch(true)}>View Friendly Match</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Registration Confirmation Dialog */}
      <Dialog
        open={showRegisterDialog}
        onClose={handleRegisterCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        {registerSuccess ? (
          <>
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <Typography variant="h2" color="white">✓</Typography>
                </Box>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  Registration Successful!
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', px: 4 }}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Congratulations!</strong> You've successfully registered for this event.
                </Typography>
                <Typography variant="body2">
                  A confirmation email has been sent to your registered email address. 
                  Please check your inbox and spam folder.
                </Typography>
              </Alert>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📧 <strong>What's Next?</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Check your email for event details and QR code
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Add the event to your calendar
                </Typography>
                <Typography variant="body2">
                  • Arrive 15 minutes early on event day
                </Typography>
              </Paper>

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Cancellation Policy:</strong> You can cancel your registration up to 
                  <strong> 48 hours</strong> before the event starts. Contact support if you need to cancel.
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button 
                variant="contained" 
                onClick={handleRegisterCancel}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                Got It!
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <Typography variant="h4" color="white">📝</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  Confirm Registration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You're about to register for this event
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ px: 4 }}>
              <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary.main">
                  {registerEvent?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {registerEvent?.description}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Date:</strong> {formatDate(registerEvent?.startTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 16, height: 16, mr: 1, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">🕐</Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>Time:</strong> {formatTime(registerEvent?.startTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Location:</strong> {registerEvent?.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Price:</strong> {registerEvent?.price === 0 ? 'Free' : `$${registerEvent?.price}`}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>📋 Registration Terms:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • You can cancel your registration up to <strong>48 hours</strong> before the event
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • A confirmation email will be sent to your registered email address
                </Typography>
                <Typography variant="body2">
                  • Please arrive 15 minutes early on the event day
                </Typography>
              </Alert>

              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>⚠️ Important:</strong> By confirming, you agree to attend the event. 
                  Late cancellations may result in a no-show fee for paid events.
                </Typography>
              </Alert>

              {registerError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {registerError}
                </Alert>
              )}
            </DialogContent>
            
            <DialogActions sx={{ px: 4, pb: 3, gap: 2 }}>
              <Button 
                onClick={handleRegisterCancel} 
                disabled={registering}
                variant="outlined"
                sx={{ px: 3, py: 1.5, borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleRegisterConfirm}
                disabled={registering}
                sx={{ px: 3, py: 1.5, borderRadius: 2 }}
              >
                {registering ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} color="inherit" />
                    Registering...
                  </Box>
                ) : (
                  'Confirm Registration'
                )}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Registered Users Dialog */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Registered Users</DialogTitle>
        <DialogContent>
          <ul>
            {registeredUsers.map(user => (
              <li key={user.id}>{user.name} ({user.email})</li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {showFriendlyMatch && <FriendlyMatchPage />}
    </Container>
  );
};

export default EventPage;

