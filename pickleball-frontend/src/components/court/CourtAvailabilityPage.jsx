// CourtAvailabilityPage.jsx
// Select date and time range, then display available courts, using CourtCard
import React, { useState } from 'react';
import { 
  Container, Box, Grid, Typography, 
  TextField, Button, Chip, Paper,
  CircularProgress, Alert, useTheme, alpha
} from '@mui/material';
import { 
  Search as SearchIcon, 
  SportsTennis as CourtIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import CourtCard from './CourtCard';
import CourtService from '../../service/CourtService';
import { useNavigate } from 'react-router-dom';

const CourtAvailabilityPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableCourts, setAvailableCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queried, setQueried] = useState(false);

  const handleQuery = async () => {
    setError('');
    setQueried(false);
    if (!selectedDate || !startTime || !endTime) {
      setError('Please select date and time range');
      return;
    }
    // Format validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setError('Date format should be YYYY-MM-DD');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      setError('Time format should be HH:mm');
      return;
    }
    setLoading(true);
    try {
      const courts = await CourtService.getAvailableCourts(selectedDate, startTime, endTime);
      setAvailableCourts(courts);
      setQueried(true);
      if (courts.length === 0) setError('No available courts for the selected time range.');
    } catch (err) {
      setAvailableCourts([]);
      setError('Query failed, please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (courtId) => {
    navigate(`/booking/${courtId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 800, 
          mb: 2,
          background: 'linear-gradient(45deg, #1976d2 30%, #4caf50 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Find Available Courts
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Select a date and time range to see all courts you can book instantly
        </Typography>
      </Box>

      {/* Search Section */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 3, 
        boxShadow: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            mb: 2
          }}>
            <ScheduleIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Check Availability
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose your preferred date and time to find available courts
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="center" justifyContent="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Start Time"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="End Time"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleQuery}
              disabled={loading}
              fullWidth
              size="large"
              startIcon={loading ? <CircularProgress size={22} color="inherit" /> : <SearchIcon />}
              sx={{ 
                py: 1.5, 
                fontWeight: 600, 
                fontSize: '1rem', 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>

        {error && !loading && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {queried && !loading && !error && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Chip 
              label={`${availableCourts.length} courts available for ${formatDate(selectedDate)}`}
              color="success"
              sx={{ 
                height: 40, 
                borderRadius: 2, 
                fontSize: '1rem', 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                color: 'white'
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Results Section */}
      {queried && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <LocationIcon sx={{ color: theme.palette.primary.main }} />
            Available Courts
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Searching for available courts...
                </Typography>
              </Box>
            </Box>
          ) : availableCourts.length === 0 && !error ? (
            <Box sx={{ textAlign: 'center', p: 8 }}>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                bgcolor: alpha(theme.palette.warning.main, 0.1), 
                borderRadius: '50%', 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}>
                <CourtIcon sx={{ fontSize: 60, color: theme.palette.warning.main }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                No Courts Available
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                No courts are available for the selected time range. Try a different time or date.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setSelectedDate('');
                  setStartTime('');
                  setEndTime('');
                  setQueried(false);
                }}
                sx={{ borderRadius: 2 }}
              >
                Try Different Time
              </Button>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {availableCourts.map(court => (
                <Grid item key={court.id} xs={12} sm={6} md={4} lg={3}>
                  <CourtCard court={court} onBookNow={handleBookNow} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Initial State */}
      {!queried && !loading && (
        <Box sx={{ textAlign: 'center', p: 8 }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            bgcolor: alpha(theme.palette.info.main, 0.1), 
            borderRadius: '50%', 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}>
            <CourtIcon sx={{ fontSize: 60, color: theme.palette.info.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Ready to Find Courts?
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Select a date and time range above to see all available courts for instant booking
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default CourtAvailabilityPage; 