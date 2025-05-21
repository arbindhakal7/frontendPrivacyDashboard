import React, { useEffect, useState } from 'react';
import { Container, Typography, Card, CardContent, Box, CircularProgress, Alert } from '@mui/material';
import { fetchForms, processFormData } from '../../utils/axios';
import { Link } from 'react-router-dom';

const LowCritical = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lowRiskForms, setLowRiskForms] = useState([]);

  useEffect(() => {
    const loadLowRiskForms = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawForms = await fetchForms();
        if (!Array.isArray(rawForms)) {
          setError('Invalid data format received from server.');
          return;
        }
        const forms = await processFormData(rawForms);
        const filtered = forms.filter(f => f.overallSensitivity < 50);
        setLowRiskForms(filtered);
      } catch (err) {
        setError(err.message || 'Failed to load low critical data.');
      } finally {
        setLoading(false);
      }
    };
    loadLowRiskForms();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom className="fadeInUp">
        Low Critical Data
      </Typography>
      {lowRiskForms.length === 0 ? (
        <Typography>No low critical data found.</Typography>
      ) : (
        lowRiskForms.map(form => (
          <Card
            key={form._id || form.id}
            sx={{
              mb: 3,
              boxShadow: 4,
              borderRadius: 3,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                boxShadow: 8,
                transform: 'translateY(-6px)',
              },
            }}
          >
            <CardContent sx={{ px: 3, py: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {form.url}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Captured at: {new Date(form.captured_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Page Title: {form.page_title || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 'bold', mt: 1 }}>
                Risk Level: {form.overallSensitivity}% - Low
              </Typography>
              {form.sensitiveFields.length > 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Sensitive Fields: {form.sensitiveFields.map(f => f.field).join(', ')}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mt: 1 }}>
                All Fields: {form.fields.map(f => f.field_name).join(', ')}
              </Typography>
              <Link to={`/forms/${form._id || form.id}`} style={{ fontWeight: '600', color: '#3f51b5', marginTop: '8px', display: 'inline-block', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.color = '#303f9f'} onMouseLeave={e => e.currentTarget.style.color = '#3f51b5'}>
                View Details
              </Link>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
};

export default LowCritical;
