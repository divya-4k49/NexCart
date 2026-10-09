/**
 * NexCart API Service Layer
 * Centralized HTTP client managing communication with the FastAPI backend.
 */

// Determine Base API URL
const getApiBaseUrl = () => {
  if (window.location.origin.includes('localhost:8000') || window.location.origin.includes('127.0.0.1:8000')) {
    return '/api';
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE = getApiBaseUrl();

/**
 * Universal request wrapper handling authentication headers and error formatting
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach JWT Bearer Token if available in localStorage
  const token = localStorage.getItem('nexcart_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `HTTP ${response.status}: Request failed`;
      const err = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      // Network failure or backend server offline
      console.error(`[NexCart API] Network connection failed for ${endpoint}:`, error);
      const networkError = new Error('Cannot connect to NexCart API. Please ensure the backend server is running on port 8000.');
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

export const api = {
  // 1. Health & Database Diagnostics
  health: {
    check: () => request('/health'),
    dbTables: () => request('/health/db-tables'),
  },

  // 2. Authentication
  auth: {
    customerRegister: (payload) => request('/auth/customer/register', { method: 'POST', body: JSON.stringify(payload) }),
    customerLogin: (payload) => request('/auth/customer/login', { method: 'POST', body: JSON.stringify(payload) }),
    customerMe: () => request('/auth/customer/me'),
    adminLogin: (payload) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
    adminMe: () => request('/auth/admin/me'),
  },

  // 3. Categories
  categories: {
    list: () => request('/categories'),
    get: (idOrSlug) => request(`/categories/${idOrSlug}`),
  },

  // 4. Products & Catalog
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request(`/products${queryString}`);
    },
    featured: (limit = 8) => request(`/products/featured?limit=${limit}`),
    trending: (limit = 8) => request(`/products/trending?limit=${limit}`),
    get: (idOrSlug) => request(`/products/${idOrSlug}`),
  },

  // 5. Shopping Cart
  cart: {
    get: () => request('/cart'),
    add: (productId, quantity = 1) => request('/cart', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) }),
    update: (cartId, quantity) => request(`/cart/${cartId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    remove: (cartId) => request(`/cart/${cartId}`, { method: 'DELETE' }),
    clear: () => request('/cart', { method: 'DELETE' }),
  },

  // 6. Addresses
  addresses: {
    list: () => request('/addresses'),
    get: (id) => request(`/addresses/${id}`),
    create: (payload) => request('/addresses', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    setDefault: (id) => request(`/addresses/${id}/set-default`, { method: 'PUT' }),
    delete: (id) => request(`/addresses/${id}`, { method: 'DELETE' }),
  },

  // 7. Orders & Tracking
  orders: {
    checkout: (payload) => request('/orders/checkout', { method: 'POST', body: JSON.stringify(payload) }),
    list: () => request('/orders'),
    get: (orderId) => request(`/orders/${orderId}`),
    cancel: (orderId) => request(`/orders/${orderId}/cancel`, { method: 'PUT' }),
    trackingStepper: (orderId) => request(`/orders/${orderId}/tracking`),
    trackPublic: (trackingNumber) => request(`/orders/track/${encodeURIComponent(trackingNumber)}`),
  },

  // 8. Reviews
  reviews: {
    submit: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
    byProduct: (productId) => request(`/reviews/product/${productId}`),
    myReviews: () => request('/reviews/my-reviews'),
    delete: (reviewId) => request(`/reviews/${reviewId}`, { method: 'DELETE' }),
  },

  // 9. Admin Portal
  admin: {
    analytics: () => request('/admin/analytics'),
    inventory: (lowStockOnly = false) => request(`/admin/inventory?low_stock_only=${lowStockOnly}`),
    updateInventory: (productId, payload) => request(`/admin/inventory/${productId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    createProduct: (payload) => request('/admin/products', { method: 'POST', body: JSON.stringify(payload) }),
    updateProduct: (productId, payload) => request(`/admin/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deactivateProduct: (productId) => request(`/admin/products/${productId}`, { method: 'DELETE' }),
    createCategory: (payload) => request('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
    orders: (statusFilter = null) => {
      const q = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
      return request(`/admin/orders${q}`);
    },
    updateOrderStatus: (orderId, payload) => request(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  }
};
