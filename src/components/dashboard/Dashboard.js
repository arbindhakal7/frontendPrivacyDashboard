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
  Button,
  useTheme,
  IconButton,
  Chip,
  Fade,
  Zoom,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, CartesianGrid, BarChart, Bar, XAxis, YAxis, Area, AreaChart
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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

  // Analyze field types and sensitivity
  const fieldAnalysis = forms.reduce((acc, form) => {
    form.fields.forEach(field => {
      const isSensitive = form.sensitiveFields.some(sf => sf.field === field.field_name);
      const fieldType = field.field_type || 'unknown';
      
      if (!acc[fieldType]) {
        acc[fieldType] = { total: 0, sensitive: 0 };
      }
      acc[fieldType].total++;
      if (isSensitive) acc[fieldType].sensitive++;
    });
    return acc;
  }, {});

  const fieldTypeData = Object.entries(fieldAnalysis).map(([type, data]) => ({
    type,
    total: data.total,
    sensitive: data.sensitive,
    sensitivityRate: Math.round((data.sensitive / data.total) * 100)
  }));

  return {
    totalForms: forms.length,
    recentForms: forms.slice(-5).reverse(),
    sensitivityDistribution: [
      { name: 'High Risk', value: sensitivityLevels.high, color: '#FF6B6B' },
      { name: 'Medium Risk', value: sensitivityLevels.medium, color: '#FFB800' },
      { name: 'Low Risk', value: sensitivityLevels.low, color: '#4ECDC4' }
    ],
    submissionTrends: Object.entries(dateGroups)
      .map(([date, count]) => ({ date, submissions: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    formTypes: Object.entries(typeGroups)
      .map(([type, count]) => ({ name: type, submissions: count })),
    fieldTypes: fieldTypeData,
    allForms: forms
  };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        sx={{
          p: 2,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          border: 'none',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(45, 50, 130, 0.15)'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#2D3282', mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{ color: entry.color || '#666' }}
          >
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const theme = useTheme();
  
  return (
    <Zoom in={true}>
      <Paper
        sx={{
          p: 3,
          height: '100%',
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
          }
        }}
      >
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
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {trend}
            </Typography>
          </>
        )}
      </Paper>
    </Zoom>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalForms: 0,
    recentForms: [],
    sensitivityDistribution: [],
    submissionTrends: [],
    formTypes: [],
    fieldTypes: [],
    allForms: []
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [topThreeEntries, setTopThreeEntries] = useState([]);
  const [timeRange, setTimeRange] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
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
            { name: 'High Risk', value: 0, color: '#FF6B6B' },
            { name: 'Medium Risk', value: 0, color: '#FFB800' },
            { name: 'Low Risk', value: 0, color: '#4ECDC4' }
          ],
          submissionTrends: [],
          formTypes: [],
          fieldTypes: [],
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
          if (new Date(form.captured_at) > new Date(existing.captured_at)) {
            groupedFormsMap.set(url, form);
          }
        }
      });
      const groupedForms = Array.from(groupedFormsMap.values());

      // Filter forms based on time range
      const filteredForms = timeRange === 'all' ? groupedForms :
        groupedForms.filter(form => {
          const formDate = new Date(form.captured_at);
          const now = new Date();
          switch (timeRange) {
            case 'day':
              return formDate >= new Date(now.setDate(now.getDate() - 1));
            case 'week':
              return formDate >= new Date(now.setDate(now.getDate() - 7));
            case 'month':
              return formDate >= new Date(now.setMonth(now.getMonth() - 1));
            default:
              return true;
          }
        });

      const processedData = analyzeFormsData(filteredForms);
      setDashboardData(processedData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

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
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    handleMenuClose();
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 800,
            color: theme.palette.primary.main,
            letterSpacing: '0.02em',
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
          Privacy Dashboard
        </Typography>

        <Box>
          <Tooltip title="Filter by time range">
            <IconButton
              onClick={handleMenuClick}
              sx={{
                background: 'rgba(45, 50, 130, 0.1)',
                '&:hover': {
                  background: 'rgba(45, 50, 130, 0.2)',
                }
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(45, 50, 130, 0.15)',
              }
            }}
          >
            <MenuItem onClick={() => handleTimeRangeChange('all')}>All Time</MenuItem>
            <MenuItem onClick={() => handleTimeRangeChange('day')}>Last 24 Hours</MenuItem>
            <MenuItem onClick={() => handleTimeRangeChange('week')}>Last 7 Days</MenuItem>
            <MenuItem onClick={() => handleTimeRangeChange('month')}>Last 30 Days</MenuItem>
          </Menu>
        </Box>
      </Box>

      {dashboardData.totalForms === 0 ? (
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.2rem', fontWeight: 500 }}>
          No form submissions found.
        </Typography>
      ) : (
        <>

          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              <Fade in={true} timeout={800}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 1 }} />
                      Form Submission Trends
                    </Typography>
                    <Chip 
                      label={timeRange === 'all' ? 'All Time' : `Last ${timeRange === 'day' ? '24 Hours' : timeRange === 'week' ? '7 Days' : '30 Days'}`}
                      sx={{ 
                        backgroundColor: 'rgba(45, 50, 130, 0.1)',
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardData.submissionTrends}>
                      <defs>
                        <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D3282" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4150D9" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45, 50, 130, 0.1)" />
                      <XAxis dataKey="date" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="submissions"
                        stroke="#2D3282"
                        fillOpacity={1}
                        fill="url(#colorSubmissions)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Fade>
            </Grid>

            <Grid item xs={12} md={4}>
              <Fade in={true} timeout={1000}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    Risk Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={dashboardData.sensitivityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={130}
                        dataKey="value"
                        onClick={handlePieClick}
                        cursor="pointer"
                      >
                        {dashboardData.sensitivityDistribution.map((entry) => (
                          <Cell 
                            key={entry.name} 
                            fill={entry.color}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontWeight: 600 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Fade>
            </Grid>
          </Grid>

          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={1200}>
                <Paper 
                  sx={{ 
                    p: 4,
                    height: '500px',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1 }} />
                    Form Types Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dashboardData.formTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45, 50, 130, 0.1)" />
                      <XAxis dataKey="name" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="submissions" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={50}
                      >
                        {dashboardData.formTypes.map((entry, index) => {
                          const colors = [
                            '#2D3282', '#FF6B6B', '#4ECDC4', '#FFB800',
                            '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C'
                          ];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Fade>
            </Grid>

            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={1400}>
                <Paper 
                  sx={{ 
                    p: 4,
                    height: '500px',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                      <TimelineIcon sx={{ mr: 1 }} />
                      Sensitivity Trends
                    </Typography>
                    <Chip 
                      label={`Last ${timeRange === 'all' ? '30' : timeRange === 'day' ? '1' : timeRange === 'week' ? '7' : '30'} Days`}
                      sx={{ 
                        backgroundColor: 'rgba(45, 50, 130, 0.1)',
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={dashboardData.allForms.slice(-30).map(form => ({
                      date: new Date(form.captured_at).toLocaleDateString(),
                      highRisk: form.sensitiveFields.filter(f => f.sensitivity >= 80).length,
                      mediumRisk: form.sensitiveFields.filter(f => f.sensitivity >= 50 && f.sensitivity < 80).length,
                      lowRisk: form.sensitiveFields.filter(f => f.sensitivity < 50).length,
                    }))}>
                      <defs>
                        <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMediumRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFB800" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FFB800" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLowRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45, 50, 130, 0.1)" />
                      <XAxis dataKey="date" stroke="#64748B" />
                      <YAxis stroke="#64748B" />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="top"
                        height={36}
                        formatter={(value, entry) => (
                          <span style={{ 
                            color: entry.color, 
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}>
                            {value}
                          </span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="highRisk"
                        name="High Risk Fields"
                        stroke="#FF6B6B"
                        fillOpacity={1}
                        fill="url(#colorHighRisk)"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="mediumRisk"
                        name="Medium Risk Fields"
                        stroke="#FFB800"
                        fillOpacity={1}
                        fill="url(#colorMediumRisk)"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="lowRisk"
                        name="Low Risk Fields"
                        stroke="#4ECDC4"
                        fillOpacity={1}
                        fill="url(#colorLowRisk)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Fade>
            </Grid>
          </Grid>

          {selectedCategory && (
            <Fade in={true} timeout={1600}>
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 4,
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                        Top {selectedCategory} Forms
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => handleMoreClick(selectedCategory)}
                        sx={{
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.dark,
                            backgroundColor: 'rgba(45, 50, 130, 0.1)',
                          }
                        }}
                      >
                        View All
                      </Button>
                    </Box>
                    <Grid container spacing={3}>
                      {topThreeEntries.map((form, index) => (
                        <Grid item xs={12} md={4} key={form._id || index}>
                          <Card 
                            sx={{ 
                              borderRadius: 4,
                              background: 'rgba(255, 255, 255, 0.8)',
                              backdropFilter: 'blur(8px)',
                              boxShadow: '0 4px 16px rgba(45, 50, 130, 0.08)',
                              transition: 'all 0.3s ease',
                              border: '1px solid rgba(45, 50, 130, 0.1)',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 32px rgba(45, 50, 130, 0.15)',
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>
                                {form.url}
                              </Typography>
                              <Typography sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                                Captured at: {new Date(form.captured_at).toLocaleString()}
                              </Typography>
                              <Typography sx={{ mb: 2, color: theme.palette.text.primary }}>
                                Title: {form.page_title || 'N/A'}
                              </Typography>
                              <Typography 
                                sx={{ 
                                  color: form.overallSensitivity >= 80 ? '#FF6B6B'
                                    : form.overallSensitivity >= 50 ? '#FFB800'
                                    : '#4ECDC4',
                                  fontWeight: 600,
                                  mb: 2
                                }}
                              >
                                Risk Level: {form.overallSensitivity}%
                              </Typography>
                              <Link 
                                to={`/forms/${form._id}`} 
                                style={{ 
                                  color: theme.palette.primary.main,
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                View Details →
                              </Link>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Fade>
          )}
        </>
      )}
    </Container>
  );
};

export default Dashboard;
