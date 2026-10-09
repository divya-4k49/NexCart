/**
 * Authentication View Component (Customer & Admin Login / Register)
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export function renderLoginPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="max-w-md mx-auto my-auto py-12 px-4 w-full">
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to NexCart</h2>
          <p class="text-xs text-slate-500">Access your saved cart, orders, and addresses.</p>
        </div>

        <!-- Mode Tabs: Customer vs Admin -->
        <div class="flex p-1 bg-slate-100 rounded-xl">
          <button id="tab-cust" class="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition-all">
            Customer Portal
          </button>
          <button id="tab-admin" class="flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all">
            Admin Portal
          </button>
        </div>

        <!-- Customer Login Form -->
        <form id="customer-login-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input 
              type="email" 
              id="cust-email" 
              required 
              placeholder="e.g. aarav.patel@gmail.com" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              <span class="text-[11px] text-slate-400">Default: Customer@123</span>
            </div>
            <input 
              type="password" 
              id="cust-password" 
              required 
              placeholder="••••••••••••" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md hover:bg-brand-700 transition-all"
          >
            Sign In as Customer
          </button>
        </form>

        <!-- Admin Login Form (Hidden by default) -->
        <form id="admin-login-form" class="space-y-4 hidden">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username or Admin Email</label>
            <input 
              type="text" 
              id="admin-user" 
              placeholder="e.g. superadmin or rahul.manager@nexusecom.com" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin Password</label>
              <span class="text-[11px] text-slate-400">Default: Admin@123</span>
            </div>
            <input 
              type="password" 
              id="admin-password" 
              placeholder="••••••••••••" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-md hover:bg-amber-700 transition-all"
          >
            Sign In to Admin Portal
          </button>
        </form>

        <!-- Demo Quick Fills -->
        <div class="pt-4 border-t border-slate-100 text-center space-y-2">
          <p class="text-[11px] text-slate-400">Quick-fill Demo Credentials:</p>
          <div class="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
            <button id="quick-aarav" class="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">
              Customer: Aarav Patel
            </button>
            <button id="quick-priya" class="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors">
              Customer: Priya Nair
            </button>
            <button id="quick-admin" class="px-2.5 py-1 rounded bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium transition-colors">
              Admin: superadmin
            </button>
          </div>
        </div>

        <div class="text-center text-xs text-slate-500 pt-2">
          Don't have an account? <a href="#/register" class="text-brand-600 font-bold hover:underline">Register New Customer</a>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  // Tab toggling
  const tabCust = document.getElementById('tab-cust');
  const tabAdmin = document.getElementById('tab-admin');
  const formCust = document.getElementById('customer-login-form');
  const formAdmin = document.getElementById('admin-login-form');

  tabCust?.addEventListener('click', () => {
    tabCust.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition-all';
    tabAdmin.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all';
    formCust.classList.remove('hidden');
    formAdmin.classList.add('hidden');
  });

  tabAdmin?.addEventListener('click', () => {
    tabAdmin.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition-all';
    tabCust.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all';
    formAdmin.classList.remove('hidden');
    formCust.classList.add('hidden');
  });

  // Quick fill handlers
  document.getElementById('quick-aarav')?.addEventListener('click', () => {
    tabCust.click();
    document.getElementById('cust-email').value = 'aarav.patel@gmail.com';
    document.getElementById('cust-password').value = 'Customer@123';
  });

  document.getElementById('quick-priya')?.addEventListener('click', () => {
    tabCust.click();
    document.getElementById('cust-email').value = 'priya.nair@yahoo.com';
    document.getElementById('cust-password').value = 'Customer@123';
  });

  document.getElementById('quick-admin')?.addEventListener('click', () => {
    tabAdmin.click();
    document.getElementById('admin-user').value = 'superadmin';
    document.getElementById('admin-password').value = 'Admin@123';
  });

  // Customer Login Submission
  formCust?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('cust-email')?.value?.trim();
    const password = document.getElementById('cust-password')?.value;

    try {
      const res = await api.auth.customerLogin({ email, password });
      state.setSession(res.access_token, res.user_info, 'customer');
      toast.success(`Welcome back, ${res.user_info.full_name}!`);
      window.location.hash = '#/';
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.');
    }
  });

  // Admin Login Submission
  formAdmin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username_or_email = document.getElementById('admin-user')?.value?.trim();
    const password = document.getElementById('admin-password')?.value;

    try {
      const res = await api.auth.adminLogin({ username_or_email, password });
      state.setSession(res.access_token, res.user_info, 'admin');
      toast.success(`Admin authenticated! Welcome ${res.user_info.full_name || res.user_info.username}.`);
      window.location.hash = '#/admin';
    } catch (err) {
      toast.error(err.message || 'Invalid administrator credentials.');
    }
  });
}

export function renderRegisterPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="max-w-md mx-auto my-auto py-12 px-4 w-full">
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <i data-lucide="user-plus" class="w-6 h-6"></i>
          </div>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
          <p class="text-xs text-slate-500">Join NexCart to maintain carts and place orders.</p>
        </div>

        <form id="register-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <input 
              type="text" 
              id="reg-name" 
              required 
              placeholder="e.g. Rahul Sharma" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input 
              type="email" 
              id="reg-email" 
              required 
              placeholder="rahul.sharma@example.com" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
            <input 
              type="text" 
              id="reg-phone" 
              placeholder="+91 9876543210" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" 
              id="reg-password" 
              required 
              placeholder="At least 6 characters" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md hover:bg-brand-700 transition-all"
          >
            Create My Account
          </button>
        </form>

        <div class="text-center text-xs text-slate-500 pt-2">
          Already have an account? <a href="#/login" class="text-brand-600 font-bold hover:underline">Sign In</a>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = document.getElementById('reg-name')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const phone = document.getElementById('reg-phone')?.value?.trim() || null;
    const password = document.getElementById('reg-password')?.value;

    try {
      const res = await api.auth.customerRegister({ full_name, email, phone, password });
      state.setSession(res.access_token, res.user_info, 'customer');
      toast.success(`Account created! Welcome to NexCart, ${res.user_info.full_name}.`);
      window.location.hash = '#/';
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    }
  });
}
