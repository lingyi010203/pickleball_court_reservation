// src/components/home/FeaturedCourts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, CardMedia, Typography, Box, Button, Chip, CircularProgress } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CourtService from '../../service/CourtService';

const FeaturedCourts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const data = await CourtService.getAllCourts();
        setCourts(data.slice(0, 3)); // 只显示前3个featured
      } catch (err) {
        setCourts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Featured Courts</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate('/courts')}>View All Courts</Button>
      </Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courts.map(court => (
            <Grid item xs={12} md={4} key={court.id}>
              <Card sx={{ borderRadius: 3, position: 'relative', boxShadow: 3, overflow: 'visible' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 160,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 48,
                    position: 'relative'
                  }}
                >
                  🎾
                  {court.status === 'MAINTENANCE' && (
                    <Chip label="Unavailable" color="error" size="small" sx={{ position: 'absolute', top: 12, right: 12 }} />
                  )}
                </CardMedia>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">{court.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon fontSize="small" color="warning" />
                      <Typography variant="body2">{court.rating || '4.8'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{court.location}</Typography>
                  </Box>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    RM {court.offPeakHourlyPrice || court.price || 25}/hour
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {(court.features || []).map(f => (
                      <Chip key={f} label={f} size="small" sx={{ bgcolor: '#ecf0f1', color: '#666' }} />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => navigate(`/courts/${court.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      disabled={court.status === 'MAINTENANCE'}
                      onClick={() => navigate(`/booking/${court.id}`)}
                    >
                      Book Now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FeaturedCourts;