import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaSearch, 
  FaPaperclip, 
  FaPaperPlane,
  FaEllipsisV,
  FaRegSmile,
  FaArrowLeft
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import messageService from '../../../services/messageService';
import '../styles/Messages.css';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2358f193'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Messages = () => {
  const { username } = useParams(); // Get username from URL params
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  
  // Refs
  const messagesEndRef = useRef(null);
  const unsubscribeConversations = useRef(null);
  const unsubscribeMessages = useRef(null);

  // Utility functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getActiveChat = () => {
    if (!selectedConversation || !currentUser) return null;
    const conversation = conversations.find(conv => conv.id === selectedConversation);
    if (!conversation) return null;
    
    return {
      ...conversation,
      otherParticipant: messageService.getOtherParticipant(conversation, currentUser.uid)
    };
  };

  const activeChat = getActiveChat();

  // Event handlers
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser || isSending) return;

    setIsSending(true);
    try {
      const result = await messageService.sendMessage(
        selectedConversation,
        currentUser.uid,
        messageInput.trim()
      );

      if (result.success) {
        setMessageInput('');
        scrollToBottom();
      } else {
        showError('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
  };

  const handleConversationSelect = async (conversationId) => {
    setSelectedConversation(conversationId);
    
    // Mark messages as read when conversation is selected
    if (currentUser) {
      try {
        await messageService.markAsRead(conversationId, currentUser.uid);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSearch = async () => {
    if (!currentUser || isLoading) return;

    try {
      if (searchTerm.trim()) {
        const result = await messageService.searchConversations(currentUser.uid, searchTerm);
        if (result.success) {
          setFilteredConversations(result.conversations);
        }
      } else {
        setFilteredConversations(conversations);
      }
    } catch (error) {
      console.error('Error searching conversations:', error);
      setFilteredConversations(conversations);
    }
  };

  const handleNewConversation = () => {
    // Could implement a modal to select a user or navigate to user search
    navigate('/social/');
  };

  // Initialize conversations listener
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If auth is loaded but user is not authenticated, clear loading
    if (!currentUser) {
      setIsLoading(false);
      setConversations([]);
      setFilteredConversations([]);
      return;
    }

    setIsLoading(true);
    
    // Set up real-time listener for conversations
    unsubscribeConversations.current = messageService.subscribeToConversations(
      currentUser.uid,
      (conversationsList) => {
        setConversations(conversationsList);
        setFilteredConversations(conversationsList);
        setIsLoading(false);
      }
    );

    // Cleanup function
    return () => {
      if (unsubscribeConversations.current) {
        unsubscribeConversations.current();
      }
    };
  }, [currentUser, authLoading]);

  // Handle navigation with username parameter (from customprofile)
  useEffect(() => {
    const initializeConversationFromUsername = async () => {
      if (username && currentUser && !authLoading && !isLoading) {
        try {
          // Check if conversation already exists (only if we have conversations loaded)
          if (conversations.length > 0) {
            const existingConversation = conversations.find(conv => {
              const otherParticipant = messageService.getOtherParticipant(conv, currentUser.uid);
              return otherParticipant?.username === username;
            });

            if (existingConversation) {
              setSelectedConversation(existingConversation.id);
              return;
            }
          }

          // Get target user data from location state or create conversation
          const targetUserData = location.state?.targetUser;
          if (targetUserData) {
            setIsCreatingConversation(true);
            const result = await messageService.createOrGetConversation(
              currentUser.uid,
              targetUserData.uid,
              targetUserData
            );

            if (result.success) {
              setSelectedConversation(result.conversation.id);
              showSuccess(`Started conversation with @${username}`);
            } else {
              showError('Failed to start conversation. Please try again.');
              navigate('/social/messages');
            }
            setIsCreatingConversation(false);
          } else {
            // If no user data in state, try to find user by username
            showError('Unable to start conversation. Please try again from the user\'s profile.');
            navigate('/social/messages');
          }
        } catch (error) {
          console.error('Error initializing conversation:', error);
          showError('Failed to start conversation. Please try again.');
          setIsCreatingConversation(false);
          navigate('/social/messages');
        }
      }
    };

    initializeConversationFromUsername();
  }, [username, currentUser, authLoading, conversations, isLoading, location.state, navigate, showSuccess, showError]);

  // Set up messages listener when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      // Clean up previous listener
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }

      // Set up new listener
      unsubscribeMessages.current = messageService.subscribeToMessages(
        selectedConversation,
        (messagesList) => {
          setMessages(messagesList);
          // Scroll to bottom when new messages arrive
          setTimeout(scrollToBottom, 100);
        }
      );
    } else {
      setMessages([]);
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
    }

    return () => {
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
    };
  }, [selectedConversation]);

  // Update filtered conversations when main conversations change (if no active search)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    }
  }, [conversations, searchTerm]);

  // Handle search
  useEffect(() => {
    // Don't run search if still loading or no user
    if (isLoading || !currentUser) return;
    
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, conversations, currentUser, isLoading]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0 && !username) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation, username]);

  // Loading state
  if (authLoading || isLoading || isCreatingConversation) {
    return (
      <div className="messages-container">
        <div className="messages-loading">
          <div className="loading-spinner"></div>
          <p>
            {isCreatingConversation 
              ? 'Starting conversation...' 
              : authLoading 
                ? 'Loading...' 
                : 'Loading conversations...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="conversations-sidebar">
        <div className="conversations-header">
          <h2>Messages</h2>
          <button 
            className="new-message-btn" 
            title="New Message"
            onClick={handleNewConversation}
          >
            <FaPlus />
          </button>
        </div>
        
        <div className="search-messages">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="conversations-list">
          {filteredConversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <small>Start a conversation by visiting a user's profile</small>
            </div>
          ) : (
            filteredConversations.map(conversation => {
              const otherParticipant = messageService.getOtherParticipant(conversation, currentUser?.uid);
              const unreadCount = conversation.unreadCount?.[currentUser?.uid] || 0;
              
              return (
                <div 
                  key={conversation.id} 
                  className={`conversation-item ${conversation.id === selectedConversation ? 'active' : ''}`}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className="conversation-avatar">
                    <img 
                      src={otherParticipant?.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
                      alt={otherParticipant?.displayName || 'User'} 
                      onError={(e) => {
                        e.target.src = DEFAULT_PROFILE_IMAGE;
                      }}
                    />
                    {/* Online indicator - could be implemented later */}
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <h3>
                        {otherParticipant?.displayName || 'Unknown User'}
                        {otherParticipant?.isVerified && <span className="verified-badge">✓</span>}
                      </h3>
                      <span className="conversation-time">
                        {messageService.formatTimestamp(conversation.lastMessage?.timestamp)}
                      </span>
                    </div>
                    <p className="conversation-last-message">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-area">
        {!activeChat ? (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <h3>Welcome to Messages</h3>
              <p>Select a conversation to start messaging</p>
              {conversations.length === 0 && (
                <p><small>Start a conversation by visiting a user's profile and clicking "Message"</small></p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <img 
                  src={activeChat.otherParticipant?.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
                  alt={activeChat.otherParticipant?.displayName || 'User'} 
                  onError={(e) => {
                    e.target.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
                <div className="user-status">
                  <h3>
                    {activeChat.otherParticipant?.displayName || 'Unknown User'}
                    {activeChat.otherParticipant?.isVerified && <span className="verified-badge">✓</span>}
                  </h3>
                  <span className="username">@{activeChat.otherParticipant?.username}</span>

                </div>
              </div>
              <div className="chat-actions">
                <button 
                  className="action-btn" 
                  title="View Profile"
                  onClick={() => navigate(`/social/profile/${activeChat.otherParticipant?.username}`)}
                >
                  <FaArrowLeft style={{transform: 'rotate(180deg)'}} />
                </button>
                <button className="action-btn" title="More Options">
                  <FaEllipsisV />
                </button>
              </div>
            </div>

            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                  <small>Start the conversation by sending a message</small>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === currentUser?.uid;
                  return (
                    <div 
                      key={message.id} 
                      className={`message ${isOwn ? 'own-message' : ''}`}
                    >
                      {!isOwn && (
                        <img 
                          src={activeChat.otherParticipant?.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
                          alt={activeChat.otherParticipant?.displayName} 
                          className="message-avatar" 
                          onError={(e) => {
                            e.target.src = DEFAULT_PROFILE_IMAGE;
                          }}
                        />
                      )}
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">
                          {messageService.formatMessageTime(message.timestamp)}
                        </span>
                        {/* Read receipt indicator could be added here */}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <button className="attachment-btn" title="Attach File" disabled>
                <FaPaperclip />
              </button>
              <div className="message-input-wrapper">
                <input 
                  type="text" 
                  placeholder={`Message @${activeChat.otherParticipant?.username || 'user'}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                />
                <button className="emoji-btn" title="Add Emoji" disabled>
                  <FaRegSmile />
                </button>
              </div>
              <button 
                className="send-btn" 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                title="Send Message"
              >
                {isSending ? '...' : <FaPaperPlane />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages; 