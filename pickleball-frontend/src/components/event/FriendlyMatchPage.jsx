import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  Paper,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  TextField,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  AttachMoney,
  AccessTime,
  Star,
  Favorite,
  FavoriteBorder,
  Notifications,
  NotificationsOff,
  PersonAdd,
  CheckCircle,
  Pending,
  ExitToApp,
  Close,
  Send,
  Info
} from '@mui/icons-material';
import * as FriendlyMatchService from '../../service/FriendlyMatchService';
import { useAuth } from '../../context/AuthContext';
import ThemedCard from '../common/ThemedCard';
import { useTheme, alpha } from '@mui/material/styles';

const FriendlyMatchPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [joinStatus, setJoinStatus] = useState('not_joined');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [reminderSet, setReminderSet] = useState(false);
  const [match, setMatch] = useState({
    id: 1,
    startTime: "2025-07-10T10:00:00",
    location: "Central Park Court 1",
    maxPlayers: 4,
    currentPlayers: 2,
    status: "OPEN",
    organizer: { username: "OrganizerName" },
    entryFee: "Free",
    matchRules: "Friendly competitive match between two skilled teams",
    participants: { 1: "APPROVED", 2: "REQUESTED" }
  });
  const [pendingRequests, setPendingRequests] = useState([
    { name: "User 2", rating: 4.0, message: "Looking forward to it!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulate reminder notification 24 hours before match
  useEffect(() => {
    if (joinStatus === 'confirmed' && !reminderSet && match) {
      const reminderTimeout = setTimeout(() => {
        alert('Reminder: Your match is tomorrow at ' + (match.startTime ? new Date(match.startTime).toLocaleTimeString() : '') + ' at ' + (match.location || '') + '!');
        setReminderSet(true);
      }, 5000);
      return () => clearTimeout(reminderTimeout);
    }
  }, [joinStatus, reminderSet, match]);

  const handleJoinRequest = () => {
    if (!currentUser) {
      alert('Please log in to join matches');
      return;
    }
    setShowJoinModal(true);
  };

  const confirmJoinRequest = async () => {
    if (!match || !currentUser) return;
    try {
      await FriendlyMatchService.joinMatch(match.id, currentUser.id);
      setJoinStatus('pending');
      setShowJoinModal(false);
      setJoinMessage('');
    } catch (err) {
      alert('Failed to send join request.');
    }
  };

  const handleCancelJoin = () => {
    setShowCancelModal(true);
  };

  const confirmCancelJoin = async () => {
    if (!match || !currentUser) return;
    try {
      await FriendlyMatchService.cancelJoin(match.id, currentUser.id);
      setJoinStatus('cancelled');
      setShowCancelModal(false);
      alert('You have cancelled your participation. The organizer has been notified.');
    } catch (err) {
      alert('Failed to cancel participation.');
    }
  };

  const getJoinButtonProps = () => {
    switch (joinStatus) {
      case 'not_joined':
        return {
          text: 'Send Join Request',
          icon: <PersonAdd />,
          color: 'primary',
          variant: 'contained',
          onClick: handleJoinRequest,
          disabled: false
        };
      case 'pending':
        return {
          text: 'Request Pending',
          icon: <Pending />,
          color: 'warning',
          variant: 'contained',
          onClick: () => {},
          disabled: true
        };
      case 'confirmed':
        return {
          text: 'Joined Match',
          icon: <CheckCircle />,
          color: 'success',
          variant: 'contained',
          onClick: () => {},
          disabled: true
        };
      case 'cancelled':
        return {
          text: 'Send Join Request',
          icon: <PersonAdd />,
          color: 'primary',
          variant: 'contained',
          onClick: handleJoinRequest,
          disabled: false
        };
      default:
        return {
          text: 'Send Join Request',
          icon: <PersonAdd />,
          color: 'primary',
          variant: 'contained',
          onClick: handleJoinRequest,
          disabled: false
        };
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

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

  const buttonProps = getJoinButtonProps();

  // Demo teams (replace with real data if available)
  const homeTeam = {
    name: match.organizer?.username || 'Home Team',
    logo: '🦅',
    players: match.currentPlayers || 0,
    rating: 4.2,
    wins: 15,
    losses: 3,
    color: '#1976d2'
  };
  const awayTeam = {
    name: 'Challengers',
    logo: '⚡',
    players: (match.maxPlayers || 0) - (match.currentPlayers || 0),
    rating: 4.5,
    wins: 18,
    losses: 2,
    color: '#f57c00'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <ThemedCard 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            Friendly Match
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton 
              onClick={() => setIsLiked(!isLiked)}
              sx={{ color: 'white' }}
            >
              {isLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <IconButton 
              onClick={() => setIsNotified(!isNotified)}
              sx={{ color: 'white' }}
            >
              {isNotified ? <Notifications /> : <NotificationsOff />}
            </IconButton>
            <IconButton sx={{ color: 'white' }}>
              {/* Share icon, no action */}
            </IconButton>
          </Box>
        </Box>
        {/* Teams */}
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TeamCard team={homeTeam} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight="bold" color="white">
                VS
              </Typography>
              <Chip 
                label={match.status}
                color={match.status === 'OPEN' ? 'success' : 'warning'}
                sx={{ mt: 1, fontWeight: 'bold' }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <TeamCard team={awayTeam} isAway />
          </Grid>
        </Grid>
      </ThemedCard>

      {/* Match Details */}
      <ThemedCard elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Match Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarToday color="primary" />
                <Typography variant="body2">
                  {match.startTime ? new Date(match.startTime).toLocaleDateString() : ''}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTime color="primary" />
                <Typography variant="body2">
                  {match.startTime ? new Date(match.startTime).toLocaleTimeString() : ''}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn color="primary" />
                <Typography variant="body2">
                  {match.location}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney color="primary" />
                <Typography variant="body2">
                  {match.entryFee || 'Free'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2">
              Players: {match.currentPlayers}/{match.maxPlayers}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={((match.currentPlayers || 0) / (match.maxPlayers || 1)) * 100}
              sx={{ width: '40%' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Organizer: {match.organizer?.username || 'Organizer'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {match.matchRules || 'Friendly competitive match between two skilled teams'}
          </Typography>
        </CardContent>
      </ThemedCard>

      {/* Join Status Alert */}
      {joinStatus !== 'not_joined' && (
        <Alert 
          severity={
            joinStatus === 'confirmed' ? 'success' : 
            joinStatus === 'pending' ? 'warning' : 'info'
          }
          sx={{ mb: 3 }}
          icon={<Info />}
        >
          {joinStatus === 'confirmed' && 'You have successfully joined this match!'}
          {joinStatus === 'pending' && 'Your join request is pending organizer approval.'}
          {joinStatus === 'cancelled' && 'You have cancelled your participation in this match.'}
        </Alert>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          {...buttonProps}
          startIcon={buttonProps.icon}
          size="large"
          fullWidth
        >
          {buttonProps.text}
        </Button>
        {joinStatus === 'confirmed' && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={handleCancelJoin}
            size="large"
          >
            Cancel Join
          </Button>
        )}
      </Stack>

      {/* Tabs */}
      <ThemedCard elevation={2}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Recent Matches" />
          <Tab label="Join Requests" />
          <Tab label="Match Rules" />
        </Tabs>
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Recent Team Performance
          </Typography>
          <List>
            {/* Demo recent matches, replace with real data if available */}
            {[{ opponent: 'Fire Dragons', result: 'W', score: '3-1' }, { opponent: 'Ice Wolves', result: 'W', score: '2-0' }, { opponent: 'Storm Eagles', result: 'L', score: '1-2' }, { opponent: 'Rock Crushers', result: 'W', score: '4-2' }].map((match, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`vs ${match.opponent}`}
                  secondary={match.score}
                />
                <Chip 
                  label={match.result === 'W' ? 'Win' : 'Loss'}
                  color={match.result === 'W' ? 'success' : 'error'}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Pending Join Requests
          </Typography>
          <List>
            {pendingRequests.map((request, index) => (
              <ListItem key={index} divider>
                <ListItemAvatar>
                  <Avatar>{request.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={request.name}
                  secondary={`Rating: ${request.rating} - "${request.message}"`}
                />
                <Stack direction="row" spacing={1}>
                  <Button size="small" color="success" variant="outlined">
                    Accept
                  </Button>
                  <Button size="small" color="error" variant="outlined">
                    Decline
                  </Button>
                </Stack>
              </ListItem>
            ))}
          </List>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Match Rules & Guidelines
          </Typography>
          <Typography variant="body2" paragraph>
            • Fair play is expected from all participants
          </Typography>
          <Typography variant="body2" paragraph>
            • Entry fee must be paid before match start
          </Typography>
          <Typography variant="body2" paragraph>
            • Cancellation must be done at least 2 hours before match time
          </Typography>
          <Typography variant="body2" paragraph>
            • Players must arrive 15 minutes before match time
          </Typography>
          <Typography variant="body2" paragraph>
            • Proper sports attire required
          </Typography>
        </TabPanel>
      </ThemedCard>

      {/* Join Request Modal */}
      <Dialog open={showJoinModal} onClose={() => setShowJoinModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Send Join Request
            <IconButton onClick={() => setShowJoinModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Your request will be sent to the match organizer for approval.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a message (optional)"
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJoinModal(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmJoinRequest} 
            variant="contained" 
            startIcon={<Send />}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Join Modal */}
      <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="sm">
        <DialogTitle>Cancel Match Participation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your participation in this match? 
            The organizer will be notified.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelModal(false)}>
            Keep Participation
          </Button>
          <Button onClick={confirmCancelJoin} color="error" variant="contained">
            Cancel Participation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FriendlyMatchPage; 