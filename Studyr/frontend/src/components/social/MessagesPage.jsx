import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Divider,
  Button,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Card,
  CardContent
} from '@mui/material';
import {
  Send,
  ArrowBack,
  Chat,
  Online,
  MoreVert,
  Phone,
  VideoCall
} from '@mui/icons-material';
import { messagesAPI } from '../../services/api';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const MessagesPage = ({ onBack, selectedPartner }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('studyr_user'));
  console.log('MessagesPage received selectedPartner:', selectedPartner); // Debug statement

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 5 seconds when viewing a conversation
  useEffect(() => {
    let interval;
    if (selectedConversation) {
      interval = setInterval(() => {
        loadMessagesWithPartner(selectedConversation.partnerId, false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedConversation]);
  useEffect(() => {
  if (selectedPartner) {
    console.log('Selected partner received:', selectedPartner); // Debug log
    
    // Check if we already have a conversation with this partner
    const existingConversation = conversations.find(conv => 
      conv.partnerId === selectedPartner.partnerId
    );
    
    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation);
      setSelectedConversation(existingConversation);
      loadMessagesWithPartner(existingConversation.partnerId);
    } else {
      console.log('Creating new conversation for partner:', selectedPartner);
      // Create a new conversation object for this partner
      const newConversation = {
        partnerId: selectedPartner.partnerId,
        partner: {
          userId: selectedPartner.partnerId,
          firstName: selectedPartner.firstName,
          lastName: selectedPartner.lastName,
          username: selectedPartner.username,
          profilePictureUrl: selectedPartner.profilePictureUrl || null
        },
        lastMessage: {
          messageText: '',
          createdAt: new Date().toISOString(),
          isFromMe: false
        },
        unreadCount: 0
      };
      
      setSelectedConversation(newConversation);
      setMessages([]); // Start with empty messages
      
      // Add this conversation to the conversations list if it doesn't exist
      setConversations(prev => {
        const exists = prev.find(conv => conv.partnerId === selectedPartner.partnerId);
        if (!exists) {
          return [newConversation, ...prev];
        }
        return prev;
      });
    }
  }
}, [selectedPartner]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.data.data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesWithPartner = async (partnerId, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await messagesAPI.getWithPartner(partnerId);
      setMessages(response.data.data.messages || []);
      
      // Mark messages as read
      await messagesAPI.markAsRead(partnerId);
      
      // Update conversation list to reflect read status
      setConversations(prev => 
        prev.map(conv => 
          conv.partnerId === partnerId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Error loading messages:', err);
      if (showLoading) setError('Failed to load messages');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

const sendMessage = async () => {
  if (!newMessage.trim() || !selectedConversation || sending) return;

  const messageText = newMessage.trim();
  setNewMessage('');
  setSending(true);

  try {
    console.log('Sending message to:', selectedConversation.partnerId); // Debug log
    
    const response = await messagesAPI.send(selectedConversation.partnerId, messageText);
    console.log('Message sent response:', response); // Debug log
    
    // Add the new message to the local state immediately
    const newMessageObj = {
      messageId: response.data.data.message?.messageId || Date.now(),
      messageText: messageText,
      senderId: currentUser?.userId,
      recipientId: selectedConversation.partnerId,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        userId: currentUser?.userId,
        firstName: currentUser?.firstName,
        lastName: currentUser?.lastName,
        username: currentUser?.username
      }
    };
    
    setMessages(prev => [...prev, newMessageObj]);
    
    // Update the conversation list with the latest message
    setConversations(prev => 
      prev.map(conv => 
        conv.partnerId === selectedConversation.partnerId
          ? {
              ...conv,
              lastMessage: {
                messageText,
                createdAt: new Date().toISOString(),
                isFromMe: true
              }
            }
          : conv
      )
    );
    
  } catch (err) {
    console.error('Error sending message:', err);
    setError('Failed to send message: ' + (err.response?.data?.message || err.message));
    setNewMessage(messageText); // Restore the message
  } finally {
    setSending(false);
  }
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM d');
    }
  };

  const formatConversationTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM d');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const renderConversationsList = () => (
    <Paper sx={{ height: '100%', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Messages
        </Typography>
      </Box>
      
      {conversations.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Chat sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No conversations yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start chatting with your study partners!
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.partnerId}
              button
              onClick={() => {
                setSelectedConversation(conversation);
                loadMessagesWithPartner(conversation.partnerId);
              }}
              selected={selectedConversation?.partnerId === conversation.partnerId}
              sx={{
                borderBottom: '1px solid #f0f0f0',
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd'
                }
              }}
            >
              <ListItemAvatar>
                <Badge
                  color="error"
                  badgeContent={conversation.unreadCount}
                  invisible={conversation.unreadCount === 0}
                >
                  <Avatar sx={{ bgcolor: '#1a73e8' }}>
                    {conversation.partner.firstName?.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {conversation.partner.firstName} {conversation.partner.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatConversationTime(conversation.lastMessage.createdAt)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: conversation.unreadCount > 0 ? 600 : 400
                    }}
                  >
                    {conversation.lastMessage.isFromMe ? 'You: ' : ''}
                    {conversation.lastMessage.messageText}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );

  const renderChatArea = () => {
    if (!selectedConversation) {
      return (
        <Paper sx={{ height: '100%', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Chat sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start chatting
            </Typography>
          </Box>
        </Paper>
      );
    }

    return (
      <Paper sx={{ height: '100%', borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat Header */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'black', borderBottom: '1px solid #e0e0e0' }}>
          <Toolbar>
            <Avatar sx={{ bgcolor: '#1a73e8', mr: 2 }}>
              {selectedConversation.partner.firstName?.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedConversation.partner.firstName} {selectedConversation.partner.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{selectedConversation.partner.username}
              </Typography>
            </Box>
            <IconButton>
              <Phone />
            </IconButton>
            <IconButton>
              <VideoCall />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f8f9fa' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message, index) => {
                const isFromMe = message.senderId === currentUser?.userId;
                const showTime = index === 0 || 
                  new Date(message.createdAt) - new Date(messages[index - 1].createdAt) > 5 * 60 * 1000; // Show time if >5 min gap

                return (
                  <Box key={message.messageId} sx={{ mb: 1 }}>
                    {showTime && (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                        mb: 0.5
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          minWidth: '100px',
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: isFromMe ? '#1a73e8' : 'white',
                          color: isFromMe ? 'white' : 'black',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          position: 'relative'
                        }}
                      >
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                          {message.messageText}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            fontSize: '0.7rem',
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5
                          }}
                        >
                          {format(new Date(message.createdAt), 'HH:mm')}
                          {isFromMe && message.isRead && ' ✓✓'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3
                }
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              sx={{
                bgcolor: '#1a73e8',
                color: 'white',
                '&:hover': { bgcolor: '#1557b0' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              {sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
            </IconButton>
          </Box>
        </Box>
      </Paper>
    );
  };

  if (loading && !selectedConversation) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Messages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Chat with your study partners
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Main Chat Interface */}
      <Box sx={{ height: '70vh', display: 'flex', gap: 3 }}>
        {/* Conversations List */}
        <Box sx={{ width: 350, minWidth: 350 }}>
          {renderConversationsList()}
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1 }}>
          {renderChatArea()}
        </Box>
      </Box>
    </Container>
  );
};

export default MessagesPage;