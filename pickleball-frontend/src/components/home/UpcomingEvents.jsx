// src/components/home/UpcomingEvents.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Button, LinearProgress, Grid, CircularProgress } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventService from '../../service/EventService';
import ThemedCard from '../common/ThemedCard';

const formatDate = (isoString) => new Date(isoString).toLocaleDateString();
const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await EventService.getUpcomingEvents();
        setEvents((data.content || []).slice(0, 3));
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <Box 
      sx={{ 
        mb: 6,
        maxWidth: 1200,
        mx: 'auto',
        width: '100%'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Upcoming Events</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate('/events')}>View All</Button>
      </Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map(event => (
            <Grid item xs={12} md={6} key={event.id}>
              <ThemedCard>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>{event.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarMonthIcon fontSize="small" />
                      <Typography variant="body2">{formatDate(event.startTime)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">{formatTime(event.startTime)}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Participants: {event.registeredCount}/{event.capacity}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={event.capacity ? (event.registeredCount / event.capacity) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </ThemedCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default UpcomingEvents;