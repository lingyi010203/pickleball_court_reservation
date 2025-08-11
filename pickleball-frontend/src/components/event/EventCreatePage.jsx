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
  Error,
  Schedule,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EventService from '../../service/EventService';
import CourtService from '../../service/CourtService';
import VenueService from '../../service/VenueService';
import EventOrganizerService from '../../service/EventOrganizerService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const EventCreatePage = ({ embedded = false }) => {
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

  // 新增：time slot相關state
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState({ start: null, end: null });

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
  const bookedDateSet = useMemo(() => {
    const set = new Set(bookedDates.map(d => dayjs(d).format('YYYY-MM-DD')));
    console.log('BookedDateSet updated:', Array.from(set), 'from bookedDates:', bookedDates);
    return set;
  }, [bookedDates]);
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

  // 新增：獲取可用時段
  const fetchAvailableSlots = async (date) => {
    if (!venueId || !date) return;
    
    try {
      setLoadingSlots(true);
      console.log('=== fetchAvailableSlots ===');
      console.log('Venue ID:', venueId, 'Date:', date);

      // 使用新的EventOrganizerService獲取該venue下所有court的可用時段
      const venueSlots = await EventOrganizerService.getVenueAvailableSlots(venueId, date);
      console.log('Venue available slots:', venueSlots);
      
      // 過濾出指定日期的可用時段
      let filtered = venueSlots.filter(slot => slot.date === date);
      
      // 如果是今天，過濾掉2小時內的時段
      if (dayjs(date).isSame(dayjs(), 'day')) {
        const nowPlus2h = dayjs().add(2, 'hour');
        filtered = filtered.filter(slot => {
          const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
          return slotDateTime.isAfter(nowPlus2h);
        });
      }
      
      console.log('Final filtered slots:', filtered);
      setAvailableSlots(filtered);
      setAllSlots(venueSlots);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      setError('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // 新增：檢查時間段是否在選中範圍內
  const isTimeSlotInRange = (slotTime) => {
    if (selectedTimeRange.start === null || selectedTimeRange.end === null) {
      return false;
    }
    return slotTime >= selectedTimeRange.start && slotTime <= selectedTimeRange.end;
  };

  // 新增：渲染time slots
  const renderTimeSlots = () => {
    if (!formData.date || !venueId) return null;

    const venueCourts = courts.filter(c => c.venue && c.venue.id === Number(venueId));
    if (venueCourts.length === 0) return null;

    // 使用第一個court的營業時間作為參考
    const court = venueCourts[0];
    
    // 獲取營業時間範圍
    const getHourRange = () => {
      let open = 8, close = 22;
      if (court && court.openingTime && court.closingTime) {
        open = parseInt(court.openingTime.split(':')[0], 10);
        close = parseInt(court.closingTime.split(':')[0], 10);
        if (isNaN(open)) open = 8;
        if (isNaN(close)) close = 22;
      }
      return { open, close };
    };

    const { open, close } = getHourRange();
    const hourSlots = [];
    for (let h = open; h < close; h++) {
      const start = (h < 10 ? '0' : '') + h + ':00';
      const end = (h + 1 < 10 ? '0' : '') + (h + 1) + ':00';
      hourSlots.push({ start, end });
    }

    console.log('Available slots for rendering:', availableSlots);
    // 修正：確保使用正確的字段名稱和格式
    const availableSlotSet = new Set(availableSlots.map(s => {
      const startTime = typeof s.startTime === 'string' ? s.startTime : s.startTime;
      const endTime = typeof s.endTime === 'string' ? s.endTime : s.endTime;
      return startTime + '-' + endTime;
    }));
    console.log('Available slot set:', Array.from(availableSlotSet));

    // 新增：處理時間段選擇（移到函數內部）
    const handleTimeSlotClick = (clickedSlot) => {
      if (!availableSlotSet.has(clickedSlot.start + '-' + clickedSlot.end)) {
        return; // 如果時段不可用，不處理
      }

      const clickedTime = clickedSlot.start;
      
      // 如果沒有選中的時間範圍，開始新的選擇
      if (selectedTimeRange.start === null) {
        setSelectedTimeRange({ start: clickedTime, end: clickedTime });
        setFormData({
          ...formData,
          time: clickedTime,
          endTime: clickedSlot.end
        });
        return;
      }

      // 如果點擊的是已經選中的單個時間段，清除選擇
      if (clickedTime === selectedTimeRange.start && selectedTimeRange.start === selectedTimeRange.end) {
        setSelectedTimeRange({ start: null, end: null });
        setFormData({
          ...formData,
          time: '',
          endTime: ''
        });
        return;
      }

      // 確定新的時間範圍
      let newStart, newEnd;
      
      if (clickedTime < selectedTimeRange.start) {
        // 點擊的時間早於當前開始時間，擴展到左邊
        newStart = clickedTime;
        newEnd = selectedTimeRange.end;
      } else if (clickedTime > selectedTimeRange.end) {
        // 點擊的時間晚於當前結束時間，擴展到右邊
        newStart = selectedTimeRange.start;
        newEnd = clickedTime;
      } else {
        // 點擊的時間在當前範圍內，調整為從開始到點擊時間
        newStart = selectedTimeRange.start;
        newEnd = clickedTime;
      }

      // 檢查範圍內的所有時間段是否都可用
      const rangeSlots = hourSlots.filter(slot => 
        slot.start >= newStart && slot.start <= newEnd
      );
      
      const allAvailable = rangeSlots.every(slot => 
        availableSlotSet.has(slot.start + '-' + slot.end)
      );

      if (allAvailable) {
        setSelectedTimeRange({ start: newStart, end: newEnd });
        
        // 找到結束時間對應的slot
        const endSlot = hourSlots.find(slot => slot.start === newEnd);
        const endTime = endSlot ? endSlot.end : newEnd;
        
        setFormData({
          ...formData,
          time: newStart,
          endTime: endTime
        });
      }
    };

    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" fontWeight="bold">
              Available Time Slots - {dayjs(formData.date).format('dddd, MMMM D, YYYY')}
            </Typography>
            {selectedTimeRange.start && (
              <Typography variant="body2" color="primary" sx={{ ml: 2 }}>
                Selected: {selectedTimeRange.start} - {selectedTimeRange.end}
              </Typography>
            )}
          </Box>

          {loadingSlots ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {hourSlots.length > 0 ? (
                hourSlots.map((slot, idx) => {
                  const key = slot.start + '-' + slot.end;
                  const isAvailable = availableSlotSet.has(key);
                  const isInRange = isTimeSlotInRange(slot.start);
                  const isSelected = formData.time === slot.start;
                  
                  return (
                    <Grid item xs={4} sm={3} md={2} key={key}>
                      <Button
                        fullWidth
                        variant={isInRange ? "contained" : "outlined"}
                        onClick={() => handleTimeSlotClick(slot)}
                        disabled={!isAvailable}
                        sx={{
                          py: 1.5,
                          borderRadius: '12px',
                          fontWeight: 600,
                          ...(isInRange ? {
                            background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                            color: 'white',
                            boxShadow: '0 4px 8px rgba(37, 117, 252, 0.3)'
                          } : {}),
                          ...(!isAvailable ? {
                            borderColor: '#aaa',
                            color: '#aaa',
                            background: '#f5f5f5',
                            opacity: 0.7
                          } : {})
                        }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {slot.start}
                          </Typography>
                          {!isAvailable && (
                            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                              BOOKED
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <Schedule sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      No available time slots for this date
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>
    );
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
      // 使用EventOrganizerService獲取已預訂日期
      EventOrganizerService.getVenueBookedDates(venueId, minDate.format('YYYY-MM-DD'), undefined, selectedState)
        .then(dates => {
          console.log('Booked dates received:', dates); // Debug log
          setBookedDates(dates);
        })
        .catch((error) => {
          console.error('Error fetching booked dates:', error);
          setBookedDates([]);
        });
    } else {
      setBookedDates([]);
    }
  }, [venueId, minDate, selectedState]);

  // 新增：當日期改變時獲取可用時段
  useEffect(() => {
    if (formData.date && venueId) {
      // 重置時間範圍選擇
      setSelectedTimeRange({ start: null, end: null });
      
      // 調試：檢查slot數據
      EventOrganizerService.debugSlots(venueId, formData.date)
        .then(debugInfo => {
          console.log('=== DEBUG SLOTS INFO ===');
          console.log(debugInfo);
          console.log('=== END DEBUG ===');
          
          // 檢查是否需要生成slots
          const needsSlots = debugInfo.courts.some(court => court.totalSlots === 0);
          if (needsSlots) {
            console.log('No slots found for this date, generating slots...');
            return EventOrganizerService.generateSlots(venueId, formData.date);
          }
        })
        .then(generateResult => {
          if (generateResult) {
            console.log('Slots generated:', generateResult);
            // 重新獲取可用時段
            fetchAvailableSlots(formData.date);
          } else {
            // 直接獲取可用時段
            fetchAvailableSlots(formData.date);
          }
        })
        .catch(error => {
          console.error('Debug/generate slots error:', error);
          // 即使出錯也嘗試獲取可用時段
          fetchAvailableSlots(formData.date);
        });
    }
  }, [formData.date, venueId]);

  // Check if selected date is booked
  const isSelectedDateBooked = useMemo(() => {
    if (!formData.date || bookedDates.length === 0) return false;
    return bookedDateSet.has(formData.date);
  }, [formData.date, bookedDateSet]);

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
    
    try {
      const eventData = {
        title: formData.title,
        startTime: `${formData.date}T${formData.time}`,
        endTime: `${formData.date}T${formData.endTime}`,
        eventType: formData.eventType,
        capacity: parseInt(formData.capacity, 10),
        schedule: JSON.stringify(scheduleArray),
        feeAmount: formData.price ? parseFloat(formData.price) : 0, // 參與者付費金額
        status: formData.status || 'PUBLISHED',
        location: venuesByState.find(v => v.id === venueId)?.location || '',
        courtIds: courtIds,
        venueId: venueId || null,
        sendNotification: formData.sendNotification
      };
      
      await EventService.createEvent(eventData);
      setShowSuccess(true);
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
                          currentUser?.userType === 'EventOrganizer' ||
                          currentUser?.userType === 'EVENTORGANIZER';
  
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
              onClick={() => navigate('/event-organizer')}
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
      <Box sx={{ 
        minHeight: embedded ? 'auto' : '100vh', 
        background: embedded ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        py: embedded ? 0 : 4,
        display: 'flex',
        justifyContent: embedded ? 'center' : 'flex-end'
      }}>
        <Container maxWidth={embedded ? 'md' : 'sm'} sx={{ mx: embedded ? 'auto' : 'initial', ml: embedded ? 'auto' : 'auto', mr: embedded ? 'auto' : { xs: 0, md: 4 } }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          <Paper elevation={embedded ? 6 : 20} sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.95)' }}>
            {/* Back to Event Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/event-organizer')}
                startIcon={<ArrowBack />}
                sx={{
                  color: '#667eea',
                  borderColor: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.04)'
                  }
                }}
              >
                Back to Event
              </Button>
            </Box>
            {showSuccess ? (
              <Box textAlign="center" py={6}>
                <Typography variant="h5" color="success.main" gutterBottom>
                  Event created successfully!
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your event has been created and is now live. Participants will pay the registration fee when they sign up.
                </Typography>
                {formData.sendNotification && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    📧 Email notifications have been sent to all registered users.
                  </Alert>
                )}
                <Button variant="contained" color="primary" onClick={() => navigate('/event-organizer')}>
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
                    <TextField label="Participant Registration Fee ($)" type="number" fullWidth value={formData.price} onChange={handleInputChange('price')} sx={{ mb: 2 }} />
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
                      onChange={date => {
                        const newDate = date ? date.format('YYYY-MM-DD') : '';
                        console.log('Date selected:', newDate, 'Booked dates:', bookedDateSet);
                        setFormData({ ...formData, date: newDate, time: '', endTime: '' });
                      }}
                      minDate={minDate}
                      shouldDisableDate={date => {
                        const formatted = date.format('YYYY-MM-DD');
                        const isBooked = bookedDateSet.has(formatted);
                        console.log('Checking date:', formatted, 'isBooked:', isBooked, 'bookedDateSet:', Array.from(bookedDateSet));
                        return isBooked;
                      }}
                      renderInput={params => (
                        <TextField {...params} fullWidth sx={{ mb: 2 }} />
                      )}
                    />
                    
                    {/* 新增：顯示time slots */}
                    {renderTimeSlots()}
                    
                    <TextField label="Start Time" type="time" fullWidth value={formData.time} onChange={handleInputChange('time')} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    <TextField label="End Time" type="time" fullWidth value={formData.endTime} onChange={handleInputChange('endTime')} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
                    {venueId && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Alert severity="info">
                          This venue can accommodate up to <b>{venueMaxCapacity}</b> people.
                        </Alert>
                      </Box>
                    )}
                    
                    {isSelectedDateBooked && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Alert severity="error">
                          ⚠️ This date is already booked for this venue. Please select a different date.
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
                      <Button 
                        variant="contained" 
                        onClick={handleNext} 
                        disabled={
                          !(formData.title && formData.eventType && formData.date && formData.time && formData.endTime && formData.capacity && formData.capacity <= venueMaxCapacity && venueMaxCapacity > 0) ||
                          isSelectedDateBooked
                        }
                      >
                        Next
                      </Button>
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
                      <li>Participant Fee: ${formData.price || 0}</li>
                      <li>Schedule: {JSON.stringify(scheduleArray)}</li>
                      <li>Description: {formData.description}</li>
                      <li>Date: {formData.date}</li>
                      <li>Time: {formData.time} ~ {formData.endTime}</li>
                      <li>Capacity: {formData.capacity}</li>
                      <li>Assigned Courts: {autoAssignedCourts.map(c => c.name).join(', ')}</li>
                    </ul>
                    
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        💡 Payment Model: You create events for free. Participants pay the registration fee when they sign up.
                      </Typography>
                      
                      {formData.price > 0 && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            📊 Revenue Breakdown (per participant):
                          </Typography>
                          <Typography variant="body2">
                            • Participant pays: ${formData.price}
                          </Typography>
                          <Typography variant="body2">
                            • Platform fee: ${(formData.price * 0.1).toFixed(2)} (10% of ${formData.price})
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            • You receive: ${(formData.price - (formData.price * 0.1)).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
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
