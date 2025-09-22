import { 
  ref, 
  push, 
  set, 
  update, 
  onValue, 
  off, 
  serverTimestamp, 
  query, 
  orderByChild, 
  equalTo,
  get,
  child,
  orderByKey,
  limitToLast
} from 'firebase/database';
import { database } from '../config/firebase';
import { collection, query as firestoreQuery, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

class MessageService {
  // Create or get existing conversation between two users
  async createOrGetConversation(currentUserId, targetUserId, targetUserData = null) {
    try {
      // Check if conversation already exists
      const conversationsRef = ref(database, 'conversations');
      const snapshot = await get(conversationsRef);
      
      let existingConversationId = null;
      
      if (snapshot.exists()) {
        const conversations = snapshot.val();
        
                 // Look for existing conversation between these two users
         Object.keys(conversations).forEach(conversationId => {
           const conversation = conversations[conversationId];
           if (conversation.participants && 
               conversation.participants[currentUserId] && 
               conversation.participants[targetUserId]) {
             existingConversationId = conversationId;
           }
         });
      }
      
      if (existingConversationId) {
        const conversationRef = ref(database, `conversations/${existingConversationId}`);
        const conversationSnapshot = await get(conversationRef);
        return {
          success: true,
          conversation: {
            id: existingConversationId,
            ...conversationSnapshot.val()
          }
        };
      }
      
      // If no conversation exists, get target user data if not provided
      let targetUser = targetUserData;
      if (!targetUser) {
        const usersRef = collection(db, 'users');
        const userQuery = firestoreQuery(usersRef, where('uid', '==', targetUserId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          throw new Error('Target user not found');
        }
        
        targetUser = userSnapshot.docs[0].data();
      }
      
      // Get current user data
      const currentUserQuery = firestoreQuery(
        collection(db, 'users'), 
        where('uid', '==', currentUserId)
      );
      const currentUserSnapshot = await getDocs(currentUserQuery);
      
      if (currentUserSnapshot.empty) {
        throw new Error('Current user not found');
      }
      
      const currentUser = currentUserSnapshot.docs[0].data();
      
      // Create new conversation in Realtime Database
      const newConversationRef = push(ref(database, 'conversations'));
      const conversationId = newConversationRef.key;
      
      const newConversation = {
        participants: {
          [currentUserId]: true,
          [targetUserId]: true
        },
        participantDetails: {
          [currentUserId]: {
            uid: currentUser.uid,
            username: currentUser.username,
            displayName: currentUser.displayName,
            profileImageUrl: currentUser.profileImageUrl || null,
            isVerified: currentUser.isVerified || false
          },
          [targetUserId]: {
            uid: targetUser.uid,
            username: targetUser.username,
            displayName: targetUser.displayName,
            profileImageUrl: targetUser.profileImageUrl || null,
            isVerified: targetUser.isVerified || false
          }
        },
        lastMessage: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: {
          [currentUserId]: 0,
          [targetUserId]: 0
        }
      };
      
      await set(newConversationRef, newConversation);
      
      return {
        success: true,
        conversation: {
          id: conversationId,
          ...newConversation
        }
      };
      
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Send a message
  async sendMessage(conversationId, senderId, content, type = 'text') {
    try {
      // Create message in Realtime Database
      const messagesRef = ref(database, `messages/${conversationId}`);
      const newMessageRef = push(messagesRef);
      const messageId = newMessageRef.key;
      
      const messageData = {
        id: messageId,
        conversationId,
        senderId,
        content: content.trim(),
        type,
        timestamp: serverTimestamp(),
        readBy: {
          [senderId]: true // Sender has read the message by default
        }
      };
      
      await set(newMessageRef, messageData);
      
      // Update conversation's last message and timestamp
      const conversationRef = ref(database, `conversations/${conversationId}`);
      const conversationSnapshot = await get(conversationRef);
      
      if (conversationSnapshot.exists()) {
        const conversationData = conversationSnapshot.val();
        const participants = conversationData.participants || {};
        const unreadCount = conversationData.unreadCount || {};
        
        // Reset sender's unread count and increment receiver's unread count
        const updatedUnreadCount = { ...unreadCount };
        Object.keys(participants).forEach(participantId => {
          if (participantId === senderId) {
            updatedUnreadCount[participantId] = 0;
          } else {
            updatedUnreadCount[participantId] = (updatedUnreadCount[participantId] || 0) + 1;
          }
        });
        
        const conversationUpdates = {
          [`conversations/${conversationId}/lastMessage`]: {
            content,
            senderId,
            timestamp: serverTimestamp(),
            type
          },
          [`conversations/${conversationId}/updatedAt`]: serverTimestamp(),
          [`conversations/${conversationId}/unreadCount`]: updatedUnreadCount
        };
        
        await update(ref(database), conversationUpdates);
      }
      
      return {
        success: true,
        messageId
      };
      
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get conversations for a user with real-time listener
  subscribeToConversations(userId, callback) {
    const conversationsRef = ref(database, 'conversations');
    
    const unsubscribe = onValue(conversationsRef, (snapshot) => {
      const conversations = [];
      
      if (snapshot.exists()) {
        const conversationsData = snapshot.val();
        
        Object.keys(conversationsData).forEach(conversationId => {
          const conversation = conversationsData[conversationId];
          
          // Only include conversations where user is a participant
          if (conversation.participants && conversation.participants[userId]) {
            conversations.push({
              id: conversationId,
              ...conversation
            });
          }
        });
        
        // Sort by updatedAt (most recent first)
        conversations.sort((a, b) => {
          const aTime = a.updatedAt || a.createdAt || 0;
          const bTime = b.updatedAt || b.createdAt || 0;
          return bTime - aTime;
        });
      }
      
      callback(conversations);
    }, (error) => {
      console.error('Error listening to conversations:', error);
      callback([]);
    });
    
    // Return unsubscribe function
    return () => off(conversationsRef, 'value', unsubscribe);
  }
  
  // Get messages for a conversation with real-time listener
  subscribeToMessages(conversationId, callback) {
    const messagesRef = ref(database, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages = [];
      
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        
        Object.keys(messagesData).forEach(messageId => {
          const message = messagesData[messageId];
          messages.push({
            id: messageId,
            ...message,
            // Convert timestamp for easier handling
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
          });
        });
        
        // Sort by timestamp (oldest first for chat display)
        messages.sort((a, b) => a.timestamp - b.timestamp);
      }
      
      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    });
    
    // Return unsubscribe function
    return () => off(messagesRef, 'value', unsubscribe);
  }
  
  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      // Get all messages in the conversation
      const messagesRef = ref(database, `messages/${conversationId}`);
      const messagesSnapshot = await get(messagesRef);
      
      if (messagesSnapshot.exists()) {
        const messages = messagesSnapshot.val();
        const updates = {};
        
        // Mark all messages as read by this user
        Object.keys(messages).forEach(messageId => {
          const message = messages[messageId];
          if (!message.readBy || !message.readBy[userId]) {
            updates[`messages/${conversationId}/${messageId}/readBy/${userId}`] = true;
          }
        });
        
        // Reset unread count for this user
        updates[`conversations/${conversationId}/unreadCount/${userId}`] = 0;
        
        if (Object.keys(updates).length > 0) {
          await update(ref(database), updates);
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'Conversation not found' };
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get conversation by ID
  async getConversation(conversationId) {
    try {
      const conversationRef = ref(database, `conversations/${conversationId}`);
      const conversationSnapshot = await get(conversationRef);
      
      if (conversationSnapshot.exists()) {
        return {
          success: true,
          conversation: {
            id: conversationId,
            ...conversationSnapshot.val()
          }
        };
      }
      
      return {
        success: false,
        error: 'Conversation not found'
      };
      
    } catch (error) {
      console.error('Error getting conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Search conversations
  async searchConversations(userId, searchTerm) {
    try {
      const conversationsRef = ref(database, 'conversations');
      const snapshot = await get(conversationsRef);
      const conversations = [];
      
      if (snapshot.exists()) {
        const conversationsData = snapshot.val();
        
        Object.keys(conversationsData).forEach(conversationId => {
          const conversation = conversationsData[conversationId];
          
          // Only include conversations where user is a participant
          if (conversation.participants && conversation.participants[userId]) {
            const participantDetails = conversation.participantDetails || {};
            
            // Search in participant names and usernames
            const searchLower = searchTerm.toLowerCase();
            const matches = Object.values(participantDetails).some(participant => 
              participant.displayName?.toLowerCase().includes(searchLower) ||
              participant.username?.toLowerCase().includes(searchLower)
            );
            
            if (matches) {
              conversations.push({
                id: conversationId,
                ...conversation
              });
            }
          }
        });
        
        // Sort by updatedAt (most recent first)
        conversations.sort((a, b) => {
          const aTime = a.updatedAt || a.createdAt || 0;
          const bTime = b.updatedAt || b.createdAt || 0;
          return bTime - aTime;
        });
      }
      
      return {
        success: true,
        conversations
      };
      
    } catch (error) {
      console.error('Error searching conversations:', error);
      return {
        success: false,
        error: error.message,
        conversations: []
      };
    }
  }
  
  // Get other participant in a conversation
  getOtherParticipant(conversation, currentUserId) {
    if (!conversation || !conversation.participants) return null;
    
    const otherParticipantId = Object.keys(conversation.participants).find(id => id !== currentUserId);
    return conversation.participantDetails?.[otherParticipantId] || null;
  }
  
  // Format timestamp for display
  formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.floor(days / 7)}w`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Format message time for display
  formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Yesterday';
    }
    
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    });
  }
}

// Export a singleton instance
const messageService = new MessageService();
export default messageService; 