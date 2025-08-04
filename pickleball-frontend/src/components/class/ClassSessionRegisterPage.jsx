import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import ClassSessionService from '../../service/ClassSessionService';

const ClassSessionRegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { sessionId } = useParams();
  const [session, setSession] = useState(location.state?.session || null);
  const sessionGroup = location.state?.sessionGroup;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    // 這裡用你實際的 API 路徑
    const fetchMyClasses = async () => {
      try {
        // 這裡請根據你實際的 service 寫法
        const res = await ClassSessionService.getCoachClasses(currentUser.id);
        setClasses(res);
      } catch (e) {
        // error 處理
      }
    };
    if (currentUser?.id) fetchMyClasses();
  }, [currentUser]);

  useEffect(() => {
    // 若有 sessionId，則自動請求詳情
    if (!session && sessionId) {
      setLoading(true);
      ClassSessionService.getSessionDetails(sessionId)
        .then(data => setSession(data))
        .catch(e => setError(e?.response?.data?.error || e.message))
        .finally(() => setLoading(false));
    }
  }, [session, sessionId]);

  if (!session && !sessionGroup) return <Typography color="error">Class session not found.</Typography>;

  // Single session registration
  const alreadyRegistered = session?.registrations?.some(r => r.member?.user?.id === currentUser?.id);
  const noQuota = (session?.currentParticipants || 0) >= session?.maxParticipants;

  // Group session registration
  const groupAlreadyRegistered = sessionGroup?.some(sess => sess.registrations?.some(r => r.member?.user?.id === currentUser?.id));
  const groupNoQuota = sessionGroup?.some(sess => (sess.currentParticipants || 0) >= sess.maxParticipants);

  // Replacement class: only allow original students, free registration
  const isReplacement = session?.replacementForSessionId != null;
  const isOriginalStudent = session?.allowedMemberIds?.includes(currentUser?.id); // 你可以在 API 回傳時加 allowedMemberIds
  const isFree = isReplacement || session?.price === 0;

  const handlePay = () => {
    // 跳轉到 payment 頁面，帶上 session 或 sessionGroup 資料
    if (sessionGroup) {
      navigate('/payment', { state: { sessionGroup } });
    } else {
      navigate('/payment', { state: { session } });
    }
  };

  const handleJoinReplacement = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await ClassSessionService.registerForSession(session.id, currentUser.id);
      setSuccess('Registration successful!');
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        {sessionGroup ? (
          <>
            <Typography variant="h5" fontWeight="bold" mb={2}>{sessionGroup[0].type}</Typography>
            <Typography mb={1}>Coach: {sessionGroup[0].coachName || sessionGroup[0].coach?.name || '-'}</Typography>
            <Typography mb={1}>Venue: {sessionGroup[0].venue || sessionGroup[0].venueName || '-'}</Typography>
            <Typography mb={1}>Total {sessionGroup.length} sessions</Typography>
            <Box mb={2}>
              {sessionGroup.map(sess => (
                <Typography key={sess.id} variant="body2" color="text.secondary">
                  {sess.date} {sess.time} | Price: RM {sess.price}
                </Typography>
              ))}
            </Box>
            <Typography mb={2} fontWeight="bold">Total Price: RM {sessionGroup.reduce((sum, sess) => sum + (sess.price || 0), 0)}</Typography>
            {groupAlreadyRegistered ? (
              <Typography color="success.main">You have already registered for one of these sessions.</Typography>
            ) : groupNoQuota ? (
              <Typography color="error">Some sessions are fully booked.</Typography>
            ) : (
              <>
                <Box display="flex" gap={2} mb={2}>
                  <Button variant="contained" color="primary" onClick={handlePay} disabled={loading} fullWidth>
                    {loading ? <CircularProgress size={24} /> : `Pay & Register All (${sessionGroup.length} sessions)`}
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={() => navigate(-1)} fullWidth>
                    Cancel
                  </Button>
                </Box>
                <Button variant="contained" color="success" fullWidth onClick={() => navigate('/payment', { state: { sessionGroup } })}>
                  Pay Now
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Typography variant="h5" fontWeight="bold" mb={2}>{session.title}</Typography>
            <Typography mb={1}>Coach: {session.coachName || session.coach?.name || '-'}</Typography>
            <Typography mb={1}>Venue: {session.court?.name || '-'} {session.venueName ? `- ${session.venueName}` : ''}</Typography>
            <Typography mb={1}>Time: {new Date(session.startTime).toLocaleString()} ~ {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
            <Typography mb={1}>Quota left: {session.maxParticipants - (session.currentParticipants || 0)}</Typography>
            <Typography mb={2}>Price: RM {session.price}</Typography>
            {isReplacement ? (
              isOriginalStudent ? (
                alreadyRegistered ? (
                  <Typography color="success.main">You have already joined this replacement class.</Typography>
                ) : (
                  <Button variant="contained" color="primary" onClick={handleJoinReplacement} disabled={loading || noQuota} fullWidth>
                    {loading ? <CircularProgress size={24} /> : 'Join (Free Replacement)'}
                  </Button>
                )
              ) : (
                <Typography color="error">Only students from the original cancelled class can join this replacement class.</Typography>
              )
            ) : alreadyRegistered ? (
              <Typography color="success.main">You have already registered for this session.</Typography>
            ) : noQuota ? (
              <Typography color="error">No quota left.</Typography>
            ) : (
              <>
                <Box display="flex" gap={2} mb={2}>
                  <Button variant="contained" color="primary" onClick={handlePay} disabled={loading} fullWidth>
                    {loading ? <CircularProgress size={24} /> : `Pay & Register (RM ${session.price})`}
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={() => navigate(-1)} fullWidth>
                    Cancel
                  </Button>
                </Box>
                <Button variant="contained" color="success" fullWidth onClick={() => navigate('/payment', { state: { session } })}>
                  Pay Now
                </Button>
              </>
            )}
          </>
        )}
        {error && <Typography color="error" mt={2}>{error}</Typography>}
        {success && <Typography color="success.main" mt={2}>{success.includes('success') ? 'Registration successful!' : success}</Typography>}
      </Paper>
    </Box>
  );
};

export default ClassSessionRegisterPage; 