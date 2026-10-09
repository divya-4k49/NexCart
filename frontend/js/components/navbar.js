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
              <span class="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 ml-1.5 bg-brand-50 text-brand-700 rounded-md border border-brand-200">DBMS Pro</span>
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
}
