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
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { formatTime } from '../../components/court/DateUtils';
import CourtService from '../../service/CourtService';
import { getAllSlotsForCourt } from '../../service/SlotService';
import BookingService from '../../service/BookingService';
import dayjs from 'dayjs';

const BookingPage = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); // 替换 selectedSlot
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courtData = await CourtService.getCourtById(courtId);
        setCourt(courtData);

        const slotsData = await getAllSlotsForCourt(courtId); // 获取所有slot
        setSlots(slotsData);

        // Extract available dates (所有slot的日期)
        const dates = [...new Set(slotsData.map(slot => slot.date))];
        setAvailableDates(dates);
      } catch (error) {
        console.error('Failed to fetch booking data:', error);
        setError('Failed to load court details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courtId]);

  useEffect(() => {
    if (selectedDate) {
      let filtered = slots.filter(slot =>
        slot.date === selectedDate.format('YYYY-MM-DD')
      );
      // 如果是今天，只保留2小时后的slot
      if (selectedDate.isSame(dayjs(), 'day')) {
        const nowPlus2h = dayjs().add(2, 'hour');
        filtered = filtered.filter(slot => {
          // slot.startTime: 'HH:mm' 字符串
          const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
          return slotDateTime.isAfter(nowPlus2h);
        });
      }
      setAvailableSlots(filtered);
      setSelectedSlots([]);
    }
  }, [selectedDate, slots]);

  const today = dayjs();
  const maxMonth = today.add(2, 'month').endOf('month'); // 允许切换到本月+2个月（共3个月）

  const handlePrevMonth = () => {
    if (currentMonth.isAfter(today, 'month')) {
      setCurrentMonth(currentMonth.subtract(1, 'month'));
    }
  };

  const handleNextMonth = () => {
    if (currentMonth.isBefore(maxMonth, 'month')) {
      setCurrentMonth(currentMonth.add(1, 'month'));
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // 替换 handleSlotSelect
  const handleSlotSelect = (slot) => {
    // 如果已选，取消选择
    if (selectedSlots.some(s => s.id === slot.id)) {
      setSelectedSlots(selectedSlots.filter(s => s.id !== slot.id));
      return;
    }
    // 只允许同一天
    if (selectedSlots.length > 0 && slot.date !== selectedSlots[0].date) return;
    // 只允许连续
    const allSlots = [...selectedSlots, slot].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let isConsecutive = true;
    for (let i = 1; i < allSlots.length; i++) {
      if (allSlots[i].startTime !== allSlots[i - 1].endTime) {
        isConsecutive = false;
        break;
      }
    }
    if (!isConsecutive) return;
    setSelectedSlots(allSlots);
  };

  // handleBookNow 传所有slotId
  const handleBookNow = () => {
    if (!selectedSlots.length) return;
    const bookingDetails = {
      slotIds: selectedSlots.map(s => s.id),
      courtName: court.name,
      courtLocation: court.location,
      date: selectedDate.format('YYYY-MM-DD'),
      startTime: selectedSlots[0].startTime,
      endTime: selectedSlots[selectedSlots.length - 1].endTime,
      durationHours: selectedSlots.length,
      price: calculatePrice(),
      purpose: "Recreational",
      numberOfPlayers: 4
    };
    navigate('/payment', { state: { bookingDetails } });
  };

  const calculatePrice = () => {
    if (!selectedSlots.length || !court) return 0;

    const startTime = dayjs(selectedSlots[0].startTime, 'HH:mm');
    const peakStart = dayjs(court.peakStartTime || '16:00', 'HH:mm');
    const peakEnd = dayjs(court.peakEndTime || '20:00', 'HH:mm');

    const isPeak = startTime.isAfter(peakStart) && startTime.isBefore(peakEnd);

    return selectedSlots.length *
      (isPeak ? (court.peakHourlyPrice || 80) : (court.offPeakHourlyPrice || 50));
  };

  // 组件作用域定义 totalDuration/totalPrice
  const totalDuration = selectedSlots.length;
  const totalPrice = totalDuration * (selectedSlots[0] && court ? (() => {
    const startTime = dayjs(selectedSlots[0].startTime, 'HH:mm');
    const peakStart = dayjs(court.peakStartTime || '16:00', 'HH:mm');
    const peakEnd = dayjs(court.peakEndTime || '20:00', 'HH:mm');
    const isPeak = startTime.isAfter(peakStart) && startTime.isBefore(peakEnd);
    return isPeak ? (court.peakHourlyPrice || 80) : (court.offPeakHourlyPrice || 50);
  })() : 0);

  const renderCalendar = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const daysInMonth = currentMonth.daysInMonth();

    const days = [];
    for (let i = 0; i < daysInMonth; i++) {
      const date = startOfMonth.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const isAvailable = availableDates.includes(dateStr);
      const isSelected = selectedDate && selectedDate.isSame(date, 'day');

      days.push(
        <Grid item xs key={i} sx={{ textAlign: 'center' }}>
          <Button
            fullWidth
            variant={isSelected ? "contained" : "outlined"}
            color={isAvailable ? "primary" : "secondary"}
            disabled={!isAvailable}
            onClick={() => isAvailable && handleDateSelect(date)}
            sx={{
              py: 1,
              borderRadius: '8px',
              minWidth: 'auto',
              backgroundColor: isAvailable ?
                (isSelected ? '#1976d2' : 'transparent') : '#f5f5f5',
              color: isAvailable ?
                (isSelected ? '#fff' : '#1976d2') : '#9e9e9e',
              borderColor: isAvailable ? '#1976d2' : '#e0e0e0',
              '&:hover': {
                backgroundColor: isAvailable ?
                  (isSelected ? '#1565c0' : '#e3f2fd') : '#f5f5f5'
              }
            }}
          >
            {date.date()}
          </Button>
        </Grid>
      );
    }

    return (
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <IconButton onClick={handlePrevMonth} disabled={currentMonth.isSame(today, 'month')}>
              <LeftIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              {currentMonth.format('MMMM YYYY')}
            </Typography>
            <IconButton onClick={handleNextMonth} disabled={currentMonth.isSame(maxMonth, 'month')}>
              <RightIcon />
            </IconButton>
          </Box>

          <Grid container spacing={1} sx={{ mb: 1 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Grid item xs key={index} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={1}>
            {days}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate || availableSlots.length === 0) {
      return null;
    }

    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Time Slots - {selectedDate.format('dddd, MMMM D, YYYY')}
          </Typography>

          <Grid container spacing={2}>
            {availableSlots.map((slot) => (
              <Grid item xs={12} sm={6} md={4} key={slot.id}>
                <Button
                  fullWidth
                  variant={selectedSlots.some(s => s.id === slot.id) ? "contained" : "outlined"}
                  onClick={slot.status === 'BOOKED' ? undefined : () => handleSlotSelect(slot)}
                  sx={{
                    py: 1.5,
                    borderRadius: '8px',
                    borderColor: slot.status === 'BOOKED' ? '#e53935' : '#1976d2',
                    color: slot.status === 'BOOKED' ? '#e53935' : (selectedSlots.some(s => s.id === slot.id) ? '#fff' : '#1976d2'),
                    backgroundColor: slot.status === 'BOOKED'
                      ? '#fff'
                      : (selectedSlots.some(s => s.id === slot.id) ? '#1976d2' : 'transparent'),
                    pointerEvents: slot.status === 'BOOKED' ? 'none' : 'auto',
                    opacity: 1,
                    '&:hover': {
                      backgroundColor: slot.status === 'BOOKED'
                        ? '#fff'
                        : (selectedSlots.some(s => s.id === slot.id) ? '#1565c0' : '#e3f2fd'),
                      borderColor: slot.status === 'BOOKED' ? '#e53935' : '#1565c0'
                    }
                  }}
                >
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderBookingSummary = () => {
    if (!court) return null;
    // 不要再定义 totalDuration/totalPrice，直接用外部的
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
            Booking Summary
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {court.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {court.location}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {selectedDate && (
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Date:</strong> {selectedDate.format('dddd, MMMM D, YYYY')}
              </Typography>

              {selectedSlots.length > 0 && (
                <>
                  <Typography variant="body1">
                    <strong>Time:</strong> {formatTime(selectedSlots[0].startTime)} - {formatTime(selectedSlots[selectedSlots.length - 1].endTime)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Duration:</strong> {totalDuration} hours
                  </Typography>
                </>
              )}
            </Stack>
          )}

          {selectedSlots.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />

              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="body1">
                  Subtotal
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  RM{totalPrice.toFixed(2)}
                </Typography>
              </Box>

              {bookingInProgress ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleBookNow}
                  disabled={!selectedSlots.length}
                  sx={{
                    py: 1.5,
                    fontWeight: 'bold',
                    backgroundColor: '#ff6f00',
                    '&:hover': {
                      backgroundColor: '#e65100'
                    }
                  }}
                >
                  Book Now
                </Button>
              )}
            </>
          )}

          {!selectedSlots.length && selectedDate && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Select a time slot to complete your booking
            </Typography>
          )}

          {!selectedDate && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Select a date to see available time slots
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading || !court) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/courts')}
          sx={{ mt: 2, ml: 2 }}
        >
          Back to Courts
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        variant="text"
        onClick={() => navigate(`/courts/${courtId}`)}
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
        Back to Court
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
        Book Court: {court.name}
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
        {court.location}
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {renderCalendar()}
          {renderTimeSlots()}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderBookingSummary()}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookingPage;