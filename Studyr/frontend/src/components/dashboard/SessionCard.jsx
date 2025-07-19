import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  MoreVert,
  PlayArrow,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  LocationOn,
  Person,
  Groups,
  PersonOutline,
  AccessTime,
  Notes
} from '@mui/icons-material';
import { format, parseISO, isToday, isTomorrow, isPast, isWithinInterval, addMinutes } from 'date-fns';
import { sessionsAPI } from '../../services/api';

const SessionCard = ({ session, onSessionUpdate, onSessionDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStartSession = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await sessionsAPI.update(session.sessionId, { status: 'inProgress' });
      onSessionUpdate(response.data.data.session);
      handleMenuClose();
    } catch (err) {
      setError('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await sessionsAPI.complete(session.sessionId);
      onSessionUpdate(response.data.data.session);
      handleMenuClose();
    } catch (err) {
      setError('Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    setLoading(true);
    setError('');
    try {
      await sessionsAPI.delete(session.sessionId);
      onSessionDelete(session.sessionId);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStatusInfo = () => {
    const now = new Date();
    const startTime = parseISO(session.startTime);
    const endTime = parseISO(session.endTime);

    switch (session.status) {
      case 'completed':
        return { label: 'Completed', color: '#4CAF50', icon: <CheckCircle /> };
      case 'cancelled':
        return { label: 'Cancelled', color: '#757575', icon: <Schedule /> };
      case 'inProgress':
        return { label: 'Active Now', color: '#FF9800', icon: <PlayArrow /> };
      case 'scheduled':
        if (isPast(endTime)) {
          return { label: 'Overdue', color: '#F44336', icon: <Schedule /> };
        } else if (isWithinInterval(now, { start: startTime, end: endTime })) {
          return { label: 'Ready to Start', color: '#2196F3', icon: <PlayArrow /> };
        } else {
          return { label: 'Scheduled', color: '#9E9E9E', icon: <Schedule /> };
        }
      default:
        return { label: 'Unknown', color: '#9E9E9E', icon: <Schedule /> };
    }
  };

  const getSessionTypeInfo = () => {
    switch (session.sessionType) {
      case 'solo':
        return { label: 'Solo Study', icon: <PersonOutline />, color: '#4ECDC4' };
      case 'partner':
        return { label: 'Study Partner', icon: <Person />, color: '#FF6B6B' };
      case 'group':
        return { label: 'Group Session', icon: <Groups />, color: '#45B7D1' };
      default:
        return { label: 'Study Session', icon: <PersonOutline />, color: '#9E9E9E' };
    }
  };

  const formatSessionTime = () => {
    const start = parseISO(session.startTime);
    const end = parseISO(session.endTime);
    
    if (isToday(start)) {
      return `Today, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else if (isTomorrow(start)) {
      return `Tomorrow, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else {
      return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
    }
  };

  const getDurationText = () => {
    const minutes = session.durationMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const statusInfo = getStatusInfo();
  const typeInfo = getSessionTypeInfo();
  const subjectColor = session.subject?.colorHex || '#4ECDC4';

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          border: `2px solid ${subjectColor}15`,
          borderLeft: `6px solid ${subjectColor}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          },
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            bgcolor: statusInfo.color,
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 1
          }}
        >
          {statusInfo.icon}
          {statusInfo.label}
        </Box>

        <CardContent sx={{ p: 3, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2C3E50', mb: 0.5 }}>
                {session.sessionTitle}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: subjectColor
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#555' }}>
                  {session.subject?.subjectName || 'Unknown Subject'}
                </Typography>
                {session.subject?.subjectCode && (
                  <Chip 
                    label={session.subject.subjectCode} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 16, color: '#666' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatSessionTime()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16, color: '#666' }} />
                  <Typography variant="body2" color="text.secondary">
                    {getDurationText()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <IconButton 
              onClick={handleMenuOpen}
              size="small"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : <MoreVert />}
            </IconButton>
          </Box>

          {/* Session Details */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={typeInfo.icon}
              label={typeInfo.label}
              size="small"
              sx={{
                bgcolor: `${typeInfo.color}15`,
                color: typeInfo.color,
                borderColor: typeInfo.color,
                border: 1
              }}
            />
            
            {session.location && (
              <Chip
                icon={<LocationOn />}
                label={session.location}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Notes */}
          {session.notes && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Notes sx={{ fontSize: 16, color: '#666' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#666' }}>
                  Notes
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {session.notes}
              </Typography>
            </Box>
          )}

          {/* Quick Actions */}
          {session.status === 'scheduled' && !isPast(parseISO(session.endTime)) && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isWithinInterval(new Date(), { 
                  start: addMinutes(parseISO(session.startTime), -15), 
                  end: parseISO(session.endTime) 
                }) && (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleStartSession}
                    disabled={loading}
                    sx={{
                      bgcolor: statusInfo.color,
                      '&:hover': { bgcolor: statusInfo.color }
                    }}
                  >
                    Start Session
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 150 }
        }}
      >
        {session.status === 'scheduled' && (
          <MenuItem onClick={handleStartSession} disabled={loading}>
            <PlayArrow sx={{ mr: 1 }} />
            Start Session
          </MenuItem>
        )}
        
        {(session.status === 'inProgress' || session.status === 'scheduled') && (
          <MenuItem onClick={handleCompleteSession} disabled={loading}>
            <CheckCircle sx={{ mr: 1 }} />
            Mark Complete
          </MenuItem>
        )}
        
        <MenuItem onClick={() => alert('Edit session coming soon!')} disabled={loading}>
          <Edit sx={{ mr: 1 }} />
          Edit Session
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          disabled={loading}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete Session
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Delete Session?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{session.sessionTitle}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteSession}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionCard;