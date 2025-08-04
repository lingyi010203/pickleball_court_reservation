// src/components/messaging/Conversation.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Avatar, Typography, TextField,
  Button, IconButton, List, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageBubble from './MessageBubble';
import messageService from '../../service/MessageService';
import { useSocket } from '../../context/SocketContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTheme, alpha } from '@mui/material/styles';

export default function Conversation({ otherUser, onBack }) {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const { stompClient } = useSocket();

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const fileInputRef = useRef(null);

  // Fetch message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!otherUser?.username) {
          setLoading(false);
          return;
        }

        const data = await messageService.getConversation(otherUser.username);

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
      } finally {
        setLoading(false);
      }
    };

    if (otherUser) fetchMessages();
  }, [otherUser]);

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
        const isFromCurrentUser = enhancedMessage.senderUsername === currentUser.username;
        const isToCurrentUser = enhancedMessage.recipientUsername === currentUser.username;

        if ((isFromOtherUser && isToCurrentUser) || (isFromCurrentUser && isToOtherUser)) {
          console.log('Adding message to conversation:', enhancedMessage);
          setMessages(prev => [...prev, enhancedMessage]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [stompClient, otherUser]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send text message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();

    // Create message object
    const messageDto = {
      senderUsername: currentUser.username,
      recipientUsername: otherUser.username,
      content: messageContent
    };

    // Optimistic UI update
    const tempId = Date.now();
    setMessages(prev => [
      ...prev,
      {
        ...messageDto,
        id: tempId,
        timestamp: new Date().toISOString(),
        delivered: true,
        read: false,
        senderProfileImage: currentUser.profileImage
      }
    ]);

    setNewMessage('');
    scrollToBottom();

    // Send via WebSocket
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(messageDto)
      });
    }

    // Persist to backend
    try {
      const savedMessage = await messageService.sendMessage(otherUser.username, messageContent);
      // 發送成功後重新獲取訊息以確保顯示正確
      setTimeout(async () => {
        try {
          const data = await messageService.getConversation(otherUser.username);
          setMessages(data);
        } catch (error) {
          console.error('Failed to refresh messages:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to store message', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  // Handle image upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit');
      return;
    }

    try {
      setUploading(true);

      // Upload image
      const imageUrl = await messageService.uploadImage(file);

      // Send message with image
      handleSendImage(imageUrl);
    } catch (err) {
      console.error('Image upload failed', err);
      alert(`Image upload failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  // Send image message
  const handleSendImage = async (imageUrl) => {
    const messageDto = {
      senderUsername: currentUser.username,
      recipientUsername: otherUser.username,
      content: '',
      imageUrl
    };

    // Optimistic UI update
    const tempId = Date.now();
    setMessages(prev => [
      ...prev,
      {
        ...messageDto,
        id: tempId,
        timestamp: new Date().toISOString(),
        delivered: true,
        read: false,
        senderProfileImage: currentUser.profileImage,
        type: 'image'
      }
    ]);

    scrollToBottom();

    // Send via WebSocket
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
    } catch (error) {
      console.error('Failed to store image message', error);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: theme.palette.background.default }}>      {/* Header */}
      <Paper sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        background: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha(theme.palette.background.paper, 0.95),
        color: theme.palette.text.primary,
        borderRadius: 0,
        boxShadow: theme.shadows[1],
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
      }}>
        <IconButton
          onClick={onBack}
          sx={{
            mr: 1,
            color: theme.palette.text.secondary,
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.1)
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Avatar
          src={otherUser.profileImage}
          sx={{
            width: 42,
            height: 42,
            boxShadow: theme.shadows[1],
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            mr: 2
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{otherUser.name}</Typography>
        </Box>
      </Paper>
      {/* Message list */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        p: { xs: 1, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(${alpha(theme.palette.background.default, 0.9)}, ${alpha(theme.palette.background.default, 0.9)}),
             url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
          : theme.palette.background.default,
        backgroundSize: '300px 300px'
      }}>
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
      <Paper sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        background: theme.palette.background.paper,
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
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            console.log('Input changed:', e.target.value);
            setNewMessage(e.target.value);
          }}
          onKeyPress={(e) => {
            console.log('Key pressed:', e.key);
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSend();
            }
          }}
          onFocus={() => console.log('Input focused')}
          onBlur={() => console.log('Input blurred')}
          sx={{ mr: 1 }}
          multiline
          maxRows={4}
          disabled={false}
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
      </Paper>
    </Box>
  );
}