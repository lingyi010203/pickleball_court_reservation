import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Divider, Button, 
  List, ListItem, ListItemText, Chip, CircularProgress
} from '@mui/material';
import CourtService from '../../service/CourtService';
import { formatTime } from './DateUtils';

const CourtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        setLoading(true);
        const courtData = await CourtService.getCourtById(id);
        setCourt(courtData);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load court details');
        setCourt(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourt();
  }, [id]);

  const handleBookNow = () => {
    navigate(`/booking/${id}`);
  };

  const formatDays = (days) => {
    if (!days) return 'Daily';
    return days.split(',').map(day => day.trim()).join(', ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  if (!court) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Court not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        {court.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {court.location}
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: '12px' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              Operating Hours
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Opening Time:</strong> {formatTime(court.openingTime)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Closing Time:</strong> {formatTime(court.closingTime)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Operating Days:</strong> {formatDays(court.operatingDays)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Status:</strong> 
                  <Chip 
                    label={court.status} 
                    sx={{ 
                      ml: 1,
                      backgroundColor: court.status === 'ACTIVE' ? '#4caf50' : 
                                     court.status === 'MAINTENANCE' ? '#ff9800' : '#f44336',
                      color: 'white'
                    }} 
                  />
                </Typography>
              </Grid>
            </Grid>
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              Pricing
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Peak Hourly:</strong> ${court.peakHourlyPrice}/hr
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({formatTime(court.peakStartTime)} - {formatTime(court.peakEndTime)})
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Off-Peak Hourly:</strong> ${court.offPeakHourlyPrice}/hr
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Daily Pass:</strong> ${court.dailyPrice}
                </Typography>
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              size="large" 
              fullWidth
              sx={{ 
                backgroundColor: '#8e44ad',
                '&:hover': { backgroundColor: '#732d91' },
                py: 1.5,
                mt: 2
              }}
              onClick={handleBookNow}
            >
              Book Now
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: '12px' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              Amenities
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText primary="High-quality pickleball courts" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Professional-grade equipment rental" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Changing rooms and showers" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Pro shop with accessories" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Refreshment area" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Free parking" />
              </ListItem>
            </List>
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
              Rules & Guidelines
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText primary="Proper sports attire required" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Respect court reservation times" />
              </ListItem>
              <ListItem>
                <ListItemText primary="No outside food or drinks" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Follow staff instructions" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourtDetails;