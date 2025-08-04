import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import {
  FilterList,
  Person,
  Schedule,
  LocationOn,
  CalendarToday,
  AccessTime,
  Star,
  Close,
  Message
} from '@mui/icons-material';
import ClassSessionService from '../../service/ClassSessionService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Mock data (English)
const mockCoaches = [
  {
    id: 1,
    name: 'Coach Lee',
    state: 'Taipei',
    venue: 'Gym A',
    rating: 4.8,
    specialties: ['Strength', 'Cardio', 'Yoga'],
    avatar: 'CL',
    sessions: [
      { id: 1, date: '2025-07-26', time: '09:00-10:00', type: 'Personal Training', price: 1500 },
      { id: 2, date: '2025-07-26', time: '14:00-15:00', type: 'Group Class', price: 800 },
      { id: 3, date: '2025-07-27', time: '10:00-11:00', type: 'Personal Training', price: 1500 },
    ]
  },
  {
    id: 2,
    name: 'Coach Wang',
    state: 'Taipei',
    venue: 'Gym B',
    rating: 4.6,
    specialties: ['Boxing', 'Core Training'],
    avatar: 'CW',
    sessions: [
      { id: 4, date: '2025-07-26', time: '11:00-12:00', type: 'Boxing Training', price: 1200 },
      { id: 5, date: '2025-07-27', time: '15:00-16:00', type: 'Core Training', price: 1000 },
    ]
  },
  {
    id: 3,
    name: 'Coach Chang',
    state: 'New Taipei',
    venue: 'Gym C',
    rating: 4.9,
    specialties: ['Pilates', 'Stretching'],
    avatar: 'CC',
    sessions: [
      { id: 6, date: '2025-07-26', time: '16:00-17:00', type: 'Pilates', price: 1300 },
      { id: 7, date: '2025-07-28', time: '09:00-10:00', type: 'Stretching Class', price: 900 },
    ]
  },
  {
    id: 4,
    name: 'Coach Chen',
    state: 'Taichung',
    venue: 'Gym D',
    rating: 4.7,
    specialties: ['CrossFit', 'Functional Training'],
    avatar: 'CC',
    sessions: [
      { id: 8, date: '2025-07-27', time: '08:00-09:00', type: 'CrossFit', price: 1400 },
      { id: 9, date: '2025-07-28', time: '18:00-19:00', type: 'Functional Training', price: 1100 },
    ]
  }
];

const states = ['All', 'Taipei', 'New Taipei', 'Taichung', 'Kaohsiung'];
const venues = ['All', 'Gym A', 'Gym B', 'Gym C', 'Gym D'];

