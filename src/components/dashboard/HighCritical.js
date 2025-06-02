import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  CircularProgress, 
  Alert,
  Grid,
  Chip,
  Fade,
  Zoom,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import { fetchForms, processFormData } from '../../utils/axios';
import { Link } from 'react-router-dom';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import TimelineIcon from '@mui/icons-material/Timeline';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <Zoom in={true}>
      <Card
        sx={{
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(255, 107, 107, 0.12)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #FF6B6B, #FF9999)',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(255, 107, 107, 0.18)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Icon sx={{ color: color, fontSize: 28, mr: 1 }} />
            <Typography variant="h6" sx={{ color: color, fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: color, mb: 1 }}>
            {value}
          </Typography>
          {trend && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {trend}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Zoom>
  );
};

const HighCritical = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highRiskForms, setHighRiskForms] = useState([]);
  const [stats, setStats] = useState({
    totalForms: 0,
    averageSensitivity: 0,
    maxSensitivity: 0,
    sensitiveFieldsCount: 0
  });

  useEffect(() => {
    const loadHighRiskForms = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawForms = await fetchForms();
        if (!Array.isArray(rawForms)) {
          setError('Invalid data format received from server.');
          return;
        }
        const forms = await processFormData(rawForms);
        const filtered = forms.filter(f => f.overallSensitivity >= 80);
        
        // Calculate statistics
        const totalSensitiveFields = filtered.reduce((acc, form) => 
          acc + form.sensitiveFields.length, 0);
        const maxSensitivity = Math.max(...filtered.map(f => f.overallSensitivity));
        const avgSensitivity = filtered.reduce((acc, form) => 
          acc + form.overallSensitivity, 0) / filtered.length;

        setStats({
          totalForms: filtered.length,
          averageSensitivity: Math.round(avgSensitivity),
          maxSensitivity: Math.round(maxSensitivity),
          sensitiveFieldsCount: totalSensitiveFields
        });
        
        setHighRiskForms(filtered);
      } catch (err) {
        setError(err.message || 'Failed to load high critical data.');
      } finally {
        setLoading(false);
      }
    };
    loadHighRiskForms();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={{ backgroundColor: '#f5f7fa' }}>
        <CircularProgress size={60} thickness={5} sx={{ color: '#FF6B6B' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(255, 107, 107, 0.15)',
            fontWeight: 600
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Typography 
        variant="h3" 
        sx={{ 
          fontWeight: 800,
          color: '#FF6B6B',
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
            backgroundColor: '#FF6B6B',
            transition: 'width 0.3s ease',
          },
          '&:hover::after': {
            width: 120,
          }
        }}
      >
        High Risk Forms
      </Typography>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Forms"
            value={stats.totalForms}
            icon={ErrorIcon}
            color="#FF6B6B"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Avg Risk Level"
            value={`${stats.averageSensitivity}%`}
            icon={TimelineIcon}
            color="#FF6B6B"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Max Risk Level"
            value={`${stats.maxSensitivity}%`}
            icon={WarningIcon}
            color="#FF6B6B"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Sensitive Fields"
            value={stats.sensitiveFieldsCount}
            icon={SecurityIcon}
            color="#FF6B6B"
          />
        </Grid>
      </Grid>

      {highRiskForms.length === 0 ? (
        <Fade in={true}>
          <Box 
            sx={{ 
              textAlign: 'center',
              py: 8,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 600, mb: 2 }}>
              No high risk forms found
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              All your forms are currently at lower risk levels
            </Typography>
            <Button
              component={Link}
              to="/forms"
              variant="outlined"
              sx={{
                borderColor: '#FF6B6B',
                color: '#FF6B6B',
                borderRadius: 3,
                px: 4,
                '&:hover': {
                  borderColor: '#FF5252',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                }
              }}
            >
              View All Forms
            </Button>
          </Box>
        </Fade>
      ) : (
        <Grid container spacing={3}>
          {highRiskForms.map((form, index) => (
            <Grid item xs={12} key={form._id || form.id}>
              <Fade in={true} timeout={500 + index * 100}>
                <Card
                  sx={{
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 4,
                      height: '100%',
                      background: 'linear-gradient(to bottom, #FF6B6B, #FF9999)',
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            mb: 2
                          }}
                        >
                          {form.url}
                        </Typography>
                        <Typography sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                          Captured at: {new Date(form.captured_at).toLocaleString()}
                        </Typography>
                        <Typography sx={{ mb: 2 }}>
                          Page Title: {form.page_title || 'N/A'}
                        </Typography>
                        {form.sensitiveFields.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 600, color: '#FF6B6B', mb: 1 }}>
                              Sensitive Fields:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {form.sensitiveFields.map((field, idx) => (
                                <Chip
                                  key={idx}
                                  label={field.field}
                                  sx={{
                                    bgcolor: 'rgba(255, 107, 107, 0.1)',
                                    color: '#FF6B6B',
                                    fontWeight: 600,
                                    borderRadius: 2
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          All Fields: {form.fields.map(f => f.field_name).join(', ')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Chip
                            label={`Risk Level: ${form.overallSensitivity}%`}
                            sx={{
                              bgcolor: '#FF6B6B',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '1rem',
                              py: 2,
                              borderRadius: 3,
                              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                              mb: 2
                            }}
                          />
                        </Box>
                        <Button
                          component={Link}
                          to={`/forms/${form._id}`}
                          variant="outlined"
                          sx={{
                            borderColor: '#FF6B6B',
                            color: '#FF6B6B',
                            borderRadius: 3,
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#FF5252',
                              backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default HighCritical;
