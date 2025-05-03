import api from '../utils/axios';
import { setAuthToken, clearTokens } from '../utils/tokenStorage';

export const login = async (email, password) => {
  try {
    const response = await api.post('/api/login/', {
      email: email,
      password: password
    });

    const { token } = response.data;
    setAuthToken(token);

    // Update axios default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || { detail: 'Login failed' };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/api/register/', {
      username: userData.username,
      email: userData.email,
      password: userData.password
    });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw error.response.data;
    }
    throw { detail: 'Registration failed' };
  }
};

export const logout = () => {
  clearTokens();
  delete api.defaults.headers.common['Authorization'];
};

export { isAuthenticated } from '../utils/tokenStorage';
