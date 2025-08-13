// src/components/home/UpcomingEvents.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  LinearProgress, 
  Grid, 
  CircularProgress,
  Alert,
  useTheme as useMuiTheme
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventService from '../../service/EventService';
import ThemedCard from '../common/ThemedCard';
import { useTheme } from '../../context/ThemeContext';

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
const formatTime = (isoString) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { getPrimaryColor, getPrimaryDarkColor, getPrimaryLightColor } = useTheme();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await EventService.getUpcomingEvents();
        console.log('Raw events data:', data);
                 const eventsList = (data.content || []).slice(0, 4);
        console.log('Processed events:', eventsList);
        if (eventsList.length > 0) {
          console.log('First event ID:', eventsList[0].id);
          console.log('First event structure:', eventsList[0]);
        }
        setEvents(eventsList);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load upcoming events. Please try again later.');
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
         width: '100%',
         minHeight: 200, // 设置最小高度
         height: 'auto'  // 自动高度
       }}
     >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color: 'black' }}>Upcoming Events</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate('/events')}
          sx={{
            borderColor: getPrimaryColor(),
            color: getPrimaryColor(),
            '&:hover': {
              borderColor: getPrimaryDarkColor(),
              backgroundColor: muiTheme.palette.mode === 'dark' ? '#2c2c2c' : `${getPrimaryColor()}10`,
            }
          }}
        >
          View All Events
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress size={40} sx={{ color: getPrimaryColor() }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading upcoming events...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2, backgroundColor: getPrimaryColor(), '&:hover': { backgroundColor: getPrimaryDarkColor() } }}
          >
            Try Again
          </Button>
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No upcoming events available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Check back later for new events or create your own!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/events')}
            sx={{ 
              background: `linear-gradient(135deg, ${getPrimaryColor()}, ${getPrimaryLightColor()})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${getPrimaryDarkColor()}, ${getPrimaryColor()})`
              }
            }}
          >
            Browse All Events
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map(event => (
                         <Grid item xs={12} sm={6} md={3} key={event.id}>
               <ThemedCard sx={{ height: 240, width: 250, display: 'flex', flexDirection: 'column' }}>
                                 <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: 'black' }}>{event.title}</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <CalendarMonthIcon fontSize="small" sx={{ color: getPrimaryColor() }} />
                      <Typography variant="body2" sx={{ color: 'black' }}>{formatDate(event.startTime)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" sx={{ color: getPrimaryColor() }} />
                      <Typography variant="body2" sx={{ color: 'black' }}>{formatTime(event.startTime)}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1, color: 'black' }}>
                    Participants: {event.registeredCount || 0}/{event.capacity || 'Unlimited'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={event.capacity ? (event.registeredCount / event.capacity) * 100 : 0}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4, 
                      mb: 2,
                      backgroundColor: muiTheme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPrimaryColor()
                      }
                    }}
                  />
                                     <Box sx={{ mt: 'auto', pt: 2 }}>
                     <Button 
                       variant="contained" 
                       size="small"
                       fullWidth
                       onClick={() => navigate(`/events?eventId=${event.id}`)}
                       sx={{
                         background: `linear-gradient(135deg, ${getPrimaryColor()}, ${getPrimaryLightColor()})`,
                         fontWeight: 600,
                         textTransform: 'none',
                         fontSize: '0.875rem',
                         borderRadius: '8px',
                         py: 1,
                         '&:hover': { 
                           background: `linear-gradient(135deg, ${getPrimaryDarkColor()}, ${getPrimaryColor()})`,
                           boxShadow: `0 2px 8px ${getPrimaryColor()}40`
                         }
                       }}
                     >
                       View Details
                     </Button>
                   </Box>
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