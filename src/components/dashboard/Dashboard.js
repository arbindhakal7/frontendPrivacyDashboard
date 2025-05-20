import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Box,
  Alert,
  Button
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, CartesianGrid, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { fetchForms, processFormData } from '../../utils/axios';

// Helper Functions
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

const analyzeFormsData = (forms) => {
  const sensitivityLevels = {
    high: forms.filter(f => f.overallSensitivity >= 80).length,
    medium: forms.filter(f => f.overallSensitivity >= 50 && f.overallSensitivity < 80).length,
    low: forms.filter(f => f.overallSensitivity < 50).length
  };

  const dateGroups = forms.reduce((acc, form) => {
    const date = new Date(form.captured_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const typeGroups = forms.reduce((acc, form) => {
    const type = inferFormType(form.url, form.page_title);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalForms: forms.length,
    recentForms: forms.slice(-5).reverse(),
    sensitivityDistribution: [
      { name: 'High Risk', value: sensitivityLevels.high, color: '#ff4444' },
      { name: 'Medium Risk', value: sensitivityLevels.medium, color: '#ffbb33' },
      { name: 'Low Risk', value: sensitivityLevels.low, color: '#00C851' }
    ],
    submissionTrends: Object.entries(dateGroups)
      .map(([date, count]) => ({ date, submissions: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    formTypes: Object.entries(typeGroups)
      .map(([type, count]) => ({ name: type, submissions: count })),
    allForms: forms
  };
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalForms: 0,
    recentForms: [],
    sensitivityDistribution: [],
    submissionTrends: [],
    formTypes: [],
    allForms: []
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [topThreeEntries, setTopThreeEntries] = useState([]);
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rawForms = await fetchForms();
      if (!Array.isArray(rawForms)) {
        setError('Invalid data format received from server.');
        return;
      }
      if (rawForms.length === 0) {
        setDashboardData({
          totalForms: 0,
          recentForms: [],
          sensitivityDistribution: [
            { name: 'High Risk', value: 0, color: '#ff4444' },
            { name: 'Medium Risk', value: 0, color: '#ffbb33' },
            { name: 'Low Risk', value: 0, color: '#00C851' }
          ],
          submissionTrends: [],
          formTypes: [],
          allForms: []
        });
        return;
      }
      const forms = await processFormData(rawForms);
      const processedData = analyzeFormsData(forms);
      setDashboardData(processedData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handlePieClick = (data) => {
    const category = data?.payload?.name;
    if (!category) return;

    setSelectedCategory(category);

    let filteredForms = [];
    if (category === 'High Risk') {
      filteredForms = dashboardData.allForms.filter(f => f.overallSensitivity >= 80);
    } else if (category === 'Medium Risk') {
      filteredForms = dashboardData.allForms.filter(f => f.overallSensitivity >= 50 && f.overallSensitivity < 80);
    } else if (category === 'Low Risk') {
      filteredForms = dashboardData.allForms.filter(f => f.overallSensitivity < 50);
    }

    setTopThreeEntries(filteredForms.slice(0, 3));
  };

  const handleMoreClick = (category) => {
    const routes = {
      'High Risk': '/high-critical-data',
      'Medium Risk': '/medium-critical',
      'Low Risk': '/low-critical-data',
    };
    if (routes[category]) {
      navigate(routes[category]);
    } else {
      alert('More details page not available for this category.');
    }
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
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Privacy Dashboard</Typography>

      {dashboardData.totalForms === 0 ? (
        <Typography>No form submissions found.</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: 140 }}>
                <Typography variant="h6" color="primary">Total Forms Captured</Typography>
                <Typography variant="h4">{dashboardData.totalForms}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" color="primary">Data Sensitivity Distribution</Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={dashboardData.sensitivityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      onClick={handlePieClick}
                      cursor="pointer"
                      activeIndex={null}
                      activeShape={null}
                    >
                      {dashboardData.sensitivityDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    {/* Disable Tooltip to prevent black box on hover/click */}
                    {/* <Tooltip /> */}
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                {selectedCategory && (
                  <Box mt={2}>
                    <Typography variant="h6">Top 3 {selectedCategory} Forms</Typography>
                    {topThreeEntries.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No forms available in this category.
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {topThreeEntries.map((form, idx) => (
                          <Grid item xs={12} md={4} key={form._id || idx}>
                            <Card>
                              <CardContent>
                                <Typography noWrap>{form.url}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Captured: {new Date(form.captured_at).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  Title: {form.page_title || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, color:
                                  form.overallSensitivity >= 80
                                    ? '#ff4444'
                                    : form.overallSensitivity >= 50
                                    ? '#ffbb33'
                                    : '#00C851'
                                }}>
                                  Risk Level: {form.overallSensitivity}% - {
                                    form.overallSensitivity >= 80 ? 'High'
                                    : form.overallSensitivity >= 50 ? 'Medium'
                                    : 'Low'
                                  }
                                </Typography>
                                <Link to={`/forms/${form._id || form.id}`}>View Details</Link>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                            <Button variant="outlined" onClick={() => handleMoreClick(selectedCategory)}>
                              More
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="h6" color="primary">Form Submission Trends</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.submissionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="submissions" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="h6" color="primary">Form Types Distribution</Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.formTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="submissions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" color="primary">Recent Form Submissions</Typography>
                {dashboardData.recentForms.map((form) => (
                  <Card key={form._id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">{form.url}</Typography>
                      <Typography color="text.secondary">
                        Captured at: {new Date(form.captured_at).toLocaleString()}
                      </Typography>
                      <Typography>Title: {form.page_title || 'N/A'}</Typography>
                      <Typography sx={{ color:
                        form.overallSensitivity >= 80 ? '#ff4444'
                        : form.overallSensitivity >= 50 ? '#ffbb33'
                        : '#00C851'
                      }}>
                        Risk Level: {form.overallSensitivity}% - {
                          form.overallSensitivity >= 80 ? 'High'
                          : form.overallSensitivity >= 50 ? 'Medium'
                          : 'Low'
                        }
                      </Typography>
                      {form.sensitiveFields.length > 0 && (
                        <Typography color="error">
                          Sensitive Fields: {form.sensitiveFields.map(f => f.field).join(', ')}
                        </Typography>
                      )}
                      <Typography>
                        All Fields: {form.fields.map(f => f.field_name).join(', ')}
                      </Typography>
                      <Link to={`/forms/${form._id}`}>View Details</Link>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
