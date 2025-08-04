import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  CircularProgress, 
  Alert, 
  Rating, 
  IconButton, 
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  School as SchoolIcon, 
  Person as PersonIcon, 
  LocationOn as LocationIcon, 
  AccessTime as TimeIcon, 
  CalendarToday as CalendarIcon, 
  Star as StarIcon, 
  Cancel as CancelIcon, 
  CheckCircle as CheckCircleIcon, 
  Schedule as ScheduleIcon, 
  Comment as CommentIcon,
  RateReview as ReviewIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LeaveRequestService from '../../service/LeaveRequestService';
import ClassSessionService from '../../service/ClassSessionService';

const MyClassSessions = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialog, setCancelDialog] = useState({ open: false, session: null });
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [reviewDialog, setReviewDialog] = useState({ open: false, session: null });
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState({ open: false, session: null });
  const [leaveData, setLeaveData] = useState({ reason: '' });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [makeupDialog, setMakeupDialog] = useState({ open: false, session: null });
  const [coachSchedule, setCoachSchedule] = useState([]);
  const [loadingCoachSchedule, setLoadingCoachSchedule] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [loadingAvailableSessions, setLoadingAvailableSessions] = useState(false);
  const [selectedReplacementSession, setSelectedReplacementSession] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchUserSessions();
    }
  }, [currentUser]);

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      console.log('Fetching sessions for user:', currentUser);
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated or user ID not available');
      }
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Making API call to:', `http://localhost:8081/api/class-sessions/user/${currentUser.id}`);
      
      const response = await fetch(`http://localhost:8081/api/class-sessions/user/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      setSessions(data);
      
      // Fetch leave requests for the current user
      try {
        const leaveResponse = await fetch(`http://localhost:8081/api/leave-requests/student?studentId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (leaveResponse.ok) {
          const leaveData = await leaveResponse.json();
          setLeaveRequests(leaveData);
          console.log('Fetched leave requests:', leaveData);
        }
      } catch (leaveError) {
        console.error('Error fetching leave requests:', leaveError);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(`Failed to load your class sessions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!cancelDialog.session) return;

    try {
      setCancelling(true);
      
      // 檢查是否在24小時內，如果是則需要原因
      const sessionTime = new Date(cancelDialog.session.startTime);
      const now = new Date();
      const hoursUntilSession = (sessionTime - now) / (1000 * 60 * 60);
      
      let reason = cancelReason.trim();
      if (hoursUntilSession <= 24 && !reason) {
        setError('Please provide a reason for cancellation within 24 hours of the session.');
        return;
      }
      
      // 如果沒有提供原因，使用默認原因
      if (!reason) {
        reason = 'User requested cancellation';
      }
      
      const response = await ClassSessionService.cancelSession(cancelDialog.session.id, reason);
      
      // 顯示成功消息
      setSuccessMessage(`Successfully cancelled class session. Refund of RM ${cancelDialog.session.price} has been processed to your wallet.`);
      setShowSuccessMessage(true);
      
      // Refresh sessions
      await fetchUserSessions();
      setCancelDialog({ open: false, session: null });
      setCancelReason('');
      
      // 3秒後隱藏成功消息
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage('');
      }, 5000);
      
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err.message;
      if (errorMessage.includes('24 hours')) {
        setError('Cannot cancel class session within 24 hours of start time. Please provide a reason and try again.');
      } else {
        setError('Failed to cancel session: ' + errorMessage);
      }
      console.error('Error cancelling session:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSession = async () => {
    if (!reviewDialog.session || reviewData.rating === 0) return;
    
    try {
      setSubmittingReview(true);
      setError(''); // 清除之前的错误
      const token = localStorage.getItem('authToken');
      
      // 如果是課程組，需要為該組的所有已完成課程提交評價
      if (reviewDialog.session.recurringGroupId) {
        const groupSessions = sessions.filter(s => s.recurringGroupId === reviewDialog.session.recurringGroupId);
        const completedSessions = groupSessions.filter(s => getSessionStatus(s).label === 'Completed');
        
        // 為每個已完成的課程提交評價
        const reviewPromises = completedSessions.map(async session => {
          const response = await fetch(`http://localhost:8081/api/class-sessions/${session.id}/review`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              rating: reviewData.rating,
              comment: reviewData.comment
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Session ${session.id}: ${errorData.error || 'Failed to submit review'}`);
          }
          
          return response;
        });
        
        await Promise.all(reviewPromises);
      } else {
        // 單個課程評價
        const response = await fetch(`http://localhost:8081/api/class-sessions/${reviewDialog.session.id}/review`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating: reviewData.rating,
            comment: reviewData.comment
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Review submission failed:', errorData);
          throw new Error(errorData.error || 'Failed to submit review');
        }
        
        const result = await response.json();
        console.log('Review submitted successfully:', result);
      }
      
      // Refresh sessions after review submission
      await fetchUserSessions();
      setReviewDialog({ open: false, session: null });
      setReviewData({ rating: 0, comment: '' });
      setError(''); // 清除错误
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewDialog = (session) => {
    setReviewDialog({ open: true, session });
    
    // 如果是課程組，計算平均評分和評論
    if (session.recurringGroupId) {
      const groupSessions = sessions.filter(s => s.recurringGroupId === session.recurringGroupId);
      const completedSessions = groupSessions.filter(s => getSessionStatus(s).label === 'Completed');
      
      if (completedSessions.length > 0) {
        const totalRating = completedSessions.reduce((sum, s) => sum + (s.rating || 0), 0);
        const avgRating = Math.round(totalRating / completedSessions.length);
        const comments = completedSessions.map(s => s.coachComment).filter(Boolean);
        const combinedComment = comments.length > 0 ? comments.join('\n\n') : '';
        
        setReviewData({ 
          rating: avgRating, 
          comment: combinedComment 
        });
      } else {
        setReviewData({ rating: 0, comment: '' });
      }
    } else {
      // 單個課程
      setReviewData({ 
        rating: session.rating || 0, 
        comment: session.coachComment || '' 
      });
    }
  };

  const handleLeaveRequest = async () => {
    if (!leaveDialog.session || !leaveData.reason.trim()) return;
    
    try {
      setSubmittingLeave(true);
      const token = localStorage.getItem('authToken');
      
      console.log('Submitting leave request for session:', leaveDialog.session.id);
      console.log('Current user:', currentUser);
      console.log('Leave reason:', leaveData.reason);
      
      // 創建 LeaveRequest，但不發送消息給教練
      const leaveRequestData = {
        studentId: currentUser.id,
        coachId: leaveDialog.session.coachId,
        sessionId: leaveDialog.session.id,
        preferredDate: null, // 不設置偏好日期，讓學生後續選擇
        reason: leaveData.reason,
        requestType: 'DRAFT' // 設置為草稿狀態，不會顯示在教練的待處理列表中
      };
      
      console.log('Leave request data:', leaveRequestData);
      
      const response = await fetch('http://localhost:8081/api/leave-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leaveRequestData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Leave request result:', result);
      
      // Refresh sessions and leave requests after leave request
      await fetchUserSessions();
      setLeaveDialog({ open: false, session: null });
      setLeaveData({ reason: '' });
      
      alert('請假請求已保存為草稿！請點擊 "ARRANGE MAKEUP" 來選擇替補課程或發送消息給教練。');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError(`Failed to submit leave request: ${error.message}`);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const fetchCoachSchedule = async (coachId) => {
    try {
      setLoadingCoachSchedule(true);
      const token = localStorage.getItem('authToken');
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      console.log('Fetching coach schedule for coachId:', coachId);
      console.log('Time range:', now.toISOString(), 'to', endDate.toISOString());
      
      const response = await fetch(`http://localhost:8081/api/class-sessions/test-coach-sessions/${coachId}?userId=${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Coach schedule data:', data);
      
      // 從測試端點響應中提取 sessions 數組
      if (data.sessions && Array.isArray(data.sessions)) {
        setCoachSchedule(data.sessions);
      } else {
        setCoachSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching coach schedule:', error);
      setError(`Failed to fetch coach schedule: ${error.message}`);
    } finally {
      setLoadingCoachSchedule(false);
    }
  };

  const openMakeupDialog = async (session) => {
    setMakeupDialog({ open: true, session });
    if (session.coachId) {
      await fetchCoachSchedule(session.coachId);
      await fetchAvailableSessions(session.coachId);
    }
  };

              const sendMessageToCoach = async (coachId, coachName) => {
              try {
                console.log('Sending message to coach:', coachId, coachName);
                console.log('Session data:', makeupDialog.session);
                
                if (!coachId || !coachName || !makeupDialog.session) {
                  console.error('Missing information:', { coachId, coachName, session: makeupDialog.session });
      return;
    }
    
                // 更新現有的 LeaveRequest 狀態為 MESSAGE_SENT
                const session = makeupDialog.session;
                
                // 先找到現有的請假請求
                const existingRequest = leaveRequests.find(req => 
                  req.originalSessionId === session.id && req.studentId === currentUser.id
                );
                
                if (!existingRequest) {
                  alert('找不到請假請求，請先提交請假請求。');
                  return;
                }
                
                // 更新請假請求狀態
                const updateResponse = await fetch(`http://localhost:8081/api/leave-requests/${existingRequest.id}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    status: 'MESSAGE_SENT',
                    preferredDate: '1900-01-01 00:00:00' // 特殊值表示需要教練安排時間
                  })
                });
                
                if (!updateResponse.ok) {
                  const errorText = await updateResponse.text();
                  console.error('Failed to update leave request:', errorText);
                  alert('更新請假請求失敗，請稍後再試。');
                  return;
                }
                
                // 構建訊息內容
                const sessionDate = new Date(session.startTime).toLocaleDateString();
                const sessionTime = new Date(session.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                
                // 構建場地信息
                let locationInfo = '';
                if (session.venue) {
                  locationInfo += ` at ${session.venue}`;
                  if (session.state) {
                    locationInfo += `, ${session.state}`;
                  }
                }
                if (session.court) {
                  locationInfo += ` (Court: ${session.court})`;
                }
                
                const messageContent = `Hi ${coachName}, I would like to request a makeup class for the session "${session.title}" on ${sessionDate} at ${sessionTime}${locationInfo}. Could you please help me arrange an alternative time? Thank you!`;
                
                // 獲取教練的 email 作為 username
                const coachEmail = await getCoachEmail(coachId);
                if (!coachEmail) {
                  console.error('Could not find coach email');
                  alert('無法獲取教練信息，請稍後再試。');
                  return;
                }
                
                // 發送訊息
                const response = await fetch('http://localhost:8081/api/messages/send', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    recipient: coachEmail,
                    content: messageContent
                  })
                });
                
                if (response.ok) {
                  console.log('Message sent successfully');
                  alert('補課請求已發送給教練！');
                  
                  // 關閉對話框
                  setMakeupDialog({ open: false, session: null });
                  
                  // 導航到訊息頁面查看對話
                  const url = `/messages?coach=${coachId}&name=${encodeURIComponent(coachName)}`;
    window.location.href = url;
                } else {
                  const errorData = await response.json();
                  console.error('Failed to send message:', errorData);
                  alert(`發送訊息失敗: ${errorData.message || '未知錯誤'}`);
                }
              } catch (error) {
                console.error('Error sending message to coach:', error);
                alert('發送訊息時發生錯誤，請稍後再試。');
              }
            };
  
  // 獲取可用的補課時間
  const fetchAvailableSessions = async (coachId) => {
    try {
      setLoadingAvailableSessions(true);
      console.log('Fetching available sessions for coachId:', coachId, 'studentId:', currentUser.id);
      
      // 先調試檢查教練課程數據
      try {
        const debugData = await LeaveRequestService.debugCoachSessions(coachId);
        console.log('Debug coach sessions data:', debugData);
      } catch (debugError) {
        console.error('Debug failed:', debugError);
      }
      
      const sessions = await LeaveRequestService.getAvailableReplacementSessions(coachId, currentUser.id);
      console.log('Available sessions received:', sessions);
      setAvailableSessions(Array.isArray(sessions) ? sessions : []);
    } catch (error) {
      console.error('Failed to fetch available sessions:', error);
      // 不要彈出 alert，只記錄錯誤，讓用戶看到 "No available times found"
      setAvailableSessions([]);
    } finally {
      setLoadingAvailableSessions(false);
    }
  };

  // 處理學生自己選擇補課時間
  const handleSelfSelectReplacement = async () => {
    try {
      if (!selectedReplacementSession) {
        alert('請選擇一個補課時間');
        return;
      }

      const session = makeupDialog.session;
      
      // 先找到現有的請假請求
      const existingRequest = leaveRequests.find(req => 
        req.originalSessionId === session.id && req.studentId === currentUser.id
      );
      
      if (!existingRequest) {
        alert('找不到請假請求，請先提交請假請求。');
        return;
      }
      
      // 更新請假請求狀態
      const updateResponse = await fetch(`http://localhost:8081/api/leave-requests/${existingRequest.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SELF_SELECTED',
          preferredDate: selectedReplacementSession.startTime ? 
            new Date(selectedReplacementSession.startTime).toISOString().slice(0, 19).replace('T', ' ') : 
            '1900-01-01 00:00:00'
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update leave request:', errorText);
        alert('更新請假請求失敗，請稍後再試。');
        return;
      }
      
      alert('補課請求已提交！');
      setMakeupDialog({ open: false, session: null });
      setSelectedReplacementSession(null);
      fetchUserSessions(); // 刷新課程列表
    } catch (error) {
      console.error('Failed to update leave request:', error);
      alert('提交補課請求失敗，請稍後再試。');
    }
  };

  // 獲取教練的 email
  const getCoachEmail = async (coachId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/users/${coachId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const coachData = await response.json();
        return coachData.email;
      } else {
        console.error('Failed to fetch coach data:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching coach data:', error);
      return null;
    }
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionTime = new Date(session.startTime);
    
    if (session.status === 'CANCELLED') return { label: 'Cancelled', color: 'error' };
    if (session.status === 'COMPLETED') return { label: 'Completed', color: 'success' };
    if (sessionTime < now) return { label: 'Completed', color: 'success' };
    if (sessionTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return { label: 'Tomorrow', color: 'warning' };
    return { label: 'Upcoming', color: 'primary' };
  };

  const getAttendanceStatus = (session) => {
    // 如果課程還沒開始，不應該顯示出席狀態
    const now = new Date();
    const sessionTime = new Date(session.startTime);
    
    // 如果課程還沒開始，顯示 "Not Started"
    if (sessionTime > now) {
      return { label: 'Not Started', color: 'default', icon: <ScheduleIcon /> };
    }
    
    // 如果課程已經開始但還沒結束，顯示 "In Progress"
    const sessionEndTime = new Date(session.endTime);
    if (sessionTime <= now && sessionEndTime > now) {
      return { label: 'In Progress', color: 'warning', icon: <ScheduleIcon /> };
    }
    
    // 課程已結束，檢查出席狀態
    if (session.attendanceStatus === 'PRESENT') return { label: 'Present', color: 'success', icon: <CheckCircleIcon /> };
    if (session.attendanceStatus === 'ABSENT') return { label: 'Absent', color: 'error', icon: <CancelIcon /> };
    if (session.attendanceStatus === 'LATE') return { label: 'Late', color: 'warning', icon: <ScheduleIcon /> };
    if (session.attendanceStatus === 'MAKEUP') return { label: 'Makeup', color: 'info', icon: <SchoolIcon /> };
    return { label: 'Not Recorded', color: 'default', icon: <ScheduleIcon /> };
  };

  const calculateAttendanceRate = () => {
    const now = new Date();
    const completedSessions = sessions.filter(s => {
      const sessionEndTime = new Date(s.endTime);
      return sessionEndTime < now; // 只有已結束的課程才算完成
    });
    
    if (completedSessions.length === 0) return 0;
    
    const attendedSessions = completedSessions.filter(s => s.attendanceStatus === 'PRESENT');
    return Math.round((attendedSessions.length / completedSessions.length) * 100);
  };

  // Check if a session has a leave request
  const hasLeaveRequest = (session) => {
    return leaveRequests.some(request => 
      request.originalSessionId === session.id && 
      request.status !== 'CANCELLED' && 
      request.status !== 'DECLINED'
    );
  };

  // Get leave request for a session
  const getLeaveRequest = (session) => {
    return leaveRequests.find(request => request.originalSessionId === session.id);
  };

  // 按 recurringGroupId 分組課程
  const groupedSessions = () => {
    const grouped = {};
    sessions.forEach(session => {
      const key = session.recurringGroupId || session.id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    });
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const attendanceRate = calculateAttendanceRate();

  return (
    <Box>
      {/* Success Message */}
      {showSuccessMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setShowSuccessMessage(false)}>
          {successMessage}
        </Alert>
      )}
      
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Class Sessions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your class bookings and track your progress
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4">
                {sessions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Attendance Rate
              </Typography>
              <Typography variant="h4" color="primary">
                {attendanceRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Upcoming Sessions
              </Typography>
              <Typography variant="h4" color="warning.main">
                {sessions.filter(s => getSessionStatus(s).label === 'Upcoming').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Sessions
              </Typography>
              <Typography variant="h4" color="success.main">
                {sessions.filter(s => getSessionStatus(s).label === 'Completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions List */}
      <Box>
        <Typography variant="h6" gutterBottom>
          All Sessions
        </Typography>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No class sessions found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You haven't booked any class sessions yet.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {groupedSessions().map((group) => {
              const first = group[0];
              const groupKey = first.recurringGroupId || first.id;
              const expanded = expandedGroups.includes(groupKey);
              const status = getSessionStatus(first);
              const canCancel = group.some(s => getSessionStatus(s).label === 'Upcoming' && s.status !== 'CANCELLED');
              
              return (
                <Grid item xs={12} key={groupKey}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Typography variant="h6" sx={{ mr: 2 }}>
                              {first.title}
                            </Typography>
                            <Chip 
                              label={status.label} 
                              color={status.color} 
                              size="small" 
                            />
                          </Box>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  Coach: {first.coachName}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" mb={1}>
                                <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {first.venue} • {first.state}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="primary" mb={1}>
                                Total {group.length} sessions
                              </Typography>
                              <Typography variant="body2" color="text.secondary" mb={1}>
                                {(() => {
                                  // Find earliest and latest date in group
                                  const dates = group.map(sess => new Date(sess.startTime));
                                  const minDate = new Date(Math.min(...dates));
                                  const maxDate = new Date(Math.max(...dates));
                                  const format = (date) => date.toLocaleDateString();
                                  return `${format(minDate)} ~ ${format(maxDate)}`;
                                })()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" mb={1}>
                                {(() => {
                                  if (!group.length) return null;
                                  const firstSession = group[0];
                                  const [startTime, endTime] = [
                                    new Date(firstSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    new Date(firstSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  ];
                                  const daysOfWeek = Array.from(new Set(group.map(sess => {
                                    const date = new Date(sess.startTime);
                                    return date.toLocaleDateString('en-US', { weekday: 'long' });
                                  })));
                                  return [
                                    `Time: ${startTime} ~ ${endTime}`,
                                    `Day(s): ${daysOfWeek.join(', ')}`
                                  ].join(' | ');
                                })()}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  Overall Attendance:
                                </Typography>
                                <Chip 
                                  label={`${Math.round((group.filter(s => s.attendanceStatus === 'PRESENT').length / group.length) * 100)}%`}
                                  color="primary" 
                                  size="small" 
                                />
                              </Box>
                              
                              <Typography variant="h6" color="primary" mb={1}>
                                ${first.price}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        <Box>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => setExpandedGroups(prev => 
                              prev.includes(groupKey) 
                                ? prev.filter(id => id !== groupKey)
                                : [...prev, groupKey]
                            )}
                            sx={{ mb: 1, mr: 1 }}
                          >
                            {expanded ? 'Hide Details' : 'Show Details'}
                          </Button>
                          
                          {/* Review Button for session groups */}
                          {(() => {
                            const completedSessions = group.filter(s => getSessionStatus(s).label === 'Completed');
                            const upcomingSessions = group.filter(s => getSessionStatus(s).label === 'Upcoming');
                            const hasReviews = completedSessions.some(s => s.rating);
                            const canReview = completedSessions.length > 0 || upcomingSessions.length > 0;
                            
                            return canReview ? (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ReviewIcon />}
                                onClick={() => openReviewDialog(first)}
                                sx={{ mb: 1, mr: 1 }}
                                color={hasReviews ? "success" : "primary"}
                              >
                                {hasReviews ? 'Edit Review' : 'Review'}
                              </Button>
                            ) : null;
                          })()}
                          
                          {canCancel && (
                            <Tooltip title="Cancel this session group">
                              <IconButton 
                                color="error" 
                                onClick={() => setCancelDialog({ open: true, session: first })}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      
                      {expanded && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Individual Sessions:
                          </Typography>
                          <Grid container spacing={1}>
                            {group.map((session) => {
                              const sessionStatus = getSessionStatus(session);
                              const attendance = getAttendanceStatus(session);
                              
                              return (
                                <Grid item xs={12} key={session.id}>
                                  <Card variant="outlined">
                                    <CardContent sx={{ py: 1 }}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                          <Typography variant="body2" fontWeight="bold">
                                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                                            {new Date(session.startTime).toLocaleTimeString([], { 
                                              hour: '2-digit', 
                                              minute: '2-digit' 
                                            })}
                                            {session.endTime && (
                                              <>
                                                {' '}-{' '}
                                                {new Date(session.endTime).toLocaleTimeString([], { 
                                                  hour: '2-digit', 
                                                  minute: '2-digit' 
                                                })}
                                              </>
                                            )}
                                          </Typography>
                                          <Box display="flex" alignItems="center" mt={0.5}>
                                            <Chip 
                                              label={sessionStatus.label} 
                                              color={sessionStatus.color} 
                                              size="small" 
                                              sx={{ mr: 1 }}
                                            />
                                            <Chip 
                                              icon={attendance.icon}
                                              label={attendance.label} 
                                              color={attendance.color} 
                                              size="small" 
                                            />
                                          </Box>
                                        </Box>
                                        
                                        <Box textAlign="right">
                                          {session.coachComment && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              {session.coachComment}
                                            </Typography>
                                          )}
                                          {session.rating && (
                                            <Box display="flex" alignItems="center" justifyContent="flex-end">
                                              <Rating value={session.rating} readOnly size="small" />
                                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                                ({session.rating}/5)
                                              </Typography>
                                            </Box>
                                          )}
                                          
                                          {/* Action Buttons */}
                                          <Box sx={{ mt: 1 }}>
                                            {/* Review Button for completed sessions */}
                                            {sessionStatus.label === 'Completed' && (
                                              <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ReviewIcon />}
                                                onClick={() => openReviewDialog(session)}
                                                sx={{ mr: 1, mb: 1 }}
                                              >
                                                {session.rating ? 'Edit Review' : 'Review'}
                                              </Button>
                                            )}
                                            
                                            {/* Leave Request Button for upcoming sessions */}
                                            {sessionStatus.label === 'Upcoming' && (() => {
                                              const leaveRequest = getLeaveRequest(session);
                                              const hasRequest = hasLeaveRequest(session);
                                              const isApproved = leaveRequest && leaveRequest.status === 'APPROVED';
                                              const isDeclined = leaveRequest && leaveRequest.status === 'DECLINED';
                                              const isDraft = leaveRequest && leaveRequest.status === 'DRAFT';
                                              
                                              return (
                                              <Button
                                                variant="outlined"
                                                size="small"
                                                  color={isApproved ? "success" : isDeclined ? "error" : hasRequest ? "default" : "warning"}
                                                onClick={() => setLeaveDialog({ open: true, session })}
                                                  disabled={isApproved || isDeclined}
                                                sx={{ mr: 1, mb: 1 }}
                                              >
                                                  {isApproved ? 'Replacement Arranged' : 
                                                   isDeclined ? 'Request Declined' : 
                                                   isDraft ? 'Draft Saved' : 
                                                   hasRequest ? 'Leave Requested' : 'Request Leave'}
                                              </Button>
                                              );
                                            })()}
                                            
                                            {/* Makeup Class Button for sessions with leave request */}
                                            {hasLeaveRequest(session) && (() => {
                                              const leaveRequest = getLeaveRequest(session);
                                              const isApproved = leaveRequest && leaveRequest.status === 'APPROVED';
                                              const isDeclined = leaveRequest && leaveRequest.status === 'DECLINED';
                                              const isDraft = leaveRequest && leaveRequest.status === 'DRAFT';
                                              
                                              return (
                                              <Button
                                                variant="outlined"
                                                size="small"
                                                  color={isApproved ? "success" : isDeclined ? "error" : "info"}
                                                onClick={() => openMakeupDialog(session)}
                                                  disabled={isApproved || isDeclined}
                                                sx={{ mr: 1, mb: 1 }}
                                              >
                                                  {isApproved ? 'Replacement Arranged' : 
                                                   isDeclined ? 'Request Declined' : 
                                                   isDraft ? 'Arrange Makeup' : 
                                                   'Arrange Makeup'}
                                              </Button>
                                              );
                                            })()}
                                          </Box>
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, session: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Class Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this class session?
          </Typography>
          {cancelDialog.session && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {cancelDialog.session.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(cancelDialog.session.startTime).toLocaleDateString()} at{' '}
                {new Date(cancelDialog.session.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Price: RM {cancelDialog.session.price}
              </Typography>
            </Box>
          )}
          
          {/* 檢查是否在24小時內 */}
          {cancelDialog.session && (() => {
            const sessionTime = new Date(cancelDialog.session.startTime);
            const now = new Date();
            const hoursUntilSession = (sessionTime - now) / (1000 * 60 * 60);
            
            if (hoursUntilSession <= 24) {
              return (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                    ⚠️ This session is within 24 hours. Please provide a reason for cancellation.
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Cancellation Reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please explain why you need to cancel this session..."
                    variant="outlined"
                  />
                </Box>
              );
            }
            return null;
          })()}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCancelDialog({ open: false, session: null });
              setCancelReason('');
            }}
            disabled={cancelling}
          >
            Keep Session
          </Button>
          <Button 
            onClick={handleCancelSession} 
            color="error" 
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={20} /> : 'Cancel Session'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog.open} 
        onClose={() => setReviewDialog({ open: false, session: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewDialog.session ? 'Review Coach & Class Experience' : 'Review'}
        </DialogTitle>
        <DialogContent>
          {reviewDialog.session && (
            <Box>
              {/* Class Information */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Class: {reviewDialog.session.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {new Date(reviewDialog.session.startTime).toLocaleDateString()} at{' '}
                  {new Date(reviewDialog.session.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Venue: {reviewDialog.session.venue} • {reviewDialog.session.state}
                </Typography>
              </Box>
              
              {/* Coach Information */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'blue.50', borderRadius: 1 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Coach: {reviewDialog.session.coachName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please rate your experience with this coach for this class session
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Rate your experience with Coach {reviewDialog.session.coachName} (1-5 stars)
                </Typography>
                <Rating
                  value={reviewData.rating}
                  onChange={(event, newValue) => {
                    setReviewData(prev => ({ ...prev, rating: newValue }));
                  }}
                  size="large"
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Additional Comments about Coach & Class (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder={`Share your thoughts about Coach ${reviewDialog.session.coachName} and the ${reviewDialog.session.title} class...`}
                  value={reviewData.comment}
                  onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReviewDialog({ open: false, session: null })}
            disabled={submittingReview}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReviewSession} 
            color="primary" 
            variant="contained"
            disabled={submittingReview || reviewData.rating === 0}
          >
            {submittingReview ? <CircularProgress size={20} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Request Dialog */}
      <Dialog 
        open={leaveDialog.open} 
        onClose={() => setLeaveDialog({ open: false, session: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Request Leave for Class
        </DialogTitle>
        <DialogContent>
          {leaveDialog.session && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {leaveDialog.session.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {new Date(leaveDialog.session.startTime).toLocaleDateString()} at{' '}
                {new Date(leaveDialog.session.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Coach: {leaveDialog.session.coachName}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Reason for Leave Request *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Please provide a detailed reason for your leave request..."
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setLeaveDialog({ open: false, session: null })}
            disabled={submittingLeave}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleLeaveRequest} 
            color="warning" 
            variant="contained"
            disabled={submittingLeave || !leaveData.reason.trim()}
          >
            {submittingLeave ? <CircularProgress size={20} /> : 'Submit Leave Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Makeup Class Dialog */}
      <Dialog 
        open={makeupDialog.open} 
        onClose={() => setMakeupDialog({ open: false, session: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Arrange Makeup Class
        </DialogTitle>
        <DialogContent>
          {makeupDialog.session && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {makeupDialog.session.title} - Makeup Class
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Coach: {makeupDialog.session.coachName}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Coach's Available Times (Next 30 Days)
              </Typography>
              
              {loadingCoachSchedule ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress />
                </Box>
              ) : coachSchedule.length > 0 ? (
                <Grid container spacing={1}>
                  {coachSchedule.map((session, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {new Date(session.startTime).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(session.startTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {new Date(session.endTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => {
                              // Handle makeup class booking
                              console.log('Book makeup class:', session);
                            }}
                          >
                            Book This Time
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={2}>
                  <Typography color="text.secondary" gutterBottom>
                    No available times found for the next 30 days.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={async () => {
                      console.log('Message button clicked');
                      console.log('Session data:', makeupDialog.session);
                      console.log('Coach ID:', makeupDialog.session.coachId);
                      console.log('Coach Name:', makeupDialog.session.coachName);
                      await sendMessageToCoach(makeupDialog.session.coachId, makeupDialog.session.coachName);
                    }}
                  >
                    Message Coach to Arrange Time
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMakeupDialog({ open: false, session: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyClassSessions; 