import React from 'react';
import { Box, Typography, Divider, Chip, List, ListItem, ListItemText } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const CourtInfo = ({ court }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Court Information
      </Typography>
      
      <List>
        <ListItem>
          <ListItemText
            primary="Operating Hours"
            secondary={`${court.openingTime} - ${court.closingTime}`}
            secondaryTypographyProps={{ color: 'text.primary' }}
          />
          <ScheduleIcon color="action" />
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemText
            primary="Operating Days"
            secondary={court.operatingDays || 'Everyday'}
            secondaryTypographyProps={{ color: 'text.primary' }}
          />
          <EventAvailableIcon color="action" />
        </ListItem>
        
        <Divider component="li" />
        
        <ListItem>
          <ListItemText
            primary="Pricing"
            secondary={
              <Box component="span">
                <Box>Peak: RM{court.peakHourlyPrice || '80'}/hr</Box>
                <Box>Off-Peak: RM{court.offPeakHourlyPrice || '50'}/hr</Box>
              </Box>
            }
            secondaryTypographyProps={{ component: 'div', color: 'text.primary' }}
          />
          <MonetizationOnIcon color="action" />
        </ListItem>
      </List>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {court.description || 'No additional description available.'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CourtInfo;