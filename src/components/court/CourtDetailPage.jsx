import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    CircularProgress,
    Chip,
    Divider,
    Stack,
    Avatar
} from '@mui/material';
import {
    LocationOn as LocationIcon,
    Schedule as ScheduleIcon,
    MonetizationOn as PriceIcon,
    People as PeopleIcon,
    ArrowBack as BackIcon,
    Star as StarIcon
} from '@mui/icons-material';
import SlotCalendar from './SlotCalendar';
import { formatTime } from './DateUtils';
import CourtService from '../../service/CourtService';
import { getAvailableSlotsForCourt } from '../../service/SlotService';
import dayjs from 'dayjs';

const CourtDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [court, setCourt] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    useEffect(() => {
    const fetchCourtDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const courtData = await CourtService.getCourtById(id);
        setCourt(courtData);
        
      } catch (err) {
        console.error('Failed to fetch court details:', err);
        setError('Failed to load court details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourtDetails();
  }, [id]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleBookSlot = (slotId) => {
        navigate(`/booking/${id}?slotId=${slotId}`);
    };

    const handleOpenCalendar = () => {
        setCalendarOpen(true);
    };

    const handleCloseCalendar = () => {
        setCalendarOpen(false);
    };

     const handleBookNow = () => {
    navigate(`/booking/${id}`);
  };

    if (loading) {
        return (
            <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading court details...</Typography>
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

    if (!court) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                    Court not found
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/courts')}
                    sx={{ mt: 2 }}
                >
                    Browse Courts
                </Button>
            </Container>
        );
    }

    return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        variant="outlined" 
        onClick={() => navigate('/courts')} 
        sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
        startIcon={<BackIcon />}
      >
        Back to Courts
      </Button>
      
      {court && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              {court.name}
            </Typography>
            <Chip 
              label={court.status === 'AVAILABLE' ? 'Available' : 'Maintenance'} 
              color={court.status === 'AVAILABLE' ? 'success' : 'error'}
              sx={{ fontWeight: 'bold', fontSize: '1rem', px: 2, py: 1 }}
            />
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Card sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    height: 300, 
                    backgroundImage: `url(${court.imageUrl || '/default-court.jpg'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} 
                />
              </Card>
              
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Court Details
                  </Typography>
                  
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        <strong>Location:</strong> {court.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        <strong>Hours:</strong> {court.openingTime} - {court.closingTime}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PriceIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        <strong>Peak:</strong> RM{court.peakHourlyPrice}/hour
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PriceIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        <strong>Off-Peak:</strong> RM{court.offPeakHourlyPrice}/hour
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        <strong>Courts:</strong> {court.numberOfCourts}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Button 
                    variant="contained" 
                    fullWidth 
                    sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
                    onClick={handleBookNow}
                  >
                    BOOK NOW
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Card sx={{ mt: 4, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Description
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {court.description || 'No description available'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default CourtDetailPage;