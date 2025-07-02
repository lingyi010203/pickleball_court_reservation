// src/components/friends/FriendRequestList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Button, Typography, Box 
} from '@mui/material';
import friendService from '../../service/FriendService';

export default function FriendRequestList() {
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
      <Typography variant="h6" sx={{ mb: 2 }}>Friend Requests</Typography>
      {requests.length === 0 ? (
        <Typography>No pending requests</Typography>
      ) : (
        <List>
          {requests.map(request => (
            <ListItem key={request.id}>
              <ListItemAvatar>
                <Avatar src={request.senderProfileImage} />
              </ListItemAvatar>
              <ListItemText 
                primary={request.senderName} 
                secondary={`@${request.senderUsername}`} 
              />
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mr: 1 }}
                onClick={() => handleAccept(request.id)}
              >
                Accept
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
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