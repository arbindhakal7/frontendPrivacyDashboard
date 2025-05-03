import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SecurityIcon from '@mui/icons-material/Security';
import LogoutIcon from '@mui/icons-material/Logout';
import { isAuthenticated, logout } from '../../services/auth';

const Navbar = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = authenticated ? [
    {
      text: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon sx={{ mr: 1 }} />
    },
    {
      text: 'Forms',
      path: '/forms',
      icon: <ListAltIcon sx={{ mr: 1 }} />
    }
  ] : [];

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <SecurityIcon 
            sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              mr: 1,
              color: theme.palette.primary.main 
            }} 
          />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 4,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: theme.palette.primary.main,
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 }
            }}
          >
            Privacy Dashboard
          </Typography>

          <Box sx={{ display: 'flex', flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  mx: 1,
                  color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary,
                  backgroundColor: isActive(item.path) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                  }
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
          
          {authenticated && (
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)'
                }
              }}
            >
              Logout
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
