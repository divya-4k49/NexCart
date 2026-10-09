/**
 * Global Navigation Header Component
 */

import { state } from '../state.js';
import { toast } from './toast.js';

export function renderNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const isAuth = state.isAuthenticated();
  const isCust = state.isCustomer();
  const isAdmin = state.isAdmin();
  const cartCount = state.cart.total_items || 0;
  const categories = state.categories || [];

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">
        
        <!-- Left: Logo & Category Dropdown -->
        <div class="flex items-center gap-6">
          <a href="#/" class="flex items-center gap-2.5 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            </div>
            <div>
              <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">NexCart</span>
              <span class="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 ml-1.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">Store</span>
            </div>
          </a>

          <!-- Categories Dropdown (Desktop) -->
          <div class="relative hidden md:block group">
            <button class="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand-600 py-2 transition-colors">
              <span>Categories</span>
              <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform"></i>
            </button>
            <div class="absolute left-0 top-full pt-1 hidden group-hover:block z-50">
              <div class="w-64 glass-dropdown rounded-2xl border border-slate-200/80 p-2 shadow-xl animate-fade-in">
                ${categories.length > 0 ? categories.map(cat => `
                  <a href="#/shop?category_id=${cat.category_id}" class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition-colors">
                    <span>${cat.category_name}</span>
                    <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">${cat.product_count}</span>
                  </a>
                `).join('') : '<p class="text-xs text-slate-400 p-2">Loading categories...</p>'}
                <div class="border-t border-slate-100 my-1"></div>
                <a href="#/shop" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
                  <span>Browse All Products</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Search Input Bar -->
        <div class="flex-1 max-w-md hidden sm:block">
          <form id="global-search-form" class="relative">
            <input 
              type="text" 
              id="global-search-input"
              placeholder="Search laptops, smartphones, headphones..." 
              class="w-full bg-slate-100/90 text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-full border border-transparent focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
            >
            <div class="absolute left-3.5 top-2.5 text-slate-400 pointer-events-none">
              <i data-lucide="search" class="w-4 h-4"></i>
            </div>
          </form>
        </div>

        <!-- Right: Actions (Cart, User, Admin) -->
        <div class="flex items-center gap-3">
          
          <!-- Explore Shop Link -->
          <a href="#/shop" class="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <i data-lucide="compass" class="w-4 h-4"></i>
            <span>Catalog</span>
          </a>

          <!-- Track Order Link -->
          <a href="#/track" class="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <i data-lucide="truck" class="w-4 h-4"></i>
            <span>Track Order</span>
          </a>

          <!-- Cart Icon with Live Badge -->
          <a href="#/cart" class="relative p-2.5 rounded-full text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors" title="View Cart">
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
            ${cartCount > 0 ? `
              <span id="nav-cart-badge" class="absolute -top-1 -right-1 bg-brand-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-sm">
                ${cartCount}
              </span>
            ` : ''}
          </a>

          <!-- Auth & Account Actions -->
          ${isAuth ? `
            <!-- Authenticated User Menu -->
            <div class="relative group">
              <button class="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none">
                <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-amber-600' : 'bg-brand-600'} text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  ${isAdmin ? 'AD' : (state.user?.full_name?.charAt(0) || 'U')}
                </div>
                <div class="hidden md:block text-left pr-1">
                  <p class="text-xs font-semibold text-slate-800 leading-tight">${isAdmin ? (state.user?.username || 'Admin') : (state.user?.full_name?.split(' ')[0] || 'Customer')}</p>
                  <p class="text-[10px] text-slate-500 leading-tight capitalize">${isAdmin ? state.user?.role : 'Shopper'}</p>
                </div>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 hidden md:block"></i>
              </button>

              <!-- Account Dropdown Menu -->
              <div class="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
                <div class="w-56 glass-dropdown rounded-2xl border border-slate-200/80 p-2 shadow-xl">
                  <div class="px-3 py-2 border-b border-slate-100">
                    <p class="text-xs font-semibold text-slate-900">${isAdmin ? state.user?.full_name || state.user?.username : state.user?.full_name}</p>
                    <p class="text-[11px] text-slate-500 truncate">${state.user?.email}</p>
                  </div>

                  <div class="py-1">
                    ${isCust ? `
                      <a href="#/orders" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition-colors">
                        <i data-lucide="package" class="w-4 h-4 text-slate-400"></i>
                        <span>My Orders</span>
                      </a>
                      <a href="#/addresses" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition-colors">
                        <i data-lucide="map-pin" class="w-4 h-4 text-slate-400"></i>
                        <span>Address Book</span>
                      </a>
                    ` : ''}

                    ${isAdmin ? `
                      <a href="#/admin" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 text-amber-600"></i>
                        <span>Admin Portal</span>
                      </a>
                      <a href="#/admin/inventory" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                        <i data-lucide="boxes" class="w-4 h-4 text-slate-400"></i>
                        <span>Manage Inventory</span>
                      </a>
                    ` : ''}

                    <button id="btn-change-password" class="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition-colors">
                      <i data-lucide="key-round" class="w-4 h-4 text-slate-400"></i>
                      <span>Change Password</span>
                    </button>
                  </div>

                  <div class="border-t border-slate-100 pt-1">
                    <button id="btn-logout" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
                      <i data-lucide="log-out" class="w-4 h-4"></i>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- Guest Links -->
            <div class="flex items-center gap-2">
              <a href="#/login" class="text-sm font-semibold text-slate-700 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Sign In
              </a>
              <a href="#/register" class="text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 px-4 py-1.5 rounded-full shadow-sm hover:shadow transition-all">
                Register
              </a>
            </div>
          `}

        </div>
      </div>
    </div>
  `;

  // Attach Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  // Handle Search Submission
  const searchForm = document.getElementById('global-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('global-search-input');
      const term = input?.value?.trim();
      if (term) {
        window.location.hash = `#/shop?search=${encodeURIComponent(term)}`;
      }
    });
  }

  // Handle Logout Button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.clearSession();
      toast.info('You have signed out successfully.');
      window.location.hash = '#/';
    });
  }

  // Handle Change Password Button
  const changePwdBtn = document.getElementById('btn-change-password');
  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      openChangePasswordModal();
    });
  }
}

