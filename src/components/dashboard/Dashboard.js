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
      { name: 'High Risk', value: sensitivityLevels.high, color: '#d32f2f' },
      { name: 'Medium Risk', value: sensitivityLevels.medium, color: '#fbc02d' },
      { name: 'Low Risk', value: sensitivityLevels.low, color: '#388e3c' }
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
            { name: 'High Risk', value: 0, color: '#d32f2f' },
            { name: 'Medium Risk', value: 0, color: '#fbc02d' },
            { name: 'Low Risk', value: 0, color: '#388e3c' }
          ],
          submissionTrends: [],
          formTypes: [],
          allForms: []
        });
        return;
      }
      const forms = await processFormData(rawForms);

      // Group forms by URL, keep only the latest captured_at timestamp per site
      const groupedFormsMap = new Map();
      forms.forEach(form => {
        const url = form.url;
        const existing = groupedFormsMap.get(url);
        if (!existing) {
          groupedFormsMap.set(url, form);
        } else {
          // Compare timestamps and keep the latest
          if (new Date(form.captured_at) > new Date(existing.captured_at)) {
            groupedFormsMap.set(url, form);
          }
        }
      });
      const groupedForms = Array.from(groupedFormsMap.values());

      const processedData = analyzeFormsData(groupedForms);
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
      'High Risk': '/high-critical',
      'Medium Risk': '/medium-critical',
      'Low Risk': '/low-critical',
    };
    if (routes[category]) {
      navigate(routes[category]);
    } else {
      alert('More details page not available for this category.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" sx={{ backgroundColor: '#f5f7fa' }}>
        <CircularProgress size={60} thickness={5} sx={{ color: '#4169e1' }} />
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
          sx={{ fontWeight: 600 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#4169e1', letterSpacing: '0.1em' }}>
        Privacy Dashboard
      </Typography>

      {dashboardData.totalForms === 0 ? (
        <Typography sx={{ color: '#757575', fontSize: '1.2rem' }}>No form submissions found.</Typography>
      ) : (
        <>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 4, height: 160, borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.2)', backgroundColor: '#e8ecfb' }}>
                <Typography variant="h6" sx={{ color: '#3556b8', fontWeight: 700, mb: 2 }}>
                  Total Forms Captured
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#2a3e8f' }}>
                  {dashboardData.totalForms}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.2)', backgroundColor: '#e8ecfb' }}>
                <Typography variant="h6" sx={{ color: '#3556b8', fontWeight: 700, mb: 3 }}>
                  Data Sensitivity Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={dashboardData.sensitivityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
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
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>

                {selectedCategory && (
                  <Box mt={4}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#3556b8', mb: 2 }}>
                      Top 3 {selectedCategory} Forms
                    </Typography>
                    {topThreeEntries.length === 0 ? (
                      <Typography variant="body1" sx={{ color: '#757575' }}>
                        No forms available in this category.
                      </Typography>
                    ) : (
                      <Grid container spacing={4}>
                        {topThreeEntries.map((form, idx) => (
                          <Grid item xs={12} md={4} key={form._id || idx}>
                            <Card sx={{ borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.15)', transition: 'box-shadow 0.3s ease', '&:hover': { boxShadow: '0 12px 36px rgba(65, 105, 225, 0.3)' } }}>
                              <CardContent>
                                <Typography noWrap sx={{ fontWeight: 700, color: '#2a3e8f' }}>
                                  {form.url}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#616161' }}>
                                  Captured: {new Date(form.captured_at).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" noWrap sx={{ mb: 2 }}>
                                  Title: {form.page_title || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ color:
                                  form.overallSensitivity >= 80
                                    ? '#d32f2f'
                                    : form.overallSensitivity >= 50
                                    ? '#fbc02d'
                                    : '#388e3c'
                                }}>
                                  Risk Level: {form.overallSensitivity}% - {
                                    form.overallSensitivity >= 80 ? 'High'
                                    : form.overallSensitivity >= 50 ? 'Medium'
                                    : 'Low'
                                  }
                                </Typography>
                                <Link to={`/forms/${form._id || form.id}`} style={{ color: '#4169e1', fontWeight: 700 }}>
                                  View Details
                                </Link>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                            <Button variant="outlined" sx={{ borderColor: '#4169e1', color: '#4169e1', fontWeight: 700 }} onClick={() => handleMoreClick(selectedCategory)}>
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

          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12}>
              <Paper sx={{ p: 4, height: 320, borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.2)', backgroundColor: '#e8ecfb' }}>
                <Typography variant="h6" sx={{ color: '#3556b8', fontWeight: 700, mb: 3 }}>
                  Form Submission Trends
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4169e1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4169e1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <LineChart data={dashboardData.submissionTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    <Line type="monotone" dataKey="submissions" stroke="#4169e1" strokeWidth={4} activeDot={{ r: 8 }} animationDuration={700} fill="url(#lineGradient)" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 4, height: 320, borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.2)', backgroundColor: '#e8ecfb' }}>
                <Typography variant="h6" sx={{ color: '#3556b8', fontWeight: 700, mb: 3 }}>
                  Form Types Distribution
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.formTypes} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="submissions" fill="#4169e1" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.15)', backgroundColor: '#e8ecfb' }}>
                <Typography variant="h6" sx={{ color: '#3556b8', fontWeight: 700, mb: 3 }}>
                  Recent Form Submissions
                </Typography>
                {dashboardData.recentForms.map((form) => (
                  <Card key={form._id} sx={{ mb: 3, borderRadius: 4, boxShadow: '0 8px 24px rgba(65, 105, 225, 0.15)', transition: 'box-shadow 0.3s ease', '&:hover': { boxShadow: '0 12px 36px rgba(65, 105, 225, 0.3)' } }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#2a3e8f', fontWeight: 700 }}>
                        {form.url}
                      </Typography>
                      <Typography sx={{ color: '#616161' }}>
                        Captured at: {new Date(form.captured_at).toLocaleString()}
                      </Typography>
                      <Typography sx={{ mb: 2 }}>
                        Title: {form.page_title || 'N/A'}
                      </Typography>
                      <Typography sx={{ color:
                        form.overallSensitivity >= 80 ? '#d32f2f'
                        : form.overallSensitivity >= 50 ? '#fbc02d'
                        : '#388e3c'
                      }}>
                        Risk Level: {form.overallSensitivity}% - {
                          form.overallSensitivity >= 80 ? 'High'
                          : form.overallSensitivity >= 50 ? 'Medium'
                          : 'Low'
                        }
                      </Typography>
                      {form.sensitiveFields.length > 0 && (
                        <Typography color="error" sx={{ mb: 2 }}>
                          Sensitive Fields: {form.sensitiveFields.map(f => f.field).join(', ')}
                        </Typography>
                      )}
                      <Typography>
                        All Fields: {form.fields.map(f => f.field_name).join(', ')}
                      </Typography>
                      <Link to={`/forms/${form._id}`} style={{ color: '#4169e1', fontWeight: 700 }}>
                        View Details
                      </Link>
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
