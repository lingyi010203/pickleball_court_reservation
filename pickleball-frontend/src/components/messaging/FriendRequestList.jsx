// src/components/friends/FriendRequestList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Button, Typography, Box 
} from '@mui/material';
import friendService from '../../service/FriendService';
import { useTheme, alpha } from '@mui/material/styles';

export default function FriendRequestList() {
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await friendService.getPendingRequests();
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch friend requests', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      await friendService.acceptRequest(id);
      setRequests(requests.filter(req => req.id !== id));
    } catch (error) {
      console.error('Failed to accept request', error);
    }
  };

  const handleDecline = async (id) => {
    try {
      await friendService.declineRequest(id);
      setRequests(requests.filter(req => req.id !== id));
    } catch (error) {
      console.error('Failed to decline request', error);
    }
  };

  if (loading) return <Typography>Loading requests...</Typography>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 700 }}>Friend Requests</Typography>
      {requests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: theme.palette.text.secondary }}>
          <Typography variant="body1">No pending requests</Typography>
        </Box>
      ) : (
        <List>
          {requests.map(request => (
            <ListItem
              key={request.id}
              sx={{
                borderRadius: 2,
                mb: 1,
                transition: 'background 0.2s',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <ListItemAvatar>
                <Avatar src={request.senderProfileImage} sx={{ boxShadow: theme.shadows[2] }} />
              </ListItemAvatar>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{request.senderName}</Typography>}
                secondary={<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{`@${request.senderUsername}`}</Typography>}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{
                  mr: 1,
                  borderRadius: 3,
                  boxShadow: theme.shadows[2],
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { boxShadow: theme.shadows[4] }
                }}
                onClick={() => handleAccept(request.id)}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { background: alpha(theme.palette.secondary.main, 0.08) }
                }}
                onClick={() => handleDecline(request.id)}
              >
                Decline
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}