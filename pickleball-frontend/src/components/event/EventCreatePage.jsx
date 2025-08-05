import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
  ListItemText,
  Stepper,
  Step,
  StepLabel
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
import CourtService from '../../service/CourtService';
import VenueService from '../../service/VenueService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const EventCreatePage = () => {
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
    price: '', // used for feeAmount
    status: 'PUBLISHED',
    sendNotification: true // 默認發送郵件通知
  });

  // Schedule builder state
  const [scheduleArray, setScheduleArray] = useState([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleActivity, setScheduleActivity] = useState('');

  const [courtIds, setCourtIds] = useState([]);
  const [courts, setCourts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [capacityError, setCapacityError] = useState('');
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [venueMaxCapacity, setVenueMaxCapacity] = useState(0);

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



  // 在組件內部
  const [bookedDates, setBookedDates] = useState([]);
  // 強化禁用邏輯：bookedDates 轉成 dayjs 字串陣列，shouldDisableDate 嚴格比對
  const bookedDateSet = useMemo(() => new Set(bookedDates.map(d => dayjs(d).format('YYYY-MM-DD'))), [bookedDates]);
  const today = useMemo(() => dayjs(), []);
  const minDate = useMemo(() => today.add(3, 'month'), [today]);
  // 1. Stepper 狀態
  const steps = ['Select State', 'Select Venue', 'Event Info', 'Confirm & Submit'];
  const [activeStep, setActiveStep] = useState(0);
  const [allStates, setAllStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [venuesByState, setVenuesByState] = useState([]);
  const [autoAssignedCourts, setAutoAssignedCourts] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const initialFormData = {
    title: '',
    eventType: '',
    date: '',
    time: '',
    endTime: '',
    capacity: '',
    price: '',
    schedule: '',
    description: '',
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setScheduleArray([]);
    setCourtIds([]);
    setVenueId('');
    setSelectedState('');
    setAutoAssignedCourts([]);
    setActiveStep(0);
  };

  // When state changes, clear venue selection
  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setVenueId('');
  };

  // 2. 取得所有 state
  useEffect(() => {
    VenueService.getAllVenues().then(data => {
      const states = Array.from(new Set(data.map(v => v.state).filter(Boolean)));
      setAllStates(states);
    });
  }, []);

  // 3. 依 state 取得 venue
  useEffect(() => {
    if (selectedState) {
      VenueService.getVenuesByState(selectedState).then(setVenuesByState);
    } else {
      setVenuesByState([]);
    }
  }, [selectedState]);

  // 4. 分步驟流程的下一步/上一步
  const handleNext = async () => {
    // 如果目前在 Event Info 步驟（activeStep === 2），直接跳到 Confirm & Submit 步驟（activeStep = 4）
    if (activeStep === 2) {
      setActiveStep(3);
      return;
    }
    setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => {
    setShowSuccess(false);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    // fetch all courts
    CourtService.getAllCourts().then(setCourts);
    VenueService.getAllVenues().then(setVenues);
  }, []);

  useEffect(() => {
    if (formData.capacity) {
      const cap = parseInt(formData.capacity, 10);
      const venuesOk = venues.filter(v =>
        courts.filter(c => c.venue && c.venue.id === v.id).length * 8 >= cap
      );
      setFilteredVenues(venuesOk);
      // 如果目前 venueId 不在可用 venue，清空 venueId/courtIds
      if (venueId && !venuesOk.some(v => v.id === venueId)) {
        setVenueId('');
        setCourtIds([]);
      }
    } else {
      setFilteredVenues(venues);
    }
  }, [formData.capacity, venues, courts]);

  useEffect(() => {
    if (venueId) {
      let filtered = courts.filter(c => c.venue && c.venue.id === Number(venueId));
      if (formData.capacity) {
        // 只顯示能湊到 capacity 的 court 組合
        const need = Math.ceil(parseInt(formData.capacity, 10) / 8);
        if (filtered.length < need) {
          setCapacityError('This venue does not have enough courts for your capacity. Please choose another venue.');
          setCourtIds([]);
        } else {
          setCapacityError('');
        }
        // 預設不自動選 court，讓 user 自己選
      } else {
        setCapacityError('');
      }
      setFilteredCourts(filtered);
      setCourtIds([]);
    } else {
      setFilteredCourts([]);
      setCourtIds([]);
      setCapacityError('');
    }
  }, [venueId, courts, formData.capacity]);

  useEffect(() => {
    if (formData.capacity && courtIds.length > 0) {
      const total = courtIds.length * 8;
      if (total < parseInt(formData.capacity, 10)) {
        setCapacityError('Selected courts cannot accommodate your capacity. Please select more courts or reduce capacity.');
      } else {
        setCapacityError('');
      }
    }
  }, [courtIds, formData.capacity]);

  // 當 venueId 改變時，計算最大容量
  useEffect(() => {
    if (venueId) {
      // 假設 courts 是所有 court 的陣列
      const courtsForVenue = courts.filter(c => c.venue && c.venue.id === Number(venueId));
      setVenueMaxCapacity(courtsForVenue.length * 8);
    } else {
      setVenueMaxCapacity(0);
    }
  }, [venueId, courts]);

  useEffect(() => {
    if (activeStep === 3 && courtIds.length > 0) {
      CourtService.getCourtsByIds(courtIds).then(setAutoAssignedCourts).catch(() => setAutoAssignedCourts([]));
    }
  }, [activeStep, courtIds]);

  useEffect(() => {
    if (venueId && selectedState) {
      // 傳 state 參數給後端（如後端支援）
      CourtService.getBookedDates(venueId, minDate.format('YYYY-MM-DD'), undefined, selectedState)
        .then(dates => {
          setBookedDates(dates);
        })
        .catch(() => setBookedDates([]));
    } else {
      setBookedDates([]);
    }
  }, [venueId, minDate, selectedState]);

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

  const handleCourtChange = (event) => {
    setCourtIds(event.target.value);
  };

  const handleVenueChange = (event) => {
    const selectedVenueId = Number(event.target.value);
    setVenueId(selectedVenueId);
    // 自動全選該場館下所有 court
    const courtsForVenue = courts.filter(c => c.venue && c.venue.id === selectedVenueId);
    setFilteredCourts(courtsForVenue);
    setCourtIds(courtsForVenue.map(c => c.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault?.();
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
        capacity: parseInt(formData.capacity, 10),
        schedule: JSON.stringify(scheduleArray),
        feeAmount: formData.price ? parseFloat(formData.price) : 0,
        status: formData.status || 'PUBLISHED',
        location: venuesByState.find(v => v.id === venueId)?.location || '', // 新增：從選中的 venue 獲取 location
        courtIds: courtIds,
        venueId: venueId || null,
        sendNotification: formData.sendNotification
      };
      await EventService.createEvent(eventData);
      setShowSuccess(true); // 顯示成功訊息
      // 不要自動跳頁
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
  const isEventOrganizer = currentUser?.role === 'EVENTORGANIZER' || 
                          currentUser?.role === 'EventOrganizer' || 
                          currentUser?.userType === 'EventOrganizer';
  
  if (!isEventOrganizer) {
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

  // 在 return 最前面加 fallback，避免 activeStep 不在 0~3 時出現空白
  if (activeStep < 0 || activeStep > 3) {
    return <div style={{textAlign: 'center', marginTop: 80, color: '#667eea', fontSize: 24}}>Step error, please refresh or contact admin.</div>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}>
        <Container maxWidth="md">
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          <Paper elevation={24} sx={{ p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.95)' }}>
            {showSuccess ? (
              <Box textAlign="center" py={6}>
                <Typography variant="h5" color="success.main" gutterBottom>
                  Event created successfully!
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your event has been created and is now live.
                </Typography>
                {formData.sendNotification && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    📧 Email notifications have been sent to all registered users.
                  </Alert>
                )}
                <Button variant="contained" color="primary" onClick={() => navigate('/events')}>
                  Go to Event List
                </Button>
              </Box>
            ) : (
              <>
                {activeStep === 0 && (
                  <FormControl fullWidth>
                    <InputLabel>Select State</InputLabel>
                    <Select value={selectedState} onChange={handleStateChange} label="Select State">
                      {allStates.map(state => <MenuItem key={state} value={state}>{state}</MenuItem>)}
                    </Select>
                    <Box mt={2}><Button variant="contained" onClick={handleNext} disabled={!selectedState}>Next</Button></Box>
                  </FormControl>
                )}
                {activeStep === 1 && (
                  <FormControl fullWidth disabled={!selectedState}>
                    <InputLabel>Select Venue</InputLabel>
                    <Select value={venueId} onChange={e => setVenueId(e.target.value)} label="Select Venue">
                      {venuesByState.map(venue => <MenuItem key={venue.id} value={venue.id}>{venue.name}</MenuItem>)}
                    </Select>
                    <Box mt={2} display="flex" gap={2}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button variant="contained" onClick={handleNext} disabled={!venueId}>Next</Button>
                    </Box>
                  </FormControl>
                )}
                {activeStep === 2 && (
                  <Box component="form" noValidate autoComplete="off">
                    {/* 保留原本所有活動欄位（活動名稱、類型、價格、資格、賽程、說明、日期、時間、容量等） */}
                    <TextField label="Event Name" fullWidth value={formData.title} onChange={handleInputChange('title')} sx={{ mb: 2 }} />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Type</InputLabel>
                      <Select value={formData.eventType} onChange={handleInputChange('eventType')} label="Type">
                        {categories.map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField label="Price" type="number" fullWidth value={formData.price} onChange={handleInputChange('price')} sx={{ mb: 2 }} />
                    {/* 賽程、說明、日期、時間、容量等欄位照原本保留 */}
                    <Box sx={{ mb: 2 }}>
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
                    </Box>
                    <TextField label="Description" fullWidth value={formData.description} onChange={handleInputChange('description')} sx={{ mb: 2 }} />
                    <DatePicker
                      label="Date"
                      value={formData.date ? dayjs(formData.date) : null}
                      onChange={date => setFormData({ ...formData, date: date ? date.format('YYYY-MM-DD') : '' })}
                      minDate={minDate}
                      shouldDisableDate={date => {
                        const formatted = date.format('YYYY-MM-DD');
                        // console.log('Checking date:', formatted, 'booked:', bookedDateSet);
                        return bookedDateSet.has(formatted);
                      }}
                      renderInput={params => (
                        <TextField {...params} fullWidth sx={{ mb: 2 }} />
                      )}
                    />
                    <TextField label="Start Time" type="time" fullWidth value={formData.time} onChange={handleInputChange('time')} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    <TextField label="End Time" type="time" fullWidth value={formData.endTime} onChange={handleInputChange('endTime')} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    {venueId && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Alert severity="info">
                          This venue can accommodate up to <b>{venueMaxCapacity}</b> people.
                        </Alert>
                      </Box>
                    )}
                    <TextField
                      label="Capacity"
                      type="number"
                      fullWidth
                      value={formData.capacity}
                      onChange={e => {
                        let value = Number(e.target.value);
                        if (value > venueMaxCapacity) value = venueMaxCapacity;
                        if (value < 1) value = 1;
                        setFormData({ ...formData, capacity: value });
                      }}
                      sx={{ mb: 2 }}
                      inputProps={{ min: 1, max: venueMaxCapacity }}
                      error={formData.capacity > venueMaxCapacity}
                      helperText={
                        formData.capacity > venueMaxCapacity
                          ? `The maximum capacity for this venue is ${venueMaxCapacity}.`
                          : ''
                      }
                      disabled={venueMaxCapacity === 0}
                    />
                    <Box mt={2} display="flex" gap={2}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button variant="contained" onClick={handleNext} disabled={!(formData.title && formData.eventType && formData.date && formData.time && formData.endTime && formData.capacity && formData.capacity <= venueMaxCapacity && venueMaxCapacity > 0)}>Next</Button>
                    </Box>
                  </Box>
                )}
                {activeStep === 3 && (
                  <Box>
                    <Typography variant="h6">Please confirm event information:</Typography>
                    <ul>
                      <li>State: {venuesByState.find(v => v.id === venueId)?.state}</li>
                      <li>Venue: {venuesByState.find(v => v.id === venueId)?.name}</li>
                      <li>Location: {venuesByState.find(v => v.id === venueId)?.location}</li>
                      <li>Event Name: {formData.title}</li>
                      <li>Type: {formData.eventType}</li>
                      <li>Price: {formData.price}</li>
                      <li>Schedule: {JSON.stringify(scheduleArray)}</li>
                      <li>Description: {formData.description}</li>
                      <li>Date: {formData.date}</li>
                      <li>Time: {formData.time} ~ {formData.endTime}</li>
                      <li>Capacity: {formData.capacity}</li>
                      <li>Assigned Courts: {autoAssignedCourts.map(c => c.name).join(', ')}</li>
                    </ul>
                    
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.sendNotification !== false}
                            onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            📧 Send email notification to all users about this new event
                          </Typography>
                        }
                      />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        When enabled, all registered users will receive an email notification about this new event.
                      </Typography>
                    </Box>
                    
                    <Box mt={2} display="flex" gap={2}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button variant="contained" color="success" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Creating Event...' : 'Submit'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default EventCreatePage;
