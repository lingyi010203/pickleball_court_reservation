// src/components/friends/FriendList.jsx
import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Typography, Box 
} from '@mui/material';
import friendService from '../../service/FriendService';
import { useTheme, alpha } from '@mui/material/styles';

export default function FriendList({ onSelectFriend }) {
  const theme = useTheme();
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
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 700 }}>Your Friends</Typography>
      {friends.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: theme.palette.text.secondary }}>
          <Typography variant="body1">No friends yet</Typography>
        </Box>
      ) : (
        <List>
          {(Array.isArray(friends) ? friends : []).map(friend => (
            <ListItem
              key={friend.id}
              button
              onClick={() => onSelectFriend(friend)}
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
                <Avatar src={friend.profileImage} sx={{ boxShadow: theme.shadows[2] }} />
              </ListItemAvatar>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{friend.name}</Typography>}
                secondary={<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{`@${friend.username}`}</Typography>}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}