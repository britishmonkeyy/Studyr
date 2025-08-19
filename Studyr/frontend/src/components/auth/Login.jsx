/*
Module Name: Login Component
Module Author: Adam Bolton
Date Modified: 12/08/2025
Description: React component for user authentication with form validation, error handling, Google-inspired design, and demo account integration for people too lazy to make an account
*/
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Divider,
  Paper,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  School,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { authAPI, setAuthToken } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        setAuthToken(response.data.data.token);
        localStorage.setItem('studyr_user', JSON.stringify(response.data.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <Container maxWidth="sm">
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
            Studyr
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 400,
              color: '#5f6368',
              mb: 4
            }}
          >
            Studying Made Easy
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #dadce0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            maxWidth: 400,
            margin: '0 auto'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 400,
                color: '#202124',
                mb: 1,
                textAlign: 'center'
              }}
            >
              Sign in
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#5f6368',
                mb: 3,
                textAlign: 'center'
              }}
            >
              to continue to Studyr
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1a73e8'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1a73e8'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1a73e8'
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
                InputProps={{
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
                sx={{
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1a73e8'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1a73e8'
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1a73e8'
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  sx={{
                    color: '#1a73e8',
                    borderColor: '#dadce0',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': {
                      bgcolor: 'rgba(26, 115, 232, 0.04)',
                      borderColor: '#1a73e8'
                    }
                  }}
                >
                  Create account
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: '#1a73e8',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2,
                    px: 4,
                    py: 1,
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
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            bgcolor: '#e8f0fe',
            border: '1px solid #dadce0',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            Demo Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: test@example.com • Password: password123
          </Typography>
        </Paper>

      </Container>
    </Box>
  );
};

export default Login;