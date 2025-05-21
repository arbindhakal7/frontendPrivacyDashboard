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

// OpenAI API integration for sensitivity classification
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const callOpenAISensitivityAPI = async (fieldName) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not set. Falling back to heuristic classification.');
    return null;
  }

  const prompt = `Classify the sensitivity of the following data field name on a scale from 0 to 100, where 0 means not sensitive and 100 means highly sensitive. Return only the number.\nField name: "${fieldName}"`;

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
        temperature: 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const text = response.data.choices[0].message.content.trim();
    const sensitivity = parseInt(text, 10);
    if (isNaN(sensitivity)) {
      console.warn('OpenAI API returned invalid sensitivity:', text);
      return null;
    }
    return sensitivity;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
};

const mockTranslateToEnglish = async (text) => {
  // Mock translation function - replace with real API call if needed
  // For demo, just return the input text assuming it's English or close enough
  return text;
};

const heuristicClassifyField = async (fieldName) => {
  const lower = fieldName.toLowerCase();

  if (/(email|e-mail|mail)/i.test(lower)) return { type: 'email', sensitivity: 80 };
  if (/(phone|mobile|tel|tele)/i.test(lower)) return { type: 'phone', sensitivity: 80 };
  if (/(address|location|city|country|zip|postal)/i.test(lower)) return { type: 'address', sensitivity: 70 };
  if (/(name|fullname|firstname|lastname)/i.test(lower)) return { type: 'name', sensitivity: 40 };
  if (/(password|pwd|pass)/i.test(lower)) return { type: 'password', sensitivity: 100 };
  if (/(ssn|social|security)/i.test(lower)) return { type: 'ssn', sensitivity: 100 };
  if (/(credit|card|cvv|ccv|cc)/i.test(lower)) return { type: 'credit', sensitivity: 100 };
  if (/(birth|dob|birthday)/i.test(lower)) return { type: 'dob', sensitivity: 70 };
  if (/(account|bank|routing|swift|iban)/i.test(lower)) return { type: 'financial', sensitivity: 90 };
  if (/(health|medical|diagnosis|prescription)/i.test(lower)) return { type: 'health', sensitivity: 90 };

  // Default low sensitivity
  return { type: 'unknown', sensitivity: 10 };
};

export const analyzeSensitivity = async (formData) => {
  if (!formData || typeof formData !== 'object') {
    return {
      sensitiveFields: [],
      overallSensitivity: 0,
      fieldAnalysis: []
    };
  }

  let maxSensitivity = 0;
  const sensitiveFields = [];

  for (const field of Object.keys(formData)) {
    const translatedField = await mockTranslateToEnglish(field);

    // Call OpenAI API for sensitivity classification
    let sensitivity = await callOpenAISensitivityAPI(translatedField);

    // Fallback to heuristic if API fails or returns null
    if (sensitivity === null) {
      const classification = await heuristicClassifyField(translatedField);
      sensitivity = classification.sensitivity;
    }

    if (sensitivity > 10) { // Consider only sensitive fields
      sensitiveFields.push({
        field,
        type: 'unknown', // Could be improved by parsing AI response further
        sensitivity
      });
      maxSensitivity = Math.max(maxSensitivity, sensitivity);
    }
  }

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

export const processFormData = async (data) => {
  if (!Array.isArray(data)) {
    console.error('processFormData expected an array but received:', data);
    return [];
  }

  if (data.length > 0 && data[0].hasOwnProperty('raw_form_data')) {
    const results = [];
    for (const form of data) {
      const analysis = await analyzeSensitivity(form.raw_form_data);
      results.push({
        ...form,
        id: form._id,
        ...analysis
      });
    }
    return results;
  }

  if (data.length > 0 && data[0].hasOwnProperty('fields')) {
    // Data is an array of form objects with fields array
    const results = [];
    for (const form of data) {
      const rawFormData = form.fields.reduce((acc, field) => {
        acc[field.field_name || field.name || ''] = field.field_value || field.value || '';
        return acc;
      }, {});
      const analysis = await analyzeSensitivity(rawFormData);
      results.push({
        ...form,
        raw_form_data: rawFormData,
        ...analysis,
        is_critical: form.fields.some(f => f.is_critical),
        is_very_critical: form.fields.some(f => f.is_very_critical),
        is_non_critical: form.fields.some(f => f.is_non_critical)
      });
    }
    return results;
  }

  console.error('Unexpected data format:', data);
  return [];
};

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

export default api;
