import React, { useState, useEffect, useMemo } from 'react';
import { Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Grid, Card, CardContent, CardActions, Button, Avatar, Chip, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Badge, Tabs, Tab, Collapse, Snackbar, Alert, CircularProgress, useTheme, Fab, Tooltip, Container, CardMedia, Switch, FormControlLabel, InputAdornment, Fade, Zoom, Checkbox, ListItemText as MuiListItemText, Stepper, Step, StepLabel } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Schedule, Assessment, Settings, Notifications, Add, Edit, Delete, Star, TrendingUp, CalendarToday, Person, Event, Message, AttachMoney, CheckCircle, Receipt, AccountBalanceWallet, TrendingDown, AccountBalance, CheckCircleOutline, Group, LocationOn, AccessTime, Visibility, VisibilityOff, Create, List as ListIcon, ViewList, Category, Image, Close, Public, Lock, Error, Favorite, FavoriteBorder } from '@mui/icons-material';
import MessagingPage from '../messaging/MessagingPage';
import { useAuth } from '../../context/AuthContext';
import EventOrganizerService from '../../service/EventOrganizerService';
import EventService from '../../service/EventService';
import CourtService from '../../service/CourtService';
import VenueService from '../../service/VenueService';
import { useNavigate, useLocation } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import EventCreatePage from '../event/EventCreatePage';

const drawerWidth = 240;

const EventOrganizerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'events', 'wallet', 'messages', 'create-event', 'edit-event', 'view-event'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // User info
  const organizerName = currentUser?.username || 'Event Organizer';
  const organizerInitial = currentUser?.username?.charAt(0)?.toUpperCase() || 'E';

  // Data states
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [wallet, setWallet] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Event creation states
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [capacityError, setCapacityError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    endTime: '',
    eventType: '',
    capacity: '',
    price: '',
    status: 'PUBLISHED',
    sendNotification: true
  });
  const [scheduleArray, setScheduleArray] = useState([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleActivity, setScheduleActivity] = useState('');
  const [courtIds, setCourtIds] = useState([]);
  const [courts, setCourts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [venueMaxCapacity, setVenueMaxCapacity] = useState(0);

  // Event edit states
  const [event, setEvent] = useState(null);
  const [editLoading, setEditLoading] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [notifyParticipants, setNotifyParticipants] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [editForm, setEditForm] = useState({
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
  });
  const [editScheduleTime, setEditScheduleTime] = useState('');
  const [editScheduleActivity, setEditScheduleActivity] = useState('');
  const [editScheduleArray, setEditScheduleArray] = useState([]);

  // Event view states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventDetailLoading, setEventDetailLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    // sync currentView with URL for organizer routes
    if (location.pathname === '/event-organizer/create') {
      setCurrentView('create-event');
      setSelectedTab(1);
    } else if (location.pathname === '/event-organizer') {
      setCurrentView('events');
      setSelectedTab(1);
    }
  }, [location.pathname]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // First, check debug status to see what's wrong
      try {
        const debugData = await EventOrganizerService.debugStatus();
        console.log('Debug status:', debugData);
      } catch (debugErr) {
        console.error('Debug status error:', debugErr);
      }
      
      const [profileData, eventsData, statsData, walletData] = await Promise.all([
        EventOrganizerService.getProfile(),
        EventOrganizerService.getEvents(),
        EventOrganizerService.getStatistics(),
        EventOrganizerService.getWallet()
      ]);

      console.log('Profile data:', profileData);
      console.log('Events data:', eventsData);
      console.log('Statistics data:', statsData);
      console.log('Wallet data:', walletData);

      setProfile(profileData);
      setEvents(eventsData);
      setStatistics(statsData);
      setWallet(walletData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    switch (newValue) {
      case 0:
        setCurrentView('dashboard');
        break;
      case 1:
        setCurrentView('events');
        break;
      case 2:
        setCurrentView('wallet');
        break;
      case 3:
        setCurrentView('messages');
        break;
      default:
        setCurrentView('dashboard');
    }
  };

  const handleCreateEvent = () => {
    navigate('/event-organizer/create');
  };

  const handleEditEvent = async (eventId) => {
    // Navigate to the EventEditPage instead of staying in dashboard
    navigate(`/events/edit/${eventId}`);
  };

  const handleViewEvent = async (eventId) => {
    setSelectedEventId(eventId);
    setCurrentView('view-event');
    setEventDetailLoading(true);
    
    try {
      const eventData = await EventService.getEventDetails(eventId);
      setSelectedEvent(eventData);
      setShowEventDialog(true);
      
      // Load registered users
      const participants = await EventOrganizerService.getEventParticipants(eventId);
      setRegisteredUsers(participants);
    } catch (err) {
      console.error('Error loading event details:', err);
      // Removed error message to prevent "Failed to load event details" from showing
    } finally {
      setEventDetailLoading(false);
    }
  };

  const handleCloseEventDialog = () => {
    setShowEventDialog(false);
    setCurrentView('events'); // 回到活動列表視圖
    setSelectedTab(1); // 確保選中 "My Events" 標籤
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedTab(0);
    loadDashboardData(); // Refresh data
  };

  const handleBackToEvents = () => {
    setCurrentView('events');
    setSelectedTab(1);
    navigate('/event-organizer');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Event Creation Functions
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (field === 'price' && priceError) setPriceError('');
    if (field === 'capacity' && capacityError) setCapacityError('');
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const handleAddScheduleItem = () => {
    if (scheduleTime && scheduleActivity) {
      setScheduleArray(prev => [...prev, { time: scheduleTime, activity: scheduleActivity }]);
      setScheduleTime('');
      setScheduleActivity('');
    }
  };

  const handleRemoveScheduleItem = (idx) => {
    setScheduleArray(prev => prev.filter((_, index) => index !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const eventData = {
        ...formData,
        schedule: scheduleArray,
        courtIds: courtIds,
        venueId: venueId
      };

      await EventService.createEvent(eventData);
      setShowSuccess(true);
      setCurrentView('events');
      setSelectedTab(1);
      loadDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  // Event Edit Functions
  const handleEditInputChange = (field) => (event) => {
    const value = event.target.value;
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditAddScheduleItem = () => {
    if (editScheduleTime && editScheduleActivity) {
      setEditScheduleArray(prev => [...prev, { time: editScheduleTime, activity: editScheduleActivity }]);
      setEditScheduleTime('');
      setEditScheduleActivity('');
    }
  };

  const handleEditRemoveScheduleItem = (idx) => {
    setEditScheduleArray(prev => prev.filter((_, index) => index !== idx));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    try {
      const eventData = {
        ...editForm,
        schedule: editScheduleArray,
        notifyParticipants: notifyParticipants
      };

      await EventService.updateEvent(selectedEventId, eventData);
      setShowEditSuccess(true);
      setCurrentView('events');
      setSelectedTab(1);
      loadDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error updating event:', err);
      setEditError('Failed to update event');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    // Find the event to get participant count
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Check if event has participants
    if (event.registeredCount && event.registeredCount > 0) {
      setError('Cannot delete event with registered participants');
      return;
    }

    // Set event to delete and show confirmation dialog
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    setDeleting(true);
    try {
      await EventService.deleteEvent(eventToDelete.id);
      setShowDeleteDialog(false);
      setShowDeleteSuccess(true);
      setEventToDelete(null);
      loadDashboardData(); // Refresh data
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setEventToDelete(null);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Event Organizer
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleTabChange(null, 0)} selected={selectedTab === 0}>
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleTabChange(null, 1)} selected={selectedTab === 1}>
            <ListItemIcon>
              <Event />
            </ListItemIcon>
            <ListItemText primary="My Events" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleTabChange(null, 2)} selected={selectedTab === 2}>
            <ListItemIcon>
              <AccountBalanceWallet />
            </ListItemIcon>
            <ListItemText primary="Wallet" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleTabChange(null, 3)} selected={selectedTab === 3}>
            <ListItemIcon>
              <Message />
            </ListItemIcon>
            <ListItemText primary="Messages" />
            <Badge badgeContent={3} color="error" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  const renderDashboard = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Events
              </Typography>
              <Typography variant="h4">
                {statistics.totalEvents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Events
              </Typography>
              <Typography variant="h4">
                {statistics.activeEvents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Participants
              </Typography>
              <Typography variant="h4">
                {statistics.totalParticipants || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                ${statistics.netRevenue ? statistics.netRevenue.toFixed(2) : '0.00'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Net after platform fees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Wallet Balance
              </Typography>
              <Typography variant="h4" color="primary.main">
                ${wallet.recentTransactions && wallet.recentTransactions.length > 0 
                  ? wallet.recentTransactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2) 
                  : '0.00'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                From transaction history
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Breakdown */}
      {statistics.grossRevenue > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Revenue Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Gross Revenue
                </Typography>
                <Typography variant="h6" color="primary">
                  ${statistics.grossRevenue ? statistics.grossRevenue.toFixed(2) : '0.00'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Platform Fees
                </Typography>
                <Typography variant="h6" color="error">
                  -${statistics.platformFees ? statistics.platformFees.toFixed(2) : '0.00'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  (10% of gross revenue)
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" color="success.main">
                  ${statistics.netRevenue ? statistics.netRevenue.toFixed(2) : '0.00'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}





      {/* Recent Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Events
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Participants</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.slice(0, 5).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.startTime ? new Date(event.startTime).toLocaleDateString() : 'No date set'}</TableCell>
                    <TableCell>{event.location || 'No location set'}</TableCell>
                    <TableCell>{event.registeredCount || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={event.status} 
                        color={event.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleViewEvent(event.id)}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditEvent(event.id)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderEvents = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateEvent}
        >
          Create New Event
        </Button>
      </Box>

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {event.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {event.startTime ? new Date(event.startTime).toLocaleDateString() : 'No date set'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <LocationOn fontSize="small" sx={{ mr: 1 }} />
                  {event.location || 'No location set'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <Group fontSize="small" sx={{ mr: 1 }} />
                  {event.registeredCount || 0} participants
                </Typography>
                <Chip 
                  label={event.status} 
                  color={event.status === 'ACTIVE' ? 'success' : 'default'}
                  size="small"
                  sx={{ mb: 2 }}
                />
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleViewEvent(event.id)}>
                  View
                </Button>
                <Button size="small" onClick={() => handleEditEvent(event.id)}>
                  Edit
                </Button>
                {/* Only show delete button if event has no participants */}
                {(!event.registeredCount || event.registeredCount === 0) ? (
                  <Button size="small" color="error" onClick={() => handleDeleteEvent(event.id)}>
                    Delete
                  </Button>
                ) : (
                  <Tooltip title="Cannot delete event with registered participants">
                    <span>
                      <Button size="small" color="error" disabled>
                        Delete
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderWallet = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Wallet
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h4">
                ${wallet.balance || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wallet.recentTransactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>${transaction.amount}</TableCell>
                        <TableCell>
                          <Chip 
                            label={transaction.type} 
                            color={transaction.type === 'CREDIT' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCreateEvent = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button onClick={handleBackToEvents} sx={{ mr: 2 }}>
          ← Back to Events
        </Button>
        <Typography variant="h4">
          Create New Event
        </Typography>
      </Box>

      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={formData.eventType}
                    onChange={handleInputChange('eventType')}
                    required
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
                <TextField
                  fullWidth
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange('capacity')}
                  required
                  error={!!capacityError}
                  helperText={capacityError}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange('price')}
                  error={!!priceError}
                  helperText={priceError}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange('date')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange('time')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange('endTime')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.sendNotification}
                      onChange={handleSwitchChange('sendNotification')}
                    />
                  }
                  label="Send notification to participants"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={handleBackToEvents}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Create Event'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );

  const renderEditEvent = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button onClick={handleBackToEvents} sx={{ mr: 2 }}>
          ← Back to Events
        </Button>
        <Typography variant="h4">
          Edit Event
        </Typography>
      </Box>

      {editLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4 }}>
            <form onSubmit={handleEditSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Event Details
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Event Title"
                    value={editForm.title}
                    onChange={handleEditInputChange('title')}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                      value={editForm.eventType}
                      onChange={handleEditInputChange('eventType')}
                      required
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
                  <TextField
                    fullWidth
                    label="Capacity"
                    type="number"
                    value={editForm.capacity}
                    onChange={handleEditInputChange('capacity')}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Price ($)"
                    type="number"
                    value={editForm.price}
                    onChange={handleEditInputChange('price')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={editForm.date}
                    onChange={handleEditInputChange('date')}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={editForm.time}
                    onChange={handleEditInputChange('time')}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={editForm.endTime}
                    onChange={handleEditInputChange('endTime')}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifyParticipants}
                        onChange={(e) => setNotifyParticipants(e.target.checked)}
                      />
                    }
                    label="Notify participants of changes"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={handleBackToEvents}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={editSubmitting}
                    >
                      {editSubmitting ? <CircularProgress size={24} /> : 'Update Event'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      )}
    </Box>
  );

  const renderViewEventDialog = () => (
    <Dialog
      open={showEventDialog}
      onClose={handleCloseEventDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Event Details
          </Typography>
          <IconButton onClick={handleCloseEventDialog}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {eventDetailLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : selectedEvent ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                {selectedEvent.title}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                Date: {selectedEvent.startTime ? new Date(selectedEvent.startTime).toLocaleDateString() : 'No date set'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                <AccessTime fontSize="small" sx={{ mr: 1 }} />
                Time: {selectedEvent.startTime ? new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - {selectedEvent.endTime ? new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                <LocationOn fontSize="small" sx={{ mr: 1 }} />
                Location: {selectedEvent.location || 'No location set'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                <Group fontSize="small" sx={{ mr: 1 }} />
                Capacity: {selectedEvent.capacity}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                <Category fontSize="small" sx={{ mr: 1 }} />
                Type: {selectedEvent.eventType}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                <AttachMoney fontSize="small" sx={{ mr: 1 }} />
                Price: ${selectedEvent.feeAmount || 0}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Registered Participants ({registeredUsers.length})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Registration Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registeredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'No date available'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseEventDialog}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'events':
        return renderEvents();
      case 'wallet':
        return renderWallet();
      case 'messages':
        return <MessagingPage />;
      case 'create-event':
        return <EventCreatePage embedded />; // centered, no background version when embedded
      case 'edit-event':
        return renderEditEvent();
      case 'view-event':
        return renderEvents();
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Event Organizer Dashboard
          </Typography>
          <Box sx={{ position: 'relative', ml: 2 }}>
            <Button
              variant="text"
              onClick={() => setShowUserMenu((v) => !v)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', p: 0, minWidth: 0 }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {organizerInitial}
              </Avatar>
              <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'primary.main', fontWeight: 600 }}>
                {organizerName}
              </Typography>
            </Button>
            {showUserMenu && (
              <Paper sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                mt: 1,
                minWidth: 120,
                boxShadow: 3,
                zIndex: 10,
                backgroundColor: theme.palette.background.paper
              }}>
                <Button
                  fullWidth
                  onClick={handleLogout}
                  sx={{ justifyContent: 'flex-start', px: 2, py: 1 }}
                >
                  Logout
                </Button>
              </Paper>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderContent()}
      </Box>

      {/* Event Details Dialog */}
      {renderViewEventDialog()}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirm Delete Event
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the event "{eventToDelete?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The event will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Success Dialog */}
      <Dialog
        open={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="success.main">
            Event Deleted Successfully
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            The event has been successfully deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteSuccess(false)} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Messages */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Event created successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showEditSuccess}
        autoHideDuration={6000}
        onClose={() => setShowEditSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowEditSuccess(false)}>
          Event updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventOrganizerDashboard; 