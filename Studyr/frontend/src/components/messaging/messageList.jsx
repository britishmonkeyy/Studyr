// components/messages/MessagesList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './MessagesList.css';

const MessagesList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations');
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div className="messages-list">
      <h2>Messages</h2>
      {conversations.length === 0 ? (
        <p>No conversations yet. Find study partners to start chatting!</p>
      ) : (
        <div className="conversations">
          {conversations.map(conv => (
            <Link 
              key={conv.other_user_id} 
              to={`/messages/${conv.other_user_id}`}
              className="conversation-item"
            >
              <div className="user-avatar">
                {conv.profile_picture_url ? (
                  <img src={conv.profile_picture_url} alt={conv.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {conv.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="conversation-details">
                <h4>{conv.username}</h4>
                <p className={conv.is_read ? 'read' : 'unread'}>
                  {conv.message_text}
                </p>
              </div>
              <div className="conversation-meta">
                <span className="time">
                  {new Date(conv.created_at).toLocaleTimeString()}
                </span>
                {!conv.is_read && <span className="unread-badge">●</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesList;