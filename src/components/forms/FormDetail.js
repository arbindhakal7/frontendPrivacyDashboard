import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart, Pie, Cell,
  Legend
} from 'recharts';
import { fetchForms, analyzeSensitivity } from '../../utils/axios';

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const forms = await fetchForms();
        const form = forms.find(f => f.id === parseInt(id));
        
        if (!form) {
          setError('Form not found');
          setLoading(false);
          return;
        }

        const analysis = analyzeSensitivity(form.raw_form_data || {});
        setFormData({
          ...form,
          ...analysis
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load form details');
        setLoading(false);
      }
    };

    loadFormData();
  }, [id]);

  const getSensitivityColor = (level) => {
    if (level >= 80) return '#ff4444';
    if (level >= 50) return '#ffbb33';
    return '#00C851';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !formData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Form not found'}</Alert>
      </Container>
    );
  }

  // Prepare data for visualizations
  const sensitivityData = [
    { name: 'High Risk Fields', value: formData.sensitiveFields.filter(f => f.sensitivity >= 80).length, color: '#ff4444' },
    { name: 'Medium Risk Fields', value: formData.sensitiveFields.filter(f => f.sensitivity >= 50 && f.sensitivity < 80).length, color: '#ffbb33' },
    { name: 'Low Risk Fields', value: Object.keys(formData.raw_form_data).length - formData.sensitiveFields.length, color: '#00C851' }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/forms')}
        sx={{ mb: 3 }}
      >
        Back to Forms
      </Button>

      <Typography variant="h4" gutterBottom component="h1">
        Form Details
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  URL
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formData.url}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Page Title
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formData.page_title || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Captured At
                </Typography>
                <Typography variant="body1">
                  {new Date(formData.captured_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Risk Analysis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Risk Analysis
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={formData.fieldAnalysis}>
                <PolarGrid />
                <PolarAngleAxis dataKey="field" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Risk Level"
                  dataKey="sensitivity"
                  stroke="#ff4444"
                  fill="#ff4444"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Encryption"
                  dataKey="encryption"
                  stroke="#2196f3"
                  fill="#2196f3"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Retention"
                  dataKey="retention"
                  stroke="#4caf50"
                  fill="#4caf50"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Field Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Field Risk Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sensitivityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent, x, y }) => (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight="bold" style={{ textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-out"
                >
                  {sensitivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" height={36} wrapperStyle={{ marginTop: 12, fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sensitive Fields Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Field Analysis
            </Typography>
            <List>
              {formData.fieldAnalysis.map((field, index) => (
                <React.Fragment key={field.field}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{field.field}</Typography>
                          <Chip
                            label={`${field.sensitivity}% Risk`}
                            sx={{
                              bgcolor: getSensitivityColor(field.sensitivity),
                              color: 'white'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Encryption Level: {field.encryption}%
                          </Typography>
                          <Typography variant="body2">
                            Retention Score: {field.retention}%
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Value: {formData.raw_form_data[field.field]}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < formData.fieldAnalysis.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Raw Form Data */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Raw Form Data
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <pre style={{ 
                  overflow: 'auto', 
                  backgroundColor: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '4px',
                  margin: 0
                }}>
                  {JSON.stringify(formData.raw_form_data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FormDetail;
