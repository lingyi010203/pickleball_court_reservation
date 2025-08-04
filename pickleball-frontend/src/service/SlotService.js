import api from './api';

export const getAvailableSlots = async (courtId, date) => {
  try {
    const response = await api.get('/member/slots/available', {
      params: { courtId, date }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

export const getAvailableSlotsForCourt = async (courtId) => {
  try {
    const response = await api.get('/member/slots/available', {
      params: { courtId }
    });
    
    // Map backend data to frontend format
    return response.data.map(slot => ({
      ...slot,
      date: slot.date, // Ensure proper date format
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationHours: slot.durationHours
    }));
  } catch (error) {
    console.error('Failed to fetch slots:', error);
    return [];
  }
};

export const getAvailableSlotsForRange = async (courtId, startDate, endDate) => {
  try {
    const response = await api.get('/member/slots/available-range', {
      params: { courtId, startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available slots range:', error);
    throw error;
  }
};

export const getAllSlotsForCourt = async (courtId) => {
  try {
    const response = await api.get('/member/slots/all', {
      params: { courtId }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all slots:', error);
    return [];
  }
};