import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Paper
} from '@mui/material';
import {
  People,
  PersonAdd,
  Inbox,
  Send,
  Search,
  Check,
  Close,
  Block,
  ArrowBack,
  FiberManualRecord,
  Message
} from '@mui/icons-material';
import { studyPartnersAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';

const StudyPartnersPage = ({ onBack, onStartChat }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [partners, setPartners] = useState([]);
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  
  
  // Modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [partnersResponse, requestsResponse] = await Promise.all([
        studyPartnersAPI.getAccepted(),
        studyPartnersAPI.getRequests()
      ]);

      setPartners(partnersResponse.data.data.partners || []);
      setRequests({
        sent: requestsResponse.data.data.sentRequests || [],
        received: requestsResponse.data.data.receivedRequests || []
      });
    } catch (err) {
      console.error('Error loading study partners data:', err);
      setError('Failed to load study partners data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      const response = await studyPartnersAPI.search({ q: searchQuery });
      setSearchResults(response.data.data.users || []);
    } catch (err) {
      console.error('Error searching partners:', err);
      setError('Failed to search for study partners');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedUser) return;

    try {
      await studyPartnersAPI.sendRequest(selectedUser.userId, requestMessage);
      setRequestModalOpen(false);
      setRequestMessage('');
      setSelectedUser(null);
      loadData(); // Reload to update the UI
      
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user.userId !== selectedUser.userId));
    } catch (err) {
      console.error('Error sending partnership request:', err);
      setError('Failed to send partnership request');
    }
  };

  const handleRespondToRequest = async (partnershipId, response) => {
    try {
      await studyPartnersAPI.respond(partnershipId, response);
      loadData(); // Reload to update the UI
    } catch (err) {
      console.error('Error responding to partnership request:', err);
      setError('Failed to respond to partnership request');
    }
  };

  const handleRemovePartnership = async (partnershipId) => {
    try {
      await studyPartnersAPI.remove(partnershipId);
      loadData(); // Reload to update the UI
    } catch (err) {
      console.error('Error removing partnership:', err);
      setError('Failed to remove partnership');
    }
  };

  const renderPartnersTab = () => (
    <Grid container spacing={3}>
      {partners.length === 0 ? (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <People sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No study partners yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Find and connect with other students to study together
            </Typography>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={() => setSearchModalOpen(true)}
              sx={{ bgcolor: '#1a73e8' }}
            >
              Find Study Partners
            </Button>
          </Paper>
        </Grid>
      ) : (
        partners.map((partner) => (
          <Grid item xs={12} md={6} lg={4} key={partner.partnerId}>
            <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Badge
                    color={partner.isOnline ? 'success' : 'default'}
                    variant="dot"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <Avatar sx={{ 
                      bgcolor: '#1a73e8', 
                      width: 48, 
                      height: 48,
                      fontSize: '1.25rem'
                    }}>
                      {partner.firstName?.charAt(0)}{partner.lastName?.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {partner.firstName} {partner.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{partner.username}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={partner.studyLevel?.replace('_', ' ').toUpperCase()}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  {partner.isOnline && (
                    <Chip
                      icon={<FiberManualRecord />}
                      label="Online"
                      size="small"
                      color="success"
                      sx={{ mb: 1 }}
                    />
                  )}
                </Box>

                {partner.subjects && partner.subjects.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Subjects:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {partner.subjects.slice(0, 3).map((subject, idx) => (
                        <Chip
                          key={idx}
                          label={subject.subjectName}
                          size="small"
                          sx={{
                            bgcolor: `${subject.colorHex}15`,
                            color: subject.colorHex,
                            fontSize: '0.75rem'
                          }}
                        />
                      ))}
                      {partner.subjects.length > 3 && (
                        <Chip
                          label={`+${partner.subjects.length - 3} more`}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Partners since {format(new Date(partner.matchedAt), 'MMM d, yyyy')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Message />}
                  size="small"
                  sx={{ bgcolor: '#34a853', flex: 1 }}
                  onClick={() => onStartChat(partner)}
                >
                  Message
                </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemovePartnership(partner.partnershipId)}
                  >
                    <Block />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  const renderRequestsTab = () => (
    <Box>
      {/* Received Requests */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Inbox sx={{ mr: 1 }} />
        Received Requests
        {requests.received.filter(r => r.status === 'pending').length > 0 && (
          <Badge 
            badgeContent={requests.received.filter(r => r.status === 'pending').length} 
            color="error" 
            sx={{ ml: 1 }}
          />
        )}
      </Typography>

      {requests.received.length === 0 ? (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <Typography variant="body2" color="text.secondary">
            No partnership requests received
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {requests.received.map((request) => (
            <Grid item xs={12} key={request.partnershipId}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#1a73e8', mr: 2 }}>
                        {request.requester?.firstName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {request.requester?.firstName} {request.requester?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{request.requester?.username} • {formatDistanceToNow(new Date(request.createdAt))} ago
                        </Typography>
                        {request.requestMessage && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            "{request.requestMessage}"
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {request.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Check />}
                          onClick={() => handleRespondToRequest(request.partnershipId, 'accepted')}
                          sx={{ bgcolor: '#34a853' }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Close />}
                          onClick={() => handleRespondToRequest(request.partnershipId, 'declined')}
                        >
                          Decline
                        </Button>
                      </Box>
                    )}
                    
                    {request.status !== 'pending' && (
                      <Chip
                        label={request.status}
                        size="small"
                        color={request.status === 'accepted' ? 'success' : 'default'}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Sent Requests */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Send sx={{ mr: 1 }} />
        Sent Requests
      </Typography>

      {requests.sent.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <Typography variant="body2" color="text.secondary">
            No partnership requests sent
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {requests.sent.map((request) => (
            <Grid item xs={12} key={request.partnershipId}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#1a73e8', mr: 2 }}>
                        {request.recipient?.firstName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {request.recipient?.firstName} {request.recipient?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{request.recipient?.username} • {formatDistanceToNow(new Date(request.createdAt))} ago
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Chip
                      label={request.status}
                      size="small"
                      color={
                        request.status === 'accepted' ? 'success' :
                        request.status === 'pending' ? 'warning' : 'default'
                      }
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Study Partners
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect with fellow students and study together
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Search />}
            onClick={() => setSearchModalOpen(true)}
          >
            Find Partners
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab
            icon={<People />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                My Partners
                {partners.length > 0 && (
                  <Chip 
                    label={partners.length} 
                    size="small" 
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<Inbox />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Requests
                {requests.received.filter(r => r.status === 'pending').length > 0 && (
                  <Chip 
                    label={requests.received.filter(r => r.status === 'pending').length} 
                    size="small" 
                    color="error"
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            }
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && renderPartnersTab()}
      {activeTab === 1 && renderRequestsTab()}

      {/* Search Modal */}
      <Dialog
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Find Study Partners</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search by name or username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              loading={searchLoading}
              disabled={!searchQuery.trim()}
              sx={{ bgcolor: '#1a73e8' }}
            >
              {searchLoading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>

          {searchResults.length > 0 && (
            <Grid container spacing={2}>
              {searchResults.map((user) => (
                <Grid item xs={12} key={user.userId}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: '#1a73e8', mr: 2 }}>
                            {user.firstName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @{user.username} • {user.studyLevel?.replace('_', ' ')}
                            </Typography>
                            {user.subjects && user.subjects.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                                {user.subjects.slice(0, 3).map((subject, idx) => (
                                  <Chip
                                    key={idx}
                                    label={subject.subjectName}
                                    size="small"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                        
                        <Button
                          variant="contained"
                          startIcon={<PersonAdd />}
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setRequestModalOpen(true);
                          }}
                        >
                          Send Request
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Send Request Modal */}
      <Dialog
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          Send Partnership Request
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 3 }}>  
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#1a73e8', mr: 2 }}>
                  {selectedUser.firstName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{selectedUser.username}
                  </Typography>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message (Optional)"
                placeholder="Hi! I'd like to be study partners..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendRequest}
            sx={{ bgcolor: '#1a73e8' }}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudyPartnersPage;