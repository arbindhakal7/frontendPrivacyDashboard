import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    // Send message to extension content script to clear auth token
    window.postMessage({ type: 'CLEAR_AUTH_TOKEN' }, '*');
    navigate('/login');
  };

  const navItems = authenticated ? [
    {
      text: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon sx={{ transition: 'transform 0.3s ease' }} />
    },
    {
      text: 'Forms',
      path: '/forms',
      icon: <ListAltIcon sx={{ transition: 'transform 0.3s ease' }} />
    },
    {
      text: 'Subscription',
      path: '/subscription',
      icon: <SecurityIcon sx={{ transition: 'transform 0.3s ease' }} />
    }
  ] : [];

  const drawer = (
    <Box
      sx={{ width: 280, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', height: '100%' }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
      onKeyDown={() => setDrawerOpen(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={RouterLink}
            to={item.path}
            selected={isActive(item.path)}
            sx={{
              borderRadius: 2,
              mx: 2,
              my: 1,
              transition: 'background-color 0.3s ease, color 0.3s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(45, 50, 130, 0.15)',
                color: '#2D3282',
                '& svg': {
                  color: '#2D3282',
                  transform: 'scale(1.1)'
                }
              },
              '&:hover': {
                backgroundColor: 'rgba(45, 50, 130, 0.1)',
                color: '#2D3282',
                '& svg': {
                  color: '#2D3282',
                  transform: 'scale(1.1)'
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? '#2D3282' : '#64748B', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ fontWeight: 600 }} />
          </ListItem>
        ))}
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            mx: 2,
            my: 1,
            color: '#FF6B6B',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 107, 0.15)',
              color: '#FF6B6B'
            }
          }}
        >
          <ListItemIcon sx={{ color: '#FF6B6B', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ fontWeight: 600 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={8}
      sx={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid rgba(45, 50, 130, 0.1)`,
        boxShadow: '0 8px 24px rgba(45, 50, 130, 0.12)',
        transition: 'background-color 0.3s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/dashboard"
            sx={{
              mr: 4,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: '#2D3282',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 },
              cursor: 'pointer',
              userSelect: 'none',
              letterSpacing: '0.1em',
              '&:hover': {
                textDecoration: 'underline',
                color: '#4150D9'
              }
            }}
          >
            Privacy Dashboard
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ ml: 'auto', color: '#2D3282' }}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                  sx: {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)'
                  }
                }}
              >
                {drawer}
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
              {authenticated ? (
                navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    startIcon={item.icon}
                    sx={{
                      mx: 1,
                      color: isActive(item.path) ? '#2D3282' : '#64748B',
                      backgroundColor: isActive(item.path) ? 'rgba(45, 50, 130, 0.15)' : 'transparent',
                      borderRadius: 3,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(45, 50, 130, 0.25)',
                        color: '#4150D9',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/register"
                    sx={{
                      mx: 1,
                      color: isActive('/register') ? '#2D3282' : '#64748B',
                      backgroundColor: isActive('/register') ? 'rgba(45, 50, 130, 0.15)' : 'transparent',
                      borderRadius: 3,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(45, 50, 130, 0.25)',
                        color: '#4150D9',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    Register
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    sx={{
                      mx: 1,
                      color: isActive('/login') ? '#2D3282' : '#64748B',
                      backgroundColor: isActive('/login') ? 'rgba(45, 50, 130, 0.15)' : 'transparent',
                      borderRadius: 3,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(45, 50, 130, 0.25)',
                        color: '#4150D9',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    Login
                  </Button>
                </>
              )}
            </Box>
          )}

          {!isMobile && authenticated && (
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                color: '#FF6B6B',
                borderRadius: 3,
                fontWeight: 700,
                ml: 2,
                letterSpacing: '0.05em',
                transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 107, 0.15)',
                  color: '#FF6B6B',
                  transform: 'scale(1.05)'
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
