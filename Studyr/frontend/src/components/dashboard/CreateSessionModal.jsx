import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Schedule,
  Person,
  Groups,
  PersonOutline
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addHours, addMinutes } from 'date-fns';
import { sessionsAPI, subjectsAPI } from '../../services/api';

const CreateSessionModal = ({ open, onClose, onSessionCreated }) => {
  const [formData, setFormData] = useState({
    subjectId: '',
    sessionTitle: '',
    sessionType: 'solo',
    startTime: new Date(),
    endTime: addHours(new Date(), 1),
    location: 'online',
    notes: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadSubjects();
      // Reset form when modal opens
      setFormData({
        subjectId: '',
        sessionTitle: '',
        sessionType: 'solo',
        startTime: new Date(),
        endTime: addHours(new Date(), 1),
        location: 'online',
        notes: ''
      });
      setError('');
    }
  }, [open]);

  const loadSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const response = await subjectsAPI.getAll();
      setSubjects(response.data.data.subjects || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user makes changes

    // Auto-adjust end time when start time changes
    if (field === 'startTime') {
      const currentDuration = formData.endTime - formData.startTime;
      setFormData(prev => ({
        ...prev,
        startTime: value,
        endTime: addMinutes(value, Math.max(30, currentDuration / (1000 * 60))) // Minimum 30 minutes
      }));
    }
  };

  const calculateDuration = () => {
    const duration = (formData.endTime - formData.startTime) / (1000 * 60); // in minutes
    return Math.max(0, Math.round(duration));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.subjectId) errors.push('Please select a subject');
    if (!formData.sessionTitle.trim()) errors.push('Please enter a session title');
    if (formData.endTime <= formData.startTime) errors.push('End time must be after start time');
    if (calculateDuration() < 15) errors.push('Session must be at least 15 minutes long');
    if (calculateDuration() > 480) errors.push('Session cannot be longer than 8 hours');
    
    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionData = {
        ...formData,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString()
      };

      const response = await sessionsAPI.create(sessionData);
      
      if (response.data.success) {
        onSessionCreated(response.data.data.session);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sessionTypeOptions = [
    { value: 'solo', label: 'Solo Study', icon: <PersonOutline />, color: '#4ECDC4' },
    { value: 'partner', label: 'Study Partner', icon: <Person />, color: '#FF6B6B' },
    { value: 'group', label: 'Group Session', icon: <Groups />, color: '#45B7D1' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create New Study Session
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Subject Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subjectId}
                  onChange={(e) => handleChange('subjectId', e.target.value)}
                  label="Subject"
                  disabled={subjectsLoading}
                >
                  {subjectsLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading subjects...
                    </MenuItem>
                  ) : subjects.length === 0 ? (
                    <MenuItem disabled>
                      No subjects available. Create one first!
                    </MenuItem>
                  ) : (
                    subjects.map((subject) => (
                      <MenuItem key={subject.subjectId} value={subject.subjectId}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: subject.colorHex || '#4ECDC4',
                              mr: 2
                            }}
                          />
                          {subject.iconEmoji && (
                            <span style={{ marginRight: 8 }}>{subject.iconEmoji}</span>
                          )}
                          {subject.subjectName}
                          {subject.subjectCode && (
                            <Chip 
                              label={subject.subjectCode} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Session Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Session Title"
                value={formData.sessionTitle}
                onChange={(e) => handleChange('sessionTitle', e.target.value)}
                placeholder="e.g., Chapter 5: Calculus Review"
                helperText="Give your session a descriptive name"
              />
            </Grid>

            {/* Session Type */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Session Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sessionTypeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    icon={option.icon}
                    onClick={() => handleChange('sessionType', option.value)}
                    variant={formData.sessionType === option.value ? 'filled' : 'outlined'}
                    sx={{
                      bgcolor: formData.sessionType === option.value ? option.color : 'transparent',
                      color: formData.sessionType === option.value ? 'white' : option.color,
                      borderColor: option.color,
                      '&:hover': {
                        bgcolor: formData.sessionType === option.value ? option.color : `${option.color}15`
                      }
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Date and Time */}
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(value) => handleChange('startTime', value)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(value) => handleChange('endTime', value)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={formData.startTime}
              />
            </Grid>

            {/* Duration Display */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 2 
              }}>
                <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Duration: <strong>{Math.floor(calculateDuration() / 60)}h {calculateDuration() % 60}m</strong>
                </Typography>
              </Box>
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Library Level 2, Online, Home"
                helperText="Where will you be studying?"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any additional notes about this session..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || subjectsLoading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
              '&:hover': {
                background: 'linear-gradient(45deg, #26C6DA, #42A5F5)'
              }
            }}
          >
            {loading ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateSessionModal;