/*
Module Name: Session Timer Component
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: React component for study session timing with countdown functionality, productivity rating, pause/resume controls, and completion tracking
*/
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Close,
  Timer as TimerIcon,
  Star,
  StarBorder
} from '@mui/icons-material';
import { format, differenceInSeconds, parseISO } from 'date-fns';
import { sessionsAPI } from '../../services/api';

const SessionTimer = ({ session, open, onClose, onSessionUpdate }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [productivityRating, setProductivityRating] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || !open) return;

    // Calculate initial time remaining
    const now = new Date();
    const endTime = parseISO(session.endTime);
    const remaining = Math.max(0, differenceInSeconds(endTime, now));
    setTimeRemaining(remaining);

    // Auto-start if session is in progress
    if (session.status === 'inProgress') {
      setIsRunning(true);
      setIsPaused(false);
    }

    // Reset other states
    setShowRating(false);
    setProductivityRating(0);
    setError('');
  }, [session, open]);

  useEffect(() => {
    let interval;
    
    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowRating(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Update session status to in progress if not already
      if (session.status === 'scheduled') {
        const response = await sessionsAPI.update(session.sessionId, { status: 'inProgress' });
        if (response.data.success) {
          onSessionUpdate(response.data.data.session);
        }
      }
      
      setIsRunning(true);
      setIsPaused(false);
    } catch (err) {
      setError('Failed to start session');
      console.error('Failed to start session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setShowRating(true);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    
    try {
      const completionData = {
        productivityRating: productivityRating > 0 ? productivityRating : null,
        actualEndTime: new Date().toISOString()
      };

      const response = await sessionsAPI.complete(session.sessionId, completionData);
      
      if (response.data.success) {
        onSessionUpdate(response.data.data.session);
        onClose();
      }
    } catch (err) {
      setError('Failed to complete session');
      console.error('Failed to complete session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await sessionsAPI.update(session.sessionId, { status: 'cancelled' });
      if (response.data.success) {
        onSessionUpdate(response.data.data.session);
        onClose();
      }
    } catch (err) {
      setError('Failed to cancel session');
      console.error('Failed to cancel session:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  const totalDuration = session.durationMinutes * 60;
  const elapsed = totalDuration - timeRemaining;
  const progress = Math.min((elapsed / totalDuration) * 100, 100);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: isRunning && !isPaused 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white'
        }
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimerIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Study Timer</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }} disabled={loading}>
            <Close />
          </IconButton>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, color: 'black' }}>
            {error}
          </Alert>
        )}

        {/* Session Info */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white', opacity: 0.9 }}>
            {session.sessionTitle}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={session.subject?.subjectName}
              sx={{
                bgcolor: session.subject?.colorHex || '#4ECDC4',
                color: 'white',
                fontWeight: 600
              }}
            />
            <Chip
              label={session.sessionType}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white'
              }}
            />
          </Box>
        </Paper>

        {/* Timer Display */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 300,
              fontSize: { xs: '3rem', sm: '4rem' },
              mb: 2,
              color: timeRemaining < 300 ? '#ff6b6b' : 'white', // Red when < 5 minutes
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {formatTime(timeRemaining)}
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: timeRemaining < 300 ? '#ff6b6b' : '#4CAF50',
                borderRadius: 4
              }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {formatTime(elapsed)} elapsed
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        </Box>

        {/* Status Messages */}
        {timeRemaining === 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(76, 175, 80, 0.2)', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#4CAF50', mb: 1 }}>
              Session Complete!
            </Typography>
          </Paper>
        )}

        {isPaused && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255, 152, 0, 0.2)', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ color: '#FF9800' }}>
              ⏸️ Session Paused
            </Typography>
          </Paper>
        )}

        {/* Controls */}
        {!showRating && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
            {!isRunning ? (
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={handleStart}
                disabled={loading}
                sx={{
                  bgcolor: '#4CAF50',
                  '&:hover': { bgcolor: '#45a049' },
                  px: 4
                }}
              >
                {loading ? 'Starting...' : 'Start'}
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={isPaused ? <PlayArrow /> : <Pause />}
                  onClick={handlePause}
                  disabled={loading}
                  sx={{
                    bgcolor: '#FF9800',
                    '&:hover': { bgcolor: '#f57c00' }
                  }}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Stop />}
                  onClick={handleStop}
                  disabled={loading}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Finish Early
                </Button>
              </>
            )}
            
            <Button
              variant="text"
              size="large"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white'
                }
              }}
            >
              Cancel Session
            </Button>
          </Box>
        )}

        {/* Productivity Rating */}
        {showRating && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="h6" gutterBottom>
              How productive was this session?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
              Rate your focus and productivity (optional)
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <IconButton
                  key={rating}
                  onClick={() => setProductivityRating(rating)}
                  sx={{ 
                    color: rating <= productivityRating ? '#FFD700' : 'rgba(255,255,255,0.5)',
                    fontSize: '2rem'
                  }}
                  disabled={loading}
                >
                  {rating <= productivityRating ? <Star fontSize="inherit" /> : <StarBorder fontSize="inherit" />}
                </IconButton>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setShowRating(false)}
                disabled={loading}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Skip Rating
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                onClick={handleComplete}
                disabled={loading}
                sx={{
                  bgcolor: '#4CAF50',
                  '&:hover': { bgcolor: '#45a049' },
                  px: 4
                }}
              >
                {loading ? 'Completing...' : 'Complete Session'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Session Details */}
        <Paper sx={{ 
          p: 2, 
          mt: 3, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderRadius: 2,
          fontSize: '0.875rem'
        }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Scheduled: {format(parseISO(session.startTime), 'h:mm a')} - {format(parseISO(session.endTime), 'h:mm a')}
          </Typography>
          {session.location && session.location !== 'online' && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Location: {session.location}
            </Typography>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimer;