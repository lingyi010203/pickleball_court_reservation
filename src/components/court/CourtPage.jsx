import React, { useState, useEffect } from 'react';
import CourtService from '../../service/CourtService'; 
import CourtCard from './CourtCard';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonGroup, Grid, Typography } from '@mui/material';

const CourtPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtData = await CourtService.getAllCourts();
        setCourts(courtData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, []);

  const filteredCourts = filterStatus === 'all' 
    ? courts 
    : courts.filter(court => court.status.toLowerCase() === filterStatus);

  const handleBookNow = (courtId) => {
    navigate(`/booking/${courtId}`);
  };

  if (loading) return <Typography>Loading courts...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Available Courts
      </Typography>
      
      <ButtonGroup sx={{ mb: 3 }}>
        <Button 
          variant={filterStatus === 'all' ? 'contained' : 'outlined'}
          onClick={() => setFilterStatus('all')}
          sx={{ 
            backgroundColor: filterStatus === 'all' ? '#8e44ad' : 'inherit',
            '&:hover': filterStatus === 'all' ? { backgroundColor: '#732d91' } : {}
          }}
        >
          All Courts
        </Button>
        <Button 
          variant={filterStatus === 'active' ? 'contained' : 'outlined'}
          onClick={() => setFilterStatus('active')}
          sx={{ 
            backgroundColor: filterStatus === 'active' ? '#8e44ad' : 'inherit',
            '&:hover': filterStatus === 'active' ? { backgroundColor: '#732d91' } : {}
          }}
        >
          Active
        </Button>
        <Button 
          variant={filterStatus === 'maintenance' ? 'contained' : 'outlined'}
          onClick={() => setFilterStatus('maintenance')}
          sx={{ 
            backgroundColor: filterStatus === 'maintenance' ? '#8e44ad' : 'inherit',
            '&:hover': filterStatus === 'maintenance' ? { backgroundColor: '#732d91' } : {}
          }}
        >
          Maintenance
        </Button>
      </ButtonGroup>
      
      {filteredCourts.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
          No courts found matching your criteria
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredCourts.map(court => (
            <Grid item key={court.id} xs={12} sm={6} md={4}>
              <CourtCard court={court} onBookNow={handleBookNow} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CourtPage;