// src/components/messaging/GroupChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, TextField, IconButton, Avatar, 
  useTheme, alpha, List, ListItem, ListItemText, 
  InputAdornment, Chip, Divider, Button, Menu, MenuItem, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions, Badge, ListItemAvatar
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupIcon from '@mui/icons-material/Group';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const GroupChat = ({ group, onBack }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showQuitGroupDialog, setShowQuitGroupDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editGroupName, setEditGroupName] = useState(group.name);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const fileInputRef = useRef(null);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`groupMessages_${group.id}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading group messages:', error);
      }
    }
  }, [group.id]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`groupMessages_${group.id}`, JSON.stringify(messages));
    }
  }, [messages, group.id]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  // Handle scroll events to detect manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    const messageData = {
      id: Date.now(),
      content: newMessage,
      imageUrl: selectedImage,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        profileImage: currentUser.profileImage
      },
      timestamp: new Date().toISOString(),
      type: selectedImage ? 'image' : 'text'
    };

    // Optimistic update
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setSelectedImage(null);
    
    // Force scroll to bottom
    setShouldAutoScroll(true);
    scrollToBottom();

    // TODO: Send to backend when group messaging API is implemented
    // try {
    //   await groupMessageService.sendMessage(group.id, newMessage, selectedImage);
    // } catch (error) {
    //   console.error('Failed to send message:', error);
    //   // Revert optimistic update on error
    //   setMessages(prev => prev.filter(msg => msg.id !== messageData.id));
    // }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Emoji categories
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕'],
    'Sports': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼'],
    'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐']
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    return user.name || user.username || 'Unknown User';
  };

  // Menu handlers & actions
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleShowMembers = () => {
    setShowMembersDialog(true);
    handleMenuClose();
  };

  const handleEditGroup = () => {
    setEditGroupName(group.name);
    setShowEditDialog(true);
    handleMenuClose();
  };

  const handleSaveGroupName = () => {
    // Update group name in localStorage
    const updatedGroup = { ...group, name: editGroupName };

    localStorage.setItem('userGroups', JSON.stringify(
      JSON.parse(localStorage.getItem('userGroups') || '[]').map(g => 
        g.id === group.id ? updatedGroup : g
      )
    ));

    setShowEditDialog(false);
    window.location.reload();
  };

  const handleAddMember = () => {
    setShowAddMemberDialog(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    handleMenuClose();
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out users who are already in the group
        const existingUsernames = [
          group.creator?.username,
          ...(group.members?.map(m => m.username) || [])
        ];
        const filteredResults = data.filter(user => 
          !existingUsernames.includes(user.username) &&
          user.username !== currentUser?.username
        );
        setSearchResults(filteredResults);
      } else {
        console.error('Failed to search users');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleSelectUser = (user) => {
    const isSelected = selectedUsers.some(u => u.username === user.username);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u.username !== user.username));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleRemoveSelectedUser = (username) => {
    setSelectedUsers(prev => prev.filter(u => u.username !== username));
  };

  const handleConfirmAddMembers = () => {
    if (selectedUsers.length === 0) return;

    // Update group members in localStorage
    const updatedGroup = {
      ...group,
      members: [...(group.members || []), ...selectedUsers],
      memberCount: (group.memberCount || 1) + selectedUsers.length
    };
    
    // Update localStorage
    const userGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
    const updatedGroups = userGroups.map(g => 
      g.id === group.id ? updatedGroup : g
    );
    localStorage.setItem('userGroups', JSON.stringify(updatedGroups));
    
    // Close dialog and show success message
    setShowAddMemberDialog(false);
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    
    alert(`Successfully added ${selectedUsers.length} member(s) to the group!`);
    
    // Force page reload to reflect changes
    window.location.reload();
  };

  const handleCancelAddMembers = () => {
    setShowAddMemberDialog(false);
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (member) => {
    setMemberToDelete(member);
    setShowDeleteMemberDialog(true);
  };

  const handleConfirmDeleteMember = () => {
    if (memberToDelete) {
      // Remove member logic here
      alert(`Member ${memberToDelete.username} removed successfully!`);
      
      // Update group members in localStorage
      const updatedGroup = {
        ...group,
        members: group.members?.filter(m => m.username !== memberToDelete.username) || [],
        memberCount: (group.memberCount || 1) - 1
      };
      
      // Update localStorage
      const userGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
      const updatedGroups = userGroups.map(g => 
        g.id === group.id ? updatedGroup : g
      );
      localStorage.setItem('userGroups', JSON.stringify(updatedGroups));
      
      // Close dialogs
      setShowDeleteMemberDialog(false);
      setShowMembersDialog(false);
      setMemberToDelete(null);
      
      // Force page reload to reflect changes
      window.location.reload();
    }
  };

  const handleCancelDeleteMember = () => {
    setShowDeleteMemberDialog(false);
    setMemberToDelete(null);
  };

  const handleDeleteGroup = () => {
    setShowDeleteGroupDialog(true);
    handleMenuClose();
  };

  const handleConfirmDeleteGroup = () => {
    // Delete group logic here
    alert('Group deleted successfully!');
    
    // Remove group from localStorage
    const userGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
    const updatedGroups = userGroups.filter(g => g.id !== group.id);
    localStorage.setItem('userGroups', JSON.stringify(updatedGroups));
    
    setShowDeleteGroupDialog(false);
    onBack();
  };

  const handleQuitGroup = () => {
    setShowQuitGroupDialog(true);
    handleMenuClose();
  };

  const handleConfirmQuitGroup = () => {
    // Remove current user from group members
    const updatedGroup = {
      ...group,
      members: group.members?.filter(m => m.username !== currentUser?.username) || [],
      memberCount: (group.memberCount || 1) - 1
    };
    
    // Update group in localStorage
    const userGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
    const updatedGroups = userGroups.map(g => 
      g.id === group.id ? updatedGroup : g
    );
    localStorage.setItem('userGroups', JSON.stringify(updatedGroups));
    
    // Remove group from current user's groups list
    const currentUserGroups = JSON.parse(localStorage.getItem('userGroups') || '[]');
    const filteredGroups = currentUserGroups.filter(g => g.id !== group.id);
    localStorage.setItem('userGroups', JSON.stringify(filteredGroups));
    
    setShowQuitGroupDialog(false);
    alert('You have successfully left the group!');
    onBack();
  };

  const handleCancelQuitGroup = () => {
    setShowQuitGroupDialog(false);
  };

  const handleCancelDeleteGroup = () => {
    setShowDeleteGroupDialog(false);
  };

  const isGroupCreator = () => {
    return group.creator?.username === currentUser?.username;
  };

  const canManageGroup = () => {
    return isGroupCreator();
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.default, 0.8)
        : alpha(theme.palette.background.default, 0.6)
    }}>
      {/* Header */}
      <Paper square sx={{
        borderRadius: 0,
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[1],
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2,
          gap: 2
        }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ 
            bgcolor: theme.palette.primary.main,
            width: 40,
            height: 40
          }}>
            <GroupIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {group.name}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {group.memberCount} members
            </Typography>
          </Box>

          {/* Group Actions Menu */}
          <IconButton
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }} ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.palette.text.secondary
          }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Welcome to {group.name}!
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Start the conversation by sending a message.
            </Typography>
          </Box>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === currentUser.id;
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Box sx={{
                  display: 'flex',
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 1,
                  maxWidth: '70%'
                }}>
                  {!isOwn && (
                    <Avatar
                      src={message.sender.profileImage}
                      sx={{ width: 32, height: 32, fontSize: '0.75rem' }}
                    >
                      {getDisplayName(message.sender).charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start'
                  }}>
                    {!isOwn && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 0.5,
                          fontSize: '0.75rem'
                        }}
                      >
                        {getDisplayName(message.sender)}
                      </Typography>
                    )}
                                         <Paper
                       sx={{
                         p: 1.5,
                         px: 2,
                         background: isOwn
                           ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                           : theme.palette.mode === 'dark'
                             ? alpha(theme.palette.background.paper, 0.8)
                             : alpha(theme.palette.background.paper, 0.9),
                         color: isOwn ? 'white' : theme.palette.text.primary,
                         borderRadius: 3,
                         maxWidth: '100%',
                         wordBreak: 'break-word'
                       }}
                     >
                       {message.imageUrl && (
                         <Box sx={{ mb: message.content ? 1 : 0 }}>
                           <img
                             src={message.imageUrl}
                             alt="Shared image"
                             style={{
                               maxWidth: '100%',
                               maxHeight: '300px',
                               borderRadius: '8px',
                               objectFit: 'cover'
                             }}
                           />
                         </Box>
                       )}
                       {message.content && (
                         <Typography variant="body2">
                           {message.content}
                         </Typography>
                       )}
                     </Paper>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        mt: 0.5,
                        fontSize: '0.7rem'
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper square sx={{
        borderRadius: 0,
        background: theme.palette.background.paper,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}>
        <Box sx={{ p: 2 }}>
          {/* Selected Image Preview */}
          {selectedImage && (
            <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: theme.palette.error.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.error.dark
                  }
                }}
              >
                ×
              </IconButton>
            </Box>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <Box 
              className="emoji-picker"
              sx={{
                mb: 2,
                p: 2,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                maxHeight: 200,
                overflow: 'auto'
              }}
            >
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary, 
                    display: 'block', 
                    mb: 1,
                    fontWeight: 600
                  }}>
                    {category}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 0.5 
                  }}>
                    {emojis.map((emoji, index) => (
                      <IconButton
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        size="small"
                        sx={{
                          fontSize: '1.2rem',
                          p: 0.5,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      >
                        {emoji}
                      </IconButton>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1
          }}>
            <IconButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <EmojiEmotionsIcon />
            </IconButton>
            
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <AttachFileIcon />
            </IconButton>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              InputProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.default, 0.8)
                    : alpha(theme.palette.background.default, 0.6),
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.divider, 0.3)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !selectedImage}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                },
                '&.Mui-disabled': {
                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                  color: alpha(theme.palette.primary.contrastText, 0.3)
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Group Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            minWidth: 200,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              py: 1,
              px: 2
            }
          }
        }}
      >
        <MenuItem onClick={handleShowMembers}>
          <ListItemIcon>
            <PeopleIcon fontSize="small" />
          </ListItemIcon>
          View Members
        </MenuItem>
        {canManageGroup() && (
          <>
            <MenuItem onClick={handleEditGroup}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Edit Group Name
            </MenuItem>
            <MenuItem onClick={handleAddMember}>
              <ListItemIcon>
                <PersonAddIcon fontSize="small" />
              </ListItemIcon>
              Add Member
            </MenuItem>
            <MenuItem onClick={handleDeleteGroup} sx={{ color: theme.palette.error.main }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
              </ListItemIcon>
              Delete Group
            </MenuItem>
          </>
        )}
        <Divider />
        <MenuItem onClick={handleQuitGroup} sx={{ color: theme.palette.warning.main }}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
          </ListItemIcon>
          Quit Group
        </MenuItem>
      </Menu>

      {/* Members Dialog */}
      <Dialog
        open={showMembersDialog}
        onClose={() => setShowMembersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon />
            <Typography variant="h6">Group Members</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {/* Creator */}
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {getDisplayName(group.creator).charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={getDisplayName(group.creator)}
                secondary="Creator"
              />
              <Chip label="Creator" size="small" color="primary" />
            </ListItem>
            
            {/* Members */}
            {group.members?.map((member, index) => (
              <ListItem key={index}>
                <ListItemAvatar>
                  <Avatar>
                    {getDisplayName(member).charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={getDisplayName(member)}
                  secondary={member.username}
                />
                {canManageGroup() && member.username !== currentUser?.username && (
                  <IconButton
                    onClick={() => handleRemoveMember(member)}
                    size="small"
                    sx={{ color: theme.palette.error.main }}
                  >
                    <PersonRemoveIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMembersDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Name Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Group Name</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={editGroupName}
            onChange={(e) => setEditGroupName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGroupName}
            variant="contained"
            disabled={!editGroupName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog
        open={showDeleteMemberDialog}
        onClose={handleCancelDeleteMember}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonRemoveIcon sx={{ color: theme.palette.error.main }} />
            <Typography variant="h6">Remove Member</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {memberToDelete ? getDisplayName(memberToDelete).charAt(0).toUpperCase() : '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {memberToDelete ? getDisplayName(memberToDelete) : 'Unknown User'}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {memberToDelete?.username}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1">
            Are you sure you want to remove this member from the group? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteMember}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDeleteMember}
            variant="contained"
            sx={{ 
              bgcolor: theme.palette.error.main,
              '&:hover': {
                bgcolor: theme.palette.error.dark
              }
            }}
          >
            Delete
          </Button>
                 </DialogActions>
       </Dialog>

       {/* Add Member Dialog */}
       <Dialog
         open={showAddMemberDialog}
         onClose={handleCancelAddMembers}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <PersonAddIcon />
             <Typography variant="h6">Add Members</Typography>
           </Box>
         </DialogTitle>
         <DialogContent>
           {/* Search Section */}
           <Box sx={{ mb: 3 }}>
             <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
               Search Users
             </Typography>
             <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
               <TextField
                 fullWidth
                 placeholder="Search by username or name..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyPress={(e) => {
                   if (e.key === 'Enter') {
                     handleSearchUsers();
                   }
                 }}
                 size="small"
               />
               <Button
                 onClick={handleSearchUsers}
                 variant="contained"
                 disabled={!searchQuery.trim()}
               >
                 Search
               </Button>
             </Box>
           </Box>

           {/* Selected Users */}
           {selectedUsers.length > 0 && (
             <Box sx={{ mb: 3 }}>
               <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                 Selected Users ({selectedUsers.length})
               </Typography>
               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                 {selectedUsers.map((user) => (
                   <Chip
                     key={user.username}
                     label={getDisplayName(user)}
                     onDelete={() => handleRemoveSelectedUser(user.username)}
                     color="primary"
                     variant="outlined"
                   />
                 ))}
               </Box>
             </Box>
           )}

           {/* Search Results */}
           {searchResults.length > 0 && (
             <Box>
               <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                 Search Results
               </Typography>
               <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                 {searchResults.map((user) => {
                   const isSelected = selectedUsers.some(u => u.username === user.username);
                   return (
                     <ListItem
                       key={user.username}
                       onClick={() => handleSelectUser(user)}
                       sx={{
                         cursor: 'pointer',
                         '&:hover': {
                           backgroundColor: alpha(theme.palette.primary.main, 0.04)
                         },
                         backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent'
                       }}
                     >
                       <ListItemAvatar>
                         <Avatar>
                           {getDisplayName(user).charAt(0).toUpperCase()}
                         </Avatar>
                       </ListItemAvatar>
                       <ListItemText
                         primary={getDisplayName(user)}
                         secondary={user.username}
                       />
                       {isSelected && (
                         <Chip label="Selected" size="small" color="primary" />
                       )}
                     </ListItem>
                   );
                 })}
               </List>
             </Box>
           )}

           {searchQuery && searchResults.length === 0 && (
             <Box sx={{ textAlign: 'center', py: 2 }}>
               <Typography variant="body2" color="text.secondary">
                 No users found matching "{searchQuery}"
               </Typography>
             </Box>
           )}
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCancelAddMembers}>
             Cancel
           </Button>
           <Button 
             onClick={handleConfirmAddMembers}
             variant="contained"
             disabled={selectedUsers.length === 0}
           >
             Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
           </Button>
         </DialogActions>
       </Dialog>

       {/* Quit Group Confirmation Dialog */}
       <Dialog
         open={showQuitGroupDialog}
         onClose={handleCancelQuitGroup}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <ExitToAppIcon sx={{ color: theme.palette.warning.main }} />
             <Typography variant="h6">Quit Group</Typography>
           </Box>
         </DialogTitle>
         <DialogContent>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
             <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
               <GroupIcon />
             </Avatar>
             <Box>
               <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                 {group.name}
               </Typography>
               <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                 {group.memberCount} members
               </Typography>
             </Box>
           </Box>
           <Typography variant="body1">
             Are you sure you want to leave this group? You will no longer be able to see group messages or participate in the conversation.
           </Typography>
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCancelQuitGroup}>
             Cancel
           </Button>
           <Button 
             onClick={handleConfirmQuitGroup}
             variant="contained"
             sx={{ 
               bgcolor: theme.palette.warning.main,
               '&:hover': {
                 bgcolor: theme.palette.warning.dark
               }
             }}
           >
             Quit Group
           </Button>
         </DialogActions>
       </Dialog>

       {/* Delete Group Confirmation Dialog */}
       <Dialog
         open={showDeleteGroupDialog}
         onClose={handleCancelDeleteGroup}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <DeleteIcon sx={{ color: theme.palette.error.main }} />
             <Typography variant="h6">Delete Group</Typography>
           </Box>
         </DialogTitle>
         <DialogContent>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
             <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
               <GroupIcon />
             </Avatar>
             <Box>
               <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                 {group.name}
               </Typography>
               <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                 {group.memberCount} members
               </Typography>
             </Box>
           </Box>
           <Typography variant="body1">
             Are you sure you want to delete this group? This action cannot be undone and all group messages will be lost.
           </Typography>
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCancelDeleteGroup}>
             Cancel
           </Button>
           <Button 
             onClick={handleConfirmDeleteGroup}
             variant="contained"
             sx={{ 
               bgcolor: theme.palette.error.main,
               '&:hover': {
                 bgcolor: theme.palette.error.dark
               }
             }}
           >
             Delete
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default GroupChat; 