import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShareIcon from '@mui/icons-material/Share';
import ClassSessionService from '../../service/ClassSessionService';
import api from '../../api/axiosConfig';

const PADDLE_PRICE = 5; // 每个 paddle 租金
const BALL_SET_PRICE = 12; // 一组 ball set 售价

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const matchDetails = location.state?.matchDetails;
  const eventDetails = location.state?.eventDetails;
  const paymentType = location.state?.type;
  const [sessionDetails, setSessionDetails] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareRecipient, setShareRecipient] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 添加调试日志
  console.log('=== BookingConfirmationPage Debug ===');
  console.log('Location state:', location.state);
  console.log('Booking object:', booking);
  console.log('Match details:', matchDetails);
  console.log('Payment type:', paymentType);
  console.log('Voucher information:');
  console.log('- voucherUsed:', booking?.voucherUsed);
  console.log('- originalAmount:', booking?.originalAmount);
  console.log('- discountAmount:', booking?.discountAmount);
  console.log('- voucherCode:', booking?.voucherCode);
  console.log('- totalAmount:', booking?.totalAmount);

  const formatDate = (dateString) => {
    console.log('formatDate called with:', dateString);
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (time) => {
    if (!time) return '';
    
    // 如果是完整的日期時間字符串，提取時間部分
    if (time.includes('T') || time.includes(' ')) {
      const date = new Date(time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // 如果是純時間格式（如 "08:00"），直接格式化
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([],
      { hour: '2-digit', minute: '2-digit' });
  };

  // 處理 friendly match、event registration 或一般 booking 的數據
  const isFriendlyMatch = paymentType === 'friendly-match';
  const isEventRegistration = paymentType === 'event-registration';
  const data = isFriendlyMatch ? matchDetails : (isEventRegistration ? eventDetails : booking);
  
  // 計算 duration（小時）
  const calculateDuration = () => {
    if (isFriendlyMatch && data?.startTime && data?.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const diffMs = end - start;
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.round(diffHours * 10) / 10; // 保留一位小數
    }
    return data?.duration || booking?.durationHours || 1;
  };
  
  const duration = calculateDuration();
  
  const numPlayers = isFriendlyMatch 
    ? (data?.maxPlayers || 4) 
    : (booking?.numberOfPlayers || 2);
  const numPaddles = isFriendlyMatch ? (data?.numPaddles || 0) : (booking?.numPaddles || 0);
  const buyBallSet = isFriendlyMatch ? !!data?.buyBallSet : !!booking?.buyBallSet;
  const total = isFriendlyMatch
    ? (data?.totalPrice || data?.price || 0)
    : isEventRegistration
    ? (location.state?.totalAmount || data?.feeAmount || 0)
    : (booking?.voucherUsed 
        ? booking.totalAmount  // Use discounted amount when voucher is used
        : (booking?.price !== undefined
            ? booking.price
            : (booking?.totalAmount !== undefined
                ? booking.totalAmount
                : (booking?.totalPrice !== undefined
                    ? booking.totalPrice
                    : 0))));

  useEffect(() => {
    if (booking && booking.type === 'class-session' && booking.sessions && booking.sessions.length > 0) {
      const sessionIds = booking.sessions.map(s => s.id);
      ClassSessionService.getSessionDetailsBatch(sessionIds)
        .then(data => setSessionDetails(data))
        .catch(() => setSessionDetails(null));
    }
  }, [booking]);

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

  // 生成分享消息內容
  const generateShareMessage = () => {
    if (isFriendlyMatch) {
      return `🎾 Friendly Match Confirmed!

📅 Date: ${formatDate(data?.date)}
⏰ Time: ${formatTime(data?.startTime)} - ${formatTime(data?.endTime)}
🏟️ Court: ${data?.courtName || 'Court'}
📍 Location: ${data?.venueName || data?.location || 'Location'}
👥 Players: ${data?.currentPlayers || 1}/${data?.maxPlayers || 4}
⏱️ Duration: ${duration} hour${duration !== 1 ? 's' : ''}
💰 Total: RM${total.toFixed(2)}

${data?.numPaddles > 0 ? `🏓 Paddles: ${data.numPaddles} (RM5 each)\n` : ''}${data?.buyBallSet ? '🏐 Ball Set: Yes (RM12)\n' : ''}
Payment Status: ✅ PAID

Join me for a great game! 🏓`;
    } else if (booking && booking.type === 'class-session' && booking.sessions) {
      // Class session booking
      const session = booking.sessions[0]; // 取第一個 session 作為代表
      const firstSession = session;
      
      return `🎓 Class Session Confirmed!

📅 Date: ${formatDate(firstSession?.startTime)}
⏰ Time: ${formatTime(firstSession?.startTime)} - ${formatTime(firstSession?.endTime)}
🏟️ Court: ${firstSession?.courtName || firstSession?.court?.name || 'Court'}
📍 Location: ${firstSession?.venueName || firstSession?.venue?.name || 'Location'}
👨‍🏫 Coach: ${firstSession?.coachName || firstSession?.coach?.name || 'Coach'}
💰 Total: RM${total.toFixed(2)}

${booking?.numPaddles > 0 ? `🏓 Paddles: ${booking.numPaddles} (RM5 each)\n` : ''}${booking?.buyBallSet ? '🏐 Ball Set: Yes (RM12)\n' : ''}
Payment Status: ✅ ${booking?.paymentStatus || 'PAID'}

Let's learn and play! 🏓`;
    } else if (isEventRegistration) {
      // Event registration
      return `🎉 Event Registration Confirmed!

📅 Event: ${data?.title || 'Event'}
🎯 Type: ${data?.eventType || 'N/A'}
📅 Date: ${data?.startTime ? new Date(data.startTime).toLocaleDateString() : 'N/A'}
⏰ Time: ${data?.startTime && data?.endTime ? 
  `${new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
📍 Location: ${data?.location || data?.venueLocation || 'Location TBD'}
👥 Capacity: ${data?.currentParticipants || 0}/${data?.capacity} participants
💰 Fee: RM${total.toFixed(2)}
👤 Organizer: ${data?.organizerName || 'N/A'}

Payment Status: ✅ ${location.state?.paymentStatus || 'COMPLETED'}

Looking forward to the event! 🎉`;
    } else {
      return `🏟️ Court Booking Confirmed!

📅 Date: ${formatDate(booking?.slotDate)}
⏰ Time: ${formatTime(booking?.startTime)} - ${formatTime(booking?.endTime)}
🏟️ Court: ${booking?.courtName || 'Court'}
📍 Location: ${booking?.courtLocation || 'Location'}
👥 Players: ${numPlayers}
💰 Total: RM${total.toFixed(2)}

${numPaddles > 0 ? `🏓 Paddles: ${numPaddles} (RM5 each)\n` : ''}${buyBallSet ? '🏐 Ball Set: Yes (RM12)\n' : ''}
Payment Status: ✅ ${booking?.paymentStatus || 'PAID'}

Let's play! 🏓`;
    }
  };

  // 處理分享
  const handleShare = () => {
    setShareMessage(generateShareMessage());
    setShareDialogOpen(true);
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
      alert('Message sent successfully!');
      setShareDialogOpen(false);
      setShareRecipient('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + (error.response?.data || error.message));
    } finally {
      setIsSharing(false);
    }
  };

  if (!booking && !matchDetails && !eventDetails) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Booking information not available
        </Typography>
        <Button variant="contained" onClick={() => navigate('/courts')}>
          Browse Courts
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{ 
          textAlign: 'center',
          p: 4,
          borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)'
      }}>
        <CheckCircleIcon sx={{ 
            fontSize: 80,
            color: '#4caf50',
            mb: 2,
            backgroundColor: '#e8f5e9',
            borderRadius: '50%',
          padding: '10px'
        }} />
  
        <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold',
            color: '#2e7d32',
          mb: 2
        }}>
           {isFriendlyMatch ? 'Payment Confirmed!' : 'Booking Confirmed!'}
        </Typography>
  
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isFriendlyMatch 
            ? `Your friendly match payment has been confirmed`
            : isEventRegistration
            ? `Your event registration has been confirmed`
            : `Your booking at ${booking?.courtName} has been confirmed`
          }
        </Typography>
  
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            mb: 4,
            textAlign: 'left',
            backgroundColor: '#f9f9f9',
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {isFriendlyMatch ? 'Match Summary' : 
               isEventRegistration ? 'Event Registration Summary' : 
               'Booking Summary'}
            </Typography>
  
            {booking && booking.type === 'class-session' && booking.sessions ? (
              <Box mb={2}>
                {/* 顯示 recurring group summary */}
                <Typography variant="body2" color="text.secondary">
                  Venue: {sessionDetails ? (sessionDetails[0]?.venueName || '-') : (booking.sessions[0]?.venue || booking.sessions[0]?.venueName || '-')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  State: {sessionDetails ? (sessionDetails[0]?.venueState || '-') : (booking.sessions[0]?.state || booking.sessions[0]?.venueState || '-')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Court: {sessionDetails ? (sessionDetails[0]?.courtName || '-') : (booking.sessions[0]?.courtName || booking.sessions[0]?.court?.name || '-')}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  Total Sessions: {booking.sessions.length}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={1} mt={2}>
                  Booked Class Sessions:
                </Typography>
                {(sessionDetails || (booking && booking.sessions)).map(sess => {
                  const start = sess.startTime ? new Date(sess.startTime) : null;
                  const end = sess.endTime ? new Date(sess.endTime) : null;
                  const format = d => d ? d.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <Typography key={sess.id} variant="body2" color="text.secondary">
                      {format(start)} - {format(end)} {sess.type || sess.slotType || ''} | Coach: {sess.coachName} | Price: RM {sess.price}
                    </Typography>
                  );
                })}
                
                {/* Equipment Options for Class Sessions */}
                {(booking?.numPaddles > 0 || booking?.buyBallSet) && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary" mb={1}>
                      Equipment Options:
                    </Typography>
                    {booking?.numPaddles > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        🏓 Paddles: {booking.numPaddles} (RM5 each)
                      </Typography>
                    )}
                    {booking?.buyBallSet && (
                      <Typography variant="body2" color="text.secondary">
                        🏐 Ball Set: Yes (RM12)
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <>
                {isFriendlyMatch ? (
                  <>
                    {/* Friendly Match Summary */}
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <SummaryRow label="Match Title" value={data?.title || 'Friendly Match'} bold />
                        <SummaryRow label="Max Players" value={numPlayers} />
                        <SummaryRow
                          label="Paddles Rented"
                          value={numPaddles > 0 ? `${numPaddles} (RM5 each)` : 'None'}
                        />
                        <SummaryRow
                          label="Ball Set"
                          value={buyBallSet ? 'Yes (RM12)' : 'No'}
                          isLast
                        />
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <SummaryRow label="Court" value={data?.courtName || 'Court'} bold />
                        <SummaryRow label="Location" value={data?.venueName || data?.location || data?.courtLocation || 'Location'} />
                        <SummaryRow label="Date" value={formatDate(data?.date)} />
                        <SummaryRow
                          label="Time"
                          value={`${formatTime(data?.startTime)} - ${formatTime(data?.endTime)}`}
                        />
                        <SummaryRow
                          label="Duration"
                          value={`${duration} hour${duration !== 1 ? 's' : ''}`}
                          isLast
                        />
                      </CardContent>
                    </Card>
                  </>
                ) : isEventRegistration ? (
                  <>
                    {/* Event Registration Summary */}
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <SummaryRow label="Event Title" value={data?.title || 'Event'} bold />
                        <SummaryRow label="Event Type" value={data?.eventType || 'N/A'} />
                        <SummaryRow label="Capacity" value={`${data?.currentParticipants || 0}/${data?.capacity} participants`} />
                        <SummaryRow label="Fee" value={`RM${data?.feeAmount || 0}`} isLast />
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <SummaryRow label="Date" value={data?.startTime ? new Date(data.startTime).toLocaleDateString() : 'N/A'} bold />
                        <SummaryRow label="Time" value={data?.startTime && data?.endTime ? 
                          `${new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'} />
                        <SummaryRow label="Location" value={data?.location || data?.venueLocation || 'Location TBD'} />
                        <SummaryRow label="Organizer" value={data?.organizerName || 'N/A'} isLast />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    {/* Regular Court Booking Summary */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <SummaryRow label="Number of Players" value={numPlayers} />
                <SummaryRow
                  label="Paddles to Rent"
                  value={`${numPaddles} (RM${PADDLE_PRICE} each)`}
                />
                <SummaryRow
                  label={`Buy Ball Set (RM${BALL_SET_PRICE})`}
                  value={buyBallSet ? 'Yes' : 'No'}
                  isLast
                />
              </CardContent>
            </Card>
  
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                        <SummaryRow label="Court" value={booking?.courtName} bold />
                        <SummaryRow label="Location" value={booking?.courtLocation} />
                        <SummaryRow label="Date" value={formatDate(booking?.slotDate)} />
                <SummaryRow
                  label="Time"
                          value={`${formatTime(booking?.startTime)} - ${formatTime(booking?.endTime)}`}
                />
                <SummaryRow
                  label="Duration"
                          value={`${booking?.durationHours} hours`}
                  isLast
                />
              </CardContent>
            </Card>
                  </>
                )}
              </>
            )}
  
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                {booking?.voucherUsed ? (
                  <>
                    <SummaryRow
                      label="Original Amount"
                      value={`RM${Number(booking.originalAmount).toFixed(2)}`}
                      color="#757575"
                    />
                    <SummaryRow
                      label="Voucher Applied"
                      value={booking.voucherCode}
                      color="#ff9800"
                    />
                    <SummaryRow
                      label="Discount Amount"
                      value={`-RM${Number(booking.discountAmount).toFixed(2)}`}
                      color="#4caf50"
                    />
                    <SummaryRow
                      label="Final Amount"
                      value={`RM${Number(total).toFixed(2)}`}
                      bold
                      color="#2e7d32"
                    />
                  </>
                ) : (
                  <SummaryRow
                    label="Total Amount"
                    value={`RM${Number(total).toFixed(2)}`}
                    bold
                    color="#2e7d32"
                  />
                )}
                <SummaryRow
                  label="Payment Method"
                  value={isFriendlyMatch ? 'Wallet' : 
                         isEventRegistration ? (location.state?.paymentMethod === 'WALLET' ? 'Wallet' : 'Credit Card') :
                         (booking?.paymentMethod === 'WALLET' ? 'Wallet' : 'Credit Card')}
                />
                <SummaryRow
                  label="Payment Status"
                  value={isFriendlyMatch ? 'PAID' : 
                         isEventRegistration ? (location.state?.paymentStatus || 'COMPLETED') :
                         booking?.paymentStatus}
                  color={(isFriendlyMatch ? 'PAID' : 
                         isEventRegistration ? (location.state?.paymentStatus || 'COMPLETED') :
                         booking?.paymentStatus) === 'COMPLETED' || (isFriendlyMatch ? 'PAID' : 
                         isEventRegistration ? (location.state?.paymentStatus || 'COMPLETED') :
                         booking?.paymentStatus) === 'PAID' ? '#2e7d32' : '#ff9800'}
                  bold
                  isLast
                />
              </CardContent>
            </Card>
  
            {booking?.pointsEarned && (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  backgroundColor: '#f3e5f5',
                  border: '1px solid #ce93d8',
                  borderRadius: '8px',
                  mt: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="#9c27b0"
                  textAlign="center"
                  gutterBottom
                >
                  🎉 Points Earned!
                </Typography>
  
                <SummaryRow
                  label="Points Earned"
                  value={`+${booking.pointsEarned}`}
                  bold
                  color="#9c27b0"
                />
                <SummaryRow
                  label="Tier Points"
                  value={`${booking.currentTierPointBalance} points`}
                />
                <SummaryRow
                  label="Reward Points"
                  value={`${booking.currentRewardPointBalance} points`}
                  isLast
                />
  
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 1 }}
                >
                  Earn 1 point for every RM1 spent!
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
  
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          {isFriendlyMatch ? (
            // Friendly Match 的按鈕
            <>
              <Tooltip title="Share confirmation with friends">
                <IconButton
                  onClick={handleShare}
                  sx={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1976d2'
                    },
                    mb: 2
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="outlined" 
                onClick={() => navigate('/events')}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#e8f5e9',
                    borderColor: '#2e7d32'
                  }
                }}
              >
                View My Matches
              </Button>
              
              <Button 
                variant="contained" 
                onClick={() => navigate('/events')}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  backgroundColor: '#ff6f00',
                  '&:hover': {
                    backgroundColor: '#e65100'
                  }
                }}
              >
                Create Another Match
              </Button>
            </>
          ) : isEventRegistration ? (
            // Event Registration 的按鈕
            <>
              <Tooltip title="Share confirmation with friends">
                <IconButton
                  onClick={handleShare}
                  sx={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1976d2'
                    },
                    mb: 2
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="outlined" 
                onClick={() => navigate('/events')}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#e8f5e9',
                    borderColor: '#2e7d32'
                  }
                }}
              >
                View My Events
              </Button>
              
              <Button 
                variant="contained" 
                onClick={() => navigate('/events')}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  backgroundColor: '#ff6f00',
                  '&:hover': {
                    backgroundColor: '#e65100'
                  }
                }}
              >
                Browse More Events
              </Button>
            </>
          ) : (booking && booking.type === 'class-session') ? (
            // Class Session 預訂的按鈕
            <>
              <Tooltip title="Share confirmation with friends">
                <IconButton
                  onClick={handleShare}
                  sx={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1976d2'
                    },
                    mb: 2
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="outlined" 
                onClick={() => navigate('/profile/my-class-sessions')}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#e8f5e9',
                    borderColor: '#2e7d32'
                  }
                }}
              >
                View My Class Sessions
              </Button>
              
              <Button 
                variant="contained" 
                onClick={() => navigate('/coaching/browse')}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  backgroundColor: '#ff6f00',
                  '&:hover': {
                    backgroundColor: '#e65100'
                  }
                }}
              >
                Book Another Class Session
              </Button>
            </>
          ) : (
            // 一般球場預訂的按鈕（保持原樣）
            <>
              <Tooltip title="Share confirmation with friends">
                <IconButton
                  onClick={handleShare}
                  sx={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1976d2'
                    },
                    mb: 2
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              
          <Button
            variant="outlined"
            onClick={() => navigate('/profile/my-bookings')}
            sx={{
              px: 4,
              py: 1.5,
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': {
                backgroundColor: '#e8f5e9',
                    borderColor: '#2e7d32'
                  }
            }}
          >
            View My Bookings
          </Button>
  
          <Button
            variant="contained"
            onClick={() => navigate('/courts')}
            sx={{
              px: 4,
              py: 1.5,
              backgroundColor: '#ff6f00',
              '&:hover': {
                    backgroundColor: '#e65100'
                  }
            }}
          >
            Book Another Court
          </Button>
            </>
          )}
        </Box>
              </Card>
      
      {/* 分享對話框 */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share Confirmation
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
            {isSharing ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    );
  };
  
const SummaryRow = ({ label, value, bold = false, color, isLast = false }) => (
  <Grid container spacing={1} sx={{ mb: isLast ? 0 : 1 }}>
    <Grid item xs={6}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Grid>
    <Grid item xs={6} textAlign="right">
      <Typography
        variant="body2"
        fontWeight={bold ? 'bold' : 'normal'}
        sx={{ color: color || 'inherit' }}
      >
        {value}
      </Typography>
    </Grid>
  </Grid>
);

export default BookingConfirmationPage;