import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  SportsTennis as TennisIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../court/DateUtils';
import CourtService from '../../service/CourtService';
import VenueService from '../../service/VenueService';
import { getAvailableSlotsForCourt } from '../../service/SlotService';
import api from '../../api/axiosConfig';
import dayjs from 'dayjs';

const FriendlyMatchCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Form states
  const [selectedState, setSelectedState] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [matchRules, setMatchRules] = useState('');

  // Data states
  const [states, setStates] = useState([]);
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);




  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchVenuesByState(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedVenue) {
      fetchCourtsByVenue(selectedVenue);
    }
  }, [selectedVenue]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchAvailableSlots(selectedCourt, selectedDate);
    }
  }, [selectedCourt, selectedDate]);



  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [venuesData] = await Promise.all([
        VenueService.getAllVenues()
      ]);

      // Extract unique states
      const uniqueStates = [...new Set(venuesData.map(venue => venue.state).filter(Boolean))];
      setStates(uniqueStates);
      setVenues(venuesData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setError('Failed to load venues and states');
      setLoading(false);
    }
  };

  const fetchVenuesByState = async (state) => {
    try {
      const venuesData = await VenueService.getVenuesByState(state);
      setVenues(venuesData);
      setSelectedVenue('');
      setSelectedCourt('');
      setAvailableSlots([]);
    } catch (error) {
      console.error('Failed to fetch venues by state:', error);
      setError('Failed to load venues for selected state');
    }
  };

  const fetchCourtsByVenue = async (venueId) => {
    try {
      const courtsData = await CourtService.getAllCourts();
      const filteredCourts = courtsData.filter(court => 
        court.venue && court.venue.id === Number(venueId)
      );
      setCourts(filteredCourts);
      setSelectedCourt('');
      setAvailableSlots([]);
    } catch (error) {
      console.error('Failed to fetch courts by venue:', error);
      setError('Failed to load courts for selected venue');
    }
  };

  const fetchAvailableSlots = async (courtId, date) => {
    try {
      console.log('=== fetchAvailableSlots ===');
      console.log('Court ID:', courtId, 'Date:', date.format('YYYY-MM-DD'));

      // 使用与BookingPage相同的逻辑
      const slotsData = await getAvailableSlotsForCourt(courtId);
      setSlots(slotsData);

      const dates = [...new Set(slotsData.map(slot => slot.date))];
      setAvailableDates(dates);

      // 过滤出指定日期的可用时段
      let filtered = slotsData.filter(slot => slot.date === date.format('YYYY-MM-DD'));
      
      // 如果是今天，过滤掉2小时内的时段
      if (date.isSame(dayjs(), 'day')) {
        const nowPlus2h = dayjs().add(2, 'hour');
        filtered = filtered.filter(slot => {
          const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
          return slotDateTime.isAfter(nowPlus2h);
        });
      }
      
      setAvailableSlots(filtered);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      setError('Failed to load available time slots');
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(dayjs(date));
    setSelectedTime('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    // 找到对应的slot对象
    const slotObj = availableSlots.find(s => s.startTime === time);
    
    if (!slotObj) return;
    
    // 检查是否已经选择了这个时段
    if (selectedSlots.some(s => s.id === slotObj.id)) {
      // 如果已经选择，则取消选择
      setSelectedSlots(selectedSlots.filter(s => s.id !== slotObj.id));
      setSelectedSlot(null);
      return;
    }
    
    // 检查是否与已选择的时段连续
    if (selectedSlots.length > 0) {
      const lastSlot = selectedSlots[selectedSlots.length - 1];
      const isConsecutive = slotObj.startTime === lastSlot.endTime;
      
      if (!isConsecutive) {
        // 如果不连续，重置选择
        setSelectedSlots([slotObj]);
        setSelectedSlot(slotObj);
        return;
      }
    }
    
    // 添加新时段到选择列表
    const newSelectedSlots = [...selectedSlots, slotObj].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    setSelectedSlots(newSelectedSlots);
    setSelectedSlot(slotObj);
  };

  const handleCreateMatch = async () => {
    if (!selectedState || !selectedVenue || !selectedCourt || !selectedDate || !selectedSlots.length || !maxPlayers) {
      setError('Please fill in all required fields');
      setSnackbarOpen(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedSlots.length === 0) {
        setError('Please select at least one time slot');
        setSnackbarOpen(true);
        setSubmitting(false);
        return;
      }

      // 計算價格
      const selectedCourtData = courts.find(c => c.id === Number(selectedCourt));
      
      // 判斷是否為 peak hour
      const isPeakHour = () => {
        if (!selectedCourtData?.peakStartTime || !selectedCourtData?.peakEndTime) {
          return false;
        }
        
        const startHour = parseInt(selectedCourtData.peakStartTime.split(':')[0]);
        const endHour = parseInt(selectedCourtData.peakEndTime.split(':')[0]);
        const slotStartHour = parseInt(selectedSlots[0].startTime.split(':')[0]);
        
        // 處理跨日的情況（例如 22:00 - 02:00）
        if (startHour > endHour) {
          return slotStartHour >= startHour || slotStartHour <= endHour;
        } else {
          return slotStartHour >= startHour && slotStartHour < endHour;
        }
      };
      
      const isPeak = isPeakHour();
      const pricePerHour = isPeak ? (selectedCourtData?.peakHourlyPrice || 0) : (selectedCourtData?.offPeakHourlyPrice || 0);
      const totalPrice = pricePerHour * selectedSlots.length;
      
      console.log('=== Create Match Price Debug ===');
      console.log('Selected Court Data:', selectedCourtData);
      console.log('Peak Start Time:', selectedCourtData?.peakStartTime);
      console.log('Peak End Time:', selectedCourtData?.peakEndTime);
      console.log('Slot Start Time:', selectedSlots[0]?.startTime);
      console.log('Is Peak Hour:', isPeak);
      console.log('Price Per Hour:', pricePerHour);
      console.log('Selected Slots Length:', selectedSlots.length);
      console.log('Total Price:', totalPrice);
      console.log('=== End Create Match Price Debug ===');

      // Create the friendly match
      const matchData = {
        maxPlayers: maxPlayers,
        currentPlayers: 1, // Organizer is first player
        matchRules: matchRules,
        status: 'OPEN',
        paymentStatus: 'PENDING',
        startTime: dayjs(`${selectedDate.format('YYYY-MM-DD')} ${selectedSlots[0].startTime}`).format('YYYY-MM-DDTHH:mm:ss'),
        endTime: dayjs(`${selectedDate.format('YYYY-MM-DD')} ${selectedSlots[selectedSlots.length - 1].endTime}`).format('YYYY-MM-DDTHH:mm:ss'),
        durationHours: selectedSlots.length,
        location: `${courts.find(c => c.id === Number(selectedCourt))?.name} at ${venues.find(v => v.id === Number(selectedVenue))?.name}`,
        courtId: selectedCourt,
        venueId: selectedVenue,
        state: selectedState,
        price: totalPrice
      };

      // Call API to create friendly match
      const response = await api.post('/friendly-matches/create', matchData);

      setSuccess('Friendly match created successfully! The court is now temporarily locked.');
      setSnackbarOpen(true);
      
      // Reset form
      setSelectedState('');
      setSelectedVenue('');
      setSelectedCourt('');
      setSelectedDate(dayjs());
      setSelectedTime('');
      setSelectedSlot(null);
      setSelectedSlots([]);
      setMaxPlayers(4);
      setMatchRules('');

      // 跳转到friendly match页面，让用户立即看到新创建的match
      setTimeout(() => {
        navigate('/friendly-matches');
      }, 1500);

    } catch (error) {
      console.error('Failed to create friendly match:', error);
      setError('Failed to create friendly match. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };



  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    // 使用与BookingPage相同的逻辑
    const court = courts.find(c => c.id === Number(selectedCourt));
    if (!court) return null;

    // 获取营业时间范围
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

    const availableSlotSet = new Set(availableSlots.map(s => s.startTime + '-' + s.endTime));

    return (
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" fontWeight="bold">
              Available Time Slots - {selectedDate.format('dddd, MMMM D, YYYY')}
            </Typography>
          </Box>

          <Grid container spacing={1.5}>
            {hourSlots.length > 0 ? (
              hourSlots.map((slot, idx) => {
                const key = slot.start + '-' + slot.end;
                const isAvailable = availableSlotSet.has(key);
                const slotObj = availableSlots.find(s => s.startTime === slot.start && s.endTime === slot.end);
                const isSelected = selectedSlots.some(s => s.startTime === slot.start);
                
                return (
                  <Grid item xs={4} sm={3} md={2} key={key}>
                    <Button
                      fullWidth
                      variant={isSelected ? "contained" : "outlined"}
                      onClick={() => isAvailable && slotObj && handleTimeSelect(slot.start)}
                      disabled={!isAvailable}
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        fontWeight: 600,
                        ...(isSelected ? {
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
                          {formatTime(slot.start)}
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
                  <ScheduleIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">
                    No available time slots for this date
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderMatchSummary = () => {
    const selectedVenueData = venues.find(v => v.id === Number(selectedVenue));
    const selectedCourtData = courts.find(c => c.id === Number(selectedCourt));
    
    // 計算價格
    const calculatePrice = () => {
      if (!selectedCourtData || !selectedSlots.length) return 0;
      
      // 判斷是否為 peak hour
      const isPeakHour = () => {
        if (!selectedCourtData.peakStartTime || !selectedCourtData.peakEndTime) {
          return false;
        }
        
        const startHour = parseInt(selectedCourtData.peakStartTime.split(':')[0]);
        const endHour = parseInt(selectedCourtData.peakEndTime.split(':')[0]);
        const slotStartHour = parseInt(selectedSlots[0].startTime.split(':')[0]);
        
        // 處理跨日的情況（例如 22:00 - 02:00）
        if (startHour > endHour) {
          return slotStartHour >= startHour || slotStartHour <= endHour;
        } else {
          return slotStartHour >= startHour && slotStartHour < endHour;
        }
      };
      
      const isPeak = isPeakHour();
      const pricePerHour = isPeak ? (selectedCourtData.peakHourlyPrice || 0) : (selectedCourtData.offPeakHourlyPrice || 0);
      const duration = selectedSlots.length;
      const total = pricePerHour * duration;
      
      console.log('=== Price Calculation Debug ===');
      console.log('Selected Court Data:', selectedCourtData);
      console.log('Peak Start Time:', selectedCourtData.peakStartTime);
      console.log('Peak End Time:', selectedCourtData.peakEndTime);
      console.log('Slot Start Time:', selectedSlots[0]?.startTime);
      console.log('Is Peak Hour:', isPeak);
      console.log('Price Per Hour:', pricePerHour);
      console.log('Duration (hours):', duration);
      console.log('Total Price:', total);
      console.log('=== End Price Calculation Debug ===');
      
      return total;
    };
    
    const totalPrice = calculatePrice();

    return (
      <Card sx={{
        position: 'sticky',
        top: 20,
        borderRadius: 3,
        boxShadow: 3,
        mb: 4
      }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Match Summary
          </Typography>

          <Stack spacing={2}>
            {selectedState && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  State
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedState}
                </Typography>
              </Box>
            )}

            {selectedVenueData && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Venue
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedVenueData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedVenueData.location}
                </Typography>
              </Box>
            )}

            {selectedCourtData && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Court
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedCourtData.name}
                </Typography>
              </Box>
            )}

            {selectedDate && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedDate.format('MMM DD, YYYY')}
                </Typography>
              </Box>
            )}

            {selectedSlots.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatTime(selectedSlots[0].startTime)} - {formatTime(selectedSlots[selectedSlots.length - 1].endTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary">
                Max Players
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {maxPlayers} players
              </Typography>
            </Box>

            {totalPrice > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  RM{totalPrice.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(() => {
                    const isPeakHour = () => {
                      if (!selectedCourtData?.peakStartTime || !selectedCourtData?.peakEndTime) {
                        return false;
                      }
                      
                      const startHour = parseInt(selectedCourtData.peakStartTime.split(':')[0]);
                      const endHour = parseInt(selectedCourtData.peakEndTime.split(':')[0]);
                      const slotStartHour = parseInt(selectedSlots[0]?.startTime.split(':')[0]);
                      
                      if (startHour > endHour) {
                        return slotStartHour >= startHour || slotStartHour <= endHour;
                      } else {
                        return slotStartHour >= startHour && slotStartHour < endHour;
                      }
                    };
                    
                    const isPeak = isPeakHour();
                    const pricePerHour = isPeak ? (selectedCourtData?.peakHourlyPrice || 0) : (selectedCourtData?.offPeakHourlyPrice || 0);
                    const priceType = isPeak ? 'Peak' : 'Off-Peak';
                    
                    return `RM${pricePerHour}/hour (${priceType}) × ${selectedSlots.length} hour${selectedSlots.length > 1 ? 's' : ''}`;
                  })()}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting || !selectedState || !selectedVenue || !selectedCourt || !selectedDate || !selectedSlots.length || !maxPlayers}
            onClick={handleCreateMatch}
            sx={{
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              fontWeight: 'bold',
              textTransform: 'none'
            }}
          >
            {submitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Creating Match...
              </Box>
            ) : (
              'Create Friendly Match'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={48} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading venues and courts...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="text"
        onClick={() => navigate('/friendly-matches')}
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          textTransform: 'none',
          fontWeight: 500,
          color: '#1976d2',
          '&:hover': {
            backgroundColor: 'transparent',
            textDecoration: 'underline'
          }
        }}
        startIcon={<BackIcon />}
      >
        Back to Friendly Matches
      </Button>

      <Paper 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 4,
          mb: 4,
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TennisIcon sx={{ fontSize: 48, mr: 2 }} />
          <Box>
            <Typography variant="h3" component="h1" fontWeight="bold">
              Create Friendly Match
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Reserve a court for a friendly match (no payment required)
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* State Selection */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Select State
              </Typography>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  label="State"
                  sx={{ borderRadius: 2 }}
                >
                  {states.map(state => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* Venue Selection */}
          {selectedState && (
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Select Venue
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Venue</InputLabel>
                  <Select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value)}
                    label="Venue"
                    sx={{ borderRadius: 2 }}
                  >
                    {venues.map(venue => (
                      <MenuItem key={venue.id} value={venue.id}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {venue.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {venue.location}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          )}

          {/* Court Selection */}
          {selectedVenue && (
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Select Court
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Court</InputLabel>
                  <Select
                    value={selectedCourt}
                    onChange={(e) => setSelectedCourt(e.target.value)}
                    label="Court"
                    sx={{ borderRadius: 2 }}
                  >
                    {courts.map(court => (
                      <MenuItem key={court.id} value={court.id}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {court.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {court.location}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          )}

          {/* Max Players Selection */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Number of Players
              </Typography>
              <TextField
                fullWidth
                label="Maximum Players"
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Math.max(2, Math.min(8, parseInt(e.target.value) || 4)))}
                inputProps={{ min: 2, max: 8 }}
                helperText="Select between 2-8 players"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={selectedDate.format('YYYY-MM-DD')}
                onChange={(e) => handleDateSelect(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton size="small">
                      <ScheduleIcon />
                    </IconButton>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused': {
                      borderColor: '#1976d2'
                    }
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Match Rules */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Match Rules & Notes
              </Typography>
              <TextField
                fullWidth
                label="Rules and Notes"
                value={matchRules}
                onChange={(e) => setMatchRules(e.target.value)}
                multiline
                rows={3}
                placeholder="e.g., Friendly doubles, all levels welcome, bring your own equipment..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </CardContent>
          </Card>



          {/* Time Slots */}
          {renderTimeSlots()}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Debug Info
                </Typography>
                <Typography variant="body2">
                  Available Slots Count: {availableSlots.length}
                </Typography>
                <Typography variant="body2">
                  Selected Court: {selectedCourt}
                </Typography>
                <Typography variant="body2">
                  Selected Date: {selectedDate ? selectedDate.format('YYYY-MM-DD') : 'None'}
                </Typography>
                <Typography variant="body2">
                  Selected Slots: {selectedSlots.length > 0 ? selectedSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ') : 'None'}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (selectedCourt && selectedDate) {
                      fetchAvailableSlots(selectedCourt, selectedDate);
                    }
                  }}
                  sx={{ mt: 1 }}
                >
                  Refresh Slots
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderMatchSummary()}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={error ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FriendlyMatchCreatePage; 