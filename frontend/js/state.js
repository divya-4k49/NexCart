/**
 * NexCart Global State Store & Event Bus
 * Simple reactive store for managing user session, cart badges, and categories.
 */

import { api } from './api.js';

class StateStore {
  constructor() {
    this.user = null;          // Logged-in Customer or Admin
    this.userType = null;      // 'customer' | 'admin' | null
    this.token = localStorage.getItem('nexcart_token') || null;
    this.cart = {
      items: [],
      total_items: 0,
      subtotal: 0,
      shipping_fee: 0,
      grand_total: 0,
      free_shipping_threshold: 999.00
    };
    this.categories = [];
    this.listeners = new Set();
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all subscribers
  notify(event, payload) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, payload, this);
      } catch (err) {
        console.error('[NexCart State] Listener error:', err);
      }
    });
  }

  // Initialize state on app startup
  async init() {
    // 1. Restore User Session
    const savedUser = localStorage.getItem('nexcart_user');
    const savedType = localStorage.getItem('nexcart_user_type');
    if (this.token && savedUser) {
      try {
        this.user = JSON.parse(savedUser);
        this.userType = savedType;
      } catch {
        this.clearSession();
      }
    }

    // 2. Fetch Categories
    try {
      this.categories = await api.categories.list();
    } catch (err) {
      console.warn('[NexCart State] Could not preload categories:', err.message);
    }

    // 3. Sync Cart if Customer is authenticated
    if (this.isCustomer()) {
      await this.syncCart();
    }

    this.notify('INIT_COMPLETE');
  }

  // Set authenticated session
  setSession(token, user, userType = 'customer') {
    this.token = token;
    this.user = user;
    this.userType = userType;
    localStorage.setItem('nexcart_token', token);
    localStorage.setItem('nexcart_user', JSON.stringify(user));
    localStorage.setItem('nexcart_user_type', userType);
    this.notify('AUTH_CHANGED', { user, userType });

    if (userType === 'customer') {
      this.syncCart();
    }
  }

  // Clear session on logout
  clearSession() {
    this.token = null;
    this.user = null;
    this.userType = null;
    this.cart = {
      items: [],
      total_items: 0,
      subtotal: 0,
      shipping_fee: 0,
      grand_total: 0,
      free_shipping_threshold: 999.00
    };
    localStorage.removeItem('nexcart_token');
    localStorage.removeItem('nexcart_user');
    localStorage.removeItem('nexcart_user_type');
    this.notify('AUTH_CHANGED', { user: null, userType: null });
    this.notify('CART_UPDATED', this.cart);
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  isCustomer() {
    return this.isAuthenticated() && this.userType === 'customer';
  }

  isAdmin() {
    return this.isAuthenticated() && this.userType === 'admin';
  }

  // Fetch live cart summary from backend
  async syncCart() {
    if (!this.isCustomer()) return;
    try {
      const summary = await api.cart.get();
      this.cart = summary;
      this.notify('CART_UPDATED', this.cart);
    } catch (err) {
      // If unauthorized, token expired
      if (err.status === 401) {
        this.clearSession();
      }
    }
  }

  // Update cart state directly from API response
  setCart(cartSummary) {
    this.cart = cartSummary;
    this.notify('CART_UPDATED', this.cart);
  }
}

export const state = new StateStore();
