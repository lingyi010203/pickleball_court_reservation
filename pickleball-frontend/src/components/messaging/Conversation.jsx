// src/components/messaging/Conversation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Avatar, Typography, TextField, 
  Button, IconButton, List, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageBubble from './MessageBubble';
import messageService from '../../service/MessageService';
import { useSocket } from '../../context/SocketContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function Conversation({ otherUser, onBack }) {
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
        
        // Only add relevant messages
        if (enhancedMessage.senderUsername === otherUser.username || 
            enhancedMessage.recipientUsername === otherUser.username) {
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

    // Create message object
    const messageDto = {
      senderUsername: currentUser.username,
      recipientUsername: otherUser.username,
      content: newMessage.trim()
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
      await messageService.sendMessage(otherUser.username, newMessage.trim());
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar src={otherUser.profileImage} sx={{ mr: 2 }} />
        <Typography variant="h6">{otherUser.name}</Typography>
      </Paper>
      
      {/* Message list */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2, 
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column'
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
      <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
        {uploading && (
          <Box sx={{
            position: 'absolute',
            top: -30,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
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
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          sx={{ mr: 1 }}
          multiline
          maxRows={4}
        />
        <IconButton 
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          <AttachFileIcon />
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
            minWidth: '56px', 
            height: '56px',
            borderRadius: '50%'
          }}
        >
          <SendIcon />
        </Button>
      </Paper>
    </Box>
  );
}