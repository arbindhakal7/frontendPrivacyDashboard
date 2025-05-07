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
  CircularProgress
} from '@mui/material';
import { fetchForms } from '../../utils/axios';

const SubscriptionPage = () => {
  // Simulated subscription status: true means subscribed, false means free user
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1" color="primary">
        Subscription Page
      </Typography>

      <Paper sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd', borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subscription Plans
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#bbdefb' }}>
              <Typography variant="h5" color="secondary" gutterBottom>
                Free Plan
              </Typography>
              <Typography>
                Access to 10 data items.
              </Typography>
              <Chip label="Free" color="default" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#1976d2', color: 'white' }}>
              <Typography variant="h5" gutterBottom>
                Premium Plan
              </Typography>
              <Typography>
                Full access to all your data.
              </Typography>
              <Typography sx={{ mt: 1 }}>
                $10 per month or $70 per year
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ mt: 2 }}
                onClick={() => alert('Subscription feature coming soon!')}
              >
                Subscribe Now
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Your Data {isSubscribed ? '(All Items)' : '(Limited to 10 Items)'}
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : displayedData.length === 0 ? (
        <Typography>No data available.</Typography>
      ) : (
        <Grid container spacing={3}>
          {userData.map((item, index) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ bgcolor: isSubscribed ? '#e8f5e9' : '#fffde7' }}>
                <CardContent sx={{
                  filter: !isSubscribed && index >= 4 ? 'blur(5px)' : 'none',
                  pointerEvents: !isSubscribed && index >= 4 ? 'none' : 'auto',
                  userSelect: !isSubscribed && index >= 4 ? 'none' : 'auto',
                  transition: 'filter 0.3s ease'
                }}>
                  <Typography variant="subtitle1" gutterBottom>
                    URL: {item.url}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Captured at: {new Date(item.captured_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Page Title: {item.page_title || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Risk Level: {item.overallSensitivity}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => setIsSubscribed(!isSubscribed)}
        >
          {isSubscribed ? 'Switch to Free User View' : 'Switch to Subscribed User View'}
        </Button>
      </Box>
    </Container>
  );
};

export default SubscriptionPage;
