import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import GroupIcon from '@mui/icons-material/Group';
import CoachService from '../../service/CoachService';
import ModernCalendar from '../common/ModernCalendar';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import ClassSessionCreateForm from '../class/ClassSessionCreateForm';
import EditClassSessionDialog from '../class/EditClassSessionDialog';
// 移除删除按钮，不再需要 DeleteIcon
import ClassSessionService from '../../service/ClassSessionService';

// Query busy slots for a court on a specific day
const fetchBusySlots = async (courtId, date) => {
  if (!courtId || !date) return [];
  const res = await axios.get('/api/coach/available-times', {
    params: { courtId, date }
  });
  return Array.isArray(res.data) ? res.data : [];
};

// 獲取指定日期的可用時段
const getAvailableSlotsForDate = async (dateStr, courtId, courtsList) => {
  try {
    // 獲取球場的營業時間
    const court = courtsList.find(c => c.id === courtId);
    if (!court) {
      console.error('Court not found');
      return [];
    }

    // 解析營業時間
    const openingHour = court.openingTime ? parseInt(court.openingTime.split(':')[0]) : 8;
    const closingHour = court.closingTime ? parseInt(court.closingTime.split(':')[0]) : 22;
    
    console.log('Court operating hours:', openingHour, 'to', closingHour);

    // 獲取該日期的已預訂時段
    let bookedSlots = [];
    if (courtId && dateStr) {
      try {
        const response = await axios.get('/api/coach/available-times', {
          params: { courtId, date: dateStr }
        });
        bookedSlots = Array.isArray(response.data) ? response.data : [];
        console.log('Booked slots:', bookedSlots);
      } catch (error) {
        console.error('Failed to fetch booked slots:', error);
      }
    }

    // 生成所有時段
    const allSlots = [];
    for (let hour = openingHour; hour < closingHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const slotKey = `${startTime}-${endTime}`;
      
      // 檢查是否被預訂
      const isBooked = bookedSlots.some(bookedSlot => {
        const bookedStart = new Date(bookedSlot.start);
        const bookedEnd = new Date(bookedSlot.end);
        const slotStart = new Date(`${dateStr}T${startTime}:00`);
        const slotEnd = new Date(`${dateStr}T${endTime}:00`);
        
        // 檢查時間重疊
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      allSlots.push({
        time: slotKey,
        startTime: startTime,
        endTime: endTime,
        isBooked: isBooked
      });
    }

    console.log('Generated slots:', allSlots);
    return allSlots;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }
};

const CoachScheduleManagement = () => {
  const { hasRole, currentUser } = useAuth();
  const isCoach = hasRole('COACH') || currentUser?.userType === 'COACH' || currentUser?.userType === 'Coach';
  
  // 調試信息
  console.log('=== CoachScheduleManagement Debug ===');
  console.log('currentUser:', currentUser);
  console.log('hasRole("COACH"):', hasRole('COACH'));
  console.log('currentUser?.userType:', currentUser?.userType);
  console.log('isCoach:', isCoach);
  const [venues, setVenues] = useState([]);
  const [allVenues, setAllVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [allCourts, setAllCourts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busySlots, setBusySlots] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedDateForBusySlots, setSelectedDateForBusySlots] = useState(''); // 格式: 'YYYY-MM-DD'
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const sessionsPerPage = 3;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venueId: '',
    courtId: '',
    startTime: '',
    endTime: '',
    experienceYear: '',
    maxParticipants: 6,
    price: '',
    slotType: 'COACH_SESSION',
    date: '',
    availableSlots: [],
    selectedSlot: ''
  });

  // 測試用戶權限
  const testUserPermissions = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('=== JWT Token Analysis ===');
        console.log('Token payload:', payload);
        console.log('Role:', payload.role);
        console.log('UserType:', payload.userType);
        console.log('UserId:', payload.userId);
        console.log('Subject:', payload.sub);
      } catch (error) {
        console.error('Failed to parse JWT token:', error);
      }
    } else {
      console.log('No auth token found');
    }
  };

  // 在組件加載時測試權限
  useEffect(() => {
    testUserPermissions();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    
    if (isCoach) {
      // Coach view - load management data
      console.log('=== Loading coach data ===');
      console.log('isCoach:', isCoach);
      console.log('currentUser:', currentUser);
      
      Promise.all([
        CoachService.getDebugStatus().catch(err => {
          console.error('Debug status failed:', err);
          return { error: 'Debug status failed' };
        }),
        CoachService.getVenues().catch(err => {
          console.error('Venues failed:', err);
          return [];
        }),
        CoachService.getAllVenues().catch(async (err) => {
          console.error('All venues failed:', err);
          console.log('Trying fallback method for venues');
          return await fetchVenuesFallback();
        }),
        CoachService.getAvailableCourts().catch(err => {
          console.error('Available courts failed:', err);
          return [];
        }),
        CoachService.getAllCourts().catch(async (err) => {
          console.error('All courts failed:', err);
          console.log('Trying fallback method for courts');
          return await fetchCourtsFallback();
        }),
        CoachService.getTimeSlots().catch(err => {
          console.error('Time slots failed:', err);
          return [];
        }),
        fetchScheduleForMonth(currentDate).catch(err => {
          console.error('Schedule failed:', err);
          return [];
        })
      ])
        .then(([debugData, venuesData, allVenuesData, courtsData, allCourtsData, timeSlotsData, sessionsData]) => {
          console.log('Coach debug status:', debugData);
          setVenues(venuesData);
          setAllVenues(allVenuesData);
          setCourts(courtsData);
          setAllCourts(allCourtsData);
          setTimeSlots(timeSlotsData);
          setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        })
        .catch((err) => {
          console.error('Error loading coach data:', err);
          setError(`Failed to load data: ${err.message || err}`);
        })
        .finally(() => setLoading(false));
    } else {
      // User view - load available coaching sessions
      fetchAvailableCoachingSessions()
        .then((sessionsData) => {
          console.log('sessionsData:', sessionsData, Array.isArray(sessionsData));
          setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        })
        .catch((err) => {
          console.error('Error loading coaching sessions:', err);
          setError(`Failed to load coaching sessions: ${err.message || err}`);
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line
  }, [isCoach]);

  useEffect(() => {
    if (isCoach) {
      fetchScheduleForMonth(currentDate)
        .then((sessionsData) => setSessions(Array.isArray(sessionsData) ? sessionsData : []))
        .catch(() => setError('Failed to load schedule.'));
    }
    // eslint-disable-next-line
  }, [currentDate, isCoach]);

  useEffect(() => {
    if (selectedCourtId && selectedDateForBusySlots) {
      fetchBusySlots(selectedCourtId, selectedDateForBusySlots).then(setBusySlots);
    } else {
      setBusySlots([]);
    }
  }, [selectedCourtId, selectedDateForBusySlots]);

  const fetchScheduleForMonth = async (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    const data = await CoachService.getSchedule(start.toISOString(), end.toISOString());
    return Array.isArray(data) ? data : [];
  };

  const fetchAvailableCoachingSessions = async () => {
    try {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1); // Next month
      const sessions = await CoachService.getPublicSessions(start.toISOString(), end.toISOString());
      return sessions;
    } catch (error) {
      console.error('Error in fetchAvailableCoachingSessions:', error);
      // Return empty array if there's an error, so users can still see the page
      return [];
    }
  };

  // 備用的球場獲取方法
  const fetchCourtsFallback = async () => {
    try {
      console.log('Using fallback court fetching method');
      const response = await fetch('http://localhost:8081/api/courts');
      if (response.ok) {
        const courts = await response.json();
        console.log('Fallback courts:', courts);
        return courts;
      } else {
        console.error('Fallback court fetch failed:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Fallback court fetch error:', error);
      return [];
    }
  };

  // 備用的場地獲取方法
  const fetchVenuesFallback = async () => {
    try {
      console.log('Using fallback venue fetching method');
      const response = await fetch('http://localhost:8081/api/venues');
      if (response.ok) {
        const venues = await response.json();
        console.log('Fallback venues:', venues);
        return venues;
      } else {
        console.error('Fallback venue fetch failed:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Fallback venue fetch error:', error);
      return [];
    }
  };

  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    const weeks = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return { weeks, currentMonth: month, currentYear: year };
  };

  const { weeks, currentMonth, currentYear } = getCalendarData();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 當選擇場地時，更新球場選項
  const handleVenueChange = (venueId) => {
    setFormData(prev => ({ ...prev, venueId, courtId: '', date: '', availableSlots: [], selectedSlot: '' }));
    if (venueId) {
      CoachService.getCourtsByVenue(venueId)
        .then(courtsData => {
          setCourts(courtsData);
        })
        .catch(err => {
          console.error('Error loading courts for venue:', err);
        });
    } else {
      setCourts([]);
    }
  };

  // 當選擇開始時間時，自動設置結束時間
  const handleStartTimeChange = (startTime) => {
    if (startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 加1小時
      setFormData(prev => ({ 
        ...prev, 
        startTime, 
        endTime: end.toISOString().slice(0, 16) 
      }));
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!formData.title || formData.title.trim() === '') {
      setError('Title is required');
      return;
    }
    console.log('Create session payload:', formData);
    try {
      await CoachService.createSlot(formData);
      setMessage('Session created successfully!');
      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        venueId: '',
        courtId: '',
        startTime: '',
        endTime: '',
        experienceYear: '',
        maxParticipants: 6,
        price: '',
        slotType: 'COACH_SESSION',
        date: '',
        availableSlots: [],
        selectedSlot: ''
      });
      fetchScheduleForMonth(currentDate).then(setSessions);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Session creation failed'
      );
    }
  };

  // 在 filter 前加防呆
  const getSessionsForDate = (date) => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const thisMonthSessions = sessions.length;
  const thisMonthActive = sessions.filter(s => s.status === 'AVAILABLE' || s.status === 'BOOKED_BY_USER').length;
  const thisMonthRevenue = sessions.reduce((sum, s) => sum + (s.price || 0), 0);

  // recurringGroupId 分組計算
  const getTotalSessionsByGroup = (recurringGroupId) => {
    if (!recurringGroupId) return 1;
    return sessions.filter(s => s.recurringGroupId === recurringGroupId).length;
  };

  // 建立課程成功後自動刷新日曆與統計數據
  const handleClassSessionCreated = (newSessionDate) => {
    fetchScheduleForMonth(currentDate).then(setSessions);
    if (newSessionDate) {
      setSelectedDate(new Date(newSessionDate));
    }
    setMessage('Session created successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  // 編輯成功後刷新
  const handleEditSuccess = () => {
    fetchScheduleForMonth(currentDate).then(setSessions);
    setEditSession(null);
  };

  // Cancel class session
  const handleCancelSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this session?")) return;
    try {
      await ClassSessionService.cancelSession(sessionId);
      alert("Session cancelled successfully!");
      fetchScheduleForMonth(currentDate).then(setSessions);
    } catch (e) {
      const errorMessage = e?.response?.data?.error || e.message;
      if (errorMessage.includes('24 hours')) {
        if (window.confirm("Cannot cancel session within 24 hours of start time. Do you want to force cancel?")) {
          try {
            await ClassSessionService.cancelSession(sessionId, '', true);
            alert("Session force-cancelled successfully!");
            fetchScheduleForMonth(currentDate).then(setSessions);
          } catch (forceError) {
            alert("Force cancellation failed: " + (forceError?.response?.data?.error || forceError.message));
          }
        }
      } else {
        alert("Cancellation failed: " + errorMessage);
      }
    }
  };

  // 分頁處理函數
  const handleNextPage = () => {
    const maxPage = Math.ceil(sessions.length / sessionsPerPage) - 1;
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getCurrentPageSessions = () => {
    const startIndex = currentPage * sessionsPerPage;
    return sessions.slice(startIndex, startIndex + sessionsPerPage);
  };

  const totalPages = Math.ceil(sessions.length / sessionsPerPage);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {isCoach ? 'Coach Schedule Management' : 'Available Coaching Sessions'}
          </Typography>
          <Typography variant="subtitle1">
            {isCoach ? 'Manage your coaching sessions and availability' : 'Browse and book coaching sessions'}
          </Typography>
        </Grid>
        {isCoach && (
          <Grid item>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)} sx={{ boxShadow: 2 }}>
              Create Recurring Session
            </Button>
          </Grid>
        )}
      </Grid>
      <ClassSessionCreateForm open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} onSuccess={handleClassSessionCreated} />
      {/* Edit Dialog */}
      <EditClassSessionDialog open={!!editSession} session={editSession} onClose={() => setEditSession(null)} onSuccess={handleEditSuccess} />

      {loading && <Typography align="center" color="primary" sx={{ py: 4 }}>Loading...</Typography>}
      {error && <Typography align="center" color="error" sx={{ py: 2 }}>{error}</Typography>}

      {message && (
        <Box sx={{ position: 'fixed', top: 80, right: 40, zIndex: 9999, bgcolor: 'success.light', color: 'success.dark', p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Typography fontWeight="bold">{message}</Typography>
        </Box>
      )}

      {isCoach ? (
        // Coach view - show calendar and management features
        <Grid container spacing={3} justifyContent="center" alignItems="flex-start" sx={{ mt: 2 }}>
          {/* Calendar */}
          <Grid item xs={12} md={7} lg={8}>
            <ModernCalendar
              currentDate={currentDate}
              onPrevMonth={() => navigateMonth(-1)}
              onNextMonth={() => navigateMonth(1)}
              onDateClick={handleDateClick}
              getSessionsForDate={getSessionsForDate}
              selectedDate={selectedDate}
              maxWidth="650px"
            />
          </Grid>
          {/* Session Details and This Month */}
          <Grid item xs={12} md={5} lg={4}>
            {/* Session Details Panel */}
            <Card elevation={2} sx={{ p: 3, borderRadius: 3, minHeight: 300 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CalendarMonthIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Session Details</Typography>
              </Box>
              {selectedDate ? (
                <Box>
                  <Card elevation={0} sx={{ bgcolor: 'primary.light', p: 2, mb: 2, borderRadius: 2 }}>
                    <Typography fontWeight="bold" color="primary.dark">Selected Date</Typography>
                    <Typography color="primary.main">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </Typography>
                  </Card>
                  {getSessionsForDate(selectedDate).length > 0 ? (
                    <Box display="flex" flexDirection="column" gap={2}>
                      {getSessionsForDate(selectedDate).map((session, idx) => (
                        <Card key={session.id || idx} elevation={1} sx={{ p: 2, borderRadius: 2, borderLeft: 4, borderColor: session.status === 'AVAILABLE' ? 'success.main' : 'warning.main', bgcolor: session.status === 'AVAILABLE' ? 'success.lighter' : 'warning.lighter', cursor: 'pointer', position: 'relative' }}
                          onClick={() => setEditSession(session)}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography fontWeight="bold" color={session.status === 'AVAILABLE' ? 'success.dark' : 'warning.dark'}>{session.title || 'Session'}</Typography>
                            <Typography variant="caption" sx={{ bgcolor: session.status === 'AVAILABLE' ? 'success.light' : 'warning.light', color: session.status === 'AVAILABLE' ? 'success.dark' : 'warning.dark', px: 1, borderRadius: 1 }}>{session.status}</Typography>
                            {/* 移除删除按钮 - 教练不能删除课程 */}
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} color={session.status === 'AVAILABLE' ? 'success.main' : 'warning.main'}>
                            <AccessTimeIcon fontSize="small" />
                            <Typography variant="body2">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} color={session.status === 'AVAILABLE' ? 'success.main' : 'warning.main'}>
                            <PlaceIcon fontSize="small" />
                            <Typography variant="body2">{session.court?.name} - {venues.find(v => v.id === session.venueId)?.name || ''}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} color={session.status === 'AVAILABLE' ? 'success.main' : 'warning.main'}>
                            <GroupIcon fontSize="small" />
                            <Typography variant="body2">{session.currentParticipants || 0}/{session.maxParticipants} participants</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" mt={1}>{session.description}</Typography>
                          {/* 新增：右下角顯示 recurringGroupId 分組總堂數 */}
                          {session.recurringGroupId && (
                            <Box sx={{ position: 'absolute', right: 12, bottom: 8, color: 'primary.main', fontSize: 13 }}>
                              Total {getTotalSessionsByGroup(session.recurringGroupId)} sessions
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} color="text.disabled">
                      <CalendarMonthIcon fontSize="large" sx={{ opacity: 0.5 }} />
                      <Typography>No sessions scheduled for this date</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box textAlign="center" py={4} color="text.disabled">
                  <CalendarMonthIcon fontSize="large" sx={{ opacity: 0.5 }} />
                  <Typography>Select a date to view sessions</Typography>
                </Box>
              )}
            </Card>

            {/* Quick Stats */}
            <Card elevation={2} sx={{ p: 3, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>This Month</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Total Sessions</Typography>
                  <Typography fontWeight="bold" color="primary.main">{thisMonthSessions}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Active Bookings</Typography>
                  <Typography fontWeight="bold" color="success.main">{thisMonthActive}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">Revenue</Typography>
                  <Typography fontWeight="bold" color="secondary.main">${thisMonthRevenue}</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // User view - show available coaching sessions
        <Card elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" color="text.primary" gutterBottom>
            Available Coaching Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Browse and book coaching sessions with our experienced coaches.
          </Typography>
          
          {Array.isArray(sessions) && sessions.length > 0 ? (
            <>
              <Grid container spacing={3} justifyContent="center">
                {getCurrentPageSessions().map((session, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={session.id || idx}>
                    <Card elevation={2} sx={{ p: 3, borderRadius: 2, borderLeft: 4, borderColor: 'primary.main' }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {session.title || 'Coaching Session'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {session.description || 'Professional coaching session'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                        <AccessTimeIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                        <PlaceIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {session.court?.name} - {venues.find(v => v.id === session.venueId)?.name || 'Venue'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                        <GroupIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {session.currentParticipants || 0}/{session.maxParticipants} participants
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          ${session.price || 0}
                        </Typography>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small"
                          disabled={session.status !== 'AVAILABLE'}
                        >
                          {session.status === 'AVAILABLE' ? 'Book Now' : 'Full'}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* 分頁導航 */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ChevronLeftIcon />}
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    sx={{ borderRadius: 2 }}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ px: 2 }}>
                    Page {currentPage + 1} of {totalPages}
                  </Typography>
                  <Button
                    variant="outlined"
                    endIcon={<ChevronRightIcon />}
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    sx={{ borderRadius: 2 }}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <CalendarMonthIcon fontSize="large" sx={{ opacity: 0.5, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No coaching sessions available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new coaching sessions.
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Create Session Modal */}
      {isCoach && (
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(90deg, #2196f3 0%, #9c27b0 100%)', color: 'white' }}>Create Coaching Session</DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleCreateSession} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Session Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  multiline
                  rows={3}
                />
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Venue</InputLabel>
                <Select
                  name="venueId"
                  value={formData.venueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  label="Venue"
                >
                  <MenuItem value="">Select a venue</MenuItem>
                  {allVenues.map(venue => (
                    <MenuItem key={venue.id} value={venue.id}>{venue.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" required disabled={!formData.venueId}>
                <InputLabel>Court</InputLabel>
                <Select
                  name="courtId"
                  value={formData.courtId}
                  onChange={e => {
                    setFormData({ ...formData, courtId: e.target.value });
                    setSelectedCourtId(e.target.value);
                  }}
                  label="Court"
                >
                  <MenuItem value="">Select a court</MenuItem>
                  {courts.map(court => (
                    <MenuItem key={court.id} value={court.id}>{court.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date || ''}
                  onChange={async (e) => {
                    const dateStr = e.target.value;
                    setFormData({ ...formData, date: dateStr, startTime: '', endTime: '', selectedSlot: '' });
                    // 獲取該日期的可用時段
                    if (dateStr && formData.courtId) {
                    try {
                      const availableSlots = await getAvailableSlotsForDate(dateStr, formData.courtId, courts);
                      setFormData(prev => ({ ...prev, availableSlots }));
                    } catch (error) {
                      console.error('Failed to fetch available slots:', error);
                    }
                  }
                  }}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                
                {formData.date && formData.availableSlots && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <CalendarMonthIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Available Time Slots - {new Date(formData.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                    <Grid container spacing={1}>
                      {formData.availableSlots.map((slot, index) => {
                        const isSelected = formData.selectedSlot === slot.time;
                        const isAvailable = !slot.isBooked;
                        
                        return (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Button
                              fullWidth
                              variant={isSelected ? "contained" : "outlined"}
                              onClick={() => {
                                if (isAvailable) {
                                  const dateTime = `${formData.date}T${slot.startTime}:00`;
                                  setFormData({
                                    ...formData,
                                    selectedSlot: slot.time,
                                    startTime: dateTime
                                  });
                                }
                              }}
                              disabled={!isAvailable}
                              sx={{
                                py: 1.5,
                                borderRadius: '12px',
                                fontWeight: 600,
                                ...(isSelected ? {
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                                  }
                                } : {
                                  borderColor: isAvailable ? '#667eea' : '#ccc',
                                  color: isAvailable ? '#667eea' : '#999',
                                  '&:hover': isAvailable ? {
                                    borderColor: '#5a6fd8',
                                    backgroundColor: 'rgba(102, 126, 234, 0.05)'
                                  } : {}
                                }),
                                ...(!isAvailable && {
                                  backgroundColor: '#f5f5f5',
                                  opacity: 0.6,
                                  cursor: 'not-allowed'
                                })
                              }}
                            >
                              {slot.startTime}
                              {slot.isBooked && (
                                <Box component="span" sx={{ 
                                  fontSize: '0.7em', 
                                  display: 'block', 
                                  color: '#999',
                                  mt: 0.5 
                                }}>
                                  Booked
                                </Box>
                              )}
                            </Button>
                          </Grid>
                        );
                      })}
                    </Grid>
                    <Box sx={{ mt: 2, p: 1, bgcolor: '#e8f5e8', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        RM45-60/hour
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <TextField
                  label="Duration (hours)"
                  type="number"
                  value={formData.startTime && formData.endTime ? 
                    (new Date(formData.endTime) - new Date(formData.startTime)) / (1000 * 60 * 60) : 1}
                  onChange={(e) => {
                    const duration = parseFloat(e.target.value);
                    const startTime = formData.startTime || new Date().toISOString();
                    const endTime = new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000).toISOString();
                    setFormData({...formData, endTime});
                  }}
                  fullWidth
                  required
                  margin="normal"
                  inputProps={{ min: 0.5, max: 8, step: 0.5 }}
                />
                <TextField
                  label="Max Participants"
                  name="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  inputProps={{ min: 1, max: 20 }}
                />
                <TextField
                  label="Experience (Years)"
                  name="experienceYear"
                  type="number"
                  value={formData.experienceYear}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
                <TextField
                  label="Price ($)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  inputProps={{ step: 0.01 }}
                />
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Session Type</InputLabel>
                  <Select
                    name="slotType"
                    value={formData.slotType}
                    onChange={handleInputChange}
                    label="Session Type"
                  >
                    <MenuItem value="COACH_SESSION">Regular Session</MenuItem>
                    <MenuItem value="COACH_AVAILABILITY">Coach Availability</MenuItem>
                    <MenuItem value="PRIVATE">Private Lesson</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {message && (
              <Box mt={3} p={2} borderRadius={2} bgcolor="#e8f5e9" color="success.main" border={1} borderColor="success.light">
                {message}
              </Box>
            )}
            {error && (
              <Box mt={3} p={2} borderRadius={2} bgcolor="#ffebee" color="error.main" border={1} borderColor="error.light">
                {error}
              </Box>
            )}
            {busySlots.length > 0 && (
              <div style={{ color: 'red', marginTop: 8 }}>
                Booked time slots:
                <ul>
                  {busySlots.map((slot, idx) => (
                    <li key={idx}>
                      {slot.start} ~ {slot.end}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained" color="primary">Create Session</Button>
        </DialogActions>
      </Dialog>
      )}
    </Box>
  );
};

export default CoachScheduleManagement;
