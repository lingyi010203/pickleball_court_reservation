import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Grid, Typography, 
  TextField, Button, Chip, Skeleton,
  Paper, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { FilterList as FilterIcon, Search as SearchIcon, SportsTennis as CourtIcon } from '@mui/icons-material';
import CourtCard from './CourtCard';
import CourtService from '../../service/CourtService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CourtListPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { authToken, currentUser } = useAuth();

  // Fetch courts
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const courtsData = await CourtService.getAllCourts();
        setCourts(courtsData);
        setFilteredCourts(courtsData);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load courts');
        setLoading(false);
      }
    };
    
    fetchCourts();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = courts;
    
    if (searchTerm) {
      result = result.filter(court => 
        court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        court.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(court => court.status === statusFilter.toUpperCase());
    }
    
    if (locationFilter !== 'all') {
      result = result.filter(court => court.location === locationFilter);
    }
    
    setFilteredCourts(result);
  }, [courts, searchTerm, statusFilter, locationFilter]);

  const handleRetry = () => window.location.reload();
  const uniqueLocations = [...new Set(courts.map(court => court.location))];

  const handleBookNow = (courtId) => {
    navigate(`/booking/${courtId}`);
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
          Find Your Perfect Court
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Discover premium pickleball courts with state-of-the-art facilities and competitive pricing
        </Typography>
      </Box>

      {/* Search & Filters Section */}
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
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<FilterIcon />}
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
              sx={{ height: 56, borderRadius: 2, fontSize: '1rem', fontWeight: 700 }}
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
                    <MenuItem value="available">Available</MenuItem>
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

      {/* Content Section */}
      {error ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={handleRetry}>
            Retry
          </Button>
        </Box>
      ) : (
        <>
          {filteredCourts.length > 0 ? (
            <Grid container spacing={4}>
              {filteredCourts.map(court => (
                <Grid item key={court.id} xs={12} sm={6} md={4} lg={3}>
                  <CourtCard court={court} loading={loading} onBookNow={handleBookNow} />
                </Grid>
              ))}
            </Grid>
          ) : (
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
                <CourtIcon sx={{ fontSize: 60, color: '#1976d2' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                No Courts Match Your Search
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                Try adjusting your filters or search terms
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setLocationFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Footer */}
      <Box sx={{ mt: 8, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} Pickleball Pro. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default CourtListPage;