import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Button, Chip, Divider, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CourtDetails = ({ court = {} }) => {
  const navigate = useNavigate();
  const { authToken } = useAuth();
  
  // 默认数据
  const defaultCourt = {
    id: 1,
    name: "Elite Pickleball Court",
    location: "Kuala Lumpur Sports Complex",
    status: "ACTIVE",
    openingTime: "06:00",
    closingTime: "23:00",
    operatingDays: "Monday - Sunday",
    peakHourlyPrice: "80",
    offPeakHourlyPrice: "50",
    description: "This premier pickleball court offers state-of-the-art facilities with professional-grade surfaces and lighting. Perfect for both casual play and competitive matches, our court features climate-controlled environments and top-tier amenities to enhance your playing experience.",
    rating: 4.8,
    totalReviews: 324,
    images: [
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
    ]
  };

  const courtData = { ...defaultCourt, ...court };
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % courtData.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + courtData.images.length) % courtData.images.length);
  };

  const amenities = [
    { icon: '👥', text: "Professional Courts", available: true },
    { icon: '🛍️', text: "Equipment Rental", available: true },
    { icon: '👕', text: "Changing Rooms", available: true },
    { icon: '🛍️', text: "Pro Shop", available: true },
    { icon: '☕', text: "Refreshment Area", available: true },
    { icon: '🚗', text: "Free Parking", available: true },
    { icon: '📶', text: "Free WiFi", available: true },
    { icon: '👥', text: "Group Lessons", available: false }
  ];

  return (
    <Box maxWidth="lg" mx="auto" p={2}>
      {/* Hero Section with Image Gallery */}
      <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ position: 'relative', height: 360, bgcolor: 'grey.200' }}>
          <img
            src={courtData.images[currentImageIndex]}
            alt={`${courtData.name} - Image ${currentImageIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Overlay */}
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.18)' }} />
          {/* Navigation Buttons */}
          <Button
            onClick={prevImage}
            sx={{ position: 'absolute', left: 16, top: '50%', minWidth: 0, p: 1, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
          >
            <span style={{ fontSize: 24 }}>←</span>
          </Button>
          <Button
            onClick={nextImage}
            sx={{ position: 'absolute', right: 16, top: '50%', minWidth: 0, p: 1, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
          >
            <span style={{ fontSize: 24 }}>→</span>
          </Button>
          {/* Image Counter */}
          <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 2, px: 2, py: 0.5 }}>
            <Typography color="white" fontSize={14}>{currentImageIndex + 1} / {courtData.images.length}</Typography>
          </Box>
          {/* Court Info Overlay */}
          <Box sx={{ position: 'absolute', bottom: 24, left: 32, color: 'white', zIndex: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <Chip
                label={courtData.status === 'ACTIVE' ? 'Available' : 'Maintenance'}
                color={courtData.status === 'ACTIVE' ? 'success' : 'error'}
                sx={{ fontWeight: 600, fontSize: 14, px: 1.5, bgcolor: courtData.status === 'ACTIVE' ? 'success.main' : 'error.main', color: 'white' }}
              />
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <Typography fontWeight={600}>{courtData.rating}</Typography>
                <Typography color="grey.200">({courtData.totalReviews} reviews)</Typography>
              </Stack>
            </Stack>
            <Typography variant="h4" fontWeight={800} mb={0.5}>{courtData.name}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <span style={{ fontSize: 18 }}>📍</span>
              <Typography fontSize={18}>{courtData.location}</Typography>
            </Stack>
          </Box>
        </Box>
        {/* Thumbnails */}
        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stack direction="row" spacing={1}>
            {courtData.images.map((image, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                sx={{
                  width: 56, height: 56, borderRadius: 2, overflow: 'hidden', border: idx === currentImageIndex ? '2px solid #1976d2' : '2px solid #eee', cursor: 'pointer', boxShadow: idx === currentImageIndex ? 2 : 0
                }}
              >
                <img src={image} alt={`thumb${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>
      <Grid container spacing={4}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 4, mb: 3 }}>
            <Typography variant="h5" fontWeight={700} mb={3} color="primary.dark">Court Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <span style={{ fontSize: 22 }}>🕒</span>
                  <Box>
                    <Typography fontWeight={600}>Operating Hours</Typography>
                    <Typography color="text.secondary">{courtData.openingTime} - {courtData.closingTime}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <span style={{ fontSize: 22 }}>📅</span>
                  <Box>
                    <Typography fontWeight={600}>Operating Days</Typography>
                    <Typography color="text.secondary">{courtData.operatingDays}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ bgcolor: 'blue.50', borderRadius: 2, p: 2, border: '1px solid #e3e8f0' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <span style={{ fontSize: 20 }}>💲</span>
                    <Typography fontWeight={600}>Pricing</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Peak Hours:</Typography>
                    <Typography fontWeight={700} color="primary">RM{courtData.peakHourlyPrice}/hr</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Off-Peak Hours:</Typography>
                    <Typography fontWeight={700} color="success.main">RM{courtData.offPeakHourlyPrice}/hr</Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
          {/* Amenities */}
          <Paper elevation={2} sx={{ borderRadius: 3, p: 4, mb: 3 }}>
            <Typography variant="h5" fontWeight={700} mb={3} color="primary.dark">Amenities & Facilities</Typography>
            <Grid container spacing={2}>
              {amenities.map((amenity, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2, borderRadius: 2, bgcolor: amenity.available ? 'green.50' : 'grey.100', border: amenity.available ? '1px solid #b9f6ca' : '1px solid #eee', opacity: amenity.available ? 1 : 0.5 }}>
                    <span style={{ fontSize: 22 }}>{amenity.icon}</span>
                    <Typography fontWeight={600}>{amenity.text}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>
          {/* Description */}
          <Paper elevation={2} sx={{ borderRadius: 3, p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={2} color="primary.dark">About This Court</Typography>
            <Typography color="text.secondary">{courtData.description}</Typography>
          </Paper>
        </Grid>
        {/* Booking Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 4, position: 'sticky', top: 32 }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h4" fontWeight={800} color="primary.main">From RM{courtData.offPeakHourlyPrice}</Typography>
              <Typography color="text.secondary">/hour (Off-peak)</Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              sx={{ fontWeight: 700, borderRadius: 2, py: 1.5, mb: 2, background: 'linear-gradient(90deg, #6366f1 0%, #a21caf 100%)' }}
              onClick={() => {
                if (!authToken) {
                  // 未登录用户重定向到登录页面
                  navigate('/login');
                } else {
                  // 已登录用户直接跳转到预订页面
                  navigate(`/booking/${courtData.id}`);
                }
              }}
            >
              Book This Court
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography fontWeight={600} mb={1}>Quick Facts</Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Court Type:</Typography>
                <Typography fontWeight={500}>Professional</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Surface:</Typography>
                <Typography fontWeight={500}>Synthetic</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Indoor/Outdoor:</Typography>
                <Typography fontWeight={500}>Indoor</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Max Players:</Typography>
                <Typography fontWeight={500}>4 players</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourtDetails;