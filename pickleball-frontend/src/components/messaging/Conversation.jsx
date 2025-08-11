// src/components/messaging/Conversation.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Avatar, Typography, TextField,
  Button, IconButton, List, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import MessageBubble from './MessageBubble';
import messageService from '../../service/MessageService';
import { useSocket } from '../../context/SocketContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTheme, alpha } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
// Removed status dot icon

export default function Conversation({ otherUser, onBack }) {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  // Removed online/offline status tracking
  const { stompClient } = useSocket();
  const { currentUser } = useAuth();

  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Enhanced emoji list with categories
  const emojiCategories = {
    'Smileys': ['😊', '😂', '😎', '🤔', '😢', '😡', '😍', '🥰', '😘', '😋', '🤗', '🤫', '🤐', '😴', '😪', '😵'],
    'Gestures': ['👍', '👎', '👋', '💪', '🙏', '✌️', '🤞', '👌', '🤟', '🤘', '👊', '🤝', '👏', '🙌', '🤲', '👐'],
    'Sports': ['🎾', '🏆', '🎯', '⚽', '🏀', '🎸', '🎵', '🎶', '🎤', '🎧', '🎮', '🎲', '🎪', '🎨', '🎭', '🎬'],
    'Nature': ['🌺', '🌸', '🌼', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🌍'],
    'Food': ['🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍰', '🍦', '🍧', '🍨', '🍭', '🍬', '🍫', '🍪', '🥤'],
    'Objects': ['💻', '📱', '📷', '🎥', '📺', '📻', '🔋', '💡', '🔑', '🎁', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎']
  };

  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Smileys');

  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  console.log('Conversation component rendered with otherUser:', otherUser);

  // Fetch message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setError(null);
        setLoading(true);
        
        if (!otherUser?.username) {
          console.log('No username found for otherUser:', otherUser);
          setLoading(false);
          return;
        }

        console.log('Fetching messages for user:', otherUser.username);
        const data = await messageService.getConversation(otherUser.username);
        console.log('Fetched messages:', data);

        // Enhance message data
        const enhancedMessages = data.map(msg => ({
          ...msg,
          senderUsername: msg.senderUsername ||
            (msg.sender?.userAccount?.username || '') ||
            (msg.sender?.username || ''),
          senderProfileImage: msg.senderProfileImage ||
            (msg.sender?.profileImage || '') ||
            (msg.sender?.userAccount?.profileImage || ''),
          // Ensure image URLs are absolute
          imageUrl: msg.imageUrl ? msg.imageUrl : null
        }));

        setMessages(enhancedMessages);
      } catch (error) {
        console.error('Failed to fetch messages', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (otherUser) fetchMessages();
  }, [otherUser]);

  // Retry function
  const handleRetry = async () => {
    setRetrying(true);
    try {
      const data = await messageService.getConversation(otherUser.username);
      const enhancedMessages = data.map(msg => ({
        ...msg,
        senderUsername: msg.senderUsername ||
          (msg.sender?.userAccount?.username || '') ||
          (msg.sender?.username || ''),
        senderProfileImage: msg.senderProfileImage ||
          (msg.sender?.profileImage || '') ||
          (msg.sender?.userAccount?.profileImage || ''),
        imageUrl: msg.imageUrl ? msg.imageUrl : null
      }));
      setMessages(enhancedMessages);
      setError(null);
    } catch (error) {
      console.error('Retry failed:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    if (!stompClient || !stompClient.connected) return;

    const subscription = stompClient.subscribe(
      `/user/queue/messages`,
      (message) => {
        const data = JSON.parse(message.body);

        // Handle status updates
        if (data.type === 'delivered' || data.type === 'read') {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.messageId ? {
                ...msg,
                [data.type === 'delivered' ? 'delivered' : 'read']: true
              } : msg
            )
          );
          return;
        }

        // Enhance received message
        const enhancedMessage = {
          ...data,
          senderUsername: data.senderUsername ||
            (data.sender?.username || ''),
          senderProfileImage: data.senderProfileImage ||
            (data.sender?.profileImage || ''),
          // Ensure image URLs are absolute
          imageUrl: data.imageUrl ? `${process.env.REACT_APP_API_BASE_URL}${data.imageUrl}` : null
        };
        
        // Only add relevant messages - check if this message is part of the current conversation
        const isFromOtherUser = enhancedMessage.senderUsername === otherUser.username;
        const isToOtherUser = enhancedMessage.recipientUsername === otherUser.username;
        const isFromCurrentUser = enhancedMessage.senderUsername === currentUser?.username;
        const isToCurrentUser = enhancedMessage.recipientUsername === currentUser?.username;

        if ((isFromOtherUser && isToCurrentUser) || (isFromCurrentUser && isToOtherUser)) {
          console.log('Adding message to conversation:', enhancedMessage);
          setMessages(prev => [...prev, enhancedMessage]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [stompClient, otherUser, currentUser]);

  // Scroll to bottom and mark delivered
  useEffect(() => {
    scrollToBottom();

    // Mark undelivered messages
    const undeliveredIds = messages
      .filter(msg =>
        !msg.delivered &&
        msg.senderUsername &&
        msg.senderUsername.toLowerCase() === otherUser.username.toLowerCase()
      )
      .map(msg => msg.id)
      .filter(id => id);

    if (undeliveredIds.length > 0) {
      messageService.markAsDelivered(undeliveredIds);
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/chat.delivered',
          body: JSON.stringify(undeliveredIds)
        });
      }
    }
  }, [messages, otherUser, stompClient]);

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
    }, 150); // 增加延迟确保DOM完全更新
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  // Scroll to bottom when component mounts or otherUser changes
  useEffect(() => {
    if (otherUser && messages.length > 0) {
      scrollToBottom();
    }
  }, [otherUser]);

  // Handle scroll events to detect manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Send text message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();

    // Create message object
    const messageDto = {
      senderUsername: currentUser?.username,
      recipientUsername: otherUser.username,
      content: messageContent
    };

    // Optimistic UI update - immediately show the message
    const tempId = Date.now();
    const newMessageObj = {
      ...messageDto,
      id: tempId,
      timestamp: new Date().toISOString(),
      delivered: true,
      read: false,
      senderProfileImage: currentUser?.profileImage
    };

    // Clear input first for better UX
    setNewMessage('');
    
    // Force scroll to bottom when user sends a message
    setShouldAutoScroll(true);
    
    // Add message to list
    setMessages(prev => [...prev, newMessageObj]);

    // Send via WebSocket immediately
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(messageDto)
      });
    }

    // Persist to backend
    try {
      const savedMessage = await messageService.sendMessage(otherUser.username, messageContent);
      console.log('Message sent successfully:', savedMessage);
      
      // 發送成功後重新獲取訊息以確保顯示正確
      setTimeout(async () => {
        try {
          const data = await messageService.getConversation(otherUser.username);
          setMessages(data);
        } catch (error) {
          console.error('Failed to refresh messages:', error);
        }
      }, 200);
    } catch (error) {
      console.error('Failed to store message', error);
      // 如果发送失败，移除临时消息
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // 恢复输入内容
      setNewMessage(messageContent);
    }
  };

  // Handle image upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please select a smaller image.');
      return;
    }

    try {
      setUploading(true);

      // Show preview before upload
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target.result;
        // You can add a preview modal here if needed
        console.log('Image preview:', previewUrl);
      };
      reader.readAsDataURL(file);

      // Upload image
      const imageUrl = await messageService.uploadImage(file);

      // Send message with image
      handleSendImage(imageUrl);
    } catch (err) {
      console.error('Image upload failed', err);
      alert(`Image upload failed: ${err.message || 'Please try again'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  // Send image message
  const handleSendImage = async (imageUrl) => {
    const messageDto = {
      senderUsername: currentUser?.username,
      recipientUsername: otherUser.username,
      content: '',
      imageUrl
    };

    // Optimistic UI update - immediately show the image message
    const tempId = Date.now();
    const newImageMessage = {
      ...messageDto,
      id: tempId,
      timestamp: new Date().toISOString(),
      delivered: true,
      read: false,
      senderProfileImage: currentUser?.profileImage,
      type: 'image'
    };

    // Add message to list immediately
    setMessages(prev => [...prev, newImageMessage]);

    // Force scroll to bottom when user sends an image
    setShouldAutoScroll(true);

    // Send via WebSocket immediately
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          ...messageDto,
          type: 'image'
        })
      });
    }

    // Persist to backend
    try {
      await messageService.sendMessage(otherUser.username, '', imageUrl);
      console.log('Image message sent successfully');
      
      // 發送成功後重新獲取訊息以確保顯示正確
      setTimeout(async () => {
        try {
          const data = await messageService.getConversation(otherUser.username);
          setMessages(data);
        } catch (error) {
          console.error('Failed to refresh messages:', error);
        }
      }, 200);
    } catch (error) {
      console.error('Failed to store image message', error);
      // 如果发送失败，移除临时消息
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  // Mark messages as read
  useEffect(() => {
    const unreadIds = messages
      .filter(msg =>
        !msg.read &&
        msg.senderUsername &&
        msg.senderUsername.toLowerCase() === otherUser.username.toLowerCase()
      )
      .map(msg => msg.id)
      .filter(id => id);

    if (unreadIds.length > 0) {
      messageService.markAsRead(unreadIds);
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/chat.read',
          body: JSON.stringify(unreadIds)
        });
      }
    }
  }, [messages, otherUser, stompClient]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Enter or Cmd+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [newMessage]); // Include newMessage in dependencies for handleSend

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 4
      }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Loading messages...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        p: 4
      }}>
        <Typography variant="body1" sx={{ color: theme.palette.error.main, mb: 2, textAlign: 'center' }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={handleRetry}
          disabled={retrying}
          sx={{ borderRadius: 2 }}
        >
          {retrying ? 'Retrying...' : 'Retry'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        background: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.95)
          : alpha(theme.palette.background.paper, 0.98),
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        boxShadow: theme.shadows[1]
      }}>
          <Avatar
            src={otherUser.profileImage}
            sx={{
              width: 48,
              height: 48,
              boxShadow: theme.shadows[2],
              border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
              mr: 2
            }}
          >
            {(otherUser.name || otherUser.username || 'U').substring(0, 2).toUpperCase()}
          </Avatar>
        
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {otherUser.name}
          </Typography>
        </Box>
      </Box>

      {/* Message list */}
      <Box 
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.default, 0.9)
            : alpha(theme.palette.background.default, 0.95)
        }}
      >
        <List sx={{ padding: 0 }}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id || msg.timestamp}
              message={msg}
            />
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input area */}
      <Box sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.95)
          : alpha(theme.palette.background.paper, 0.98),
        boxShadow: theme.shadows[3]
      }}>
        {uploading && (
          <Box sx={{
            position: 'absolute',
            top: -40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2
          }}>
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ ml: 1 }}>
              Uploading image...
            </Typography>
          </Box>
        )}
        
        <Box sx={{ position: 'relative' }}>
          <IconButton 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            sx={{
              color: theme.palette.text.secondary,
              mr: 1,
              '&:hover': {
                color: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <SentimentSatisfiedAltIcon />
          </IconButton>
          
          {showEmojiPicker && (
            <Box 
              className="emoji-picker-container"
              sx={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: 2,
                p: 1,
                display: 'flex',
                flexDirection: 'column', // Changed to column for categories
                gap: 0.5,
                maxWidth: 300,
                overflowY: 'auto', // Added overflowY for scrolling
                boxShadow: theme.shadows[4],
                zIndex: 1000
              }}
            >
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <Box key={category} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary, mb: 0.5 }}>
                    {category}
                  </Typography>
                  {emojis.map((emoji, index) => (
                    <IconButton
                      key={index}
                      onClick={() => handleEmojiClick(emoji)}
                      sx={{
                        fontSize: '1.2rem',
                        p: 0.5,
                        minWidth: 32,
                        height: 32,
                        flexShrink: 0,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      {emoji}
                    </IconButton>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </Box>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message... (Ctrl+Enter to send)"
          value={newMessage}
          onChange={(e) => {
            console.log('Input changed:', e.target.value);
            setNewMessage(e.target.value);
          }}
          onKeyPress={(e) => {
            console.log('Key pressed:', e.key);
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onFocus={() => console.log('Input focused')}
          onBlur={() => console.log('Input blurred')}
          sx={{ mr: 1 }}
          multiline
          maxRows={4}
          disabled={uploading}
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
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          sx={{
            color: theme.palette.text.secondary,
            mx: 0.5,
            '&:hover': {
              color: theme.palette.primary.main,
              background: alpha(theme.palette.primary.main, 0.1)
            }
          }}
        >
          <InsertPhotoIcon />
        </IconButton>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={uploading}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={!newMessage.trim() || uploading}
          sx={{
            minWidth: 48,
            height: 48,
            borderRadius: '50%',
            boxShadow: theme.shadows[2],
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.dark})`,
              boxShadow: theme.shadows[4]
            },
            '&:disabled': {
              background: theme.palette.action.disabledBackground
            }
          }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Box>
  );
}