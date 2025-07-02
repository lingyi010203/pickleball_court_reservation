// src/components/friends/FriendList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Typography, Box 
} from '@mui/material';
import friendService from '../../service/FriendService';

export default function FriendList({ onSelectFriend }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await friendService.getFriends();
        console.log('API getFriends result:', data); // Debug: log the API response
        setFriends(Array.isArray(data) ? data : []); // Defensive: always set an array
      } catch (error) {
        console.error('Failed to fetch friends', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  if (loading) return <Typography>Loading friends...</Typography>;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Your Friends</Typography>
      {friends.length === 0 ? (
        <Typography>No friends yet</Typography>
      ) : (
        <List>
          {(Array.isArray(friends) ? friends : []).map(friend => (
            <ListItem 
              key={friend.id} 
              button
              onClick={() => onSelectFriend(friend)}
            >
              <ListItemAvatar>
                <Avatar src={friend.profileImage} />
              </ListItemAvatar>
              <ListItemText 
                primary={friend.name} 
                secondary={`@${friend.username}`} 
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}