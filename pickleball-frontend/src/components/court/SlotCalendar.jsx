import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  Grid, 
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { 
  ArrowBack as BackIcon, 
  ArrowForward as ForwardIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const SlotCalendar = ({ 
  open, 
  onClose, 
  selectedDate, 
  onDateSelect 
}) => {
  // Add safety check for selectedDate
  const safeSelectedDate = selectedDate || dayjs();
  const [currentWeek, setCurrentWeek] = React.useState(
    safeSelectedDate.startOf('week')
  );
  
  const generateWeekDays = () => {
    const days = [];
    const startDate = currentWeek;
    
    for (let i = 0; i < 7; i++) {
      const date = startDate.add(i, 'day');
      days.push({
        date,
        formatted: date.format('ddd, MMM D') // Format directly with Day.js
      });
    }
    
    return days;
  };
  
  const handlePrevWeek = () => {
    setCurrentWeek(currentWeek.subtract(7, 'day'));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(currentWeek.add(7, 'day'));
  };
  
  const handleDateClick = (date) => {
    onDateSelect(date);
    onClose();
  };
  
  const weekDays = generateWeekDays();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <span>Select Date</span>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <IconButton onClick={handlePrevWeek}>
            <BackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {currentWeek.format('MMMM D')} - {currentWeek.add(6, 'day').format('D, YYYY')}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <ForwardIcon />
          </IconButton>
        </Box>
        
        <Grid container spacing={1}>
          {weekDays.map((day, index) => (
            <Grid item xs key={index} sx={{ textAlign: 'center' }}>
              <Button
                fullWidth
                variant={
                  selectedDate?.isSame(day.date, 'day') ? 'contained' : 'outlined'
                }
                color="primary"
                onClick={() => handleDateClick(day.date)}
                sx={{ 
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  backgroundColor: selectedDate?.isSame(day.date, 'day') 
                    ? '#1976d2' : 'transparent',
                  color: selectedDate?.isSame(day.date, 'day') 
                    ? '#fff' : '#333',
                  '&:hover': {
                    backgroundColor: selectedDate?.isSame(day.date, 'day') 
                      ? '#1565c0' : '#f5f7fa'
                  }
                }}
              >
                {day.formatted}
              </Button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default SlotCalendar;