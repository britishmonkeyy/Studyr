import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  Chip,
  InputAdornment,
  TextField
} from '@mui/material';
import {
  Today,
  Upcoming,
  History,
  Search,
  Add
} from '@mui/icons-material';
import { isToday, isFuture, isPast, parseISO } from 'date-fns';
import SessionCard from './SessionCard';

const SessionsList = ({ sessions, onSessionUpdate, onSessionDelete, onCreateSession }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter sessions based on active tab
  const getFilteredSessions = () => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.subject?.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 0: // Today
        return filtered.filter(session => 
          session.startTime && isToday(parseISO(session.startTime))
        );
      case 1: // Upcoming
        return filtered.filter(session => 
          session.startTime && 
          isFuture(parseISO(session.startTime)) && 
          !isToday(parseISO(session.startTime)) &&
          session.status !== 'completed' &&
          session.status !== 'cancelled'
        );
      case 2: // Completed
        return filtered.filter(session => 
          session.status === 'completed'
        );
      case 3: // All
        return filtered;
      default:
        return filtered;
    }
  };

  const filteredSessions = getFilteredSessions();

  // Count sessions for each tab
  const todaySessions = sessions.filter(session => 
    session.startTime && isToday(parseISO(session.startTime))
  ).length;

  const upcomingSessions = sessions.filter(session => 
    session.startTime && 
    isFuture(parseISO(session.startTime)) && 
    !isToday(parseISO(session.startTime)) &&
    session.status !== 'completed' &&
    session.status !== 'cancelled'
  ).length;

  const completedSessions = sessions.filter(session => 
    session.status === 'completed'
  ).length;

  const EmptyState = ({ title, subtitle, actionText, onAction }) => (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: '#f8f9fa',
        borderRadius: 3,
        border: '2px dashed #ddd'
      }}
    >
      <Typography variant="h6" gutterBottom color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {subtitle}
      </Typography>
      {actionText && onAction && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAction}
          sx={{
            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #26C6DA, #42A5F5)'
            }
          }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Study Sessions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onCreateSession}
          sx={{
            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #26C6DA, #42A5F5)'
            }
          }}
        >
          New Session
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search sessions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
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
            icon={<Today />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Today
                {todaySessions > 0 && (
                  <Chip 
                    label={todaySessions} 
                    size="small" 
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<Upcoming />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Upcoming
                {upcomingSessions > 0 && (
                  <Chip 
                    label={upcomingSessions} 
                    size="small" 
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            icon={<History />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Completed
                {completedSessions > 0 && (
                  <Chip 
                    label={completedSessions} 
                    size="small" 
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            }
            iconPosition="start"
          />
          <Tab
            label={`All (${sessions.length})`}
          />
        </Tabs>
      </Paper>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          title={
            searchTerm ? 'No sessions found' :
            activeTab === 0 ? 'No sessions today' :
            activeTab === 1 ? 'No upcoming sessions' :
            activeTab === 2 ? 'No completed sessions yet' :
            'No sessions created yet'
          }
          subtitle={
            searchTerm ? 'Try adjusting your search terms' :
            activeTab === 0 ? 'Create a session to start studying today!' :
            activeTab === 1 ? 'Schedule your next study session' :
            activeTab === 2 ? 'Complete some sessions to see them here' :
            'Create your first study session to get started'
          }
          actionText={searchTerm ? null : 'Create Session'}
          onAction={searchTerm ? null : onCreateSession}
        />
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session) => (
            <Grid item xs={12} md={6} lg={4} key={session.sessionId}>
              <SessionCard
                session={session}
                onSessionUpdate={onSessionUpdate}
                onSessionDelete={onSessionDelete}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Results Summary */}
      {filteredSessions.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredSessions.length} of {sessions.length} sessions
            {searchTerm && ` matching "${searchTerm}"`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SessionsList;