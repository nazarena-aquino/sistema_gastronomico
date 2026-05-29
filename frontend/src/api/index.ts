import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (window.location.pathname.startsWith('/admin')) window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const productApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories/public'),
  getAllAdmin: () => api.get('/products/admin/all'),
  getCategoriesAdmin: () => api.get('/products/admin/categories'),
  getLowStock: () => api.get('/products/admin/low-stock'),
  getStockMovements: (params?: any) => api.get('/products/admin/stock-movements', { params }),
  create: (data: any) => api.post('/products/admin', data),
  update: (id: string, data: any) => api.put(`/products/admin/${id}`, data),
  delete: (id: string) => api.delete(`/products/admin/${id}`),
  toggle: (id: string) => api.patch(`/products/admin/${id}/toggle`),
  updateStock: (id: string, data: any) => api.patch(`/products/admin/${id}/stock`, data),
  uploadImage: (file: File) => {
    const fd = new FormData(); fd.append('image', file);
    return api.post('/products/admin/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  createCategory: (data: any) => api.post('/products/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/products/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/products/admin/categories/${id}`),
  getModifiers: (productId: string) => api.get(`/products/admin/${productId}/modifiers`),
  createModifierGroup: (productId: string, data: any) => api.post(`/products/admin/${productId}/modifiers`, data),
  deleteModifierGroup: (id: string) => api.delete(`/products/admin/modifiers/${id}`),
};

export const orderApi = {
  create: (data: any) => api.post('/orders', data),
  track: (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  getByTable: (tableId: string) => api.get(`/orders/table/${tableId}/active`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  updateItemStatus: (itemId: string, status: string) => api.patch(`/orders/items/${itemId}/status`, { status }),
  markPrinted: (id: string) => api.patch(`/orders/${id}/print`),
  getStats: () => api.get('/orders/dashboard/stats'),
  getSalesReport: (params?: any) => api.get('/orders/reports/sales', { params }),
};

export const tableApi = {
  getAll: () => api.get('/tables'),
  getById: (id: string) => api.get(`/tables/${id}`),
  create: (data: any) => api.post('/tables', data),
  update: (id: string, data: any) => api.put(`/tables/${id}`, data),
  updatePosition: (id: string, data: any) => api.patch(`/tables/${id}/position`, data),
  updateStatus: (id: string, data: any) => api.patch(`/tables/${id}/status`, data),
  delete: (id: string) => api.delete(`/tables/${id}`),
};

export const customerApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const discountApi = {
  getAll: () => api.get('/discounts'),
  getActive: () => api.get('/discounts/active'),
  create: (data: any) => api.post('/discounts', data),
  update: (id: string, data: any) => api.put(`/discounts/${id}`, data),
  delete: (id: string) => api.delete(`/discounts/${id}`),
};

export const paymentApi = {
  createPreference: (orderId: string) => api.post('/payments/create-preference', { order_id: orderId }),
  confirmPayment: (orderId: string) => api.patch(`/payments/confirm/${orderId}`),
  getMPKey: () => api.get('/payments/mp-public-key'),
};

export const configApi = {
  get: () => api.get('/config'),
  update: (data: any) => api.put('/config', data),
  toggleOpen: () => api.patch('/config/toggle-open'),
  getMenuQR: () => api.get('/config/qr/menu'),
  getTableQR: (tableNumber: string) => api.get(`/config/qr/table/${tableNumber}`),
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  verifyWaiterPin: (pin: string) => api.post('/auth/waiter-pin', { pin }),
};
