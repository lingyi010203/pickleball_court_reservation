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
  IconButton,
  TextField,
  Snackbar,
  MenuItem,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CalendarToday as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AccessTime
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { formatTime } from '../../components/court/DateUtils';
import CourtService from '../../service/CourtService';
import { getAvailableSlotsForCourt } from '../../service/SlotService';
import BookingService from '../../service/BookingService';
import dayjs from 'dayjs';
import ThemedCard from '../common/ThemedCard';

const PADDLE_PRICE = 5; // 每个 paddle 租金
const BALL_SET_PRICE = 12; // 一组 ball set 售价

const BookingPage = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Today');
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [numPlayers, setNumPlayers] = useState(2);
  const [numPaddles, setNumPaddles] = useState(0);
  const [buyBallSet, setBuyBallSet] = useState(false);

  // 日历数据结构
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const tabs = ['Today', 'Tomorrow', 'This Week', 'Custom Date'];

  // 生成日历数据
  const generateCalendar = (month = dayjs()) => {
    const startOfMonth = month.startOf('month');
    const endOfMonth = month.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');

    const calendar = [];
    let week = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }

      week.push({
        date: current.date(),
        month: current.month(),
        year: current.year(),
        isCurrentMonth: current.month() === month.month()
      });
      current = current.add(1, 'day');
    }

    if (week.length > 0) {
      calendar.push(week);
    }

    return calendar;
  };

  const calendar = generateCalendar(currentMonth);

  // 检查日期是否可用
  const isDateAvailable = (dateObj) => {
    if (!dateObj || !dateObj.isCurrentMonth) return false;
    const dateStr = dayjs().year(dateObj.year).month(dateObj.month).date(dateObj.date).format('YYYY-MM-DD');
    return availableDates.includes(dateStr);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courtData = await CourtService.getCourtById(courtId);
        setCourt(courtData);

        const slotsData = await getAvailableSlotsForCourt(courtId);
        setSlots(slotsData);

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
      let filtered = slots.filter(slot => slot.date === selectedDate.format('YYYY-MM-DD'));

      if (selectedDate.isSame(dayjs(), 'day')) {
        const nowPlus2h = dayjs().add(2, 'hour');
        filtered = filtered.filter(slot => {
          const slotDateTime = dayjs(`${slot.date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
          return slotDateTime.isAfter(nowPlus2h);
        });
      }

      setAvailableSlots(filtered);
      setSelectedSlots([]);
    }
  }, [selectedDate, slots]);

  const handleSlotSelect = (slot) => {
    if (selectedSlots.some(s => s.id === slot.id)) {
      setSelectedSlots(selectedSlots.filter(s => s.id !== slot.id));
      return;
    }

    if (selectedSlots.length > 0 && slot.date !== selectedSlots[0].date) return;

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

  const handleBookNow = () => {
    if (!selectedSlots.length) return;
    const bookingDetails = {
      slotIds: selectedSlots.map(s => s.id),
      courtName: court.name,
      courtLocation: court.location,
      venueName: court.venue?.name,
      venueLocation: court.venue?.location,
      date: selectedDate.format('YYYY-MM-DD'),
      startTime: selectedSlots[0].startTime,
      endTime: selectedSlots[selectedSlots.length - 1].endTime,
      durationHours: selectedSlots.length,
      price: totalPrice, // 传递场地费用（不含equipment）
      numberOfPlayers: numPlayers, // 传递人数
      numPaddles, // 传递paddle数量
      buyBallSet // 传递ball set选择
    };
    navigate('/payment', { state: { bookingDetails } });
  };

  const calculatePrice = () => {
    if (!selectedSlots.length || !court) return 0;

    const startTime = selectedSlots[0].startTime; // Use string directly
    const peakStart = court.peakStartTime || '16:00';
    const peakEnd = court.peakEndTime || '20:00';

    const isPeak = startTime >= peakStart && startTime <= peakEnd;

    return selectedSlots.length * (isPeak ? (court.peakHourlyPrice || 80) : (court.offPeakHourlyPrice || 50));
  };

  const totalDuration = selectedSlots.length;
  const totalPrice = totalDuration * (selectedSlots[0] && court ? (() => {
    const startTime = selectedSlots[0].startTime; // Use string directly
    const peakStart = court.peakStartTime || '16:00';
    const peakEnd = court.peakEndTime || '20:00';
    const isPeak = startTime >= peakStart && startTime <= peakEnd;
    return isPeak ? (court.peakHourlyPrice || 80) : (court.offPeakHourlyPrice || 50);
  })() : 0);

  // 计算总价 (仅场地费用)
  const total = totalPrice;

  const renderBookingSummary = () => {
    if (!court) return null;
    return (
      <ThemedCard sx={{
        position: 'sticky',
        top: 20,
        borderRadius: 3,
        boxShadow: 3,
        mb: 4,
        background: 'linear-gradient(135deg, #f8f9ff, #ffffff)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Booking Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* 场地和场馆 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Court</Typography>
            <Typography variant="body1" fontWeight="bold">{court.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {court.venue?.name || court.location}{court.venue?.location ? `，${court.venue.location}` : ''}
            </Typography>
          </Box>

          {/* 日期和时间 */}
          {selectedDate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Date</Typography>
              <Typography variant="body1">{selectedDate.format('dddd, MMMM D, YYYY')}</Typography>
              {selectedSlots.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Time</Typography>
                  <Typography variant="body1">
                    {formatTime(selectedSlots[0].startTime)} - {formatTime(selectedSlots[selectedSlots.length - 1].endTime)}
                    <span style={{ marginLeft: 8, fontSize: 13, color: '#888' }}>({totalDuration}h)</span>
                  </Typography>
                </>
              )}
            </Box>
          )}



                  {/* 价格详情 */}
        {selectedSlots.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Pricing Details:
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Off-peak: RM{court.offPeakHourlyPrice || 50}/hour
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Peak: RM{court.peakHourlyPrice || 80}/hour
            </Typography>
          </Box>
        )}

        {/* 总价 */}
        {selectedSlots.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Grid container>
              <Grid item xs={7}>
                <Typography variant="body1" fontWeight="bold">
                  Court Rental:
                </Typography>
              </Grid>
              <Grid item xs={5} textAlign="right">
                <Typography variant="body1" fontWeight="bold" color="#2e7d32">
                  RM{total.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                disabled={!selectedSlots.length || !court}
                onClick={handleBookNow}
                sx={{ px: 6, py: 1.5, fontWeight: 600, fontSize: '1.1rem', borderRadius: 2 }}
              >
                Book Now
              </Button>
            </Box>
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
      </ThemedCard >
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
        <ThemedCard sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          mb: 4,
          background: 'linear-gradient(135deg, #f8f9ff, #ffffff)'
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* 头部 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                Book Court
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Reserve a pickleball court for your next game
              </Typography>
            </Box>

            {/* Tab导航 */}
            <Box sx={{
              display: 'flex',
              gap: 1,
              mb: 4,
              p: 0.5,
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: '12px',
              width: 'fit-content'
            }}>
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "contained" : "outlined"}
                  onClick={() => {
                    setActiveTab(tab);
                    switch (tab) {
                      case 'Today':
                        setSelectedDate(dayjs());
                        setCurrentMonth(dayjs());
                        break;
                      case 'Tomorrow':
                        setSelectedDate(dayjs().add(1, 'day'));
                        setCurrentMonth(dayjs().add(1, 'day'));
                        break;
                      case 'This Week':
                        setSelectedDate(dayjs().add(7, 'day'));
                        setCurrentMonth(dayjs().add(7, 'day'));
                        break;
                      case 'Custom Date':
                        // Keep current date for custom selection
                        break;
                    }
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                    ...(activeTab === tab && {
                      background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                      color: 'white',
                      boxShadow: '0 4px 8px rgba(37, 117, 252, 0.25)'
                    })
                  }}
                >
                  {tab}
                </Button>
              ))}
            </Box>

            {/* 日历头部 */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4
            }}>
              <IconButton
                onClick={() => {
                  const newMonth = currentMonth.subtract(1, 'month');
                  setCurrentMonth(newMonth);
                }}
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.03)',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>

              <Typography variant="h6" fontWeight="bold">
                {currentMonth.format('MMMM YYYY')}
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setCurrentMonth(dayjs());
                  setSelectedDate(dayjs());
                }}
                sx={{
                  ml: 2,
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                Today
              </Button>

              <IconButton
                onClick={() => {
                  const newMonth = currentMonth.add(1, 'month');
                  setCurrentMonth(newMonth);
                }}
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.03)',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>

            {/* 日历网格 */}
            <Box sx={{ mb: 4 }}>
              {/* 星期标题 */}
              <Grid container spacing={0} sx={{ mb: 2 }}>
                {daysOfWeek.map((day) => (
                  <Grid item xs key={day}>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'text.secondary',
                        py: 1
                      }}
                    >
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* 日期网格 */}
              <Grid container spacing={1}>
                {calendar.map((week, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {week.map((dateObj, dateIndex) => (
                      <Grid item xs key={`${weekIndex}-${dateIndex}`}>
                        {dateObj.isCurrentMonth ? (
                          <Button
                            fullWidth
                            variant={selectedDate?.date() === dateObj.date && selectedDate?.month() === dateObj.month ? "contained" : "outlined"}
                            onClick={() => {
                              if (isDateAvailable(dateObj)) {
                                const newDate = dayjs().year(dateObj.year).month(dateObj.month).date(dateObj.date);
                                setSelectedDate(newDate);
                              }
                            }}
                            disabled={!isDateAvailable(dateObj)}
                            sx={{
                              height: 56,
                              minWidth: 0,
                              borderRadius: '12px',
                              fontWeight: 600,
                              ...(selectedDate?.date() === dateObj.date && selectedDate?.month() === dateObj.month && {
                                background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(37, 117, 252, 0.3)'
                              }),
                              ...(isDateAvailable(dateObj) ? {} : {
                                border: '2px solid #f44336',
                                color: '#f44336',
                                opacity: 0.7,
                                '&:hover': {
                                  border: '2px solid #f44336',
                                  backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                }
                              })
                            }}
                          >
                            {dateObj.date}
                          </Button>
                        ) : (
                          <Box sx={{ height: 56 }} />
                        )}
                      </Grid>
                    ))}
                  </React.Fragment>
                ))}
              </Grid>
            </Box>

            {/* 时间槽位 */}
            <ThemedCard sx={{
              borderRadius: 3,
              background: 'white',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <CardContent>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3
                }}>
                  <AccessTime sx={{
                    color: 'text.secondary',
                    mr: 1.5
                  }} />
                  <Typography variant="h6" fontWeight="bold">
                    Available Time Slots - {selectedDate?.format('dddd, MMMM D, YYYY')}
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <Grid item xs={6} sm={4} md={3} key={slot.id}>
                        <Button
                          fullWidth
                          variant={
                            selectedSlots.some(s => s.id === slot.id)
                              ? "contained"
                              : slot.status === 'BOOKED'
                                ? "outlined"
                                : "outlined"
                          }
                          onClick={() => handleSlotSelect(slot)}
                          disabled={slot.status === 'BOOKED'}
                          sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 600,
                            ...(selectedSlots.some(s => s.id === slot.id) ? {
                              background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                              color: 'white',
                              boxShadow: '0 4px 8px rgba(37, 117, 252, 0.3)'
                            } : {}),
                            ...(slot.status === 'BOOKED' ? {
                              borderColor: '#e53935',
                              color: '#e53935',
                              opacity: 0.7
                            } : {})
                          }}
                        >
                          {formatTime(slot.startTime)}
                        </Button>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'text.secondary'
                      }}>
                        <AccessTime sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1">
                          No available time slots for this date
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </ThemedCard>

            {/* 价格信息 */}
            {court && (
              <Box sx={{
                mt: 3,
                p: 2,
                bgcolor: 'rgba(46, 125, 50, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="body2" fontWeight="600" color="success.main">
                  RM{court.offPeakHourlyPrice || 50}-{court.peakHourlyPrice || 80}/hour
                </Typography>
              </Box>
            )}
          </CardContent>
        </ThemedCard>
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