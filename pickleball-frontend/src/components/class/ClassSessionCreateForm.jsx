import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormHelperText
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../api/axiosConfig';
import ClassSessionService from '../../service/ClassSessionService';
import CourtService from '../../service/CourtService';
import axios from 'axios'; // Added axios import

const daysOfWeekOptions = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

const defaultForm = {
  title: '',
  description: '',
  venueId: '',
  courtId: '',
  price: '',
  maxParticipants: '',
  daysOfWeek: [],
  startTime: '',
  endTime: '',
  startDate: '',
  endDate: '',
};

const ClassSessionCreateForm = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState(defaultForm);
  const [allCourts, setAllCourts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalSessions, setTotalSessions] = useState(0);

  // 取得所有 court，並動態產生場館選單
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        // 嘗試使用教練專用的 API
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        let courtsData;
        try {
          const response = await axios.get('/api/coach/all-courts', { headers });
          courtsData = response.data;
        } catch (coachError) {
          console.log('Coach API failed, trying public API');
          // 如果教練 API 失敗，使用公開 API
          const response = await axios.get('/api/courts');
          courtsData = response.data;
        }
        
        setAllCourts(courtsData);
        // 動態產生場館選單（去重）
        const venueMap = {};
        courtsData.forEach(c => {
          if (c.venue && !venueMap[c.venue.id]) {
            venueMap[c.venue.id] = c.venue;
          }
        });
        setVenues(Object.values(venueMap));
      } catch (error) {
        console.error('Failed to fetch courts:', error);
        setAllCourts([]);
        setVenues([]);
      }
    };
    
    fetchCourts();
  }, []);

  // 根據選擇的場館過濾 court
  useEffect(() => {
    if (form.venueId) {
      setCourts(allCourts.filter(c => c.venue && String(c.venue.id) === String(form.venueId)));
    } else {
      setCourts(allCourts);
    }
  }, [form.venueId, allCourts]);

  // 自動計算總堂數
  useEffect(() => {
    if (!form.startDate || !form.endDate || form.daysOfWeek.length === 0) {
      setTotalSessions(0);
      return;
    }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      if (form.daysOfWeek.includes(dayName)) {
        count++;
      }
    }
    setTotalSessions(count);
  }, [form.startDate, form.endDate, form.daysOfWeek]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDaysChange = (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, daysOfWeek: typeof value === 'string' ? value.split(',') : value }));
  };

  // 根據週期自動產生所有日期時間段
  const getAllDateTimes = () => {
    if (!form.startDate || !form.endDate || !form.startTime || !form.endTime || form.daysOfWeek.length === 0) return [];
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      if (form.daysOfWeek.includes(dayName)) {
        const dateStr = d.toISOString().slice(0, 10);
        result.push({
          startTime: `${dateStr}T${form.startTime}`,
          endTime: `${dateStr}T${form.endTime}`,
        });
      }
    }
    return result;
  };

  const handleCheckConflicts = async () => {
    setChecking(true);
    setConflicts([]);
    setError('');
    try {
      const dateTimes = getAllDateTimes();
      if (!form.courtId || dateTimes.length === 0) {
        setError('Please select venue, court, period, and time');
        setChecking(false);
        return;
      }
      const res = await ClassSessionService.checkCourtAvailability(form.courtId, dateTimes);
      setConflicts(res.conflicts || []);
      if ((res.conflicts || []).length === 0) setSuccess('No conflicts, you can create sessions!');
      else setSuccess('');
    } catch (e) {
      setError(e?.response?.data?.error || 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const dateTimes = getAllDateTimes();
    if (!form.title || !form.courtId || !form.venueId || !form.price || !form.maxParticipants || !form.startDate || !form.endDate || !form.startTime || !form.endTime || form.daysOfWeek.length === 0) {
      setError('Please complete all fields');
      return;
    }
    if (conflicts.length > 0) {
      setError('There are time conflicts, please reselect');
      return;
    }
    try {
      const payload = {
        ...form,
        daysOfWeek: form.daysOfWeek,
        price: Number(form.price),
        maxParticipants: Number(form.maxParticipants),
      };
      await ClassSessionService.createRecurringSessions(payload);
      setSuccess('Session created successfully!');
      if (onSuccess) onSuccess(form.startDate); // 傳遞新課程第一天日期
      setTimeout(() => { setSuccess(''); onClose(); }, 1200);
    } catch (e) {
      setError(e?.response?.data?.error || 'Creation failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Recurring/Multiple Sessions</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Session Title" name="title" value={form.title} onChange={handleChange} required fullWidth />
          <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={2} />
          <FormControl fullWidth required>
            <InputLabel>Venue</InputLabel>
            <Select name="venueId" value={form.venueId} onChange={handleChange} label="Venue">
              {venues.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Court</InputLabel>
            <Select name="courtId" value={form.courtId} onChange={handleChange} label="Court">
              {courts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Max Participants" name="maxParticipants" type="number" value={form.maxParticipants} onChange={handleChange} required fullWidth inputProps={{ min: 1, max: 20 }} />
          <TextField label="Price (RM/person)" name="price" type="number" value={form.price} onChange={handleChange} required fullWidth inputProps={{ min: 0 }} />
          <FormControl fullWidth required>
            <InputLabel>Days of Week</InputLabel>
            <Select
              multiple
              name="daysOfWeek"
              value={form.daysOfWeek}
              onChange={handleDaysChange}
              input={<OutlinedInput label="Days of Week" />}
              renderValue={(selected) => selected.map(val => daysOfWeekOptions.find(opt => opt.value === val)?.label).join(', ')}
            >
              {daysOfWeekOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Checkbox checked={form.daysOfWeek.indexOf(opt.value) > -1} />
                  <ListItemText primary={opt.label} />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Multiple selection allowed</FormHelperText>
          </FormControl>
          {/* 新增：顯示總堂數 */}
          <Typography color="primary" sx={{ mb: 1 }}>
            {totalSessions > 0 ? `Total ${totalSessions} sessions` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start Time (HH:mm)" name="startTime" type="time" value={form.startTime} onChange={handleChange} required fullWidth />
            <TextField label="End Time (HH:mm)" name="endTime" type="time" value={form.endTime} onChange={handleChange} required fullWidth />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} required fullWidth />
            <TextField label="End Date" name="endDate" type="date" value={form.endDate} onChange={handleChange} required fullWidth />
          </Box>
          <Button variant="outlined" onClick={handleCheckConflicts} disabled={checking || !form.courtId || getAllDateTimes().length === 0}>Check Venue Conflicts</Button>
          {conflicts.length > 0 && <Typography color="error">Conflicting time slots: {conflicts.join(', ')}</Typography>}
          {success && <Typography color="success.main">{success.replace('No conflicts, you can create sessions!', 'No conflicts, you can create sessions!').replace('Session created successfully!', 'Session created successfully!')}</Typography>}
          {error && <Typography color="error">{error.replace('Please complete all fields', 'Please complete all fields').replace('There are time conflicts, please reselect', 'There are time conflicts, please reselect').replace('Creation failed', 'Creation failed').replace('Check failed', 'Check failed')}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Create Session</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassSessionCreateForm; 