/**
 * Interactive Change Password Modal
 */
export function openChangePasswordModal() {
  const existingModal = document.getElementById('change-password-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'change-password-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 text-left relative">
      <button id="close-change-pwd" class="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <div class="space-y-1">
        <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
          <i data-lucide="key-round" class="w-5 h-5"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-900">Change Password</h3>
        <p class="text-xs text-slate-500">Update your security credentials. Your new password must be at least 6 characters.</p>
      </div>

      <form id="form-change-password" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Current Password</label>
          <div class="relative">
            <input 
              type="password" 
              id="pwd-current" 
              required 
              placeholder="••••••••••••"
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
            <button type="button" data-toggle-eye="pwd-current" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
          <div class="relative">
            <input 
              type="password" 
              id="pwd-new" 
              required 
              minlength="6"
              placeholder="At least 6 characters"
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
            <button type="button" data-toggle-eye="pwd-new" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
          <div class="relative">
            <input 
              type="password" 
              id="pwd-confirm" 
              required 
              minlength="6"
              placeholder="Re-enter new password"
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
            <button type="button" data-toggle-eye="pwd-confirm" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div class="pt-2 flex items-center justify-end gap-3">
          <button type="button" id="btn-cancel-change-pwd" class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" id="btn-submit-change-pwd" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-700">
            Update Password
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons({ root: modal });

  // Toggle eye icons
  modal.querySelectorAll('[data-toggle-eye]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-toggle-eye');
      const input = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4"></i>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<i data-lucide="eye" class="w-4 h-4"></i>';
      }
      if (window.lucide) window.lucide.createIcons({ root: btn });
    });
  });

  const closeModal = () => modal.remove();
  document.getElementById('close-change-pwd')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-change-pwd')?.addEventListener('click', closeModal);

  // Form submission
  const form = document.getElementById('form-change-password');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('pwd-current')?.value;
    const newPassword = document.getElementById('pwd-new')?.value;
    const confirmPassword = document.getElementById('pwd-confirm')?.value;

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-change-pwd');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const payload = { current_password: currentPassword, new_password: newPassword };
      if (state.isAdmin()) {
        await api.auth.changeAdminPassword(payload);
      } else {
        await api.auth.changeCustomerPassword(payload);
      }
      toast.success('Your password has been changed successfully!');
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
