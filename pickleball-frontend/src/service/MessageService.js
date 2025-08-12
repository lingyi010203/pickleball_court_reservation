// src/service/MessageService.js
import api from '../api/axiosConfig';

const MessageService = {
  /**
   * 获取与特定用户的对话历史
   * @param {string} username - 对方的用户名
   * @returns {Promise<Array>} - 消息列表
   */
  getConversation: async (username) => {
    try {
      const response = await api.get(`/messages/conversation/${username}`);
      
      // 确保消息数据有 senderUsername 和 senderProfileImage
      return response.data.map(msg => {
        // 如果后端返回的是嵌套对象，提取必要字段
        const senderUsername = msg.senderUsername || 
                              (msg.sender?.userAccount?.username || '') || 
                              (msg.sender?.username || '');
        
        const senderProfileImage = msg.senderProfileImage || 
                                 (msg.sender?.profileImage || '') || 
                                 (msg.sender?.userAccount?.profileImage || '');
        
        return {
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          delivered: msg.delivered || false,
          read: msg.read || false,
          senderUsername,
          senderProfileImage,
          recipientUsername: msg.recipientUsername || msg.receiverUsername,
          conversationId: msg.conversationId,
          // Add new fields here if needed!
          // type: msg.type,
          // attachmentUrl: msg.attachmentUrl,
          imageUrl: msg.imageUrl // <-- ADD THIS LINE
        };
      });
    } catch (error) {
      console.error('Failed to fetch conversation', error);
      throw new Error('Failed to load conversation history');
    }
  },
  
  /**
   * 发送消息
   * @param {string} recipient - 接收者用户名
   * @param {string} content - 消息内容
   * @returns {Promise<Object>} - 发送的消息
   */
  sendMessage: async (recipient, content, imageUrl) => {
    try {
      const response = await api.post('/messages/send', null, {
        params: { 
          recipient, 
          content,
          imageUrl // <-- add this line
        }
      });
      
      // 确保返回的消息有必要的字段
      const sentMessage = response.data;
      return {
        id: sentMessage.id,
        content: sentMessage.content,
        timestamp: sentMessage.timestamp || new Date().toISOString(),
        delivered: sentMessage.delivered || false,
        read: sentMessage.read || false,
        senderUsername: sentMessage.senderUsername,
        recipientUsername: sentMessage.recipientUsername,
        conversationId: sentMessage.conversationId,
        imageUrl: sentMessage.imageUrl // <-- add this line
      };
    } catch (error) {
      console.error('Failed to send message', error);
      
      // 提供更友好的错误信息
      let errorMessage = 'Failed to send message';
      if (error.response) {
        if (error.response.status === 403) {
          // 檢查是否是教練相關的消息
          const recipientUsername = error.config?.params?.recipient;
          if (recipientUsername && recipientUsername.toLowerCase().includes('coach')) {
            errorMessage = 'Unable to send message to coach. Please try again.';
          } else {
            errorMessage = 'You can only message friends';
          }
        } else if (error.response.status === 404) {
          errorMessage = 'User not found';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }
  },
  
  /**
   * 获取对话预览列表
   * @returns {Promise<Array>} - 对话预览列表
   */
  getConversationPreviews: async () => {
    try {
      const response = await api.get('/messages/previews');
      return response.data.map(preview => ({
        id: preview.id,
        lastMessage: {
          content: preview.content,
          timestamp: preview.timestamp
        },
        otherUser: {
          id: preview.otherUserId,
          username: preview.otherUsername,
          name: preview.otherUserName,
          profileImage: preview.otherUserProfileImage
        },
        unreadCount: preview.unreadCount || 0
      }));
    } catch (error) {
      console.error('Failed to fetch conversation previews', error);
      throw new Error('Failed to load conversations');
    }
  },
  
  /**
   * 标记消息为已送达
   * @param {Array<number>} messageIds - 消息ID数组
   */
  markAsDelivered: async (messageIds) => {
    try {
      await api.post('/messages/mark-delivered', messageIds);
    } catch (error) {
      console.error('Failed to mark messages as delivered', error);
      // 可以选择不抛出错误，因为这不是关键操作
    }
  },
  
  /**
   * 标记消息为已读
   * @param {Array<number>} messageIds - 消息ID数组
   */
  markAsRead: async (messageIds) => {
    try {
      await api.post('/messages/mark-read', messageIds);
    } catch (error) {
      console.error('Failed to mark messages as read', error);
      // 可以选择不抛出错误，因为这不是关键操作
    }
  },
  
  /**
   * 获取用户的所有对话
   * @returns {Promise<Array>} - 对话列表
   */
  getConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversations', error);
      throw new Error('Failed to load conversations');
    }
  },
  
  /**
   * 获取用户消息通知
   * @returns {Promise<Object>} - 消息通知
   */
  getMessageNotifications: async () => {
    try {
      const response = await api.get('/messages/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch message notifications', error);
      return { unreadCount: 0, latestMessages: [] };
    }
  },

  uploadImage: async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/messages/upload', formData, {
            headers: { 
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || 'Failed to upload image');
    }
}
};

export default MessageService;