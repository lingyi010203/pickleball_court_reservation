import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Stack,
  Divider,
  Skeleton,
  Dialog,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material'; 
import { 
  ChevronLeft,
  ChevronRight,
  Today,
  Event,
  Schedule,
  AttachMoney,
  FiberManualRecord,
  CalendarMonth,
  AccessTime,
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material'; 
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import isYesterday from 'dayjs/plugin/isYesterday';
import weekday from 'dayjs/plugin/weekday';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import ThemedCard from '../common/ThemedCard';

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);
dayjs.extend(weekday);
dayjs.extend(advancedFormat);

// 主容器样式 - 简洁白色背景
const CalendarContainer = styled(ThemedCard)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'relative'
}));

// 日期按钮样式 - 简洁现代
const DateButton = styled(Button)(({ theme, selected, today, available, hasSlots }) => ({
  minWidth: 0,
  height: '48px',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  position: 'relative',
  transition: 'all 0.2s ease',
  backgroundColor: selected 
    ? theme.palette.primary.main
    : today 
      ? alpha(theme.palette.error.main, 0.1)
      : available 
        ? 'transparent'
        : alpha(theme.palette.grey[500], 0.05),
  border: selected 
    ? `2px solid ${theme.palette.primary.main}` 
    : today 
      ? `1px solid ${theme.palette.error.main}`
      : available 
        ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
        : `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
  color: selected 
    ? theme.palette.primary.contrastText
    : today 
      ? theme.palette.error.main
      : theme.palette.text.primary,
  '&:hover': {
    transform: available ? 'translateY(-1px)' : 'none',
    backgroundColor: selected 
      ? theme.palette.primary.dark 
      : available 
        ? alpha(theme.palette.grey[500], 0.05)
        : alpha(theme.palette.grey[500], 0.1),
    boxShadow: available 
      ? '0 2px 8px rgba(0, 0, 0, 0.1)'
      : 'none'
  },
  '&:disabled': {
    opacity: 0.4,
    transform: 'none'
  },
  '& .date-number': {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1,
    marginBottom: '2px'
  },
  '& .date-weekday': {
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    opacity: 0.7
  }
}));

// 时间段按钮样式 - 简洁现代
const TimeSlotButton = styled(Button)(({ theme, selected, available }) => ({
  minWidth: 0,
  height: '40px',
  borderRadius: '8px',
  backgroundColor: selected 
    ? theme.palette.primary.main
    : available 
      ? alpha(theme.palette.grey[500], 0.05)
      : alpha(theme.palette.error.main, 0.1),
  border: selected 
    ? `2px solid ${theme.palette.primary.main}`
    : available 
      ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
      : `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
  color: selected 
    ? theme.palette.primary.contrastText
    : available 
      ? theme.palette.text.primary
      : theme.palette.error.main,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected 
      ? theme.palette.primary.dark
      : available 
        ? alpha(theme.palette.grey[500], 0.1)
        : alpha(theme.palette.error.main, 0.15),
    transform: available ? 'scale(1.02)' : 'none'
  },
  '&:disabled': {
    opacity: 0.4
  }
}));

// 标签切换按钮样式
const TabButton = styled(Button)(({ theme, active }) => ({
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 2),
  backgroundColor: active 
    ? theme.palette.primary.main
    : 'transparent',
  color: active 
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  border: `1px solid ${active 
    ? theme.palette.primary.main
    : alpha(theme.palette.divider, 0.2)}`,
  '&:hover': {
    backgroundColor: active 
      ? theme.palette.primary.dark
      : alpha(theme.palette.grey[500], 0.05)
  }
}));

