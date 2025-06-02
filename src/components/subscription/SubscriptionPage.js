import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  Fade,
  Zoom,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SupportIcon from '@mui/icons-material/Support';
import CloudIcon from '@mui/icons-material/Cloud';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { fetchForms } from '../../utils/axios';

const SubscriptionPage = () => {
  const theme = useTheme();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setError('');
      try {
        const forms = await fetchForms();
        setUserData(forms);
      } catch (err) {
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Limit data to 10 items if not subscribed
  const displayedData = isSubscribed ? userData : userData.slice(0, 10);

  const getSensitivityColor = (sensitivity) => {
    if (sensitivity >= 80) return '#FF6B6B';
    if (sensitivity >= 50) return '#FFB800';
    return '#4ECDC4';
  };

  const getSensitivityLevel = (sensitivity) => {
    if (sensitivity >= 80) return 'High';
    if (sensitivity >= 50) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={{ backgroundColor: '#f5f7fa' }}>
        <CircularProgress size={60} thickness={5} sx={{ color: '#4169e1' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 800,
          color: theme.palette.primary.main,
          letterSpacing: '0.02em',
          mb: 4,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: 60,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.primary.main,
            transition: 'width 0.3s ease',
          },
          '&:hover::after': {
            width: 120,
          }
        }}
      >
        Subscription Plans
      </Typography>

      {/* Current Status Card */}
      <Fade in={true} timeout={600}>
        <Paper 
          sx={{ 
            p: 4, 
            mb: 4,
            borderRadius: 4,
            background: isSubscribed 
              ? 'linear-gradient(135deg, rgba(76, 205, 196, 0.1), rgba(126, 221, 214, 0.1))'
              : 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 201, 71, 0.1))',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
            border: `2px solid ${isSubscribed ? '#4ECDC4' : '#FFB800'}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  background: isSubscribed ? '#4ECDC4' : '#FFB800',
                  mr: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSubscribed ? (
                  <StarIcon sx={{ color: 'white', fontSize: 32 }} />
                ) : (
                  <SecurityIcon sx={{ color: 'white', fontSize: 32 }} />
                )}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
                  {isSubscribed ? 'Premium Plan Active' : 'Free Plan'}
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  {isSubscribed 
                    ? 'You have full access to all privacy features'
                    : 'Limited access - Upgrade to unlock all features'
                  }
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isSubscribed}
                  onChange={(e) => setIsSubscribed(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4ECDC4',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#4ECDC4',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {isSubscribed ? 'Premium View' : 'Free View'}
                </Typography>
              }
            />
          </Box>
        </Paper>
      </Fade>

      {/* Subscription Plans */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Free Plan */}
        <Grid item xs={12} md={6}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                border: !isSubscribed ? '3px solid #FFB800' : '1px solid rgba(45, 50, 130, 0.1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #FFB800, #FFC947)',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 48px rgba(255, 184, 0, 0.18)',
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SecurityIcon sx={{ color: '#FFB800', fontSize: 32, mr: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFB800' }}>
                    Free
                  </Typography>
                </Box>
                
                <Typography variant="h2" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 1 }}>
                  $0
                  <Typography component="span" variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                    /month
                  </Typography>
                </Typography>
                
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                  Perfect for getting started with privacy monitoring
                </Typography>

                <List sx={{ mb: 4 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Access to 10 form submissions" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Basic privacy analysis" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Standard dashboard" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <PriorityHighIcon sx={{ color: '#FFB800' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Limited data access" 
                      sx={{ '& .MuiListItemText-primary': { color: theme.palette.text.secondary } }}
                    />
                  </ListItem>
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 4, pt: 0 }}>
                <Button 
                  fullWidth
                  variant={!isSubscribed ? "contained" : "outlined"}
                  size="large"
                  sx={{ 
                    borderRadius: 3,
                    fontWeight: 700,
                    py: 2,
                    background: !isSubscribed ? '#FFB800' : 'transparent',
                    color: !isSubscribed ? 'white' : '#FFB800',
                    borderColor: '#FFB800',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: !isSubscribed ? '#FF9800' : 'rgba(255, 184, 0, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(255, 184, 0, 0.3)',
                    }
                  }}
                >
                  {!isSubscribed ? 'Current Plan' : 'Downgrade to Free'}
                </Button>
              </CardActions>
            </Card>
          </Zoom>
        </Grid>

        {/* Premium Plan */}
        <Grid item xs={12} md={6}>
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                border: isSubscribed ? '3px solid #4ECDC4' : '1px solid rgba(45, 50, 130, 0.1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #4ECDC4, #7EDDD6)',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 48px rgba(78, 205, 196, 0.18)',
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <StarIcon sx={{ color: '#4ECDC4', fontSize: 32, mr: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#4ECDC4' }}>
                    Premium
                  </Typography>
                  <Chip 
                    label="POPULAR" 
                    size="small" 
                    sx={{ 
                      ml: 2, 
                      bgcolor: '#FF6B6B', 
                      color: 'white', 
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }} 
                  />
                </Box>
                
                <Typography variant="h2" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 1 }}>
                  $10
                  <Typography component="span" variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                    /month
                  </Typography>
                </Typography>
                
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                  Complete privacy protection and unlimited access
                </Typography>

                <List sx={{ mb: 4 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Unlimited form submissions" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <AnalyticsIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Advanced privacy analytics" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <SpeedIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Real-time monitoring" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CloudIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Cloud backup & sync" />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <SupportIcon sx={{ color: '#4ECDC4' }} />
                    </ListItemIcon>
                    <ListItemText primary="Priority support" />
                  </ListItem>
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 4, pt: 0 }}>
                <Button 
                  fullWidth
                  variant={isSubscribed ? "contained" : "outlined"}
                  size="large"
                  onClick={() => alert('Subscription feature coming soon!')}
                  sx={{ 
                    borderRadius: 3,
                    fontWeight: 700,
                    py: 2,
                    background: isSubscribed ? '#4ECDC4' : 'transparent',
                    color: isSubscribed ? 'white' : '#4ECDC4',
                    borderColor: '#4ECDC4',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: isSubscribed ? '#26A69A' : 'rgba(78, 205, 196, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)',
                    }
                  }}
                >
                  {isSubscribed ? 'Current Plan' : 'Upgrade to Premium'}
                </Button>
              </CardActions>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Data Section */}
      <Fade in={true} timeout={1000}>
        <Paper 
          sx={{ 
            p: 4, 
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
            }
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main, 
              mb: 3,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <AnalyticsIcon sx={{ mr: 2 }} />
            Your Privacy Data {isSubscribed ? '(Full Access)' : '(Limited to 10 Items)'}
          </Typography>

          {error ? (
            <Alert 
              severity="error"
              sx={{
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(255, 107, 107, 0.15)',
                fontWeight: 600
              }}
            >
              {error}
            </Alert>
          ) : displayedData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <SecurityIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                No privacy data available
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                Start using the privacy extension to see your data here
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {userData.map((item, index) => (
                <Grid item xs={12} md={6} lg={4} key={item.id || index}>
                  <Zoom in={true} style={{ transitionDelay: `${(index % 6) * 100}ms` }}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 4px 16px rgba(45, 50, 130, 0.08)',
                        transition: 'all 0.3s ease',
                        border: '1px solid rgba(45, 50, 130, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        filter: !isSubscribed && index >= 10 ? 'blur(5px)' : 'none',
                        pointerEvents: !isSubscribed && index >= 10 ? 'none' : 'auto',
                        userSelect: !isSubscribed && index >= 10 ? 'none' : 'auto',
                        '&:hover': { 
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 32px rgba(45, 50, 130, 0.15)',
                          background: 'rgba(255, 255, 255, 0.95)'
                        },
                        '&::before': !isSubscribed && index >= 10 ? {
                          content: '"🔒"',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '3rem',
                          zIndex: 10,
                        } : {}
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SecurityIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 700, 
                              color: theme.palette.primary.main,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {item.url}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                          <strong>Captured:</strong> {new Date(item.captured_at).toLocaleString()}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.primary }}>
                          <strong>Page:</strong> {item.page_title || 'N/A'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Risk Level:
                          </Typography>
                          <Chip
                            label={`${getSensitivityLevel(item.overallSensitivity)} (${item.overallSensitivity}%)`}
                            sx={{
                              bgcolor: getSensitivityColor(item.overallSensitivity),
                              color: 'white',
                              fontWeight: 700,
                              borderRadius: 2,
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          )}

          {!isSubscribed && userData.length > 10 && (
            <Fade in={true} timeout={1500}>
              <Box 
                sx={{ 
                  mt: 4, 
                  p: 4, 
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 153, 153, 0.1))',
                  border: '2px dashed #FF6B6B',
                  textAlign: 'center'
                }}
              >
                <PriorityHighIcon sx={{ fontSize: 48, color: '#FF6B6B', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF6B6B', mb: 2 }}>
                  {userData.length - 10} More Items Available
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                  Upgrade to Premium to access all your privacy data and unlock advanced features
                </Typography>
                <Button 
                  variant="contained"
                  size="large"
                  onClick={() => alert('Subscription feature coming soon!')}
                  sx={{ 
                    borderRadius: 3,
                    fontWeight: 700,
                    px: 4,
                    py: 2,
                    background: '#FF6B6B',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: '#FF5252',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(255, 107, 107, 0.4)',
                    }
                  }}
                >
                  Upgrade Now
                </Button>
              </Box>
            </Fade>
          )}
        </Paper>
      </Fade>
    </Container>
  );
};

export default SubscriptionPage;