export default function BrowseClassPage() {
  const [tabValue, setTabValue] = useState(0);
  const [stateFilter, setStateFilter] = useState('All');
  const [venueFilter, setVenueFilter] = useState('All');
  const [coachFilter, setCoachFilter] = useState('All');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [timeOfDayFilter, setTimeOfDayFilter] = useState('All');
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState('All');
  const [showFullCourses, setShowFullCourses] = useState(true); // 新增：是否顯示已滿課程
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [expandedGroups, setExpandedGroups] = useState([]); // <-- move here
  const [selectedSessionGroup, setSelectedSessionGroup] = useState([]); // for group booking
  const [coaches, setCoaches] = useState(mockCoaches); // 新增：存儲教練數據，初始值為 mock 數據
  const [loadingCoaches, setLoadingCoaches] = useState(false); // 新增：教練數據加載狀態
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 獲取教練數據
  useEffect(() => {
    const fetchCoaches = async () => {
      console.log('=== Fetching coaches ===');
      setLoadingCoaches(true);
      try {
        console.log('Making API call to: http://localhost:8081/api/class-sessions/coaches');
        
        // 添加認證頭
        const token = localStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('http://localhost:8081/api/class-sessions/coaches', {
          method: 'GET',
          headers: headers
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error('Failed to fetch coaches: ' + response.status);
        }
        
        const data = await response.json();
        console.log('Raw API response:', data);
        
        // 確保數據是數組格式
        if (Array.isArray(data)) {
          console.log('Data is array, length:', data.length);
          // 轉換後端數據格式為前端需要的格式
          const formattedCoaches = data.map(coach => ({
            id: coach.id,
            name: coach.name,
            state: coach.state || 'Unknown',
            venue: coach.venue || 'Unknown',
            rating: coach.rating || 4.5,
            specialties: coach.specialties || ['Pickleball', 'Training'],
            avatar: coach.avatar || coach.name.substring(0, 2).toUpperCase(),
            sessionsCount: coach.sessionsCount || 0,
            sessions: [] // 暫時為空，可以後續添加
          }));
          console.log('Formatted coaches:', formattedCoaches);
          setCoaches(formattedCoaches);
        } else {
          console.error('Invalid coaches data format:', data);
          console.log('Using mock data as fallback');
          setCoaches(mockCoaches);
        }
      } catch (error) {
        console.error('Error fetching coaches:', error);
        console.log('Using mock data as fallback due to error');
        // 如果 API 失敗，使用 mock 數據作為備用
        setCoaches(mockCoaches);
      } finally {
        setLoadingCoaches(false);
        console.log('=== Finished fetching coaches ===');
      }
    };

    fetchCoaches();
  }, []);

  // 篩選教練
  const filteredCoaches = useMemo(() => {
    return coaches.filter(coach => {
      const stateMatch = stateFilter === 'All' || coach.state === stateFilter;
      const venueMatch = venueFilter === 'All' || coach.venue === venueFilter;
      return stateMatch && venueMatch;
    });
  }, [coaches, stateFilter, venueFilter]);

  // 篩選課程
  const filteredSessions = useMemo(() => {
    console.log('=== Filtering sessions ===');
    console.log('Current filters:', {
      stateFilter,
      venueFilter,
      coachFilter,
      sessionTypeFilter,
      priceRangeFilter,
      timeOfDayFilter,
      dayOfWeekFilter,
      showFullCourses
    });
    console.log('All sessions:', allSessions);
    
    return allSessions.filter(session => {
      console.log(`Filtering session ${session.id}: status=${session.status}, showFullCourses=${showFullCourses}`);
      
      // 狀態篩選：如果不顯示已滿課程，則過濾掉 FULL 狀態
      if (!showFullCourses && session.status === 'FULL') {
        console.log(`Session ${session.id} filtered out: FULL status and showFullCourses=false`);
        return false;
      }
      
      // 基本篩選
      const stateMatch = stateFilter === 'All' || session.state === stateFilter;
      const venueMatch = venueFilter === 'All' || session.venue === venueFilter;
      const coachMatch = coachFilter === 'All' || session.coachName === coachFilter;
      const sessionTypeMatch = sessionTypeFilter === 'All' || session.type === sessionTypeFilter;
      
      console.log(`Session ${session.id} filters:`, {
        state: session.state,
        venue: session.venue,
        coachName: session.coachName,
        type: session.type,
        stateMatch,
        venueMatch,
        coachMatch,
        sessionTypeMatch
      });
      
      // 價格篩選
      let priceMatch = true;
      if (priceRangeFilter !== 'All') {
        const price = session.price || 0;
        switch (priceRangeFilter) {
          case 'Under 100':
            priceMatch = price < 100;
            break;
          case '100-500':
            priceMatch = price >= 100 && price <= 500;
            break;
          case '500-1000':
            priceMatch = price >= 500 && price <= 1000;
            break;
          case 'Over 1000':
            priceMatch = price > 1000;
            break;
        }
        console.log(`Session ${session.id} price: ${price}, priceMatch: ${priceMatch}`);
      }
      
      // 時間篩選
      let timeMatch = true;
      if (timeOfDayFilter !== 'All') {
        try {
          // 嘗試從不同的時間字段獲取時間
          const timeString = session.time || session.startTime || '';
          if (timeString) {
            const timeParts = timeString.split('-')[0]; // 取開始時間
            const [hours, minutes] = timeParts.split(':').map(Number);
            const hour = hours;
            
            switch (timeOfDayFilter) {
              case 'Morning':
                timeMatch = hour >= 6 && hour < 12;
                break;
              case 'Afternoon':
                timeMatch = hour >= 12 && hour < 18;
                break;
              case 'Evening':
                timeMatch = hour >= 18 || hour < 6;
                break;
            }
            console.log(`Session ${session.id} time: ${timeString}, hour: ${hour}, timeMatch: ${timeMatch}`);
          }
        } catch (error) {
          console.error(`Error parsing time for session ${session.id}:`, error);
          timeMatch = false;
        }
      }
      
      // 星期篩選
      let dayMatch = true;
      if (dayOfWeekFilter !== 'All') {
        try {
          const dateString = session.date || session.startTime || '';
          if (dateString) {
            const date = new Date(dateString);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            dayMatch = dayOfWeek === dayOfWeekFilter;
            console.log(`Session ${session.id} date: ${dateString}, dayOfWeek: ${dayOfWeek}, dayMatch: ${dayMatch}`);
          }
        } catch (error) {
          console.error(`Error parsing date for session ${session.id}:`, error);
          dayMatch = false;
        }
      }
      
      const finalMatch = stateMatch && venueMatch && coachMatch && sessionTypeMatch && priceMatch && timeMatch && dayMatch;
      console.log(`Session ${session.id} final match: ${finalMatch}`);
      
      return finalMatch;
    });
  }, [allSessions, stateFilter, venueFilter, coachFilter, sessionTypeFilter, priceRangeFilter, timeOfDayFilter, dayOfWeekFilter]);

  // Fetch all available sessions from backend when tabValue is 1
  useEffect(() => {
    if (tabValue === 1) {
    const fetchSessions = async () => {
        setLoadingSessions(true);
        setSessionError('');
      try {
        const start = new Date();
        const end = new Date();
          end.setFullYear(end.getFullYear() + 1); // 查詢一年內
          
        // 檢查 JWT token
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('JWT payload:', payload);
            console.log('JWT userId:', payload.userId);
            console.log('JWT sub:', payload.sub);
          } catch (e) {
            console.log('Error parsing JWT:', e);
          }
        }
        
          const data = await ClassSessionService.getAllAvailableSessions(start.toISOString(), end.toISOString());
        console.log('=== DEBUG START ===');
        console.log('Raw API data:', data); // 調試日誌
        console.log('Current user:', currentUser); // 調試 currentUser
        console.log('Current user ID:', currentUser?.id, 'Type:', typeof currentUser?.id); // 調試用戶ID
        
        // 檢查是否有任何 session 包含 registrations
        if (Array.isArray(data)) {
          console.log('Total sessions found:', data.length);
          data.forEach(s => {
            if (s.registrations && s.registrations.length > 0) {
              console.log(`Session ${s.id} has ${s.registrations.length} registrations:`, s.registrations);
              s.registrations.forEach(r => {
                console.log(`  - Registration ${r.registrationId} for user ${r.userId} (${r.memberName})`);
              });
            } else {
              console.log(`Session ${s.id} has no registrations`);
            }
          });
        }
        console.log('=== DEBUG END ===');
        
          // Map backend data to session card format
        setAllSessions(Array.isArray(data) ? data.map(s => {
          const mappedSession = {
            id: s.id,
            recurringGroupId: s.recurringGroupId, // <-- add this line
            coachName: s.coach?.name || s.coachName || '-',
            coachId: s.coach?.id || s.coachId || '-',
            venue: s.venueName || '-',
            state: s.venueState || '-',
            courtName: s.courtName || s.court?.name || '-',
            type: s.title || s.type || '-',
            date: s.startTime ? new Date(s.startTime).toLocaleDateString() : '-',
            time: s.startTime && s.endTime ? `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-',
            price: s.price || 0,
            status: s.status || 'AVAILABLE', // 添加 status 字段
            currentParticipants: s.currentParticipants || 0,
            maxParticipants: s.maxParticipants || 1,
            coachRating: s.coach?.rating || 5,
            registrations: s.registrations || [] // 添加 registrations 數據
          };
          
          console.log(`Mapped session ${s.id}:`, {
            id: mappedSession.id,
            status: mappedSession.status,
            currentParticipants: mappedSession.currentParticipants,
            maxParticipants: mappedSession.maxParticipants
          });
          
          return mappedSession;
          console.log(`Session ${s.id} mapped registrations:`, mappedSession.registrations); // 調試日誌
          if (mappedSession.registrations && mappedSession.registrations.length > 0) {
            console.log(`Session ${s.id} has registrations:`, mappedSession.registrations.map(r => ({
              registrationId: r.registrationId,
              userId: r.userId,
              userName: r.memberName
            })));
          }
          return mappedSession;
        }) : []);
      } catch (e) {
          setSessionError('Failed to load sessions');
      } finally {
          setLoadingSessions(false);
      }
    };
    fetchSessions();
    }
  }, [tabValue, currentUser]); // 添加 currentUser 依賴

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedCoach(null);
  };

  const handleCoachSelect = async (coach) => {
    console.log('=== Selecting coach ===', coach);
    setSelectedCoach(coach);
    
    // 獲取該教練的課程
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8081/api/class-sessions/test-coach-sessions/${coach.id}`, {
        method: 'GET',
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Coach sessions data:', data);
        
        // 轉換為前端需要的格式
        const formattedSessions = data.sessions.map(session => {
          const startTime = new Date(session.startTime);
          const endTime = session.endTime ? new Date(session.endTime) : null;
          
                      return {
              id: session.id,
              type: session.title || 'Pickleball Class',
              date: startTime.toLocaleDateString(),
              startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              endTime: endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
              time: endTime ? `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              price: session.price || 1500,
              coachName: coach.name,
              state: session.venueState || coach.state,
              venue: session.venue || coach.venue,
              status: session.status,
              recurringGroupId: session.recurringGroupId,
              registrations: session.registrations || []
            };
        });
        
        console.log('Formatted sessions:', formattedSessions);
        
        // 更新教練的課程列表
        const updatedCoach = { ...coach, sessions: formattedSessions };
        setSelectedCoach(updatedCoach);
        setCoaches(prevCoaches => 
          prevCoaches.map(c => 
            c.id === coach.id 
              ? updatedCoach
              : c
          )
        );
      } else {
        console.error('Failed to fetch coach sessions');
      }
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
    }
  };

  const handleBooking = (session) => {
    setSelectedSession(session);
    setBookingDialog(true);
  };

  const handleBookGroup = (group) => {
    // 直接跳轉到 payment 頁面，帶上 group 資料
    navigate('/payment', { state: { sessionGroup: group } });
  };

  const confirmBooking = () => {
    // 跳轉到報名頁，帶上 group 資料
    navigate('/class/register', { state: { sessionGroup: selectedSessionGroup } });
    setBookingDialog(false);
    setSelectedSessionGroup([]);
  };

  const FilterSection = () => {
    // 獲取所有可用的選項
    const allStates = ['All', ...Array.from(new Set(allSessions.map(s => s.state).filter(Boolean)))];
    const allVenues = ['All', ...Array.from(new Set(allSessions.map(s => s.venue).filter(Boolean)))];
    const allCoaches = ['All', ...Array.from(new Set(allSessions.map(s => s.coachName).filter(Boolean)))];
    const allSessionTypes = ['All', ...Array.from(new Set(allSessions.map(s => s.type).filter(Boolean)))];
    
    return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filter</Typography>
      </Box>
      <Grid container spacing={2}>
          {/* 第一行 */}
          <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>State</InputLabel>
            <Select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              label="State"
            >
                {allStates.map(state => (
                <MenuItem key={state} value={state}>{state}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
          <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Venue</InputLabel>
            <Select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              label="Venue"
            >
                {allVenues.map(venue => (
                <MenuItem key={venue} value={venue}>{venue}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Coach</InputLabel>
              <Select
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                label="Coach"
              >
                {allCoaches.map(coach => (
                  <MenuItem key={coach} value={coach}>{coach}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Session Type</InputLabel>
              <Select
                value={sessionTypeFilter}
                onChange={(e) => setSessionTypeFilter(e.target.value)}
                label="Session Type"
              >
                {allSessionTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* 第二行 */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Price Range</InputLabel>
              <Select
                value={priceRangeFilter}
                onChange={(e) => setPriceRangeFilter(e.target.value)}
                label="Price Range"
              >
                <MenuItem value="All">All Prices</MenuItem>
                <MenuItem value="Under 100">Under $100</MenuItem>
                <MenuItem value="100-500">$100 - $500</MenuItem>
                <MenuItem value="500-1000">$500 - $1000</MenuItem>
                <MenuItem value="Over 1000">Over $1000</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time of Day</InputLabel>
              <Select
                value={timeOfDayFilter}
                onChange={(e) => setTimeOfDayFilter(e.target.value)}
                label="Time of Day"
              >
                <MenuItem value="All">All Times</MenuItem>
                <MenuItem value="Morning">Morning (6AM-12PM)</MenuItem>
                <MenuItem value="Afternoon">Afternoon (12PM-6PM)</MenuItem>
                <MenuItem value="Evening">Evening (6PM-6AM)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={dayOfWeekFilter}
                onChange={(e) => setDayOfWeekFilter(e.target.value)}
                label="Day of Week"
              >
                <MenuItem value="All">All Days</MenuItem>
                <MenuItem value="Monday">Monday</MenuItem>
                <MenuItem value="Tuesday">Tuesday</MenuItem>
                <MenuItem value="Wednesday">Wednesday</MenuItem>
                <MenuItem value="Thursday">Thursday</MenuItem>
                <MenuItem value="Friday">Friday</MenuItem>
                <MenuItem value="Saturday">Saturday</MenuItem>
                <MenuItem value="Sunday">Sunday</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Show Full Courses</InputLabel>
              <Select
                value={showFullCourses ? 'Yes' : 'No'}
                onChange={(e) => setShowFullCourses(e.target.value === 'Yes')}
                label="Show Full Courses"
              >
                <MenuItem value="Yes">Show All Courses</MenuItem>
                <MenuItem value="No">Available Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              onClick={() => {
                setStateFilter('All');
                setVenueFilter('All');
                setCoachFilter('All');
                setSessionTypeFilter('All');
                setPriceRangeFilter('All');
                setTimeOfDayFilter('All');
                setDayOfWeekFilter('All');
                // 保持用戶的 "Show Full Courses" 選擇，不清除
                // setShowFullCourses 保持當前值
              }}
              fullWidth
            >
              Clear All Filters
            </Button>
        </Grid>
      </Grid>
    </Paper>
  );
  };

  const CoachCard = ({ coach }) => {
    const navigate = useNavigate();
    
    const handleMessageClick = (e) => {
      e.stopPropagation(); // 防止觸發卡片的點擊事件
      navigate('/messages', { 
        state: { 
          selectedUser: {
            id: coach.id,
            name: coach.name,
            username: coach.username || coach.email,
            userType: 'COACH',
            email: coach.email
          }
        }
      });
    };

    return (
      <Card 
        sx={{ 
          cursor: 'pointer', 
          transition: 'all 0.2s',
          '&:hover': { 
            transform: 'translateY(-2px)', 
            boxShadow: 4 
          },
          border: selectedCoach?.id === coach.id ? '2px solid #1976d2' : 'none'
        }}
        onClick={() => handleCoachSelect(coach)}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
              {coach.avatar}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{coach.name}</Typography>
              <Box display="flex" alignItems="center">
                <Rating value={coach.rating} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {coach.rating}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleMessageClick}
              sx={{ 
                color: 'primary.main',
                '&:hover': { 
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              <Message />
            </IconButton>
          </Box>
          <Box display="flex" alignItems="center" mb={1}>
            <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {coach.state} • {coach.venue}
            </Typography>
          </Box>
          <Box mb={2}>
            {coach.specialties.map(specialty => (
              <Chip 
                key={specialty} 
                label={specialty} 
                size="small" 
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
          <Typography variant="body2" color="primary">
            {coach.sessionsCount || 0} available sessions
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const SessionCard = ({ session, showCoach = false }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            {showCoach && (
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {session.coachName}
              </Typography>
            )}
            <Typography variant="h6" gutterBottom>{session.type}</Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {session.date}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {session.time}
              </Typography>
            </Box>
            {showCoach && (
              <Box display="flex" alignItems="center" mb={1}>
                <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {session.state} • {session.venue}
                </Typography>
              </Box>
            )}
            <Typography variant="h6" color="primary">
              ${session.price}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={() => handleBooking(session)}
            sx={{ ml: 2 }}
          >
            Book Now
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom align="center">
        Coaching Session Booking System
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="By Coach" />
          <Tab label="All Available Sessions" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedCoach ? 6 : 12}>
            <Typography variant="h5" gutterBottom>
              Select Coach ({filteredCoaches.length})
            </Typography>
            {loadingCoaches ? (
              <Typography>Loading coaches...</Typography>
            ) : (
            <Grid container spacing={2}>
              {filteredCoaches.map(coach => (
                <Grid item xs={12} sm={selectedCoach ? 12 : 6} lg={selectedCoach ? 12 : 4} key={coach.id}>
                  <CoachCard coach={coach} />
                </Grid>
              ))}
            </Grid>
            )}
          </Grid>
          
          {selectedCoach && (
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedCoach.name}'s Available Sessions
                </Typography>
                <Divider sx={{ my: 2 }} />
                {(() => {
                  // Group by recurringGroupId or id
                  const grouped = {};
                  selectedCoach.sessions.forEach(session => {
                    const key = session.recurringGroupId || session.id;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(session);
                  });
                  
                  return Object.values(grouped).map(group => {
                    const first = group[0];
                    const groupKey = first.recurringGroupId || first.id;
                    const expanded = expandedGroups.includes(groupKey);
                    
                    return (
                      <Card key={groupKey} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="h6" gutterBottom>{first.type}</Typography>
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {first.state} • {first.venue}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="primary">
                                Total {group.length} sessions
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {(() => {
                                  // Find earliest and latest date in group
                                  const dates = group.map(sess => {
                                    if (!sess.date) return null;
                                    const [m, d, y] = sess.date.split('/');
                                    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                  }).filter(Boolean);
                                  if (dates.length === 0) return null;
                                  const minDate = new Date(Math.min(...dates));
                                  const maxDate = new Date(Math.max(...dates));
                                  const format = (date) => `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
                                  return `${format(minDate)} ~ ${format(maxDate)}`;
                                })()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {(() => {
                                  if (!group.length) return null;
                                  // 取第一堂課的時間
                                  const firstSession = group[0];
                                  const [startTime, endTime] = firstSession.time ? firstSession.time.split('-') : [null, null];
                                  // 取所有星期幾
                                  const daysOfWeek = Array.from(new Set(group.map(sess => {
                                    if (!sess.date) return '';
                                    const [m, d, y] = sess.date.split('/');
                                    const dateObj = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                  }))).filter(Boolean);
                                  return [
                                    startTime && endTime ? `Time: ${startTime} ~ ${endTime}` : null,
                                    daysOfWeek.length ? `Day(s): ${daysOfWeek.join(', ')}` : null
                                  ].filter(Boolean).join(' | ');
                                })()}
                              </Typography>
                              <Typography variant="h6" color="primary">
                                ${first.price}
                              </Typography>
                            </Box>
                            <Box>
                              <Button 
                                variant="outlined" 
                                size="small"
                                onClick={() => setExpandedGroups(prev => 
                                  prev.includes(groupKey) 
                                    ? prev.filter(id => id !== groupKey)
                                    : [...prev, groupKey]
                                )}
                                sx={{ mb: 1 }}
                              >
                                {expanded ? 'Hide Details' : 'Show Details'}
                              </Button>
                              <Button 
                                variant="contained" 
                                onClick={() => handleBookGroup(group)}
                                disabled={(() => {
                                  const currentUserId = parseInt(currentUser?.id);
                                  return group.some(sess => {
                                    if (!sess.registrations || sess.registrations.length === 0) {
                                      return false;
                                    }
                                    return sess.registrations.some(r => {
                                      const registrationUserId = parseInt(r.userId);
                                      return registrationUserId === currentUserId;
                                    });
                                  });
                                })()}
                              >
                                {(() => {
                                  const currentUserId = parseInt(currentUser?.id);
                                  const isBooked = group.some(sess => {
                                    if (!sess.registrations || sess.registrations.length === 0) {
                                      return false;
                                    }
                                    return sess.registrations.some(r => {
                                      const registrationUserId = parseInt(r.userId);
                                      return registrationUserId === currentUserId;
                                    });
                                  });
                                  return isBooked ? 'Already Booked' : `Book All ${group.length} Sessions`;
                                })()}
                              </Button>
                            </Box>
                          </Box>
                          {expanded && (
                            <Box mt={2}>
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Date</TableCell>
                                      <TableCell>Start Time</TableCell>
                                      <TableCell>End Time</TableCell>
                                      <TableCell>Status</TableCell>
                                      <TableCell>Price</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.map(sess => (
                                      <TableRow key={sess.id}>
                                        <TableCell>{sess.date}</TableCell>
                                        <TableCell>{sess.time?.split('-')[0]}</TableCell>
                                        <TableCell>{sess.time?.split('-')[1]}</TableCell>
                                        <TableCell>{sess.status || 'Available'}</TableCell>
                                        <TableCell>${sess.price}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Paper>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* All Available Sessions tab */}
      {tabValue === 1 && (
        <Box>
          <FilterSection />
          <Typography variant="h5" gutterBottom>
            All Available Sessions ({filteredSessions.length})
          </Typography>
          {loadingSessions ? (
            <Typography>Loading...</Typography>
          ) : sessionError ? (
            <Typography color="error">{sessionError}</Typography>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Debug: Total sessions: {allSessions.length}, Filtered sessions: {filteredSessions.length}, Show Full: {showFullCourses ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Status breakdown: {(() => {
                  const statusCount = {};
                  allSessions.forEach(s => {
                    statusCount[s.status] = (statusCount[s.status] || 0) + 1;
                  });
                  return Object.entries(statusCount).map(([status, count]) => `${status}: ${count}`).join(', ');
                })()}
              </Typography>
              <Grid container spacing={2} sx={{ minHeight: '400px' }}>
                {/* Group by recurringGroupId or individual sessions */}
                {(() => {
                  const grouped = {};
                  filteredSessions.forEach(session => {
                    // 如果有 recurringGroupId，按它分組；否則按 session.id 分組
                    const key = session.recurringGroupId || `single_${session.id}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(session);
                  });
                  
                  // 如果 showFullCourses 為 false，過濾掉只包含 FULL 狀態的組
                  const finalGroups = Object.values(grouped).filter(group => {
                    if (!showFullCourses) {
                      // 如果組內所有課程都是 FULL 狀態，則過濾掉
                      return !group.every(sess => sess.status === 'FULL');
                    }
                    return true;
                  });
                  
                  console.log('Grouped sessions:', Object.keys(grouped).length, 'groups');
                  console.log('Groups:', Object.keys(grouped));
                  console.log('Final groups after filtering:', finalGroups.length);
                  
                  return finalGroups.map(group => {
                    const first = group[0];
                    const groupKey = first.recurringGroupId || `single_${first.id}`;
                    const isRecurring = !!first.recurringGroupId;
                    const expanded = expandedGroups.includes(groupKey);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={groupKey}>
                        <Card sx={{ mb: 2, height: '100%' }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                  {first.coachName}
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                  {first.type}
                                  {isRecurring && group.length > 1 && (
                                    <Chip 
                                      label={`${group.length} sessions`} 
                                      size="small" 
                                      color="secondary" 
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                  <Chip 
                                    label={first.status || 'AVAILABLE'} 
                                    size="small" 
                                    color={first.status === 'FULL' ? 'error' : first.status === 'CONFIRMED' ? 'success' : 'primary'} 
                                    sx={{ ml: 1 }}
                                  />
                                </Typography>
                                

                                <Box display="flex" alignItems="center" mb={1}>
                                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Venue: {first.venue || '-'}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                  State: {first.state || '-'}
                                </Typography>
                                
                                {isRecurring && group.length > 1 ? (
                                  <>
                                    <Typography variant="body2" color="primary" mb={1}>
                                      Total {group.length} sessions
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                      {(() => {
                                        // Find earliest and latest date in group
                                        const dates = group.map(sess => {
                                          if (!sess.date) return null;
                                          const [m, d, y] = sess.date.split('/');
                                          return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                        }).filter(Boolean);
                                        if (dates.length === 0) return null;
                                        const minDate = new Date(Math.min(...dates));
                                        const maxDate = new Date(Math.max(...dates));
                                        const format = (date) => `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}`;
                                        return `${format(minDate)} ~ ${format(maxDate)}`;
                                      })()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                      {(() => {
                                        if (!group.length) return null;
                                        const firstSession = group[0];
                                        const [startTime, endTime] = firstSession.time ? firstSession.time.split('-') : [null, null];
                                        const daysOfWeek = Array.from(new Set(group.map(sess => {
                                          if (!sess.date) return '';
                                          const [m, d, y] = sess.date.split('/');
                                          const dateObj = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                          return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                        }))).filter(Boolean);
                                        return [
                                          startTime && endTime ? `Time: ${startTime} ~ ${endTime}` : null,
                                          daysOfWeek.length ? `Day(s): ${daysOfWeek.join(', ')}` : null
                                        ].filter(Boolean).join(' | ');
                                      })()}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                      Date: {first.date || '-'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                      Time: {first.time || '-'}
                                    </Typography>
                                  </>
                                )}
                                
                                <Typography variant="h6" color="primary" mb={2}>
                                  RM {isRecurring ? group.reduce((sum, sess) => sum + (sess.price || 0), 0) : first.price}
                                </Typography>
                              </Box>
                              
                              {isRecurring && group.length > 1 && (
                                <IconButton 
                                  onClick={() => setExpandedGroups(expanded ? expandedGroups.filter(id => id !== groupKey) : [...expandedGroups, groupKey])}
                                  size="small"
                                >
                                  {expanded ? '-' : '+'}
                                </IconButton>
                              )}
                            </Box>
                            
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => isRecurring ? handleBookGroup(group) : handleBooking(first)}
                              fullWidth
                              disabled={(() => {
                                const currentUserId = parseInt(currentUser?.id);
                                // 檢查是否已預訂或課程已滿
                                return group.some(sess => {
                                  const isBooked = sess.registrations && sess.registrations.some(r => {
                                    const registrationUserId = parseInt(r.userId);
                                    return registrationUserId === currentUserId;
                                  });
                                  const isFull = sess.status === 'FULL' || (sess.currentParticipants >= sess.maxParticipants);
                                  return isBooked || isFull;
                                });
                              })()}
                            >
                              {(() => {
                                const currentUserId = parseInt(currentUser?.id);
                                const isBooked = group.some(sess => {
                                  return sess.registrations && sess.registrations.some(r => {
                                    const registrationUserId = parseInt(r.userId);
                                    return registrationUserId === currentUserId;
                                  });
                                });
                                const isFull = group.some(sess => {
                                  return sess.status === 'FULL' || (sess.currentParticipants >= sess.maxParticipants);
                                });
                                
                                if (isBooked) return 'Already Booked';
                                if (isFull) return 'Full';
                                return isRecurring ? `Book All ${group.length} Sessions` : 'Book Now';
                              })()}
                            </Button>
                            
                            {expanded && isRecurring && group.length > 1 && (
                              <Box mt={2}>
                                <Paper variant="outlined" sx={{ p: 1 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Start Time</TableCell>
                                        <TableCell>End Time</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Price</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {group.map(sess => (
                                        <TableRow key={sess.id}>
                                          <TableCell>{sess.date}</TableCell>
                                          <TableCell>{sess.time?.split('-')[0]}</TableCell>
                                          <TableCell>{sess.time?.split('-')[1]}</TableCell>
                                          <TableCell>{sess.status || 'Available'}</TableCell>
                                          <TableCell>RM {sess.price}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Paper>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  });
                })()}
            </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Booking
          <IconButton
            onClick={() => setBookingDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Show group booking summary */}
          {selectedSessionGroup && selectedSessionGroup.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                You are booking {selectedSessionGroup.length} sessions
              </Typography>
              <List>
                {selectedSessionGroup.map(sess => (
                  <ListItem key={sess.id}>
                    <ListItemAvatar>
                      <Avatar><CalendarToday /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${sess.date} ${sess.time}`}
                      secondary={`Coach: ${sess.coachName} | Venue: ${sess.venue}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Total Price</Typography>
                <Typography variant="h5" color="primary">
                  ${selectedSessionGroup.reduce((sum, sess) => sum + (sess.price || 0), 0)}
                </Typography>
              </Box>
    </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmBooking} disabled={!selectedSessionGroup || selectedSessionGroup.length === 0}>
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 