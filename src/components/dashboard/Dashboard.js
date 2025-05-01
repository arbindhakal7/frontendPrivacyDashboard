import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Box,
  Alert
} from '@mui/material';
import {
  PieChart, Pie, Cell,
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  Legend,
  LineChart, Line,
  CartesianGrid
} from 'recharts';
import { fetchForms, processFormData } from '../../utils/axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalForms: 0,
    recentForms: [],
    sensitivityDistribution: [],
    submissionTrends: [],
    formTypes: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const rawForms = await fetchForms();
        const forms = processFormData(rawForms);
        const processedData = analyzeFormsData(forms);
        setDashboardData(processedData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const analyzeFormsData = (forms) => {
    // Calculate sensitivity distribution
    const sensitivityLevels = {
      high: forms.filter(f => f.overallSensitivity >= 80).length,
      medium: forms.filter(f => f.overallSensitivity >= 50 && f.overallSensitivity < 80).length,
      low: forms.filter(f => f.overallSensitivity < 50).length
    };

    // Group forms by date for trend analysis
    const dateGroups = forms.reduce((acc, form) => {
      const date = new Date(form.captured_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Analyze form types based on URL patterns
    const typeGroups = forms.reduce((acc, form) => {
      const type = inferFormType(form.url, form.page_title);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalForms: forms.length,
      recentForms: forms.slice(-5).reverse(), // Get last 5 forms, most recent first
      sensitivityDistribution: [
        { name: 'High Risk', value: sensitivityLevels.high, color: '#ff4444' },
        { name: 'Medium Risk', value: sensitivityLevels.medium, color: '#ffbb33' },
        { name: 'Low Risk', value: sensitivityLevels.low, color: '#00C851' }
      ],
      submissionTrends: Object.entries(dateGroups)
        .map(([date, count]) => ({ date, submissions: count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
      formTypes: Object.entries(typeGroups)
        .map(([type, count]) => ({ name: type, submissions: count }))
    };
  };

  const inferFormType = (url, title) => {
    const text = `${url} ${title}`.toLowerCase();
    if (text.includes('contact')) return 'Contact';
    if (text.includes('register') || text.includes('signup')) return 'Registration';
    if (text.includes('feedback')) return 'Feedback';
    if (text.includes('survey')) return 'Survey';
    if (text.includes('newsletter')) return 'Newsletter';
    if (text.includes('login')) return 'Login';
    if (text.includes('payment')) return 'Payment';
    return 'Other';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Privacy Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Total Forms Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Forms Captured
            </Typography>
            <Typography component="p" variant="h4">
              {dashboardData.totalForms}
            </Typography>
          </Paper>
        </Grid>

        {/* Data Sensitivity Distribution */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Data Sensitivity Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.sensitivityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.sensitivityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Submission Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Form Submission Trends
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboardData.submissionTrends}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#8884d8" 
                  name="Submissions"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Form Types Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Form Types Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.formTypes}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" fill="#8884d8" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Forms */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Form Submissions
            </Typography>
            {dashboardData.recentForms.map((form) => (
              <Card key={form.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {form.url}
                  </Typography>
                  <Typography color="text.secondary">
                    Captured at: {new Date(form.captured_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Page Title: {form.page_title || 'N/A'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: form.overallSensitivity >= 80 ? '#ff4444' : 
                             form.overallSensitivity >= 50 ? '#ffbb33' : '#00C851',
                      mt: 1
                    }}
                  >
                    Risk Level: {form.overallSensitivity}% - {
                      form.overallSensitivity >= 80 ? 'High' :
                      form.overallSensitivity >= 50 ? 'Medium' : 'Low'
                    }
                  </Typography>
                  {form.sensitiveFields.length > 0 && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Sensitive Fields: {form.sensitiveFields.map(f => f.field).join(', ')}
                    </Typography>
                  )}
                  <Link to={`/forms/${form.id}`}>View Details</Link>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
