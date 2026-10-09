/**
 * Executive Admin Dashboard & Inventory Management Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderAdminPage() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isAdmin()) {
    toast.warning('Admin privileges required. Please sign in with an administrator account.');
    window.location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <i data-lucide="shield" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Executive Portal &bull; Role: ${state.user?.role || 'Admin'}</span>
          </span>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Platform Analytics Dashboard</h1>
          <p class="text-sm text-slate-500">Real-time aggregate calculations from MySQL 8.0 InnoDB database.</p>
        </div>

        <div class="flex items-center gap-2">
          <a href="#/admin/inventory" class="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm">
            <i data-lucide="boxes" class="w-4 h-4"></i>
            <span>Inventory Restock</span>
          </a>
          <button id="admin-refresh-btn" class="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors" title="Refresh Analytics">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <div id="admin-dashboard-container" class="space-y-8">
        <div class="py-24 text-center text-slate-400">Computing analytics across MySQL tables...</div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  document.getElementById('admin-refresh-btn')?.addEventListener('click', () => {
    loadAdminDashboard();
  });

  await loadAdminDashboard();
}

async function loadAdminDashboard() {
  const container = document.getElementById('admin-dashboard-container');
  if (!container) return;

  try {
    const data = await api.admin.analytics();

    container.innerHTML = `
      <!-- KPI Metric Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-2">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Gross Revenue</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="dollar-sign" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold text-slate-900">&#8377;${Number(data.total_revenue).toLocaleString('en-IN')}</p>
          <p class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <i data-lucide="check" class="w-3 h-3"></i>
            <span>Settled transactions in <code class="font-mono">payment</code></span>
          </p>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-2">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Total Orders</span>
            <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold text-slate-900">${data.total_orders}</p>
          <p class="text-[11px] text-slate-500 font-medium">
            <span class="text-amber-600 font-bold">${data.pending_orders} active</span> &bull; 
            <span class="text-emerald-600 font-bold">${data.completed_orders} delivered</span>
          </p>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-2">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Registered Customers</span>
            <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <i data-lucide="users" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold text-slate-900">${data.total_customers}</p>
          <p class="text-[11px] text-slate-500 font-medium">${data.total_products} Active Products in Catalog</p>
        </div>

        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-2">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Low Stock Alerts</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold ${data.low_stock_products_count > 0 ? 'text-amber-600' : 'text-slate-900'}">${data.low_stock_products_count}</p>
          <p class="text-[11px] text-slate-500 font-medium">Stock &le; Reorder Threshold in <code class="font-mono">inventory</code></p>
        </div>

      </div>

      <!-- Category Sales Contribution Table -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4 text-left">
        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <i data-lucide="pie-chart" class="w-4 h-4 text-brand-600"></i>
          <span>Category Sales & Revenue Contribution</span>
        </h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th class="py-3 px-4 font-bold">Category</th>
                <th class="py-3 px-4 font-bold text-center">Catalog Products</th>
                <th class="py-3 px-4 font-bold text-center">Units Sold</th>
                <th class="py-3 px-4 font-bold text-right">Gross Revenue</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${data.category_sales.map(cat => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-slate-900">${cat.category_name}</td>
                  <td class="py-3.5 px-4 text-center text-slate-600">${cat.total_products}</td>
                  <td class="py-3.5 px-4 text-center font-semibold text-slate-800">${cat.total_units_sold}</td>
                  <td class="py-3.5 px-4 text-right font-bold text-slate-900">&#8377;${Number(cat.total_revenue).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Platform Orders Stream -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4 text-left">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="activity" class="w-4 h-4 text-brand-600"></i>
            <span>Recent Platform Orders Stream</span>
          </h3>
          <span class="text-xs text-slate-400">Latest 10 Invoices</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th class="py-3 px-4 font-bold">Order ID</th>
                <th class="py-3 px-4 font-bold">Customer</th>
                <th class="py-3 px-4 font-bold">Amount</th>
                <th class="py-3 px-4 font-bold">Status</th>
                <th class="py-3 px-4 font-bold">Tracking #</th>
                <th class="py-3 px-4 font-bold text-right">Advance Lifecycle</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${data.recent_orders.map(o => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-slate-900">#${o.order_id}</td>
                  <td class="py-3.5 px-4">
                    <p class="font-bold text-slate-800">${o.customer_name}</p>
                    <p class="text-[10px] text-slate-400">${o.customer_email}</p>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-slate-900">&#8377;${Number(o.total_amount).toLocaleString('en-IN')}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${o.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : o.order_status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                      ${o.order_status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-[11px] text-slate-600">${o.tracking_number || 'N/A'}</td>
                  <td class="py-3.5 px-4 text-right">
                    ${o.order_status !== 'Delivered' && o.order_status !== 'Cancelled' ? `
                      <select data-advance-order="${o.order_id}" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium focus:ring-1 focus:ring-brand-200">
                        <option value="">Update Status...</option>
                        <option value="Shipped">Mark as Shipped</option>
                        <option value="Delivered">Mark as Delivered</option>
                        <option value="Cancelled">Cancel & Restock</option>
                      </select>
                    ` : `
                      <span class="text-[11px] text-slate-400 italic">Settled</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Handle Order Lifecycle Progression
    container.querySelectorAll('[data-advance-order]').forEach(select => {
      select.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        const orderId = parseInt(select.getAttribute('data-advance-order'), 10);
        if (!newStatus) return;

        try {
          await api.admin.updateOrderStatus(orderId, { order_status: newStatus });
          toast.success(`Order #${orderId} progressed to ${newStatus}. Milestone timestamps synchronized.`);
          loadAdminDashboard();
        } catch (err) {
          toast.error(err.message || 'Failed to update order status.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load analytics: ${err.message}</div>`;
  }
}

export async function renderAdminInventoryPage() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isAdmin()) {
    window.location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-left">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <nav class="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <a href="#/admin" class="hover:text-brand-600 transition-colors">Admin Portal</a>
            <span>/</span>
            <span class="text-slate-800 font-semibold">Inventory Manager</span>
          </nav>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Warehouse Inventory & Stock Restock</h1>
          <p class="text-sm text-slate-500">1:1 Normalized Relational Entity: <code class="font-mono text-brand-700">inventory</code></p>
        </div>

        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer shadow-sm">
            <input type="checkbox" id="check-low-stock-only" class="rounded text-amber-600 focus:ring-amber-500">
            <span>Show Low Stock Only (&le; Threshold)</span>
          </label>
        </div>
      </div>

      <div id="admin-inventory-container" class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 overflow-x-auto">
        <div class="py-16 text-center text-slate-400 text-sm">Loading stock levels...</div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  const checkbox = document.getElementById('check-low-stock-only');
  checkbox?.addEventListener('change', () => {
    loadInventoryTable(checkbox.checked);
  });

  await loadInventoryTable(false);
}

async function loadInventoryTable(lowStockOnly = false) {
  const container = document.getElementById('admin-inventory-container');
  if (!container) return;

  try {
    const items = await api.admin.inventory(lowStockOnly);

    container.innerHTML = `
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
          <tr>
            <th class="py-3 px-4 font-bold">Product ID</th>
            <th class="py-3 px-4 font-bold">Product Name</th>
            <th class="py-3 px-4 font-bold">Category</th>
            <th class="py-3 px-4 font-bold text-center">Current Quantity</th>
            <th class="py-3 px-4 font-bold text-center">Reorder Threshold</th>
            <th class="py-3 px-4 font-bold text-center">Status</th>
            <th class="py-3 px-4 font-bold text-right">Quick Restock</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${items.map(item => `
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3.5 px-4 font-bold text-slate-900">#${item.product_id}</td>
              <td class="py-3.5 px-4 font-bold text-slate-900">${item.product_name}</td>
              <td class="py-3.5 px-4 text-slate-600">${item.category_name}</td>
              <td class="py-3.5 px-4 text-center font-extrabold text-sm ${item.is_low_stock ? 'text-amber-600' : 'text-slate-900'}">${item.quantity}</td>
              <td class="py-3.5 px-4 text-center text-slate-500 font-semibold">${item.low_stock_threshold}</td>
              <td class="py-3.5 px-4 text-center">
                ${item.quantity === 0 ? `
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Out of Stock</span>
                ` : item.is_low_stock ? `
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Low Stock Alert</span>
                ` : `
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Optimal Stock</span>
                `}
              </td>
              <td class="py-3.5 px-4 text-right">
                <button 
                  data-restock-id="${item.product_id}"
                  data-prod-name="${item.product_name}"
                  class="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white text-xs font-bold transition-colors"
                >
                  + Restock Units
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Handle Quick Restock Prompt
    container.querySelectorAll('[data-restock-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pId = parseInt(btn.getAttribute('data-restock-id'), 10);
        const name = btn.getAttribute('data-prod-name');
        const qtyStr = prompt(`Enter number of units to add to stock for "${name}":`, '10');
        if (!qtyStr) return;

        const addUnits = parseInt(qtyStr, 10);
        if (isNaN(addUnits) || addUnits <= 0) {
          toast.warning('Please enter a valid positive integer.');
          return;
        }

        try {
          await api.admin.updateInventory(pId, { add_stock: addUnits });
          toast.success(`Successfully added ${addUnits} units to ${name}.`);
          loadInventoryTable(document.getElementById('check-low-stock-only')?.checked || false);
        } catch (err) {
          toast.error(err.message || 'Restock failed.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load inventory: ${err.message}</div>`;
  }
}
