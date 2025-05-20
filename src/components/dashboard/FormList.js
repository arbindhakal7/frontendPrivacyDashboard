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
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchForms, processFormData, deleteForm } from '../../utils/axios';

const FormList = () => {
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
        console.log('Loaded forms:', processedForms);
        setForms(processedForms);
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
    if (sensitivity >= 80) return '#ff4444';
    if (sensitivity >= 50) return '#ffbb33';
    return '#00C851';
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
        Form Submissions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by URL or page title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Risk Level</InputLabel>
            <Select
              value={sensitivityFilter}
              label="Risk Level"
              onChange={(e) => setSensitivityFilter(e.target.value)}
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
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="sensitivity">Risk Level</MenuItem>
              <MenuItem value="url">URL</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>Page Title</TableCell>
              <TableCell>Captured At</TableCell>
              <TableCell>Risk Level</TableCell>
              <TableCell>Sensitive Fields</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredForms
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((form) => (
                <TableRow key={form.id}>
                  <TableCell>{form.url}</TableCell>
                  <TableCell>{form.page_title || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(form.captured_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${getSensitivityLevel(form.overallSensitivity)} (${form.overallSensitivity}%)`}
                      sx={{
                        bgcolor: getSensitivityColor(form.overallSensitivity),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {form.sensitiveFields.length > 0 ? (
                      <Typography variant="body2">
                        {form.sensitiveFields.map(f => f.field).join(', ')}
                      </Typography>
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                  <IconButton
                    color="error"
                    title="Delete Form"
                    onClick={() => handleDeleteClick(form)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {filteredForms.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No forms found
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
        />
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this form submission?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FormList;
