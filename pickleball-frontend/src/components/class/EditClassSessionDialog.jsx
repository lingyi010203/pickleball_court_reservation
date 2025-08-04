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
  Box
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
          const response = await api.get('/api/coach/all-courts', { headers });
          courtsData = response.data;
        } catch (coachError) {
          console.log('Coach API failed, trying public API');
          // 如果教練 API 失敗，使用公開 API
          const response = await api.get('/api/courts');
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

  useEffect(() => {
    if (form.venueId) {
      setCourts(allCourts.filter(c => c.venue && String(c.venue.id) === String(form.venueId)));
    } else {
      setCourts(allCourts);
    }
  }, [form.venueId, allCourts]);

  useEffect(() => {
    if (session) {
      setForm({
        title: session.title || '',
        description: session.description || '',
        venueId: session.venueId || (session.court?.venue?.id || ''),
        courtId: session.courtId || (session.court?.id || ''),
        maxParticipants: session.maxParticipants || '',
        price: session.price || '',
        startTime: session.startTime ? session.startTime.slice(0, 16) : '',
        endTime: session.endTime ? session.endTime.slice(0, 16) : '',
      });
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await api.put(`/api/class-sessions/${session.id}`, {
        ...form,
        maxParticipants: Number(form.maxParticipants),
        price: Number(form.price),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e?.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Session</DialogTitle>
      <DialogContent>
        <TextField label="Session Title" name="title" value={form.title} onChange={handleChange} required fullWidth sx={{ mt: 2 }} />
        <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={2} sx={{ mt: 2 }} />
        <FormControl fullWidth required sx={{ mt: 2 }}>
          <InputLabel>Venue</InputLabel>
          <Select name="venueId" value={form.venueId} onChange={handleChange} label="Venue">
            {venues.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth required sx={{ mt: 2 }}>
          <InputLabel>Court</InputLabel>
          <Select name="courtId" value={form.courtId} onChange={handleChange} label="Court">
            {courts.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Max Participants" name="maxParticipants" type="number" value={form.maxParticipants} onChange={handleChange} required fullWidth inputProps={{ min: 1, max: 20 }} sx={{ mt: 2 }} />
        <TextField label="Price (RM/person)" name="price" type="number" value={form.price} onChange={handleChange} required fullWidth inputProps={{ min: 0 }} sx={{ mt: 2 }} />
        <TextField label="Start Time" name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} required fullWidth sx={{ mt: 2 }} />
        <TextField label="End Time" name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} required fullWidth sx={{ mt: 2 }} />
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