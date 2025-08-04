import api from './api';

// Get all open matches
export async function getOpenMatches() {
  const res = await api.get('/friendly-matches/open');
  return res.data;
}

// Create a new match (for organizer)
export async function createMatch(matchDetails, organizerId) {
  const res = await api.post(`/matches?organizerId=${organizerId}`, matchDetails);
  return res.data;
}

// Send join request (participant)
export async function joinMatch(matchId, memberId) {
  const res = await api.post('/join-requests', { matchId, memberId });
  return res.data;
}

// Approve join request (organizer)
export async function approveRequest(requestId, organizerId) {
  const res = await api.put(`/join-requests/${requestId}/approve?organizerId=${organizerId}`);
  return res.data;
}

// Cancel join request (participant)
export async function cancelJoin(requestId, memberId) {
  const res = await api.delete(`/join-requests/${requestId}?memberId=${memberId}`);
  return res.data;
}

// Get match details (including status, participants, etc.)
export async function getMatch(matchId) {
  const res = await api.get(`/matches/${matchId}`);
  return res.data;
} 