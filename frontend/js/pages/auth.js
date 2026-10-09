/**
 * Authentication View Component (Customer & Admin Login / Register / Forgot Password)
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export function renderLoginPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="max-w-md mx-auto my-auto py-12 px-4 w-full text-left">
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to NexCart</h2>
          <p class="text-xs text-slate-500">Access your saved cart, orders, and addresses.</p>
        </div>

        <!-- Mode Tabs: Customer vs Admin vs Forgot Password -->
        <div class="flex p-1 bg-slate-100 rounded-xl" id="auth-tabs">
          <button id="tab-cust" class="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition-all">
            Customer
          </button>
          <button id="tab-admin" class="flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all">
            Administrator
          </button>
          <button id="tab-forgot" class="flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all">
            Recovery
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
              placeholder="e.g. yourname@example.com" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
            >
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              <button type="button" id="link-forgot-cust" class="text-xs text-brand-600 hover:text-brand-800 font-semibold">
                Forgot password?
              </button>
            </div>
            <div class="relative">
              <input 
                type="password" 
                id="cust-password" 
                required 
                placeholder="Enter your password" 
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
              >
              <button type="button" data-toggle-eye="cust-password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
            </div>
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
              required
              placeholder="Enter administrator username or email" 
              class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
            >
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin Password</label>
              <button type="button" id="link-forgot-admin" class="text-xs text-amber-600 hover:text-amber-800 font-semibold">
                Forgot password?
              </button>
            </div>
            <div class="relative">
              <input 
                type="password" 
                id="admin-password" 
                required
                placeholder="Enter admin password" 
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
              >
              <button type="button" data-toggle-eye="admin-password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-md hover:bg-amber-700 transition-all"
          >
            Sign In to Admin Portal
          </button>
        </form>

        <!-- Forgot / Reset Password Form (Hidden by default) -->
        <div id="forgot-password-container" class="space-y-4 hidden">
          <!-- Step 1: Request Reset Token -->
          <form id="request-token-form" class="space-y-3">
            <div class="p-3 bg-brand-50 border border-brand-200/60 rounded-xl text-xs text-brand-800">
              <p class="font-semibold">Password Recovery</p>
              <p class="text-slate-600 mt-0.5">Enter your registered email address to generate a 15-minute verification token.</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Account Email</label>
              <input 
                type="email" 
                id="forgot-email" 
                required 
                placeholder="registered.email@example.com" 
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
            </div>
            <button 
              type="submit" 
              id="btn-request-token"
              class="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-brand-600 transition-all"
            >
              Generate Verification Token
            </button>
          </form>

          <!-- Step 2: Set New Password with Token -->
          <form id="reset-password-form" class="space-y-3 pt-3 border-t border-slate-100 hidden">
            <div class="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs text-emerald-800">
              <p class="font-semibold">Verification Token Ready</p>
              <p class="text-slate-600 mt-0.5" id="token-status-text">Token generated! Paste or review token below to set your new password.</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Verification Token</label>
              <input 
                type="text" 
                id="reset-token-input" 
                required 
                placeholder="Paste verification token here" 
                class="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-200"
              >
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
              <div class="relative">
                <input 
                  type="password" 
                  id="reset-new-password" 
                  required 
                  minlength="6"
                  placeholder="At least 6 characters" 
                  class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-200"
                >
                <button type="button" data-toggle-eye="reset-new-password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
              <div class="relative">
                <input 
                  type="password" 
                  id="reset-confirm-password" 
                  required 
                  minlength="6"
                  placeholder="Re-enter new password" 
                  class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-200"
                >
                <button type="button" data-toggle-eye="reset-confirm-password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              class="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-all shadow-md"
            >
              Save New Password
            </button>
          </form>
        </div>

        <div class="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account? <a href="#/register" class="text-brand-600 font-bold hover:underline">Register New Customer</a>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  // Tab switching logic
  const tabCust = document.getElementById('tab-cust');
  const tabAdmin = document.getElementById('tab-admin');
  const tabForgot = document.getElementById('tab-forgot');
  const formCust = document.getElementById('customer-login-form');
  const formAdmin = document.getElementById('admin-login-form');
  const containerForgot = document.getElementById('forgot-password-container');

  const setTabActive = (activeBtn) => {
    [tabCust, tabAdmin, tabForgot].forEach(btn => {
      btn.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 transition-all';
    });
    activeBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm transition-all';
  };

  tabCust?.addEventListener('click', () => {
    setTabActive(tabCust);
    formCust.classList.remove('hidden');
    formAdmin.classList.add('hidden');
    containerForgot.classList.add('hidden');
  });

  tabAdmin?.addEventListener('click', () => {
    setTabActive(tabAdmin);
    formAdmin.classList.remove('hidden');
    formCust.classList.add('hidden');
    containerForgot.classList.add('hidden');
  });

  tabForgot?.addEventListener('click', () => {
    setTabActive(tabForgot);
    containerForgot.classList.remove('hidden');
    formCust.classList.add('hidden');
    formAdmin.classList.add('hidden');
  });

  document.getElementById('link-forgot-cust')?.addEventListener('click', () => tabForgot?.click());
  document.getElementById('link-forgot-admin')?.addEventListener('click', () => tabForgot?.click());

  // Password visibility eye toggles
  app.querySelectorAll('[data-toggle-eye]').forEach(btn => {
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
      toast.success(`Welcome ${res.user_info.full_name || res.user_info.username}!`);
      window.location.hash = '#/admin';
    } catch (err) {
      toast.error(err.message || 'Invalid administrator credentials.');
    }
  });

  // Forgot Password Step 1: Request Token
  const reqForm = document.getElementById('request-token-form');
  reqForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value?.trim();
    const btn = document.getElementById('btn-request-token');
    if (btn) btn.disabled = true;

    try {
      const res = await api.auth.forgotPasswordRequest({ email });
      toast.success('Verification token generated!');
      const resetForm = document.getElementById('reset-password-form');
      resetForm?.classList.remove('hidden');
      if (res.reset_token) {
        const tokenInput = document.getElementById('reset-token-input');
        if (tokenInput) tokenInput.value = res.reset_token;
      }
    } catch (err) {
      toast.error(err.message || 'Could not generate reset token.');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // Forgot Password Step 2: Complete Reset
  const resetForm = document.getElementById('reset-password-form');
  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value?.trim();
    const reset_token = document.getElementById('reset-token-input')?.value?.trim();
    const new_password = document.getElementById('reset-new-password')?.value;
    const confirm_password = document.getElementById('reset-confirm-password')?.value;

    if (new_password !== confirm_password) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      const res = await api.auth.resetPassword({ email, reset_token, new_password });
      toast.success(res.message || 'Password reset successfully! Please sign in.');
      tabCust?.click();
    } catch (err) {
      toast.error(err.message || 'Password reset failed.');
    }
  });
}

export function renderRegisterPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="max-w-md mx-auto my-auto py-12 px-4 w-full text-left">
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
            <div class="relative">
              <input 
                type="password" 
                id="reg-password" 
                required 
                minlength="6"
                placeholder="At least 6 characters" 
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
              <button type="button" data-toggle-eye="reg-password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md hover:bg-brand-700 transition-all"
          >
            Create My Account
          </button>
        </form>

        <div class="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account? <a href="#/login" class="text-brand-600 font-bold hover:underline">Sign In</a>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  // Eye toggle for register password
  app.querySelectorAll('[data-toggle-eye]').forEach(btn => {
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
