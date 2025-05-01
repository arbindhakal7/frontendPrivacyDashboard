import api from '../utils/axios';
import { setAuthToken, setRefreshToken, getRefreshToken, clearTokens } from '../utils/tokenStorage';

export const login = async (username, password) => {
  try {
    const response = await api.post('/api/token/', {
      username,
      password
    });

    const { access, refresh } = response.data;
    setAuthToken(access);
    setRefreshToken(refresh);

    // Update axios default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Login failed' };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/api/register/', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Registration failed' };
  }
};

export const logout = () => {
  clearTokens();
  delete api.defaults.headers.common['Authorization'];
};

export const refreshToken = async () => {
  try {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error('No refresh token available');

    const response = await api.post('/api/token/refresh/', {
      refresh
    });

    const { access } = response.data;
    setAuthToken(access);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    return access;
  } catch (error) {
    logout();
    throw error;
  }
};

export { isAuthenticated } from '../utils/tokenStorage';
