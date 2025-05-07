import axios from 'axios';
import { getAuthToken } from './tokenStorage';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    const response = await api.get('/forms');
    return response.data;
  } catch (error) {
    console.error('Error fetching forms:', error);
    throw error;
  }
};

export const fetchFormById = async (id) => {
  try {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching form ${id}:`, error);
    throw error;
  }
};

export const deleteForm = async (id) => {
  try {
    const response = await api.delete(`/forms/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting form ${id}:`, error);
    throw error;
  }
};

export const getPrivacySettings = async () => {
  try {
    const response = await api.get('/privacy');
    return response.data;
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    throw error;
  }
};

export const updatePrivacySettings = async (settings) => {
  try {
    const response = await api.put('/privacy', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/profile/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const analyzeSensitivity = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return {
      sensitiveFields: [],
      overallSensitivity: 0,
      fieldAnalysis: []
    };
  }

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
  if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('raw_form_data')) {
    return data.map(form => ({
      ...form,
      id: form._id,
      ...analyzeSensitivity(form.raw_form_data)
    }));
  }

  if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('fields')) {
    // Data is an array of form objects with fields array
    return data.map(form => {
      const rawFormData = form.fields.reduce((acc, field) => {
        acc[field.field_name || field.name || ''] = field.field_value || field.value || '';
        return acc;
      }, {});
      const analysis = analyzeSensitivity(rawFormData);
      return {
        ...form,
        raw_form_data: rawFormData,
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
