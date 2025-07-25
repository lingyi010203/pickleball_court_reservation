// CourtAvailabilityPage.jsx
// Select date and time range, then display available courts, using CourtCard
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Grid, CircularProgress, Paper, Divider } from '@mui/material';
import TextField from '@mui/material/TextField';
import CourtCard from './CourtCard';
import CourtService from '../../service/CourtService';

const CourtAvailabilityPage = () => {
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

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
        Find Available Courts
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Select a date and time range to see all courts you can book instantly.
      </Typography>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 3, maxWidth: 700, mx: 'auto' }}>
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Date"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
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
              sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', borderRadius: 2 }}
              startIcon={loading ? <CircularProgress size={22} color="inherit" /> : null}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
        {error && !loading && (
          <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>{error}</Typography>
        )}
      </Paper>
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {queried ? 'Available Courts' : 'Results will appear here'}
      </Typography>
      <Box sx={{ minHeight: 200 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && queried && availableCourts.length === 0 && !error && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            No courts available for the selected time range. Try a different time or date.
          </Typography>
        )}
        <Grid container spacing={3}>
          {availableCourts.map(court => (
            <Grid item xs={12} sm={6} md={4} key={court.id}>
              <CourtCard court={court} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

CourtAvailabilityPage.propTypes = {};

export default CourtAvailabilityPage; 