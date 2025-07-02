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
import { getAvailableSlotsForCourt } from '../../service/SlotService';
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
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courtData = await CourtService.getCourtById(courtId);
        setCourt(courtData);

        const slotsData = await getAvailableSlotsForCourt(courtId);
        setSlots(slotsData);

        // Extract available dates
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
    if (selectedDate && selectedDuration) {
      const filtered = slots.filter(slot =>
        slot.date === selectedDate.format('YYYY-MM-DD') &&
        slot.durationHours === selectedDuration
      );
      setAvailableSlots(filtered);
      setSelectedSlot(null);
    }
  }, [selectedDate, selectedDuration, slots]);

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedDuration(1);
  };

  const handleDurationChange = (event) => {
    setSelectedDuration(event.target.value);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookNow = () => {
    if (!selectedSlot) return;
    
    const bookingDetails = {
      slotId: selectedSlot.id,
      courtName: court.name,
      courtLocation: court.location,
      date: selectedDate.format('YYYY-MM-DD'),
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      durationHours: selectedSlot.durationHours,
      price: calculatePrice(),
      purpose: "Recreational", // Or get from user input
      numberOfPlayers: 4 // Or get from user input
    };

    navigate('/payment', { state: { bookingDetails } });
  };

  const calculatePrice = () => {
    if (!selectedSlot || !court) return 0;

    const startTime = dayjs(selectedSlot.startTime, 'HH:mm');
    const peakStart = dayjs(court.peakStartTime || '16:00', 'HH:mm');
    const peakEnd = dayjs(court.peakEndTime || '20:00', 'HH:mm');

    const isPeak = startTime.isAfter(peakStart) && startTime.isBefore(peakEnd);

    return selectedSlot.durationHours *
      (isPeak ? (court.peakHourlyPrice || 80) : (court.offPeakHourlyPrice || 50));
  };

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
            <IconButton onClick={handlePrevMonth}>
              <LeftIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              {currentMonth.format('MMMM YYYY')}
            </Typography>
            <IconButton onClick={handleNextMonth}>
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

  const renderDurationSelector = () => {
    if (!selectedDate) return null;

    return (
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Select Duration for {selectedDate.format('MMMM D, YYYY')}
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="duration-select-label">Duration (hours)</InputLabel>
            <Select
              labelId="duration-select-label"
              value={selectedDuration}
              label="Duration (hours)"
              onChange={handleDurationChange}
              sx={{ mb: 2 }}
            >
              <MenuItem value={1}>1 hour</MenuItem>
              <MenuItem value={2}>2 hours</MenuItem>
              <MenuItem value={3}>3 hours</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            Choose how long you want to book the court
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderTimeSlots = () => {
    if (!selectedDate || !selectedDuration || availableSlots.length === 0) {
      return null;
    }

    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Available Time Slots - {selectedDate.format('dddd, MMMM D, YYYY')}
          </Typography>

          <Grid container spacing={2}>
            {availableSlots.map((slot) => (
              <Grid item xs={12} sm={6} md={4} key={slot.id}>
                <Button
                  fullWidth
                  variant={selectedSlot?.id === slot.id ? "contained" : "outlined"}
                  onClick={() => handleSlotSelect(slot)}
                  sx={{
                    py: 1.5,
                    borderRadius: '8px',
                    borderColor: '#1976d2',
                    color: selectedSlot?.id === slot.id ? '#fff' : '#1976d2',
                    backgroundColor: selectedSlot?.id === slot.id ? '#1976d2' : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedSlot?.id === slot.id ? '#1565c0' : '#e3f2fd',
                      borderColor: '#1565c0'
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

              {selectedSlot && (
                <>
                  <Typography variant="body1">
                    <strong>Time:</strong> {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Duration:</strong> {selectedSlot.durationHours} hours
                  </Typography>
                  <Typography variant="body1">
                    <strong>Court:</strong> #{selectedSlot.courtNumber}
                  </Typography>
                </>
              )}
            </Stack>
          )}

          {selectedSlot && (
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
                  RM{calculatePrice().toFixed(2)}
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
                  disabled={!selectedSlot}
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

          {!selectedSlot && selectedDate && (
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
          {renderDurationSelector()}
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