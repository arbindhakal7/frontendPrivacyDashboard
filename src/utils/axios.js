import axios from 'axios';
import { getAuthToken } from './tokenStorage';

const api = axios.create({
  baseURL: 'https://7f3a-203-123-66-231.ngrok-free.app',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token and log requests
api.interceptors.request.use(
  (config) => {
    console.log('Starting Request:', config);
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to log responses and handle unauthorized access
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  async (error) => {
    console.error('Response Error:', error);
    
    // If unauthorized, redirect to login
    if (error.response?.status === 401) {
      const { logout } = await import('../services/auth');
      logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API Functions
export const fetchForms = async () => {
  try {
    console.log('Fetching forms...');
    const response = await api.get('/api/formdata/');
    console.log('Raw API Response:', response);
    console.log('Response Data Type:', typeof response.data);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Handle different response formats
    let data = response.data;

    // If data is a string, try to parse it
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse response data:', e);
        return [];
      }
    }

    // If data is an object with a data property (common in APIs)
    if (data?.data) {
      data = data.data;
    }

    // If data is an object with a results property (common in Django REST Framework)
    if (data?.results) {
      data = data.results;
    }

    // If data is not an array but is an object, try to convert it
    if (!Array.isArray(data) && typeof data === 'object') {
      data = Object.values(data);
    }

    // Final check to ensure we have an array
    if (!Array.isArray(data)) {
      console.error('Could not convert data to array:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching forms:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      stack: error.stack
    });
    return [];
  }
};

export const fetchFormById = async (id) => {
  try {
    const response = await api.get(`/api/formdata/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching form ${id}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const analyzeSensitivity = (formData) => {
  // Analyze form fields for sensitivity
  const sensitivePatterns = {
    email: /email|e-mail/i,
    phone: /phone|mobile|tel/i,
    address: /address|location|city|country|zip|postal/i,
    name: /name|fullname|firstname|lastname/i,
    password: /password|pwd|pass/i,
    ssn: /ssn|social|security/i,
    credit: /credit|card|cvv|ccv/i,
    dob: /birth|dob|birthday/i,
    financial: /account|bank|routing|swift|iban/i,
    health: /health|medical|diagnosis|prescription/i
  };

  const sensitivityLevels = {
    password: 100,
    ssn: 100,
    credit: 100,
    financial: 90,
    email: 80,
    phone: 80,
    health: 90,
    address: 70,
    dob: 70,
    name: 40
  };

  let maxSensitivity = 0;
  const sensitiveFields = [];

  Object.keys(formData).forEach(field => {
    const fieldLower = field.toLowerCase();
    
    Object.entries(sensitivePatterns).forEach(([type, pattern]) => {
      if (pattern.test(fieldLower)) {
        sensitiveFields.push({
          field,
          type,
          sensitivity: sensitivityLevels[type]
        });
        maxSensitivity = Math.max(maxSensitivity, sensitivityLevels[type]);
      }
    });
  });

  return {
    sensitiveFields,
    overallSensitivity: maxSensitivity,
    fieldAnalysis: sensitiveFields.map(field => ({
      field: field.field,
      sensitivity: field.sensitivity,
      encryption: field.sensitivity >= 70 ? 100 : 60,
      retention: Math.max(50, 100 - field.sensitivity)
    }))
  };
};

export const processFormData = (data) => {
  // Handle if data is already in the expected format
  if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('raw_form_data')) {
    return data.map(form => ({
      ...form,
      ...analyzeSensitivity(form.raw_form_data)
    }));
  }

  // If data is an array of form fields, process them
  if (Array.isArray(data)) {
    console.log('Processing form fields:', data);
    
    // Group fields by form ID
    const formGroups = data.reduce((acc, field) => {
      const formId = field.form || field.id || field.form_id;
      if (!formId) {
        console.warn('Field missing form ID:', field);
        return acc;
      }

      if (!acc[formId]) {
        acc[formId] = {
          id: formId,
          fields: [],
          url: '',
          page_title: '',
          captured_at: field.captured_at || new Date().toISOString(),
          raw_form_data: {}
        };
      }
      
      // Handle different field formats
      const fieldData = {
        field_name: field.field_name || field.name || '',
        field_value: field.field_value || field.value || '',
        field_type: field.field_type || field.type || 'text',
        is_critical: field.is_critical || false,
        is_very_critical: field.is_very_critical || false,
        is_non_critical: field.is_non_critical || false
      };

      acc[formId].fields.push(fieldData);

      // Update form metadata
      if (fieldData.field_name === 'url') {
        acc[formId].url = fieldData.field_value;
      }
      if (fieldData.field_name === 'page_title') {
        acc[formId].page_title = fieldData.field_value;
      }

      // Add to raw_form_data
      acc[formId].raw_form_data[fieldData.field_name] = fieldData.field_value;
      
      return acc;
    }, {});

    console.log('Processed form groups:', formGroups);

    // Convert to array and analyze sensitivity
    return Object.values(formGroups).map(form => {
      const analysis = analyzeSensitivity(form.raw_form_data);
      return {
        ...form,
        ...analysis,
        is_critical: form.fields.some(f => f.is_critical),
        is_very_critical: form.fields.some(f => f.is_very_critical),
        is_non_critical: form.fields.some(f => f.is_non_critical)
      };
    });
  }

  console.error('Unexpected data format:', data);
  return [];
};

export default api;
