import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Paper, Typography, 
  CircularProgress, Box, Button, Chip
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import CourtService from '../../service/CourtService';
import CourtDetails from './CourtDetails';

const CourtDetailPage = () => {
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
      } catch (err) {
        setError(err.message || 'Failed to load court details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourt();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
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

  if (!court) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Court not found
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/courts')}
          sx={{ mt: 2 }}
        >
          Browse Available Courts
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 4 }}
      >
        Back
      </Button>
      
      <CourtDetails court={court} />
    </Container>
  );
};

export default CourtDetailPage;