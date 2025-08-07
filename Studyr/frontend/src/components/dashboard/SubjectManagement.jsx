import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Divider
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Save,
  School
} from '@mui/icons-material';
import { subjectsAPI } from '../../services/api';

const SubjectManagement = ({ onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectsAPI.getAll();
      setSubjects(response.data.data.subjects || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, subject) => {
    setMenuAnchor(event.currentTarget);
    setSelectedSubject(subject);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedSubject(null);
  };

  const handleEditSubject = () => {
    setEditingSubject(selectedSubject);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setSubjectToDelete(selectedSubject);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!subjectToDelete) return;

    try {
      await subjectsAPI.delete(subjectToDelete.subjectId);
      setSubjects(prev => prev.filter(s => s.subjectId !== subjectToDelete.subjectId));
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  const handleSubjectCreated = (newSubject) => {
    setSubjects(prev => [newSubject, ...prev]);
    setCreateModalOpen(false);
  };

  const handleSubjectUpdated = (updatedSubject) => {
    setSubjects(prev => 
      prev.map(subject => 
        subject.subjectId === updatedSubject.subjectId ? updatedSubject : subject
      )
    );
    setEditingSubject(null);
  };

  const getCategoryLabel = (category) => {
    const categoryMap = {
      mathematics: 'Mathematics',
      english: 'English',
      psychology: 'Psychology',
      physics: 'Physics',
      biology: 'Biology',
      history: 'History',
      languages: 'Languages',
      arts: 'Arts',
      technology: 'Technology',
      business: 'Business',
      other: 'Other'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Subject Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and customize your study subjects
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ minWidth: 100 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#4ECDC4', mb: 1 }}>
              {subjects.length}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Subjects
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#FF6B6B', mb: 1 }}>
              {new Set(subjects.map(s => s.category)).size}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Categories
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
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
          <School sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            No subjects created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first subject
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
              '&:hover': {
                background: 'linear-gradient(45deg, #26C6DA, #42A5F5)'
              }
            }}
          >
            Create First Subject
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {subjects.map((subject) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={subject.subjectId}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: `2px solid ${subject.colorHex}15`,
                  borderLeft: `6px solid ${subject.colorHex}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h4" sx={{ mr: 1 }}>
                          {subject.iconEmoji || '📚'}
                        </Typography>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: subject.colorHex,
                            ml: 'auto'
                          }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {subject.subjectName}
                      </Typography>
                      {subject.subjectCode && (
                        <Chip
                          label={subject.subjectCode}
                          size="small"
                          sx={{
                            bgcolor: `${subject.colorHex}15`,
                            color: subject.colorHex,
                            fontWeight: 600,
                            mb: 1
                          }}
                        />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, subject)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* Category */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={getCategoryLabel(subject.category)}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: subject.colorHex,
                        color: subject.colorHex
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add subject"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
          '&:hover': {
            background: 'linear-gradient(45deg, #26C6DA, #42A5F5)'
          }
        }}
        onClick={() => setCreateModalOpen(true)}
      >
        <Add />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 150 }
        }}
      >
        <MenuItem onClick={handleEditSubject}>
          <Edit sx={{ mr: 1 }} />
          Edit Subject
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Subject
        </MenuItem>
      </Menu>

      {/* Create/Edit Subject Modal */}
      <SubjectFormModal
        open={createModalOpen || !!editingSubject}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingSubject(null);
        }}
        subject={editingSubject}
        onSubjectCreated={handleSubjectCreated}
        onSubjectUpdated={handleSubjectUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Delete Subject?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{subjectToDelete?.subjectName}"? 
            This will also affect any study sessions associated with this subject.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete Subject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Subject Form Modal Component
const SubjectFormModal = ({ open, onClose, subject, onSubjectCreated, onSubjectUpdated }) => {
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    category: 'other',
    colorHex: '#4ECDC4',
    iconEmoji: '📚'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectName: subject.subjectName || '',
        subjectCode: subject.subjectCode || '',
        category: subject.category || 'other',
        colorHex: subject.colorHex || '#4ECDC4',
        iconEmoji: subject.iconEmoji || '📚'
      });
    } else {
      setFormData({
        subjectName: '',
        subjectCode: '',
        category: 'other',
        colorHex: '#4ECDC4',
        iconEmoji: '📚'
      });
    }
    setError('');
  }, [subject, open]);

  const handleSubmit = async () => {
    if (!formData.subjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (subject) {
        // Update existing subject
        const response = await subjectsAPI.update?.(subject.subjectId, formData);
        onSubjectUpdated?.(response?.data?.data?.subject || { ...subject, ...formData });
      } else {
        // Create new subject
        const response = await subjectsAPI.create(formData);
        onSubjectCreated?.(response.data.data.subject);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'english', label: 'English' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'physics', label: 'Physics' },
    { value: 'biology', label: 'Biology' },
    { value: 'history', label: 'History' },
    { value: 'languages', label: 'Languages' },
    { value: 'arts', label: 'Arts' },
    { value: 'technology', label: 'Technology' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other' }
  ];

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#F8C471', '#85C1E9',
    '#F1948A', '#82E0AA', '#D7BDE2', '#F9E79F'
  ];

  const emojiOptions = [
    '📚', '🔢', '🧪', '🌍', '🎨', '💻', '🏛️', '🔬',
    '📖', '✏️', '🎵', '🏋️', '🧠', '💡', '🎯', '⚗️'
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        {subject ? 'Edit Subject' : 'Create New Subject'}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Subject Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Subject Name"
              value={formData.subjectName}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
              placeholder="e.g., Introduction to Psychology"
            />
          </Grid>

          {/* Subject Code */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Subject Code (Optional)"
              value={formData.subjectCode}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value }))}
              placeholder="e.g., PSYC101"
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Color Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {colorOptions.map((color) => (
                <Box
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, colorHex: color }))}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: color,
                    cursor: 'pointer',
                    border: formData.colorHex === color ? '3px solid #333' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.1)' }
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Emoji Selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Icon Emoji
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {emojiOptions.map((emoji) => (
                <Box
                  key={emoji}
                  onClick={() => setFormData(prev => ({ ...prev, iconEmoji: emoji }))}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    bgcolor: formData.iconEmoji === emoji ? '#f0f0f0' : 'transparent',
                    border: formData.iconEmoji === emoji ? '2px solid #333' : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.1)', bgcolor: '#f0f0f0' }
                  }}
                >
                  {emoji}
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Preview
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ fontSize: '2rem' }}>{formData.iconEmoji}</Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formData.subjectName || 'Subject Name'}
                  </Typography>
                  {formData.subjectCode && (
                    <Chip
                      label={formData.subjectCode}
                      size="small"
                      sx={{
                        bgcolor: `${formData.colorHex}15`,
                        color: formData.colorHex,
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: formData.colorHex,
                    ml: 'auto'
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          sx={{
            background: 'linear-gradient(45deg, #4ECDC4, #45B7D1)',
            '&:hover': {
              background: 'linear-gradient(45deg, #26C6DA, #42A5F5)'
            }
          }}
        >
          {loading ? 'Saving...' : (subject ? 'Update Subject' : 'Create Subject')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectManagement;