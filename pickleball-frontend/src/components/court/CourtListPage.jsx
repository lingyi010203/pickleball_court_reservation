import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Grid, Typography, 
  TextField, Button, Chip, Paper,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Search as SearchIcon, SportsTennis as CourtIcon } from '@mui/icons-material';
import CourtCard from './CourtCard';
import CourtService from '../../service/CourtService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CourtListPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [groupedVenues, setGroupedVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [venueFilter, setVenueFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const navigate = useNavigate();
  const { authToken, currentUser } = useAuth();

  // Fetch courts
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const courtsData = await CourtService.getAllCourts();
        setCourts(courtsData);
        setFilteredCourts(courtsData);
        setGroupedVenues(groupCourtsByVenue(courtsData));
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load courts');
        setLoading(false);
      }
    };
    
    fetchCourts();
  }, []);

  // Group courts by venue
  const groupCourtsByVenue = (courts) => {
    const venueMap = new Map();

    courts.forEach(court => {
      const venue = court.venue;
      if (!venue) return;

      if (!venueMap.has(venue.id)) {
        venueMap.set(venue.id, {
          venueId: venue.id,
          name: venue.name,
          location: venue.location,
          description: venue.description,
          courts: []
        });
      }
      venueMap.get(venue.id).courts.push(court);
    });

    return Array.from(venueMap.values());
  };

  // Apply filters
  useEffect(() => {
    let result = courts;
    
    if (searchTerm) {
      result = result.filter(court => 
        court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        court.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (court.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }
    
    if (venueFilter !== 'all') {
      result = result.filter(court => court.venue?.name === venueFilter);
    }

    if (stateFilter !== 'all') {
      result = result.filter(court => court.venue?.state === stateFilter);
    }

    if (priceFilter !== 'all') {
      result = result.filter(court => {
        const minPrice = getCourtMinPrice(court);
        if (!minPrice) return false;
        
        switch (priceFilter) {
          case '20to40':
            return minPrice >= 20 && minPrice <= 40;
          case '40to60':
            return minPrice >= 40 && minPrice <= 60;
          case 'over60':
            return minPrice > 60;
          default:
            return true;
        }
      });
    }

    setFilteredCourts(result);
    setGroupedVenues(groupCourtsByVenue(result));
  }, [courts, searchTerm, venueFilter, stateFilter, priceFilter]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const courtsData = await CourtService.getAllCourts();
      setCourts(courtsData);
      setFilteredCourts(courtsData);
      setGroupedVenues(groupCourtsByVenue(courtsData));
    } catch (err) {
      setError(err.message || 'Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  const uniqueStates = [...new Set(courts.map(court => court.venue?.state).filter(Boolean))];
  
  // 根据选择的州获取可用的场馆
  const getVenuesByState = (selectedState) => {
    if (selectedState === 'all') {
      return [...new Set(courts.map(court => court.venue?.name).filter(Boolean))];
    }
    return [...new Set(
      courts
        .filter(court => court.venue?.state === selectedState)
        .map(court => court.venue?.name)
        .filter(Boolean)
    )];
  };
  
  const availableVenues = getVenuesByState(stateFilter);
  
  // 当州改变时，重置场馆过滤器
  useEffect(() => {
    if (stateFilter !== 'all') {
      const venuesInState = getVenuesByState(stateFilter);
      if (!venuesInState.includes(venueFilter)) {
        setVenueFilter('all');
      }
    }
  }, [stateFilter]);
  
  // 获取球场的最低价格用于过滤
  const getCourtMinPrice = (court) => {
    const prices = [
      court.peakHourlyPrice,
      court.offPeakHourlyPrice,
      court.dailyPrice
    ].filter(price => price && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
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

  return (
    <>
      {/* Hero Section with Background Image */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 280, md: 320 },
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.4) 100%), url(${process.env.PUBLIC_URL}/court-1.jpg)`
        }}
      >
        {/* Content overlay */}
        <Box sx={{ maxWidth: 1200, width: '100%', px: { xs: 2, sm: 3, lg: 4 }, textAlign: 'center' }}>
          <Typography
            variant="h3"
            fontWeight="800"
            sx={{ 
              color: '#fff', 
              textShadow: '0 6px 18px rgba(0,0,0,0.35)', 
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Find Your Perfect Court
          </Typography>
          <Typography
            variant="h6"
            sx={{ 
              color: 'rgba(255,255,255,0.9)', 
              maxWidth: 900, 
              mx: 'auto',
              mb: 3,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            Discover premium pickleball courts with state-of-the-art facilities and competitive pricing
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Search & Filters Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2 }}>
        {/* First Row: Search and Main Filters */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          {/* Search Bar */}
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search courts or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          {/* State Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>State</InputLabel>
              <Select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                label="State"
              >
                <MenuItem value="all">All States</MenuItem>
                {uniqueStates.map(state => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Venue Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Venue</InputLabel>
              <Select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                label="Venue"
                disabled={stateFilter === 'all' && availableVenues.length === 0}
              >
                <MenuItem value="all">
                  {stateFilter === 'all' ? 'Select State First' : `All Venues in ${stateFilter}`}
                </MenuItem>
                {availableVenues.map(venue => (
                  <MenuItem key={venue} value={venue}>
                    {venue}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Price Filter */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Price Range</InputLabel>
              <Select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                label="Price Range"
              >
                <MenuItem value="all">All Prices</MenuItem>
                <MenuItem value="20to40">RM 20 - RM 40</MenuItem>
                <MenuItem value="40to60">RM 40 - RM 60</MenuItem>
                <MenuItem value="over60">Over RM 60</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Clear Filters Button */}
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setStateFilter('all');
                setVenueFilter('all');
                setPriceFilter('all');
              }}
              sx={{
                height: 40,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderColor: '#7C4DFF',
                color: '#7C4DFF',
                '&:hover': {
                  borderColor: '#651FFF',
                  backgroundColor: 'rgba(124, 77, 255, 0.04)'
                }
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
        
        
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
          {groupedVenues.length > 0 ? (
            <>
              {groupedVenues.map(venue => (
                <Box key={venue.venueId} sx={{ mb: 6 }}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {venue.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                      {venue.location}
                    </Typography>
                    {venue.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {venue.description}
                      </Typography>
                    )}
                    <Chip 
                      label={`${venue.courts.length} courts available`}
                      color="primary"
                      sx={{ height: 32, borderRadius: 2, fontWeight: 700 }}
                    />
                  </Paper>
                  
                  <Grid container spacing={4}>
                    {venue.courts.map(court => (
                      <Grid item key={court.id} xs={12} sm={6} md={4} lg={3}>
                        <CourtCard court={court} loading={loading} onBookNow={handleBookNow} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </>
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
                  setStateFilter('all');
                  setVenueFilter('all');
                  setPriceFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Box>
          )}
        </>
      )}

      </Container>
    </>
  );
};

export default CourtListPage;
