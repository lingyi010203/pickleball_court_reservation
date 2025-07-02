import React from 'react';
import { 
  Box, Typography, Divider, Chip, List, ListItem, 
  ListItemText, Paper, Stack, Grid, Button
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  MonetizationOn as MonetizationIcon,
  EventAvailable as CalendarIcon,
  LocationOn as LocationIcon,
  SportsTennis as CourtIcon
} from '@mui/icons-material';

const CourtDetails = ({ court }) => {
  return (
    <Box>
      {/* Court Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
          {court.name}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocationIcon color="primary" />
          <Typography variant="h6" color="text.secondary">
            {court.location}
          </Typography>
          <Chip 
            label={court.status === 'ACTIVE' ? 'Available' : 'Maintenance'} 
            color={court.status === 'ACTIVE' ? 'success' : 'error'}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Grid container spacing={3}>
        {/* Information Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Court Information
            </Typography>
            
            <List disablePadding>
              <ListItem sx={{ py: 1.5 }}>
                <ListItemText
                  primary="Operating Hours"
                  secondary={`${court.openingTime} - ${court.closingTime}`}
                />
                <ScheduleIcon color="primary" />
              </ListItem>
              
              <Divider component="li" />
              
              <ListItem sx={{ py: 1.5 }}>
                <ListItemText
                  primary="Operating Days"
                  secondary={court.operatingDays || 'Everyday'}
                />
                <CalendarIcon color="primary" />
              </ListItem>
              
              <Divider component="li" />
              
              <ListItem sx={{ py: 1.5 }}>
                <ListItemText
                  primary="Pricing"
                  secondary={
                    <Box component="div">
                      <Typography>Peak: RM{court.peakHourlyPrice || '80'}/hr</Typography>
                      <Typography>Off-Peak: RM{court.offPeakHourlyPrice || '50'}/hr</Typography>
                    </Box>
                  }
                />
                <MonetizationIcon color="primary" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* Amenities Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Amenities & Facilities
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CourtIcon color="primary" fontSize="small" />
                  <Typography>Professional Courts</Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CourtIcon color="primary" fontSize="small" />
                  <Typography>Equipment Rental</Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CourtIcon color="primary" fontSize="small" />
                  <Typography>Changing Rooms</Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CourtIcon color="primary" fontSize="small" />
                  <Typography>Pro Shop</Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CourtIcon color="primary" fontSize="small" />
                  <Typography>Refreshment Area</Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CourtIcon color="primary" fontSize="small" />
                  <Typography>Free Parking</Typography>
                </Stack>
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              fullWidth 
              sx={{ mt: 4, py: 1.5, fontWeight: 600 }}
              onClick={() => window.location.href = `/booking/${court.id}`}
            >
              Book This Court
            </Button>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Description */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          Description
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {court.description || 'This premier pickleball court offers state-of-the-art facilities with professional-grade surfaces and lighting. Perfect for both casual play and competitive matches, our court features climate-controlled environments and top-tier amenities to enhance your playing experience.'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default CourtDetails;