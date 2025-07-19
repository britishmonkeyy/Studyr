import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import { getAuthToken } from './services/api';

// Create Google-inspired theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
      light: '#4285f4',
      dark: '#1557b0',
    },
    secondary: {
      main: '#34a853',
      light: '#46c063',
      dark: '#2d8e47',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
    },
    error: {
      main: '#ea4335',
    },
    warning: {
      main: '#fbbc04',
    },
    success: {
      main: '#34a853',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      fontWeight: 400,
    },
    h2: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      fontWeight: 400,
    },
    h3: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      fontWeight: 400,
    },
    h4: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      fontWeight: 400,
    },
    h5: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      fontWeight: 400,
    },
    h6: {
      fontFamily: '"Google Sans", "Roboto", sans-serif',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();
  return token ? children : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const token = getAuthToken();
  return !token ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 route */}
          <Route 
            path="*" 
            element={
              <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f5f5f5'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontSize: '4rem', color: '#666', margin: 0 }}>404</h1>
                  <p style={{ color: '#888', marginTop: '1rem' }}>Page not found</p>
                  <a href="/login" style={{ color: '#4ECDC4', textDecoration: 'none' }}>
                    Go Home
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;