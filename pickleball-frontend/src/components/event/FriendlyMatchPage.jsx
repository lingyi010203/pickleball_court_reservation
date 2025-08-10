import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  MenuItem, 
  Select, 
  InputLabel, 
  FormControl, 
  Card, 
  CardContent, 
  Alert, 
  CircularProgress, 
  Divider, 
  Grid, 
  Chip,
  Paper,
  Avatar,
  IconButton,
  Fade,
  Slide,
  Container,
  CardActions,
  Stack,
  Badge,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { 
  Add as AddIcon,
  SportsTennis as TennisIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Stadium as StadiumIcon,
  Star,
  Favorite,
  FavoriteBorder,
  Notifications,
  NotificationsOff,
  PersonAdd,
  ExitToApp,
  Info,
  Delete as DeleteIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import api from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { cancelJoin } from '../../service/FriendlyMatchService';
import MessageService from '../../service/MessageService';

function formatTime(dt) {
  if (!dt) return '';
  // 支援 ISO string 或 Date 物件
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const FriendlyMatchPage = () => {
  const navigate = useNavigate();
  // States
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewInvite, setViewInvite] = useState(null);
  const [currentPlayers, setCurrentPlayers] = useState(1);
  const [matchExistsError, setMatchExistsError] = useState('');

  const { currentUser, authToken } = useAuth();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isLiked, setIsLiked] = useState(false);
  
  // 分享相關狀態
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareRecipient, setShareRecipient] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [matchToShare, setMatchToShare] = useState(null);
  const [isNotified, setIsNotified] = useState(false);
  const [joinStatus, setJoinStatus] = useState('not_joined');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');
  const [cancelConfirmDialogOpen, setCancelConfirmDialogOpen] = useState(false);

  const handleOpenUserProfile = async (username) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:8081/api/users/profile/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedUserProfile(data);
      } else {
        // 如果 API 調用失敗，顯示基本資料
        setSelectedUserProfile({
          username: username,
          name: 'User',
          email: 'Contact info not available',
          phone: 'Contact info not available',
          userType: 'User'
        });
      }
      setUserProfileDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // 如果 API 調用失敗，顯示基本資料
      setSelectedUserProfile({
        username: username,
        name: 'User',
        email: 'Contact info not available',
        phone: 'Contact info not available',
        userType: 'User'
      });
      setUserProfileDialogOpen(true);
    }
  };

  const handleCloseUserProfile = () => {
    setUserProfileDialogOpen(false);
    setSelectedUserProfile(null);
  };

  const handleSendMessage = () => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    setMessageDialogOpen(true);
    setMessageContent('');
    setMessageError('');
    setMessageSuccess('');
  };

  const handleCloseMessageDialog = () => {
    setMessageDialogOpen(false);
    setMessageContent('');
    setMessageError('');
    setMessageSuccess('');
  };

  const handleSubmitMessage = async () => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    if (!messageContent.trim()) {
      setMessageError('Please enter a message');
      return;
    }

    setSendingMessage(true);
    setMessageError('');
    setMessageSuccess('');

    try {
      await MessageService.sendMessage(selectedUserProfile.username, messageContent.trim());
      setMessageSuccess('Message sent successfully!');
      setMessageContent('');
      
      // 自動關閉對話框
      setTimeout(() => {
        handleCloseMessageDialog();
      }, 1500);
    } catch (error) {
      setMessageError(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const TeamCard = ({ team, isAway = false }) => (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={2} 
      flexDirection={isAway ? (isMobile ? 'column' : 'row-reverse') : (isMobile ? 'column' : 'row')}
      textAlign={isMobile ? 'center' : (isAway ? 'right' : 'left')}
    >
      <Avatar 
        sx={{ 
          width: 60, 
          height: 60, 
          bgcolor: team?.color || '#1976d2', 
          fontSize: '2rem',
          order: isAway ? 2 : 1
        }}
      >
        {team?.logo || '🏸'}
      </Avatar>
      <Box sx={{ order: isAway ? 1 : 2 }}>
        <Typography variant="h6" fontWeight="bold" color="white">
          {team?.name || (isAway ? 'Away Team' : 'Home Team')}
        </Typography>
        <Box display="flex" alignItems="center" gap={1} flexDirection={isAway ? 'row-reverse' : 'row'}>
          <Star sx={{ color: '#ffd700', fontSize: '1rem' }} />
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            {team?.rating || 4.0} ({team?.wins || 0}W-{team?.losses || 0}L)
          </Typography>
        </Box>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          {team?.players || 0} players
        </Typography>
      </Box>
    </Box>
  );

  useEffect(() => {
    fetchBookings();
    fetchInvitations();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/member/my-upcoming');
      setBookings(res.data);
    } catch (err) {
      setCreateError('Failed to load your bookings');
    }
  };

  const fetchInvitations = async () => {
    setLoading(true);
    setError('');
    try {
      // 获取所有开放的比赛（包括邀请类型和独立类型）
      const res = await api.get('/friendly-matches/all');
      setInvitations(res.data);
    } catch (err) {
      console.error('Failed to load matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // 移除自动刷新功能，避免过多的网络请求

  const handleBookingChange = (e) => {
    setSelectedBooking(e.target.value);
    setCurrentPlayers(1); // reset current participants when booking changes
  };

  const handleCreate = async (e) => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    e.preventDefault();
    setSubmitting(true);
    setCreateError('');
    setCreateSuccess('');
    setMatchExistsError('');
    try {
      const booking = bookings.find(b => b.id === Number(selectedBooking));
      const capacity = booking?.numberOfPlayers;
      if (!capacity || capacity <= 0) {
        setCreateError('Please select a booking with valid number of players.');
        setSubmitting(false);
        return;
      }
      if (currentPlayers < 1 || currentPlayers > capacity) {
        setCreateError('Current participants must be between 1 and capacity.');
        setSubmitting(false);
        return;
      }
      await api.post('/friendly-matches/invitation', {
        maxPlayers: capacity,
        currentPlayers,
        matchRules: note,
        startTime: booking?.bookingDate,
        status: 'OPEN',
      }, { params: { bookingId: selectedBooking } });
      setCreateSuccess('Invitation created successfully!');
      setSelectedBooking('');
      setCurrentPlayers(1);
      setNote('');
      fetchInvitations();
    } catch (err) {
      if (err.response && err.response.data && typeof err.response.data === 'string' && err.response.data.includes('already exists')) {
        setMatchExistsError('A match for this booking/time already exists. Please select another booking or time.');
      } else if (err.response && (err.response.status === 409 || err.response.status === 400)) {
        setMatchExistsError(err.response.data.message || 'A match for this booking/time already exists.');
      } else {
        setCreateError('Failed to create invitation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (id) => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    setJoiningId(id);
    setJoinSuccess('');
    try {
      await api.post(`/friendly-matches/invitation/${id}/join`);
      setJoinStatus('confirmed'); // 直接設為已加入
      setJoinSuccess('Successfully joined the match!');
      // 立即在前端更新 invitations，讓 UI 立即反映
      setInvitations(prevInvitations => prevInvitations.map(invite => {
        if (invite.id === id) {
          // 檢查是否已經有 joinRequests
          const alreadyJoined = invite.joinRequests && invite.joinRequests.some(req => req.status === 'APPROVED' && (
            req.memberId === currentUser?.id ||
            req.memberName === currentUser?.name ||
            req.username === currentUser?.username
          ));
          if (!alreadyJoined) {
            const newCurrentPlayers = (invite.currentPlayers || 0) + 1;
            const isFull = newCurrentPlayers >= invite.maxPlayers;
            const updatedInvite = {
              ...invite,
              currentPlayers: newCurrentPlayers,
              status: isFull ? 'FULL' : invite.status,
              joinRequests: [
                ...(invite.joinRequests || []),
                {
                  id: 'local-' + (currentUser?.id || currentUser?.username),
                  status: 'APPROVED',
                  memberId: currentUser?.id,
                  memberName: currentUser?.name,
                  username: currentUser?.username
                }
              ]
            };
            
            // 如果當前正在查看這個比賽，也要更新 viewInvite
            if (viewInvite && viewInvite.id === id) {
              setViewInvite(updatedInvite);
            }
            
            return updatedInvite;
          }
        }
        return invite;
      }));
      // 也可選擇 fetchInvitations(); // 但這樣會有延遲
    } catch (err) {
      setError('Failed to join invitation');
    } finally {
      setJoiningId(null);
    }
  };

  const handleView = (invite) => {
    setViewInvite(invite);
    setViewOpen(true);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewInvite(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'success';
      case 'FULL': return 'warning';
      case 'CLOSED': return 'error';
      case 'END': return 'error';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  // 計算已存在 match 的 bookingId set
  const existingMatchBookingIds = new Set(invitations.map(invite => invite.bookingId).filter(Boolean));

  // 刪除這段提醒彈窗的 useEffect
  // useEffect(() => {
  //   if (joinStatus === 'confirmed' && !reminderSet && viewInvite) {
  //     const reminderTimeout = setTimeout(() => {
  //       alert('Reminder: Your match is tomorrow at ' + 
  //         (viewInvite.startTime ? new Date(viewInvite.startTime).toLocaleTimeString() : '') + 
  //         ' at ' + (viewInvite.courtLocation || '') + '!');
  //       setReminderSet(true);
  //     }, 5000); // 測試用 5 秒，實際可設 24 小時前
  //     return () => clearTimeout(reminderTimeout);
  //   }
  // }, [joinStatus, reminderSet, viewInvite]);

  useEffect(() => {
    if (viewInvite) {
      console.log('currentUser', currentUser);
      console.log('viewInvite.joinRequests', viewInvite.joinRequests);
    }
  }, [viewInvite, currentUser]);

  const handlePayForMatch = () => {
    console.log('handlePayForMatch called'); // Debug log
    if (!viewInvite) {
      console.log('No viewInvite available'); // Debug log
      return;
    }
    
    console.log('Navigating to payment page with match details:', viewInvite); // Debug log
    
    // 導航到付款頁面，傳遞 friendly match 的詳細資訊
    navigate('/payment', {
      state: {
        type: 'friendly-match',
        matchId: viewInvite.id,
        matchDetails: {
          id: viewInvite.id,
          title: `Friendly Match #${viewInvite.id}`,
          organizer: viewInvite.organizerUsername,
          maxPlayers: viewInvite.maxPlayers,
          currentPlayers: viewInvite.currentPlayers,
          startTime: viewInvite.startTime,
          endTime: viewInvite.endTime,
          courtName: viewInvite.courtName,
          venueName: viewInvite.venueName,
          location: viewInvite.courtLocation,
          paymentStatus: viewInvite.paymentStatus,
          price: viewInvite.price,
          date: viewInvite.slotDate || viewInvite.date,
          duration: viewInvite.durationHours || 1
        }
      }
    });
  };

  const handlePayForMatchFromList = (invite) => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    console.log('handlePayForMatchFromList called for invite:', invite.id); // Debug log
    
    // 導航到付款頁面，傳遞 friendly match 的詳細資訊
    navigate('/payment', {
      state: {
        type: 'friendly-match',
        matchId: invite.id,
        matchDetails: {
          id: invite.id,
          title: `Friendly Match #${invite.id}`,
          organizer: invite.organizerUsername,
          maxPlayers: invite.maxPlayers,
          currentPlayers: invite.currentPlayers,
          startTime: invite.startTime,
          endTime: invite.endTime,
          courtName: invite.courtName,
          venueName: invite.venueName,
          location: invite.courtLocation,
          paymentStatus: invite.paymentStatus,
          price: invite.price,
          date: invite.slotDate || invite.date,
          duration: invite.durationHours || 1
        }
      }
    });
  };

  const handleCancelPayment = async () => {
    if (!viewInvite) return;
    try {
      await api.post(`/friendly-matches/invitation/${viewInvite.id}/cancel-payment`);
      setJoinStatus('not_joined'); // 取消付款後，狀態回到未加入
      setJoinSuccess('Payment cancelled successfully!');
      fetchInvitations(); // 立即刷新
    } catch (err) {
      setError('Failed to cancel payment');
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    console.log('=== Delete button clicked ===');
    console.log('Match ID:', matchId);
    console.log('Current user:', currentUser);
    
    if (!window.confirm('Are you sure you want to delete this friendly match? This action cannot be undone.')) {
      console.log('User cancelled deletion');
      return;
    }

    console.log('User confirmed deletion');
    setDeletingId(matchId);
    try {
      console.log('Attempting to delete match:', matchId);
      const response = await api.delete(`/friendly-matches/${matchId}`);
      console.log('Delete response:', response);
      
      if (response.status === 200) {
        // 刷新数据以移除已删除的match
        fetchInvitations();
        setJoinSuccess('Friendly match deleted successfully');
        setTimeout(() => setJoinSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete friendly match:', error);
      console.error('Error response:', error.response);
      setError('Failed to delete friendly match: ' + (error.response?.data || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelJoin = () => {
    setCancelConfirmDialogOpen(true);
  };

  const handleConfirmCancelJoin = async () => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    console.log('handleConfirmCancelJoin called'); // Debug log
    if (!viewInvite || !currentUser) {
      console.log('Missing viewInvite or currentUser:', { viewInvite, currentUser }); // Debug log
      return;
    }
    
    // 找到自己的 joinRequest
    const myRequest = viewInvite.joinRequests && viewInvite.joinRequests.find(
      req => req.status === 'APPROVED' && req.username === currentUser?.username
    );
    
    console.log('Found myRequest:', myRequest); // Debug log
    
    if (!myRequest) {
      console.log('No approved join request found'); // Debug log
      return;
    }
    
    try {
      console.log('Calling cancelJoin with:', { requestId: myRequest.id, memberId: currentUser.id }); // Debug log
      await cancelJoin(myRequest.id, currentUser.id);
      
      setJoinStatus('not_joined');
      setJoinSuccess('You have cancelled your join!');
      
      // 更新 invitations 和 viewInvite 狀態
      setInvitations(prevInvitations => prevInvitations.map(invite => {
        if (invite.id === viewInvite.id) {
          const newJoinRequests = (invite.joinRequests || []).filter(r => r.id !== myRequest.id);
          const newCurrentPlayers = Math.max((invite.currentPlayers || 1) - 1, 0);
          return {
            ...invite,
            joinRequests: newJoinRequests,
            currentPlayers: newCurrentPlayers,
            status: (invite.status === 'FULL' && newCurrentPlayers < invite.maxPlayers) ? 'OPEN' : invite.status
          };
        }
        return invite;
      }));
      
      // 更新 viewInvite
      setViewInvite(prev => {
        if (!prev) return prev;
        const newJoinRequests = (prev.joinRequests || []).filter(r => r.id !== myRequest.id);
        const newCurrentPlayers = Math.max((prev.currentPlayers || 1) - 1, 0);
        return {
          ...prev,
          joinRequests: newJoinRequests,
          currentPlayers: newCurrentPlayers,
          status: (prev.status === 'FULL' && newCurrentPlayers < prev.maxPlayers) ? 'OPEN' : prev.status
        };
      });
      
      console.log('Successfully cancelled join'); // Debug log
      
      // 關閉確認對話框
      setCancelConfirmDialogOpen(false);
    } catch (err) {
      console.error('Error in handleConfirmCancelJoin:', err); // Debug log
      setError('Failed to cancel join');
    }
  };

  const handleCloseCancelConfirmDialog = () => {
    setCancelConfirmDialogOpen(false);
  };

  // 獲取朋友列表
  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends/accepted');
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  // 搜索用戶
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 選擇用戶
  const selectUser = (username) => {
    setShareRecipient(username);
    setSearchQuery(username);
    setShowSearchResults(false);
  };

  // 生成分享消息
  const generateShareMessage = (match) => {
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (time) => {
      if (!time) return '';
      if (time.includes('T') || time.includes(' ')) {
        const date = new Date(time);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([], 
        { hour: '2-digit', minute: '2-digit' });
    };

    return `🎾 Join my Friendly Match!

📅 Date: ${formatDate(match.startTime)}
⏰ Time: ${formatTime(match.startTime)} - ${formatTime(match.endTime)}
🏟️ Court: ${match.courtName || 'Court'}
📍 Location: ${match.venueName || match.location || 'Location'}
👥 Players: ${match.currentPlayers}/${match.maxPlayers}
💰 Price: RM${match.price || 0}

Come join us for a great game! 🏓
Click here to join: [Friendly Match #${match.id}]`;
  };

  // 處理分享
  const handleShare = (match) => {
    console.log('handleShare called with match:', match);
    setMatchToShare(match);
    setShareMessage(generateShareMessage(match));
    setShareDialogOpen(true);
    console.log('Share dialog should be open now');
  };

  // 發送分享消息
  const handleSendShare = async () => {
    if (!shareRecipient.trim()) {
      alert('Please enter a recipient username');
      return;
    }

    setIsSharing(true);
    try {
      const params = new URLSearchParams({
        recipient: shareRecipient.trim(),
        content: shareMessage
      });
      await api.post(`/messages/send?${params.toString()}`);
      alert('Invitation sent successfully!');
      setShareDialogOpen(false);
      setShareRecipient('');
      setMatchToShare(null);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Failed to send invitation: ' + (error.response?.data || error.message));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TennisIcon sx={{ fontSize: 48, mr: 2 }} />
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold">
                Friendly Matches
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {authToken ? 'Create and join pickleball matches with fellow players' : 'Browse and join tennis matches with fellow players'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Success/Error Alerts */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {createError && authToken && (
            <Slide direction="down" in={!!createError}>
              <Alert 
                severity="error" 
                onClose={() => setCreateError('')}
                sx={{ borderRadius: 2 }}
              >
                {createError}
              </Alert>
            </Slide>
          )}
          {createSuccess && (
            <Slide direction="down" in={!!createSuccess}>
              <Alert 
                severity="success" 
                onClose={() => setCreateSuccess('')}
                sx={{ borderRadius: 2 }}
              >
                {createSuccess}
              </Alert>
            </Slide>
          )}
          {joinSuccess && (
            <Slide direction="down" in={!!joinSuccess}>
              <Alert 
                severity="success" 
                onClose={() => setJoinSuccess('')}
                sx={{ borderRadius: 2 }}
              >
                {joinSuccess}
              </Alert>
            </Slide>
          )}
          {error && (
            <Slide direction="down" in={!!error}>
              <Alert 
                severity="error" 
                onClose={() => setError('')}
                sx={{ borderRadius: 2 }}
              >
                {error}
              </Alert>
            </Slide>
          )}
          {/* 顯示 match exists 錯誤訊息 */}
          {matchExistsError && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error" onClose={() => setMatchExistsError('')} sx={{ borderRadius: 2 }}>
                {matchExistsError}
              </Alert>
            </Box>
          )}
        </Stack>

        <Grid container spacing={4}>
          {/* Create New Match Button - Only show for authenticated users */}
          {authToken && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/friendly-matches/create')}
                  sx={{
                    py: 2,
                    px: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '1.1rem'
                  }}
                  startIcon={<AddIcon />}
                >
                  Create New Friendly Match (No Payment Required)
                </Button>
              </Box>
            </Grid>
          )}

          {/* Create Invitation Form - Only show for authenticated users */}
          {authToken && (
            <Grid item xs={12} lg={4}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 0,
                borderRadius: 3,
                overflow: 'hidden',
                position: 'sticky',
                top: 20
              }}
            >
              <Box sx={{ 
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                p: 3,
                color: 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AddIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Create New Match
                  </Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                <form onSubmit={handleCreate}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="booking-select-label">Select Your Booking</InputLabel>
                    <Select
                      labelId="booking-select-label"
                      value={selectedBooking}
                      onChange={handleBookingChange}
                      label="Select Your Booking"
                      sx={{ borderRadius: 2 }}
                    >
                      {bookings.filter(b => !existingMatchBookingIds.has(b.id)).map(b => (
                        <MenuItem key={b.id} value={b.id}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {b.courtName || 'Court'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {b.slotDate} {b.startTime}~{b.endTime}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Capacity:</strong> {(() => {
                        if (!selectedBooking) return '-';
                        const booking = bookings.find(b => b.id === Number(selectedBooking));
                        if (booking && typeof booking.numberOfPlayers === 'number' && booking.numberOfPlayers > 0) {
                          return booking.numberOfPlayers;
                        }
                        return '-';
                      })()}
                    </Typography>
                  </Box>

                  {/* 新增目前已參加人數輸入欄位 */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Current Participants"
                      type="number"
                      value={currentPlayers}
                      onChange={e => {
                        const booking = bookings.find(b => b.id === Number(selectedBooking));
                        const capacity = booking?.numberOfPlayers || 1;
                        const maxVal = Math.max(1, capacity - 1);
                        const inputVal = Number(e.target.value);
                        const val = Math.max(1, Math.min(inputVal, maxVal));
                        setCurrentPlayers(val);
                      }}
                      required
                      inputProps={{ min: 1, max: selectedBooking ? Math.max(1, (bookings.find(b => b.id === Number(selectedBooking))?.numberOfPlayers || 1) - 1) : 1 }}
                      helperText={`How many participants (including yourself) are already confirmed?`}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Match Rules & Notes"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    multiline
                    rows={3}
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    placeholder="e.g., Friendly doubles, all levels welcome..."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || !selectedBooking || !(bookings.find(b => b.id === Number(selectedBooking))?.numberOfPlayers > 0) || !!matchExistsError}
                    fullWidth
                    sx={{ 
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      fontWeight: 'bold',
                      textTransform: 'none'
                    }}
                  >
                    {submitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Creating...
                      </Box>
                    ) : (
                      <>Create Match Invitation</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Paper>
          </Grid>
          )}

          {/* Invitations List */}
          <Grid item xs={12} lg={authToken ? 8 : 12}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                Available Matches
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join exciting tennis matches organized by the community
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {invitations.filter(invite => invite.status === 'OPEN' || invite.status === 'FULL' || invite.status === 'REMOVED').map((invite, index) => (
                  <Grid item xs={12} md={6} key={invite.id}>
                    <Fade in timeout={300 + index * 100}>
                      <Card 
                        elevation={2}
                        sx={{ 
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          bgcolor: invite.status === 'REMOVED' ? 'grey.100' : 'white',
                          color: invite.status === 'REMOVED' ? 'grey.500' : 'inherit',
                          '&:hover': invite.status === 'REMOVED' ? {} : {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Header */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ 
                                bgcolor: invite.status === 'REMOVED' ? 'grey.400' : 'primary.main',
                                width: 40,
                                height: 40,
                                mr: 2
                              }}>
                                <TennisIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="bold">
                                  Match #{invite.id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  by {invite.organizerUsername}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={invite.bookingStatus === 'CANCELLED' ? 'CANCELLED' : (invite.status === 'REMOVED' ? 'REMOVED' : invite.status)}
                              color={invite.bookingStatus === 'CANCELLED' ? 'error' : (invite.status === 'REMOVED' ? 'default' : getStatusColor(invite.status))}
                              size="small"
                              sx={{ fontWeight: 'medium', bgcolor: invite.bookingStatus === 'CANCELLED' ? 'error.light' : (invite.status === 'REMOVED' ? 'grey.300' : undefined) }}
                            />
                          </Box>

                          {/* Details */}
                          <Stack spacing={2} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ScheduleIcon sx={{ color: 'text.secondary', mr: 2, fontSize: 20 }} />
                              <Typography variant="body2">
                                {invite.slotDate || invite.date || ''} {invite.startTime && invite.endTime
                                  ? `${formatTime(invite.startTime)} ~ ${formatTime(invite.endTime)}`
                                  : (invite.startTime ? formatTime(invite.startTime) : '')}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StadiumIcon sx={{ color: 'text.secondary', mr: 2, fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {invite.courtName || invite.court}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {invite.venueName}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ color: 'text.secondary', mr: 2, fontSize: 20 }} />
                              <Typography variant="body2">
                                {invite.courtLocation}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <GroupIcon sx={{ color: 'text.secondary', mr: 2, fontSize: 20 }} />
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {invite.currentPlayers} / {invite.maxPlayers} players
                                </Typography>
                                <Box sx={{ ml: 1 }}>
                                  {[...Array(invite.maxPlayers)].map((_, i) => (
                                    <PersonIcon 
                                      key={i}
                                      sx={{ 
                                        fontSize: 16,
                                        color: i < invite.currentPlayers ? 'primary.main' : 'action.disabled'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Box>

                            {/* Price Information */}
                            {invite.price && invite.price > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ 
                                  width: 16, 
                                  height: 16, 
                                  borderRadius: '50%', 
                                  bgcolor: 'success.main',
                                  mr: 2 
                                }} />
                                <Typography variant="body2" fontWeight="medium" color="success.main">
                                  RM{invite.price.toFixed(2)}
                                </Typography>
                              </Box>
                            )}

                            {/* Payment Status - Only show for independent friendly matches (not invitation type) */}
                            {!invite.isInvitation && invite.paymentStatus === 'PENDING' && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ 
                                  width: 16, 
                                  height: 16, 
                                  borderRadius: '50%', 
                                  bgcolor: 'warning.main',
                                  mr: 2 
                                }} />
                                <Typography variant="body2" color="text.secondary">
                                  Payment: PENDING
                                </Typography>
                              </Box>
                            )}

                            {/* Payment Note for PENDING status - Only for independent matches */}
                            {!invite.isInvitation && invite.paymentStatus === 'PENDING' && invite.organizerUsername === currentUser?.username && (
                              <Box sx={{ 
                                bgcolor: 'warning.light',
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'warning.main'
                              }}>
                                <Typography variant="body2" color="warning.dark" sx={{ fontSize: '0.875rem' }}>
                                  💡 Organizer will make payment when the match is full
                                </Typography>
                              </Box>
                            )}
                          </Stack>

                          {invite.matchRules && (
                            <Box sx={{ 
                              bgcolor: 'grey.50',
                              p: 2,
                              borderRadius: 2,
                              mb: 2
                            }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Rules:</strong> {invite.matchRules}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>

                        <CardActions sx={{ p: 3, pt: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                            {invite.status === 'REMOVED' || invite.status === 'END' ? (
                              <Button
                                variant="outlined"
                                disabled
                                fullWidth
                                sx={{ 
                                  py: 1.5,
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  color: 'grey.500',
                                  borderColor: 'grey.300',
                                  bgcolor: 'grey.100'
                                }}
                              >
                                {invite.status === 'END' ? 'Match Ended' : 'Removed'}
                              </Button>
                            ) : (() => {
                              console.log('=== Checking organizer match ===');
                              console.log('Invite organizer:', invite.organizerUsername);
                              console.log('Current user username:', currentUser?.username);
                              console.log('Current user name:', currentUser?.name);
                              console.log('Match:', invite.id);
                              console.log('Match status:', invite.status);
                              console.log('Match start time:', invite.startTime);
                              console.log('Match end time:', invite.endTime);
                              console.log('Current date:', new Date().toISOString());
                              console.log('Is expired:', invite.status === 'END' || invite.status === 'CLOSED');
                              return invite.organizerUsername === currentUser?.username && invite.status !== 'END';
                            })() ? (
                              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                {/* 檢查是否滿員且需要付款 */}
                                {invite.status === 'FULL' && invite.paymentStatus === 'PENDING' ? (
                                  <Button
                                    onClick={() => handlePayForMatchFromList(invite)}
                                    variant="contained"
                                    color="primary"
                                    sx={{ 
                                      py: 1.5,
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      flex: 1,
                                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                                    }}
                                  >
                                    💳 Make Payment
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    disabled
                                    sx={{ 
                                      py: 1.5,
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      flex: 1
                                    }}
                                  >
                                    You're the organizer
                                  </Button>
                                )}
                                {/* 分享按鈕 - 只有 organizer 且不是 END 狀態才顯示 */}
                                {(() => {
                                  console.log('Share button debug:', {
                                    inviteId: invite.id,
                                    status: invite.status,
                                    organizerUsername: invite.organizerUsername,
                                    currentUser: currentUser?.username,
                                    isOrganizer: invite.organizerUsername === currentUser?.username,
                                    shouldShow: invite.organizerUsername === currentUser?.username && invite.status !== 'END'
                                  });
                                  return invite.organizerUsername === currentUser?.username && invite.status !== 'END';
                                })() && (
                                  <Tooltip title="Share with friends">
                                    <Button
                                      onClick={() => {
                                        console.log('Share button clicked for match:', invite.id);
                                        handleShare(invite);
                                      }}
                                      variant="contained"
                                      size="small"
                                      sx={{
                                        backgroundColor: '#2196f3',
                                        color: 'white',
                                        minWidth: 'auto',
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: 2,
                                        '&:hover': {
                                          backgroundColor: '#1976d2'
                                        }
                                      }}
                                    >
                                      Share
                                    </Button>
                                  </Tooltip>
                                )}
                                <Button
                                  onClick={() => handleDeleteMatch(invite.id)}
                                  disabled={deletingId === invite.id}
                                  variant="outlined"
                                  color="error"
                                  sx={{ 
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    minWidth: 'auto',
                                    px: 2
                                  }}
                                >
                                  {deletingId === invite.id ? (
                                    <CircularProgress size={16} color="error" />
                                  ) : (
                                    <DeleteIcon />
                                  )}
                                </Button>
                              </Stack>
                            ) : (
                              <Button
                                onClick={() => handleJoin(invite.id)}
                                disabled={(() => {
                                  const hasJoined = invite.joinRequests && invite.joinRequests.some(
                                    req => req.status === 'APPROVED' &&
                                      req.memberName && req.memberName.toLowerCase() === ((currentUser?.name || currentUser?.username || '')).toLowerCase()
                                  );
                                  return joiningId === invite.id || 
                                         invite.currentPlayers >= invite.maxPlayers || 
                                         invite.bookingStatus === 'CANCELLED' || 
                                         invite.status === 'END' || 
                                         invite.status === 'CLOSED' ||
                                         hasJoined;
                                })()}
                                variant="contained"
                                fullWidth
                                sx={{ 
                                  py: 1.5,
                                  borderRadius: 2,
                                  background: (() => {
                                    const hasJoined = invite.joinRequests && invite.joinRequests.some(
                                      req => req.status === 'APPROVED' &&
                                        req.memberName && req.memberName.toLowerCase() === ((currentUser?.name || currentUser?.username || '')).toLowerCase()
                                    );
                                    if (hasJoined) {
                                      return 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)';
                                    }
                                    return (invite.bookingStatus === 'CANCELLED' || invite.status === 'END' || invite.status === 'CLOSED') ? 'grey.400' : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)';
                                  })(),
                                  fontWeight: 'medium',
                                  textTransform: 'none'
                                }}
                              >
                                {(() => {
                                  const hasJoined = invite.joinRequests && invite.joinRequests.some(
                                    req => req.status === 'APPROVED' &&
                                      req.memberName && req.memberName.toLowerCase() === ((currentUser?.name || currentUser?.username || '')).toLowerCase()
                                  );
                                  if (hasJoined) {
                                    return (
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CheckIcon />
                                        Already Joined
                                      </Box>
                                    );
                                  }
                                  return (
                                    invite.bookingStatus === 'CANCELLED' ? (
                                      'Booking Cancelled'
                                    ) : invite.status === 'END' || invite.status === 'CLOSED' ? (
                                      'Match Ended'
                                    ) : joiningId === invite.id ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                                        Joining...
                                      </Box>
                                    ) : invite.currentPlayers >= invite.maxPlayers ? (
                                      'Match Full'
                                    ) : (
                                      'Join Match'
                                    )
                                  );
                                })()}
                              </Button>
                            )}
                            
                            <Tooltip title="View Details">
                              <IconButton 
                                onClick={() => handleView(invite)}
                                sx={{ 
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 2
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </CardActions>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            )}

            {!loading && invitations.length === 0 && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 8,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                  borderRadius: 3
                }}
              >
                <TennisIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No matches available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {authToken ? 'Be the first to create a friendly match!' : 'No matches are currently available. Please check back later!'}
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

        {/* View Match Dialog */}
        <Dialog 
          open={viewOpen} 
          onClose={handleCloseView} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TennisIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Match Details
              </Typography>
            </Box>
            <IconButton onClick={handleCloseView} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 3 }}>
            {viewInvite && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Match #{viewInvite.id}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Organizer
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewInvite.organizerUsername}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        label={viewInvite.bookingStatus === 'CANCELLED' ? 'CANCELLED' : viewInvite.status} 
                        color={viewInvite.bookingStatus === 'CANCELLED' ? 'error' : getStatusColor(viewInvite.status)}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        When & Where
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewInvite.slotDate || viewInvite.date || ''} {viewInvite.startTime && viewInvite.endTime
                          ? `${formatTime(viewInvite.startTime)} ~ ${formatTime(viewInvite.endTime)}`
                          : (viewInvite.startTime ? formatTime(viewInvite.startTime) : '')}
                      </Typography>
                      <Typography variant="body2">
                        {viewInvite.courtName} at {viewInvite.venueName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {viewInvite.courtLocation}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Players
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {viewInvite.currentPlayers} / {viewInvite.maxPlayers}
                      </Typography>
                    </Grid>
                    
                    {viewInvite.price && viewInvite.price > 0 && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" color="success.main">
                          RM{viewInvite.price.toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {viewInvite.matchRules && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Match Rules
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2">
                        {viewInvite.matchRules}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {viewInvite.note && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Additional Notes
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2">
                        {viewInvite.note}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {viewInvite.joinRequests && viewInvite.joinRequests.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Join Members
                    </Typography>
                    <Stack spacing={1}>
                      {viewInvite.joinRequests
                        .filter(req => req.status === 'APPROVED')
                        .map(req => (
                          <Box 
                            key={req.id}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              p: 2,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => handleOpenUserProfile(req.username)}
                            >
                              {req.username}
                            </Typography>
                          </Box>
                        ))}
                    </Stack>
                  </Box>
                )}

                {/* 如果沒有 joinRequests 或為空，顯示提示 */}
                {(!viewInvite.joinRequests || viewInvite.joinRequests.length === 0) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Join Members
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No members have joined yet.
                    </Typography>
                  </Box>
                )}
                {joinStatus === 'confirmed' && (
                  <Alert severity="success" sx={{ mb: 3 }} icon={<Info />}>You have successfully joined this match!</Alert>
                )}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  {(() => {
                    // 強化判斷：memberId 轉字串比對，並 fallback 比對 name/username
                    const hasJoined = viewInvite && viewInvite.joinRequests && viewInvite.joinRequests.some(
                      req => req.status === 'APPROVED' && req.username && req.username === currentUser?.username
                    );
                    const isFull = viewInvite.currentPlayers >= viewInvite.maxPlayers;
                    const isOrganizer = viewInvite.organizerUsername === currentUser?.username;
                    const isCancelled = viewInvite.bookingStatus === 'CANCELLED';
                    const isEnded = viewInvite.status === 'END' || viewInvite.status === 'CLOSED';
                    
                    if (hasJoined) {
                      // 檢查是否為 organizer
                      const isOrganizer = viewInvite.organizerUsername === currentUser?.username;
                      
                      if (isOrganizer) {
                        // Organizer 只顯示 "Already Joined" 按鈕，沒有 Cancel Join
                        return (
                          <Button
                            startIcon={<CheckIcon />}
                            size="large"
                            fullWidth
                            color="success"
                            variant="contained"
                            disabled
                            sx={{
                              background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                              fontWeight: 'medium'
                            }}
                          >
                            Already Joined
                          </Button>
                        );
                      } else {
                        // 一般參與者顯示兩個按鈕
                        return (
                          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            <Button
                              startIcon={<CheckIcon />}
                              size="large"
                              fullWidth
                              color="success"
                              variant="contained"
                              disabled
                              sx={{
                                background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                                fontWeight: 'medium'
                              }}
                            >
                              Already Joined
                            </Button>
                            <Button
                              startIcon={<ExitToApp />}
                              size="large"
                              color="error"
                              variant="outlined"
                              onClick={handleCancelJoin}
                              sx={{ fontWeight: 'medium', minWidth: 150 }}
                            >
                              Cancel Join
                            </Button>
                          </Stack>
                        );
                      }
                    }
                    if (isFull && !hasJoined) {
                      return (
                        <Button
                          startIcon={<PersonAdd />}
                          size="large"
                          fullWidth
                          color="warning"
                          variant="contained"
                          disabled
                          sx={{
                            background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                            fontWeight: 'medium'
                          }}
                        >
                          Match Full
                        </Button>
                      );
                    }
                    // 檢查是否為 organizer 且比賽滿員需要付款
                    if (isOrganizer && isFull && viewInvite.paymentStatus === 'PENDING') {
                      return (
                        <Button
                          startIcon={<PersonAdd />}
                          size="large"
                          fullWidth
                          color="primary"
                          variant="contained"
                          onClick={handlePayForMatch}
                          sx={{
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            fontWeight: 'medium'
                          }}
                        >
                          💳 Make Payment
                        </Button>
                      );
                    }
                    
                    return (
                      <Button
                        startIcon={<PersonAdd />}
                        size="large"
                        fullWidth
                        color={isCancelled ? 'error' : (isOrganizer ? 'info' : 'primary')}
                        variant="contained"
                        onClick={isCancelled || isEnded || isOrganizer ? undefined : () => handleJoin(viewInvite.id)}
                        disabled={isCancelled || isEnded || isOrganizer || joiningId === viewInvite.id}
                        sx={{
                          background: isCancelled || isEnded ? 'grey.400' : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          fontWeight: 'medium'
                        }}
                      >
                        {isCancelled
                          ? 'Booking Cancelled'
                          : isEnded
                            ? 'Match Ended'
                            : isOrganizer
                              ? "You're the organizer"
                              : joiningId === viewInvite.id ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                                  Joining...
                                </Box>
                              ) : (
                                'Join Match'
                              )}
                      </Button>
                    );
                  })()}
                </Stack>
              </Stack>
            )}
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        <Dialog open={userProfileDialogOpen} onClose={handleCloseUserProfile} maxWidth="xs" fullWidth>
          <DialogTitle>User Profile</DialogTitle>
          <DialogContent>
            {selectedUserProfile ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Username: {selectedUserProfile.username}</Typography>
                <Typography variant="body2">Name: {selectedUserProfile.name || '-'}</Typography>
                <Typography variant="body2">Email: {selectedUserProfile.email || '-'}</Typography>
                <Typography variant="body2">Phone: {selectedUserProfile.phone || '-'}</Typography>
                
                {/* Send Message Button - 只有當不是自己的資料時才顯示 */}
                {selectedUserProfile.username !== currentUser?.username && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSendMessage}
                      sx={{ minWidth: 150 }}
                    >
                      Send Message
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onClose={handleCloseMessageDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Send Message to {selectedUserProfile?.username}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              {messageError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {messageError}
                </Alert>
              )}
              {messageSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {messageSuccess}
                </Alert>
              )}
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                label="Message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMessageDialog} disabled={sendingMessage}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitMessage} 
              variant="contained" 
              disabled={sendingMessage || !messageContent.trim()}
            >
              {sendingMessage ? <CircularProgress size={20} /> : 'Send'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Share Friendly Match
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select Friend or Search User:
              </Typography>
              
              {/* 朋友列表下拉框 */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select from Friends</InputLabel>
                <Select
                  value=""
                  onChange={(e) => selectUser(e.target.value)}
                  label="Select from Friends"
                  onClick={fetchFriends}
                >
                  {friends.map((friend) => (
                    <MenuItem key={friend.id} value={friend.username}>
                      {friend.username} {friend.name && `(${friend.name})`}
                    </MenuItem>
                  ))}
                  {friends.length === 0 && (
                    <MenuItem disabled>No friends found</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* 搜索用戶 */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username"
                  variant="outlined"
                  size="small"
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button
                  variant="contained"
                  onClick={searchUsers}
                  disabled={isSearching || !searchQuery.trim()}
                  sx={{ minWidth: '80px' }}
                >
                  {isSearching ? '...' : 'Search'}
                </Button>
              </Box>

              {/* 搜索結果 */}
              {showSearchResults && (
                <Box sx={{ mb: 2, maxHeight: 150, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  {searchResults.map((user) => (
                    <Box
                      key={user.id}
                      onClick={() => selectUser(user.username)}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {user.username}
                      </Typography>
                      {user.name && (
                        <Typography variant="body2" color="text.secondary">
                          {user.name}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {searchResults.length === 0 && (
                    <Box sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* 選中的用戶 */}
              {shareRecipient && (
                <Box sx={{ mb: 2, p: 1, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected: <strong>{shareRecipient}</strong>
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Message Preview:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendShare}
              variant="contained"
              disabled={isSharing || !shareRecipient.trim()}
              sx={{
                backgroundColor: '#2196f3',
                '&:hover': {
                  backgroundColor: '#1976d2'
                }
              }}
            >
              {isSharing ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Join Confirmation Dialog */}
        <Dialog open={cancelConfirmDialogOpen} onClose={handleCloseCancelConfirmDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Confirm Cancel Join
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to cancel your join for this match?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone. You will be removed from the match.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCancelConfirmDialog}>
              Keep Joined
            </Button>
            <Button 
              onClick={() => {
                console.log('Button clicked!'); // Debug log
                handleConfirmCancelJoin();
              }} 
              variant="contained" 
              color="error"
            >
              Yes, Cancel Join
            </Button>
          </DialogActions>
        </Dialog>
      
    </Container>
  );
};

export default FriendlyMatchPage;