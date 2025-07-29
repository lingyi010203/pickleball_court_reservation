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

// Cancel join request (participant)
export async function cancelJoin(requestId, memberId) {
  const res = await api.delete(`/friendly-matches/requests/${requestId}`);
  return res.data;
}

// Get match details (including status, participants, etc.)
export async function getMatch(matchId) {
  const res = await api.get(`/matches/${matchId}`);
  return res.data;
}

// Create a new friendly match (without booking)
export async function createFriendlyMatch(matchData) {
  const res = await api.post('/api/friendly-matches/create', matchData);
  return res.data;
}

// Get all invitations
export async function getInvitations() {
  const res = await api.get('/api/friendly-matches/invitations');
  return res.data;
}

// Join an invitation
export async function joinInvitation(matchId) {
  const res = await api.post(`/api/friendly-matches/invitation/${matchId}/join`);
  return res.data;
}

// Create invitation from booking
export async function createInvitation(invitationData, bookingId) {
  const res = await api.post('/api/friendly-matches/invitation', invitationData, {
    params: { bookingId }
  });
  return res.data;
} 