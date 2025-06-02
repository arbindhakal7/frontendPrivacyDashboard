 import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Box,
  IconButton,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  Card,
  CardContent,
  Fade,
  Zoom
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { fetchForms, processFormData, deleteForm } from '../../utils/axios';

const FormList = () => {
  const theme = useTheme();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);

  useEffect(() => {
    let intervalId;

    const loadForms = async () => {
      try {
        const rawForms = await fetchForms();
        const processedForms = await processFormData(rawForms);

        // Group forms by URL, keep only the latest captured_at timestamp per site
        const groupedFormsMap = new Map();
        processedForms.forEach(form => {
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

        console.log('Loaded forms:', groupedForms);
        setForms(groupedForms);
        setLoading(false);
      } catch (error) {
        console.error('Error loading forms:', error);
        setError('Failed to load forms data');
        setLoading(false);
      }
    };

    loadForms();

    // Set up polling every 10 seconds
    intervalId = setInterval(() => {
      loadForms();
    }, 10000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  const getSensitivityLevel = (sensitivity) => {
    if (sensitivity >= 80) return 'High';
    if (sensitivity >= 50) return 'Medium';
    return 'Low';
  };

  const getSensitivityColor = (sensitivity) => {
    if (sensitivity >= 80) return '#FF6B6B';
    if (sensitivity >= 50) return '#FFB800';
    return '#4ECDC4';
  };

  const filteredForms = forms
    .filter(form => {
      const url = form.url || '';
      const pageTitle = form.page_title || '';
      const matchesSearch = 
        url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pageTitle.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSensitivity = 
        sensitivityFilter === 'all' ||
        (sensitivityFilter === 'high' && form.overallSensitivity >= 80) ||
        (sensitivityFilter === 'medium' && form.overallSensitivity >= 50 && form.overallSensitivity < 80) ||
        (sensitivityFilter === 'low' && form.overallSensitivity < 50);

      return matchesSearch && matchesSensitivity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sensitivity':
          return b.overallSensitivity - a.overallSensitivity;
        case 'url':
          return a.url.localeCompare(b.url);
        case 'date':
        default:
          return new Date(b.captured_at) - new Date(a.captured_at);
      }
    });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (form) => {
    setFormToDelete(form);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;
    try {
      await deleteForm(formToDelete._id);
      setForms((prevForms) => prevForms.filter(f => f._id !== formToDelete._id));
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    } catch (error) {
      console.error('Error deleting form:', error);
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFormToDelete(null);
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
        Form Submissions
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
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
                  right: 0,
                  height: 4,
                  background: 'linear-gradient(90deg, #2D3282, #4150D9)',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 1 }}>
                  Total Forms
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {forms.length}
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Link to="/high-critical" style={{ textDecoration: 'none' }}>
              <Card sx={{ 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(255, 107, 107, 0.12)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
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
                  <Typography variant="h6" sx={{ color: '#FF6B6B', fontWeight: 700, mb: 1 }}>
                    High Risk
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#FF6B6B' }}>
                    {forms.filter(f => f.overallSensitivity >= 80).length}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Card 
              sx={{ 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(255, 184, 0, 0.12)',
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
                  background: 'linear-gradient(90deg, #FFB800, #FFC947)',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 48px rgba(255, 184, 0, 0.18)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: '#FFB800', fontWeight: 700, mb: 1 }}>
                  Medium Risk
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFB800' }}>
                  {forms.filter(f => f.overallSensitivity >= 50 && f.overallSensitivity < 80).length}
                </Typography>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: '400ms' }}>
            <Link to="/low-critical" style={{ textDecoration: 'none' }}>
              <Card sx={{ 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(78, 205, 196, 0.12)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
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
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ color: '#4ECDC4', fontWeight: 700, mb: 1 }}>
                    Low Risk
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#4ECDC4' }}>
                    {forms.filter(f => f.overallSensitivity < 50).length}
                  </Typography>
                </CardContent>
              </Card>
            </Link>
          </Zoom>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Fade in={true} timeout={800}>
        <Paper 
          sx={{ 
            p: 4, 
            mb: 4,
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
          <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            Filters & Search
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by URL or page title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.9)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(45, 50, 130, 0.1)',
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 8px 32px rgba(45, 50, 130, 0.15)',
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Risk Level</InputLabel>
                <Select
                  value={sensitivityFilter}
                  label="Risk Level"
                  onChange={(e) => setSensitivityFilter(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.9)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(45, 50, 130, 0.1)',
                    }
                  }}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="high">High Risk</MenuItem>
                  <MenuItem value="medium">Medium Risk</MenuItem>
                  <MenuItem value="low">Low Risk</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.9)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(45, 50, 130, 0.1)',
                    }
                  }}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="sensitivity">Risk Level</MenuItem>
                  <MenuItem value="url">URL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Results Summary */}
      <Fade in={true} timeout={1000}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
            Showing {filteredForms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length} of {filteredForms.length} forms
          </Typography>
        </Box>
      </Fade>

      {/* Table */}
      <Fade in={true} timeout={1200}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(45, 50, 130, 0.12)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 48px rgba(45, 50, 130, 0.18)',
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(90deg, rgba(45, 50, 130, 0.05), rgba(65, 80, 217, 0.05))' }}>
                <TableCell sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '1rem', py: 3 }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '1rem', py: 3 }}>Page Title</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '1rem', py: 3 }}>Captured At</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '1rem', py: 3 }}>Risk Level</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '1rem', py: 3 }}>Sensitive Fields</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '1rem', py: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredForms
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((form, index) => (
                  <TableRow 
                    key={form.id}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(45, 50, 130, 0.04)',
                        transform: 'scale(1.01)',
                        boxShadow: '0 4px 16px rgba(45, 50, 130, 0.1)',
                      },
                      '&:nth-of-type(even)': {
                        background: 'rgba(45, 50, 130, 0.02)',
                      }
                    }}
                  >
                    <TableCell sx={{ py: 3, fontWeight: 600, color: theme.palette.text.primary }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          fontWeight: 600,
                          color: theme.palette.primary.main
                        }}
                      >
                        {form.url}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {form.page_title || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(form.captured_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Chip
                        label={`${getSensitivityLevel(form.overallSensitivity)} (${form.overallSensitivity}%)`}
                        sx={{
                          bgcolor: getSensitivityColor(form.overallSensitivity),
                          color: 'white',
                          fontWeight: 700,
                          borderRadius: 3,
                          boxShadow: `0 4px 12px ${getSensitivityColor(form.overallSensitivity)}40`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 24px ${getSensitivityColor(form.overallSensitivity)}60`,
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      {form.sensitiveFields.length > 0 ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FF6B6B', mb: 1 }}>
                            {form.sensitiveFields.length} sensitive field{form.sensitiveFields.length > 1 ? 's' : ''}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {form.sensitiveFields.map(f => f.field).join(', ')}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip 
                          label="None" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#4ECDC4', 
                            color: 'white', 
                            fontWeight: 600,
                            borderRadius: 2
                          }} 
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          component={Link}
                          to={`/forms/${form._id}`}
                          sx={{ 
                            color: theme.palette.primary.main,
                            background: 'rgba(45, 50, 130, 0.1)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(45, 50, 130, 0.2)',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(45, 50, 130, 0.3)',
                            }
                          }}
                          title="View Details"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          sx={{ 
                            color: '#FF6B6B',
                            background: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(255, 107, 107, 0.2)',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                            }
                          }}
                          title="Delete Form"
                          onClick={() => handleDeleteClick(form)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredForms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                      No forms found matching your criteria
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                      Try adjusting your search or filter settings
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredForms.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              background: 'rgba(45, 50, 130, 0.02)',
              borderTop: '1px solid rgba(45, 50, 130, 0.1)',
              '& .MuiTablePagination-toolbar': {
                fontWeight: 600,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontWeight: 600,
                color: theme.palette.primary.main,
              }
            }}
          />
        </TableContainer>
      </Fade>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(45, 50, 130, 0.15)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500 }}>
            Are you sure you want to delete this form submission? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
              borderRadius: 3,
              fontWeight: 600,
              px: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            sx={{ 
              bgcolor: '#FF6B6B',
              color: 'white',
              borderRadius: 3,
              fontWeight: 600,
              px: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: '#FF5252',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
              }
            }} 
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FormList;