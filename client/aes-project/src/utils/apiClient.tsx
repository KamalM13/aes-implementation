import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Base API URL from environment
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies to be sent with requests
});

// Helper function to get the `access_token` from cookies
const getAccessTokenFromCookie = () => {
  const match = document.cookie.match(/(^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[2]) : null;
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const token = getAccessTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add token to headers
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response, // Pass through valid responses
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized access or expired session
      document.cookie = 'access_token=; Max-Age=0'; // Clear the token cookie
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error); // Pass through other errors
  }
);

export default api;
