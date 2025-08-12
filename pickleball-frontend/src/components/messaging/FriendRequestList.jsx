// src/components/friends/FriendRequestList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Button, Typography, Box, Badge 
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

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Loading requests...
        </Typography>
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        color: theme.palette.text.secondary 
      }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          No pending requests
        </Typography>
        <Typography variant="caption">
          When someone sends you a friend request, it will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {requests.map((request, index) => (
        <ListItem
          key={request.id}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: index < requests.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
            transition: 'background 0.2s',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          <ListItemAvatar sx={{ minWidth: 48 }}>
            <Avatar 
              src={request.senderProfileImage} 
              sx={{ 
                width: 40, 
                height: 40,
                boxShadow: theme.shadows[2]
              }}
            >
              {(request.senderName || request.senderUsername || 'R').substring(0, 2).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: '0.9rem'
                }}
              >
                {request.senderName}
              </Typography>
            }
            secondary={
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem'
                }}
              >
                {`@${request.senderUsername}`}
              </Typography>
            }
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[2],
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.8rem',
                minWidth: 80,
                height: 32,
                '&:hover': { 
                  boxShadow: theme.shadows[4] 
                }
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
                fontSize: '0.8rem',
                minWidth: 80,
                height: 32,
                '&:hover': { 
                  background: alpha(theme.palette.secondary.main, 0.08) 
                }
              }}
              onClick={() => handleDecline(request.id)}
            >
              Decline
            </Button>
          </Box>
        </ListItem>
      ))}
    </List>
  );
}