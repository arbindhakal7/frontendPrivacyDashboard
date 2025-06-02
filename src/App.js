import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Components
import Dashboard from './components/dashboard/Dashboard';
import FormList from './components/dashboard/FormList';
import FormDetail from './components/forms/FormDetail';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import PrivacySettings from './components/settings/PrivacySettings';
import SubscriptionPage from './components/subscription/SubscriptionPage';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/layout/PrivateRoute';
import { isAuthenticated } from './services/auth';

import HighCritical from './components/dashboard/HighCritical';
import LowCritical from './components/dashboard/LowCritical';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2D3282',
      light: '#4150D9',
      dark: '#1A1B4B',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#FF6B6B',
      light: '#FF9999',
      dark: '#CC5555',
      contrastText: '#ffffff'
    },
    background: {
      default: '#F4F7FE',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2D3282',
      secondary: '#64748B'
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669'
    },
    warning: {
      main: '#FBBF24',
      light: '#FCD34D',
      dark: '#D97706'
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01562em'
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.00833em'
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '0em'
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.2,
      letterSpacing: '0.00735em'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: '0em'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
      letterSpacing: '0.0075em'
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.00938em'
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em'
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02857em',
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0
        },
        html: {
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        body: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
          padding: 24,
          transition: 'box-shadow 0.25s ease-in-out',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 2rem 0 rgba(45, 50, 130, 0.1)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: 16,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0.5rem 2rem 0 rgba(45, 50, 130, 0.1)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 1rem 3rem 0 rgba(45, 50, 130, 0.15)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        },
        contained: {
          boxShadow: '0 4px 12px 0 rgba(45, 50, 130, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 16px 0 rgba(45, 50, 130, 0.25)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          padding: '4px 8px'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(45, 50, 130, 0.1)'
        }
      }
    }
  }
});

function App() {
  useEffect(() => {
    // Clear any existing auth state on app startup
    // localStorage.clear();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', pt: 2 }}>
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated() ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login />
                  )
                } 
              />
              <Route 
                path="/register" 
                element={
                  isAuthenticated() ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Register />
                  )
                } 
              />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/forms" element={<PrivateRoute><FormList /></PrivateRoute>} />
              <Route path="/forms/:id" element={<PrivateRoute><FormDetail /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/privacy-settings" element={<PrivateRoute><PrivacySettings /></PrivateRoute>} />
              <Route path="/subscription" element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
              <Route path="/high-critical" element={<PrivateRoute><HighCritical /></PrivateRoute>} />
              <Route path="/low-critical" element={<PrivateRoute><LowCritical /></PrivateRoute>} />

              {/* Default Route */}
              <Route 
                path="/" 
                element={<Navigate to="/login" replace />} 
              />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
