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
  FormControlLabel,
  Switch
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../api/axiosConfig';

const EditClassSessionDialog = ({ open, session, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    venueId: '',
    courtId: '',
    maxParticipants: '',
    price: '',
    startTime: '',
    endTime: '',
    allowReplacement: false,
  });
  const [allCourts, setAllCourts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        // 嘗試使用教練專用的 API
        const token = localStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        let courtsData;
        try {
          const response = await api.get('/coach/all-courts', { headers });
          courtsData = response.data;
          console.log('Loaded courts from coach API:', courtsData.length);
        } catch (coachError) {
          console.log('Coach API failed, trying public API');
          // 如果教練 API 失敗，使用公開 API
          const response = await api.get('/courts');
          courtsData = response.data;
          console.log('Loaded courts from public API:', courtsData.length);
        }
        
        setAllCourts(courtsData);
        // 動態產生場館選單（去重）
        const venueMap = {};
        courtsData.forEach(c => {
          if (c.venue && !venueMap[c.venue.id]) {
            venueMap[c.venue.id] = c.venue;
          }
        });
        const venuesList = Object.values(venueMap);
        setVenues(venuesList);
        console.log('Generated venues from courts:', venuesList.length);
        console.log('Sample court data:', courtsData[0]);
        console.log('Sample venue data:', venuesList[0]);
      } catch (error) {
        console.error('Failed to fetch courts:', error);
        setAllCourts([]);
        setVenues([]);
      }
    };
    
    fetchCourts();
  }, []);

  useEffect(() => {
    if (form.venueId) {
      setCourts(allCourts.filter(c => c.venue && String(c.venue.id) === String(form.venueId)));
    } else {
      setCourts(allCourts);
    }
    console.log('Courts filtered for venueId:', form.venueId, 'Available courts:', courts.length);
  }, [form.venueId, allCourts]);

  // 当 venues 和 courts 加载完成后，重新设置 venueId 和 courtId
  useEffect(() => {
    if (session && venues.length > 0 && allCourts.length > 0) {
      console.log('Venues and courts loaded, updating form with session data');
      // 优先使用直接关联的 venue，如果没有则使用 court 的 venue
      let venueId = '';
      if (session.venue && session.venue.id) {
        venueId = session.venue.id;
      } else if (session.court && session.court.venue && session.court.venue.id) {
        venueId = session.court.venue.id;
      } else if (session.venueId) {
        venueId = session.venueId;
      }
      
      // 优先使用直接关联的 court
      let courtId = '';
      if (session.court && session.court.id) {
        courtId = session.court.id;
      } else if (session.courtId) {
        courtId = session.courtId;
      }
      
      console.log('Setting venueId:', venueId, 'courtId:', courtId);
      
      setForm(prev => ({
        ...prev,
        venueId: venueId,
        courtId: courtId,
      }));
    }
  }, [session, venues, allCourts]);

  useEffect(() => {
    if (session) {
      console.log('Session data for editing:', session); // 调试日志
      
      // 优先使用直接关联的 venue，如果没有则使用 court 的 venue
      let venueId = '';
      if (session.venue && session.venue.id) {
        venueId = session.venue.id;
      } else if (session.court && session.court.venue && session.court.venue.id) {
        venueId = session.court.venue.id;
      } else if (session.venueId) {
        venueId = session.venueId;
      }
      
      // 优先使用直接关联的 court
      let courtId = '';
      if (session.court && session.court.id) {
        courtId = session.court.id;
      } else if (session.courtId) {
        courtId = session.courtId;
      }
      
      setForm({
        title: session.title || '',
        description: session.description || '',
        venueId: venueId,
        courtId: courtId,
        maxParticipants: session.maxParticipants || '',
        price: session.price || '',
        startTime: session.startTime ? session.startTime.slice(0, 16) : '',
        endTime: session.endTime ? session.endTime.slice(0, 16) : '',
        allowReplacement: session.allowReplacement || false,
      });
      
      // 如果 venues 和 courts 已经加载，立即更新 venueId 和 courtId
      if (venues.length > 0 && allCourts.length > 0) {
        setTimeout(() => {
          setForm(prev => ({
            ...prev,
            venueId: venueId,
            courtId: courtId,
          }));
        }, 100);
      }
    }
  }, [session, venues, allCourts]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'allowReplacement' ? checked : value }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    
    // 调试信息：检查用户权限
    const token = localStorage.getItem('authToken');
    console.log('=== Debug: User Permission Check ===');
    console.log('Auth token exists:', !!token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);
        console.log('User role:', payload.role);
        console.log('User type:', payload.userType);
        console.log('User ID:', payload.userId);
        console.log('Subject:', payload.sub);
      } catch (error) {
        console.error('Failed to parse JWT token:', error);
      }
    }
    
    try {
      console.log('Making PATCH request to:', `/class-sessions/${session.id}`);
      console.log('Request payload:', {
        maxParticipants: Number(form.maxParticipants),
        price: Number(form.price),
      });
      
      await api.patch(`/class-sessions/${session.id}`, {
        maxParticipants: Number(form.maxParticipants),
        price: Number(form.price),
      });
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error('API Error:', e);
      console.error('Response data:', e?.response?.data);
      console.error('Response status:', e?.response?.status);
      setError(e?.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Session (Participants & Price Only)</DialogTitle>
      <DialogContent>
        <TextField 
          label="Session Title" 
          name="title" 
          value={form.title} 
          onChange={handleChange} 
          required 
          fullWidth 
          sx={{ mt: 2 }}
          InputProps={{ readOnly: true }}
          helperText="Read-only field"
        />
        <TextField 
          label="Description" 
          name="description" 
          value={form.description} 
          onChange={handleChange} 
          fullWidth 
          multiline 
          rows={2} 
          sx={{ mt: 2 }}
          InputProps={{ readOnly: true }}
          helperText="Read-only field"
        />
        <FormControl fullWidth required sx={{ mt: 2 }}>
          <InputLabel>Venue</InputLabel>
          <Select 
            name="venueId" 
            value={form.venueId} 
            onChange={handleChange} 
            label="Venue"
            disabled={true}
          >
            {venues.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </Select>
          <Typography variant="caption" color="text.secondary">
            Selected: {form.venueId} | Available: {venues.length} venues | Read-only field
          </Typography>
        </FormControl>
        <FormControl fullWidth required sx={{ mt: 2 }}>
          <InputLabel>Court</InputLabel>
          <Select 
            name="courtId" 
            value={form.courtId} 
            onChange={handleChange} 
            label="Court"
            disabled={true}
          >
            {courts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
          <Typography variant="caption" color="text.secondary">
            Selected: {form.courtId} | Available: {courts.length} courts | Read-only field
          </Typography>
        </FormControl>
        <TextField 
          label="Max Participants" 
          name="maxParticipants" 
          type="number" 
          value={form.maxParticipants} 
          onChange={handleChange} 
          required 
          fullWidth 
          inputProps={{ min: 1, max: 20 }} 
          sx={{ mt: 2 }}
          helperText="✓ Editable field"
        />
        <TextField 
          label="Price (RM/person)" 
          name="price" 
          type="number" 
          value={form.price} 
          onChange={handleChange} 
          required 
          fullWidth 
          inputProps={{ min: 0 }} 
          sx={{ mt: 2 }}
          helperText="✓ Editable field"
        />
        <TextField 
          label="Start Time" 
          name="startTime" 
          type="datetime-local" 
          value={form.startTime} 
          onChange={handleChange} 
          required 
          fullWidth 
          sx={{ mt: 2 }}
          InputProps={{ readOnly: true }}
          helperText="Read-only field"
        />
        <TextField 
          label="End Time" 
          name="endTime" 
          type="datetime-local" 
          value={form.endTime} 
          onChange={handleChange} 
          required 
          fullWidth 
          sx={{ mt: 2 }}
          InputProps={{ readOnly: true }}
          helperText="Read-only field"
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.allowReplacement}
              onChange={handleChange}
              name="allowReplacement"
              color="primary"
              disabled={true}
            />
          }
          label="Allow Replacement (Read-only)"
          sx={{ mt: 2 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Enable this option to allow students to book this time slot for makeup classes when they request leave from other sessions.
        </Typography>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClassSessionDialog; 