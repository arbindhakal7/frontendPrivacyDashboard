import React, { useState, useEffect } from 'react';
import { getPrivacySettings, updatePrivacySettings } from '../../utils/axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Switch,
  FormGroup,
  FormControlLabel,
  Slider,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import NotificationsIcon from '@mui/icons-material/Notifications';

const PrivacySettings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState({
    // Data Collection Settings
    collectSensitiveData: true,
    autoDetectSensitiveFields: true,
    encryptAllData: true,
    
    // Retention Settings
    dataRetentionPeriod: 90, // days
    automaticDeletion: true,
    retentionStrategy: 'archive',
    
    // Privacy Level Settings
    privacyLevel: 'high',
    sensitivityThreshold: 70,
    
    // Notification Settings
    emailNotifications: true,
    sensitiveDataAlerts: true,
    breachNotifications: true,
    
    // Export Settings
    allowDataExport: true,
    exportFormat: 'json',
    
    // Analysis Settings
    enableAnalytics: true,
    shareAnalytics: false,
    
    // Compliance Settings
    gdprCompliance: true,
    ccpaCompliance: true,
    hipaaCompliance: false
  });

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: value !== undefined ? value : checked
    }));
  };

  const handleSliderChange = (name) => (event, newValue) => {
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await getPrivacySettings();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching privacy settings:', err);
        setError('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updatePrivacySettings(settings);
      setSuccess('Privacy settings updated successfully!');
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDataDeletion = async () => {
    if (window.confirm('Are you sure you want to delete all collected data? This action cannot be undone.')) {
      setLoading(true);
      try {
        // API call to delete data would go here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
        setSuccess('All data has been deleted successfully');
      } catch (err) {
        console.error('Error during data deletion:', err);
        setError('Failed to delete data');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Privacy Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Data Collection Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                Data Collection Settings
              </Typography>
            </Box>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.collectSensitiveData}
                    onChange={handleChange}
                    name="collectSensitiveData"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Collect Sensitive Data
                    <Tooltip title="Enable/disable collection of sensitive information">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoDetectSensitiveFields}
                    onChange={handleChange}
                    name="autoDetectSensitiveFields"
                  />
                }
                label="Auto-detect Sensitive Fields"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.encryptAllData}
                    onChange={handleChange}
                    name="encryptAllData"
                  />
                }
                label="Encrypt All Data"
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Privacy Level Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PrivacyTipIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                Privacy Level Settings
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Privacy Level</InputLabel>
              <Select
                value={settings.privacyLevel}
                label="Privacy Level"
                name="privacyLevel"
                onChange={handleChange}
              >
                <MenuItem value="low">Low - Basic Protection</MenuItem>
                <MenuItem value="medium">Medium - Enhanced Protection</MenuItem>
                <MenuItem value="high">High - Maximum Protection</MenuItem>
              </Select>
            </FormControl>

            <Typography gutterBottom>
              Sensitivity Threshold
            </Typography>
            <Slider
              value={settings.sensitivityThreshold}
              onChange={handleSliderChange('sensitivityThreshold')}
              valueLabelDisplay="auto"
              step={10}
              marks
              min={0}
              max={100}
            />
          </Paper>
        </Grid>

        {/* Data Retention Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <StorageIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                Data Retention Settings
              </Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Retention Strategy</InputLabel>
              <Select
                value={settings.retentionStrategy}
                label="Retention Strategy"
                name="retentionStrategy"
                onChange={handleChange}
              >
                <MenuItem value="delete">Permanent Deletion</MenuItem>
                <MenuItem value="archive">Archive</MenuItem>
                <MenuItem value="anonymize">Anonymize</MenuItem>
              </Select>
            </FormControl>

            <Typography gutterBottom>
              Data Retention Period (Days)
            </Typography>
            <Slider
              value={settings.dataRetentionPeriod}
              onChange={handleSliderChange('dataRetentionPeriod')}
              valueLabelDisplay="auto"
              step={30}
              marks
              min={30}
              max={365}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.automaticDeletion}
                  onChange={handleChange}
                  name="automaticDeletion"
                />
              }
              label="Enable Automatic Deletion"
            />
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NotificationsIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                Notification Settings
              </Typography>
            </Box>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    name="emailNotifications"
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sensitiveDataAlerts}
                    onChange={handleChange}
                    name="sensitiveDataAlerts"
                  />
                }
                label="Sensitive Data Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.breachNotifications}
                    onChange={handleChange}
                    name="breachNotifications"
                  />
                }
                label="Data Breach Notifications"
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Compliance Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Compliance Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.gdprCompliance}
                      onChange={handleChange}
                      name="gdprCompliance"
                    />
                  }
                  label="GDPR Compliance"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.ccpaCompliance}
                      onChange={handleChange}
                      name="ccpaCompliance"
                    />
                  }
                  label="CCPA Compliance"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.hipaaCompliance}
                      onChange={handleChange}
                      name="hipaaCompliance"
                    />
                  }
                  label="HIPAA Compliance"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDataDeletion}
              disabled={loading}
            >
              Delete All Data
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PrivacySettings;
