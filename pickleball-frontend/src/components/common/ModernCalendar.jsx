import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const ModernCalendar = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onDateClick,
  getSessionsForDate,
  selectedDate,
  maxWidth = '650px', // smaller than before
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Calendar grid logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  const days = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  const isCurrentMonth = (date) => date.getMonth() === month;
  const isSelected = (date) =>
    selectedDate && selectedDate.toDateString() === date.toDateString();

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 4,
        p: 3,
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.10)',
        background: '#f8fafc',
        maxWidth: maxWidth,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Month header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} width="100%">
        <IconButton onClick={onPrevMonth} size="large" sx={{ color: '#6366f1' }}>
          <ChevronLeftIcon fontSize="large" />
        </IconButton>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: 1, color: '#22223b' }}>
          {monthNames[month]} {year}
        </Typography>
        <IconButton onClick={onNextMonth} size="large" sx={{ color: '#6366f1' }}>
          <ChevronRightIcon fontSize="large" />
        </IconButton>
      </Box>
      {/* Day names */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        sx={{
          borderRadius: 3,
          background: '#fff',
          mb: 0.5,
          width: '100%',
          px: 0,
          py: 1,
        }}
      >
        {dayNames.map((day) => (
          <Typography
            key={day}
            align="center"
            variant="subtitle2"
            sx={{
              color: '#b0b3c6',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: 1,
              py: 0.5,
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>
      {/* Calendar grid */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(7, 1fr)"
        sx={{
          borderRadius: 3,
          background: '#fff',
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {days.map((date, idx) => {
          const daySessions = getSessionsForDate(date);
          const hasSessions = daySessions.length > 0;
          return (
            <Box
              key={idx}
              onClick={() => isCurrentMonth(date) && onDateClick(date)}
              sx={{
                aspectRatio: '1/1',
                minHeight: 48,
                borderRight: (idx + 1) % 7 !== 0 ? '1px solid #e5e7eb' : 'none',
                borderBottom: idx < days.length - 7 ? '1px solid #e5e7eb' : 'none',
                bgcolor: isSelected(date)
                  ? '#ede9fe'
                  : isToday(date)
                  ? '#dbeafe'
                  : hasSessions
                  ? '#e0f7fa'
                  : 'transparent',
                cursor: isCurrentMonth(date) ? 'pointer' : 'default',
                opacity: isCurrentMonth(date) ? 1 : 0.35,
                position: 'relative',
                transition: 'all 0.18s',
                '&:hover': isCurrentMonth(date)
                  ? { boxShadow: 2, bgcolor: '#f3f4f6' }
                  : {},
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                py: 1,
              }}
            >
              <Typography
                align="center"
                fontWeight={isSelected(date) ? 900 : isToday(date) ? 800 : 600}
                color={isSelected(date) ? '#4b2995' : isCurrentMonth(date) ? '#22223b' : '#b0b3c6'}
                sx={{ fontSize: 18, mb: 0.5 }}
              >
                {date.getDate()}
              </Typography>
              {/* Session dots */}
              {hasSessions && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 8,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 0.7,
                  }}
                >
                  {daySessions.slice(0, 3).map((s, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        bgcolor: '#22c55e', // 綠色圓點
                        border: '2px solid #fff',
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.08)',
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default ModernCalendar;
