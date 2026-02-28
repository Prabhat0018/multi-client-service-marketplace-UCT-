import axios from 'axios';

// Base API configuration
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH APIs
// ============================================
export const authAPI = {
  // Customer
  userSignup: (data) => API.post('/auth/user/signup', data),
  userLogin: (data) => API.post('/auth/user/login', data),
  
  // Merchant
  merchantSignup: (data) => API.post('/auth/merchant/signup', data),
  merchantLogin: (data) => API.post('/auth/merchant/login', data),
};

// ============================================
// PUBLIC APIs (Customer Marketplace)
// ============================================
export const publicAPI = {
  // Categories
  getCategories: () => API.get('/categories'),
  getCategoryById: (id) => API.get(`/categories/${id}`),
  
  // Services
  getServices: (params) => API.get('/services', { params }),
  getServiceById: (id) => API.get(`/services/${id}`),
  
  // Merchants
  getMerchants: (params) => API.get('/merchants', { params }),
  getMerchantById: (id) => API.get(`/merchants/${id}`),
  
  // Search
  search: (query) => API.get(`/search?q=${query}`),
};

// ============================================
// CUSTOMER APIs (Protected)
// ============================================
export const customerAPI = {
  // Orders
  createOrder: (data) => API.post('/orders', data),
  getMyOrders: (status) => API.get('/orders', { params: { status } }),
  getOrderById: (id) => API.get(`/orders/${id}`),
  cancelOrder: (id) => API.put(`/orders/${id}/cancel`),
};

// ============================================
// MERCHANT APIs (Protected)
// ============================================
export const merchantAPI = {
  // Services
  createService: (data) => API.post('/merchant/services', data),
  getMyServices: () => API.get('/merchant/services'),
  getServiceById: (id) => API.get(`/merchant/services/${id}`),
  updateService: (id, data) => API.put(`/merchant/services/${id}`, data),
  deleteService: (id) => API.delete(`/merchant/services/${id}`),
  
  // Orders
  getOrders: (status) => API.get('/merchant/orders', { params: { status } }),
  updateOrderStatus: (id, status) => API.put(`/merchant/orders/${id}/status`, { status }),
  getOrderStats: () => API.get('/merchant/orders/stats'),
};

export default API;