const SlotCalendar = ({ 
  open = false,
  onClose, 
  selectedDate, 
  onDateSelect,
  selectedTime,
  onTimeSelect,
  availableDates = [],
  availableSlots = {}, // { 'YYYY-MM-DD': ['09:00', '10:00', '11:00'] }
  courtInfo = null,
  loading = false,
  onMonthChange,
  showTimeSlots = false // 控制是否显示时间段选择
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [internalShowTimeSlots, setInternalShowTimeSlots] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [activeTab, setActiveTab] = useState('Today');

  // 使用外部传入的showTimeSlots或内部状态
  const displayTimeSlots = showTimeSlots !== undefined ? showTimeSlots : internalShowTimeSlots;
  const setDisplayTimeSlots = showTimeSlots !== undefined ? () => {} : setInternalShowTimeSlots;

  // 获取当前视图的日期
  const getViewDates = () => {
    if (viewMode === 'week') {
      const startOfWeek = currentDate.startOf('week');
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    } else {
      const startOfMonth = currentDate.startOf('month');
      const endOfMonth = currentDate.endOf('month');
      const startDate = startOfMonth.startOf('week');
      const endDate = endOfMonth.endOf('week');
    const days = [];
      let current = startDate;
      
      while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
        days.push(current);
        current = current.add(1, 'day');
    }
    return days;
    }
  };
  
  const handlePrevious = () => {
    const newDate = viewMode === 'week' 
      ? currentDate.subtract(1, 'week')
      : currentDate.subtract(1, 'month');
    setCurrentDate(newDate);
    setAnimationKey(prev => prev + 1);
    if (onMonthChange) onMonthChange(newDate);
  };
  
  const handleNext = () => {
    const newDate = viewMode === 'week' 
      ? currentDate.add(1, 'week')
      : currentDate.add(1, 'month');
    setCurrentDate(newDate);
    setAnimationKey(prev => prev + 1);
    if (onMonthChange) onMonthChange(newDate);
  };
  
  const handleDateClick = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    if (availableDates.includes(dateStr)) {
    onDateSelect(date);
      setInternalShowTimeSlots(true);
    }
  };
  
  const handleTimeClick = (time) => {
    onTimeSelect(time);
  };

  const handleToday = () => {
    const today = dayjs();
    setCurrentDate(today);
    setAnimationKey(prev => prev + 1);
    if (availableDates.includes(today.format('YYYY-MM-DD'))) {
      onDateSelect(today);
      setInternalShowTimeSlots(true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Today') {
      handleToday();
    } else if (tab === 'Tomorrow') {
      const tomorrow = dayjs().add(1, 'day');
      setCurrentDate(tomorrow);
      if (availableDates.includes(tomorrow.format('YYYY-MM-DD'))) {
        onDateSelect(tomorrow);
        setInternalShowTimeSlots(true);
      }
    }
  };

  const viewDates = getViewDates();
  const selectedDateStr = selectedDate?.format('YYYY-MM-DD');
  const todaySlots = selectedDateStr ? availableSlots[selectedDateStr] || [] : [];

  // 价格信息
  const priceInfo = courtInfo ? {
    offPeak: courtInfo.offPeakHourlyPrice || 50,
    peak: courtInfo.peakHourlyPrice || 80
  } : null;

  const calendarContent = (
    <CalendarContainer>
      <CardContent sx={{ p: 4 }}>
        {/* 头部 */}
        <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
          mb: 4
        }}>
          <Box>
            <Typography variant="h4" fontWeight="600" sx={{ mb: 1 }}>
              Book Court
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Reserve a pickleball court for your next game
            </Typography>
          </Box>
        </Box>

        {/* 标签导航 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Select Date & Time
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            p: 0.5, 
            bgcolor: alpha(theme.palette.grey[500], 0.1),
            borderRadius: '8px',
            width: 'fit-content'
          }}>
            {['Today', 'Tomorrow', 'This Week', 'Custom Date'].map((tab) => (
              <TabButton
                key={tab}
                active={activeTab === tab}
                onClick={() => handleTabChange(tab)}
                size="small"
              >
                {tab === 'Custom Date' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth sx={{ fontSize: '1rem' }} />
                    <span>Custom Date</span>
                  </Box>
                ) : (
                  tab
                )}
              </TabButton>
            ))}
          </Box>
        </Box>

        {/* 日历头部 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <IconButton
            onClick={handlePrevious}
            sx={{ 
              p: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[500], 0.1)
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
          
          <Typography variant="h6" fontWeight="600">
            {currentDate.format('MMMM YYYY')}
          </Typography>
          
          <IconButton
            onClick={handleNext}
            sx={{ 
              p: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[500], 0.1)
              }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
        
        {/* 日历网格 */}
        <Box sx={{ mb: 4 }}>
          {/* 星期标题 */}
          <Grid container spacing={0.5} sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs key={day}>
              <Typography 
                variant="body2" 
                sx={{ 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'text.secondary',
                    py: 1
                }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>
        
        {/* 日期网格 */}
          <Grid container spacing={0.5}>
            {viewDates.map((date, index) => {
              const dateStr = date.format('YYYY-MM-DD');
              const isAvailable = availableDates.includes(dateStr);
              const isSelected = selectedDate?.isSame(date, 'day');
              const isToday = date.isToday();
              const isPast = date.isBefore(dayjs(), 'day');
              const hasSlots = availableSlots[dateStr]?.length > 0;
              const isCurrentMonth = date.month() === currentDate.month();
            
            return (
                <Grid 
                  item 
                  xs={viewMode === 'week' ? true : 12/7} 
                  key={dateStr}
                >
                <DateButton
                  fullWidth
                  selected={isSelected}
                  today={isToday}
                    available={isAvailable}
                    hasSlots={hasSlots}
                    disabled={isPast || !isAvailable}
                    onClick={() => handleDateClick(date)}
                    sx={{
                      opacity: viewMode === 'month' && !isCurrentMonth ? 0.3 : 1
                    }}
                >
                    <Typography variant="body2" className="date-number">
                      {date.format('D')}
                  </Typography>
                    <Typography variant="caption" className="date-weekday">
                      {isToday ? 'Today' : date.format('ddd')}
                  </Typography>
                </DateButton>
              </Grid>
            );
          })}
        </Grid>
        </Box>
        
        {/* 时间段选择 */}
        {selectedDate && (
          <Box sx={{ 
            bgcolor: 'background.paper',
            borderRadius: '12px',
            p: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{
              display: 'flex', 
              alignItems: 'center',
              mb: 3
            }}>
              <Schedule sx={{ 
                color: 'text.secondary', 
                fontSize: '1.25rem',
                mr: 1
            }} />
              <Typography variant="h6" fontWeight="600">
                Available Time Slots - {selectedDate.format('dddd, MMMM D, YYYY')}
            </Typography>
          </Box>
          
            <Grid container spacing={1.5}>
              {todaySlots.length > 0 ? (
                todaySlots.map((time, index) => (
                  <Grid item xs={6} sm={4} md={3} key={time}>
                    <TimeSlotButton
                      fullWidth
                      selected={selectedTime === time}
                      available={true}
                      onClick={() => handleTimeClick(time)}
                    >
                      <Typography variant="body2" fontWeight="600">
                        {time}
                      </Typography>
                    </TimeSlotButton>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <Schedule sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      No available time slots for this date
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* 价格信息 */}
        {priceInfo && (
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: alpha(theme.palette.success.main, 0.1),
            borderRadius: '8px',
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney sx={{ color: 'success.main' }} />
              <Typography variant="body2" fontWeight="600" color="success.main">
                RM{priceInfo.offPeak}-{priceInfo.peak}/hour
            </Typography>
          </Box>
        </Box>
        )}
      </CardContent>
    </CalendarContainer>
  );

  // 如果提供了open和onClose，则包装在Dialog中
  if (open !== undefined && onClose) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }
        }}
      >
        {calendarContent}
    </Dialog>
  ); 
  }

  // 否则直接返回内容
  return calendarContent;
}; 

export default SlotCalendar;