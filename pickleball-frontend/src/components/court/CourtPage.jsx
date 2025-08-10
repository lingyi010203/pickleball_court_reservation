import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, TextField,
  Button, Chip, Paper, Container,
  CircularProgress, MenuItem, InputLabel, FormControl, Select
} from '@mui/material';
import { FilterList, Search, SportsTennis } from '@mui/icons-material';
import CourtService from '../../service/CourtService';
import CourtCard from './CourtCard';
import Footer from '../common/Footer';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';


const CourtPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { authToken } = useAuth();

  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtData = await CourtService.getAllCourts();
        setCourts(courtData);
        setFilteredCourts(courtData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, []);

  useEffect(() => {
  let result = courts;

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(court =>
      court.name.toLowerCase().includes(term) ||
      court.location.toLowerCase().includes(term)
    );
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    result = result.filter(court =>
      court.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }

  // Apply location filter
  if (locationFilter !== 'all') {
    result = result.filter(court => court.location === locationFilter);
  }

  setFilteredCourts(result);
}, [courts, searchTerm, statusFilter, locationFilter]);

  const uniqueLocations = [...new Set(courts.map(court => court.location))];

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
  };

  const handleBookNow = (courtId) => {
    if (!authToken) {
      // 未登录用户重定向到登录页面
      navigate('/login');
    } else {
      // 已登录用户直接跳转到预订页面
      navigate(`/booking/${courtId}`);
    }
  };

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
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{
          fontWeight: 800,
          mb: 2,
          background: 'linear-gradient(45deg, #1976d2 30%, #4caf50 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Find Your Perfect Court
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Discover premium pickleball courts with state-of-the-art facilities
        </Typography>
      </Box>

      {/* Search & Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search courts by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ height: 56 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>

          <Grid item xs={6} md={3}>
            <Chip
              label={`${filteredCourts.length} courts available`}
              color="primary"
              sx={{
                height: 56,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 700,
                width: '100%'
              }}
            />
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        {showFilters && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    label="Location"
                  >
                    <MenuItem value="all">All Locations</MenuItem>
                    {uniqueLocations.map(location => (
                      <MenuItem key={location} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Court Cards */}
      {filteredCourts.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 8 }}>
          <Box sx={{
            width: 120,
            height: 120,
            bgcolor: '#e3f2fd',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}>
            <SportsTennis sx={{ fontSize: 60, color: '#1976d2' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            No Courts Found
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            Try adjusting your filters or search terms
          </Typography>
          <Button
            variant="outlined"
            onClick={handleResetFilters}
          >
            Reset Filters
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredCourts.map(court => (
            <Grid item key={court.id} xs={12} sm={6} md={4} lg={3}>
              <CourtCard
                court={court}
                onBookNow={() => handleBookNow(court.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Footer />
    </Container>
  );
};

export default CourtPage;