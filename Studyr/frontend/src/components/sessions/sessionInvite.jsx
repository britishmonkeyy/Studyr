
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const SessionInvite = ({ sessionId, sessionType }) => {
  const [partners, setPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionType !== 'solo') {
      fetchPotentialPartners();
    }
  }, [sessionType]);

  const fetchPotentialPartners = async () => {
    try {
      // Get users who are accepted partners
      const response = await api.get('/partners/accepted');
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const invitePartners = async () => {
    if (selectedPartners.length === 0) return;

    setLoading(true);
    try {
      await api.post(`/sessions/${sessionId}/invite`, {
        partnerIds: selectedPartners
      });
      alert('Partners invited successfully!');
      setSelectedPartners([]);
    } catch (error) {
      console.error('Error inviting partners:', error);
      alert('Failed to invite partners');
    } finally {
      setLoading(false);
    }
  };

  if (sessionType === 'solo') return null;

  return (
    <div className="session-invite">
      <h3>Invite Study Partners</h3>
      <div className="partner-list">
        {partners.map(partner => (
          <div key={partner.userId} className="partner-item">
            <input
              type="checkbox"
              id={partner.userId}
              checked={selectedPartners.includes(partner.userId)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPartners([...selectedPartners, partner.userId]);
                } else {
                  setSelectedPartners(selectedPartners.filter(id => id !== partner.userId));
                }
              }}
            />
            <label htmlFor={partner.userId}>
              {partner.username} - {partner.subjects.join(', ')}
            </label>
          </div>
        ))}
      </div>
      <button 
        onClick={invitePartners} 
        disabled={loading || selectedPartners.length === 0}
      >
        {loading ? 'Inviting...' : 'Send Invites'}
      </button>
    </div>
  );
};