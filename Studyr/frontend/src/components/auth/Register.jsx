/*
Module Name: Registration Component
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: React multi-step registration component with form validation, date picker integration, study level selection, and progressive user onboarding
*/
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { enAU } from 'date-fns/locale';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  School,
  Visibility,
  VisibilityOff,
  ArrowBack,
  ArrowForward,
  Person,
  Email,
  Lock,
  School as SchoolIcon,
  DateRange
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { authAPI, setAuthToken } from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    studyLevel: '',
    yearLevel: '',
    dateOfBirth: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = ['Personal Info', 'Account Details', 'Study Profile'];

  const studyLevels = [
    { value: 'high_school', label: 'High School', years: [7, 8, 9, 10, 11, 12] },
    { value: 'university', label: 'University', years: [1, 2, 3, 4, 5, 6] },
    { value: 'professional', label: 'Professional Development', years: [] }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear year level if study level changes
    if (field === 'studyLevel') {
      setFormData(prev => ({
        ...prev,
        yearLevel: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          // Check age (must be at least 13)
          const today = new Date();
          const birthDate = new Date(formData.dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (age < 13) {
            newErrors.dateOfBirth = 'You must be at least 13 years old to register';
          }
        }
        break;

      case 1: // Account Details
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        
        if (!formData.username.trim()) {
          newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else if (formData.username.length > 50) {
          newErrors.username = 'Username must be less than 50 characters';
        }
        
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 2: // Study Profile
        if (!formData.studyLevel) {
          newErrors.studyLevel = 'Please select your study level';
        }
        
        const selectedLevel = studyLevels.find(level => level.value === formData.studyLevel);
        if (selectedLevel && selectedLevel.years.length > 0 && !formData.yearLevel) {
          newErrors.yearLevel = 'Please select your year level';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setErrors({});

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim(),
        password: formData.password,
        studyLevel: formData.studyLevel,
        yearLevel: formData.yearLevel || null,
        dateOfBirth: formData.dateOfBirth.toISOString().split('T')[0] // Format as YYYY-MM-DD
      };

      const response = await authAPI.register(registrationData);
      
      if (response.data.success) {
        // Auto-login after successful registration
        setAuthToken(response.data.data.token);
        localStorage.setItem('studyr_user', JSON.stringify(response.data.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      const errorDetails = err.response?.data?.errors || [];
      
      if (errorDetails.length > 0) {
        // Map specific validation errors to form fields
        const fieldErrors = {};
        errorDetails.forEach(error => {
          if (error.includes('email')) fieldErrors.email = error;
          else if (error.includes('username')) fieldErrors.username = error;
          else if (error.includes('password')) fieldErrors.password = error;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#5f6368' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#5f6368' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(value) => handleChange('dateOfBirth', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.dateOfBirth}
                      helperText={errors.dateOfBirth || 'You must be at least 13 years old'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <DateRange sx={{ color: '#5f6368' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  maxDate={new Date()}
                  openTo="year"
                  views={['year', 'month', 'day']}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#5f6368' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                error={!!errors.username}
                helperText={errors.username || 'Choose a unique username (3-50 characters)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#5f6368' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password || 'Must be at least 8 characters'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#5f6368' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#5f6368' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        const selectedLevel = studyLevels.find(level => level.value === formData.studyLevel);
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.studyLevel}>
                <InputLabel>Study Level</InputLabel>
                <Select
                  value={formData.studyLevel}
                  onChange={(e) => handleChange('studyLevel', e.target.value)}
                  label="Study Level"
                  startAdornment={
                    <InputAdornment position="start">
                      <SchoolIcon sx={{ color: '#5f6368', mr: 1 }} />
                    </InputAdornment>
                  }
                >
                  {studyLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.studyLevel && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.studyLevel}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            {selectedLevel && selectedLevel.years.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth required error={!!errors.yearLevel}>
                  <InputLabel>Year Level</InputLabel>
                  <Select
                    value={formData.yearLevel}
                    onChange={(e) => handleChange('yearLevel', e.target.value)}
                    label="Year Level"
                  >
                    {selectedLevel.years.map((year) => (
                      <MenuItem key={year} value={year}>
                        Year {year}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.yearLevel && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                      {errors.yearLevel}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1a73e8', fontWeight: 600 }}>
                  🎉 Almost there!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You're about to join the Studyr community and start your journey to better study habits. 
                  Click "Create Account" to complete your registration.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Logo */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                mb: 3
              }}
            >
              <School sx={{ fontSize: 40, color: '#1a73e8' }} />
            </Box>
            
            {/* Branding */}
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 400,
                color: '#202124',
                mb: 1,
                fontFamily: '"Google Sans", Roboto, sans-serif'
              }}
            >
              Join Studyr
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 400,
                color: '#5f6368',
                mb: 2
              }}
            >
              Create your account to start your study journey
            </Typography>

            {/* Back to Login Link */}
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/login')}
              sx={{
                color: '#1a73e8',
                textTransform: 'none',
                mb: 2
              }}
            >
              Back to Sign In
            </Button>
          </Box>

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid #dadce0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
              maxWidth: 600,
              margin: '0 auto'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* General Error */}
              {errors.general && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.general}
                </Alert>
              )}

              {/* Step Content */}
              <Box sx={{ mb: 4 }}>
                {getStepContent(activeStep)}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                  startIcon={<ArrowBack />}
                  sx={{
                    color: '#5f6368',
                    textTransform: 'none'
                  }}
                >
                  Back
                </Button>

                <Button
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  variant="contained"
                  disabled={loading}
                  endIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : activeStep === steps.length - 1 ? null : (
                      <ArrowForward />
                    )
                  }
                  sx={{
                    bgcolor: '#1a73e8',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    px: 4,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#1557b0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                    },
                    '&:disabled': {
                      bgcolor: '#94a3b8'
                    }
                  }}
                >
                  {loading 
                    ? 'Creating Account...' 
                    : activeStep === steps.length - 1 
                      ? 'Create Account' 
                      : 'Next'
                  }
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Button
                component={Link}
                to="/login"
                sx={{
                  color: '#1a73e8',
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                Sign in here
              </Button>
            </Typography>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default Register;