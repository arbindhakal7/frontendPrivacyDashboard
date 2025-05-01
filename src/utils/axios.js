import axios from 'axios';
import { getAuthToken } from './tokenStorage';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Import refreshToken dynamically to avoid circular dependency
      const { refreshToken } = await import('../services/auth');
      await refreshToken();
      
      // Retry the original request with new token
      const token = getAuthToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Import logout dynamically to avoid circular dependency
      const { logout } = await import('../services/auth');
      logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

// API Functions
export const fetchForms = async () => {
  try {
    const response = await api.get('/submit-form/');
    return response.data;
  } catch (error) {
    console.error('Error fetching forms:', error);
    if (error.response?.status === 401) {
      const { logout } = await import('../services/auth');
      logout();
      window.location.href = '/login';
    }
    return [];
  }
};

export const fetchFormById = async (id) => {
  try {
    const response = await api.get(`/submit-form/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching form ${id}:`, error);
    throw error;
  }
};

export const submitForm = async (formData) => {
  try {
    const response = await api.post('/submit-form/', formData);
    return response.data;
  } catch (error) {
    console.error('Error submitting form:', error);
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

export const processFormData = (forms) => {
  return forms.map(form => {
    const analysis = analyzeSensitivity(form.raw_form_data || {});
    return {
      ...form,
      ...analysis
    };
  });
};

export default api;
