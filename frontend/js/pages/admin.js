/**
 * NexCart Executive Admin Portal & Operations Hub
 * Comprehensive administration dashboard covering:
 * - Real-time MySQL 8.0 analytics & visual charts
 * - Product catalog lifecycle (Create, Edit, Toggle Archive, Safe Delete)
 * - Category management with orphaned product integrity protection
 * - Warehouse inventory stock levels & instant reordering
 * - Order lifecycle progression & milestone tracking
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

let currentAdminTab = 'analytics';
let cachedCategories = [];

export async function renderAdminPage(initialTab = 'analytics') {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isAdmin()) {
    toast.warning('Admin privileges required. Please sign in with an administrator account.');
    window.location.hash = '#/login';
    return;
  }

  currentAdminTab = initialTab;

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-left">
      <!-- Portal Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-amber-600"></i>
              <span>Executive Operations &bull; Role: ${state.user?.role || 'Super Admin'}</span>
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>MySQL 8.0 Live</span>
            </span>
          </div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">Executive Management Portal</h1>
          <p class="text-sm text-slate-500">Full-lifecycle catalog administration, inventory control, and transaction monitoring.</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="admin-refresh-btn" class="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-2 shadow-sm" title="Refresh Active Tab">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs Bar -->
      <div class="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-slate-200">
        <button data-tab="analytics" class="admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentAdminTab === 'analytics' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}">
          <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
          <span>Analytics & Metrics</span>
        </button>
        <button data-tab="products" class="admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentAdminTab === 'products' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}">
          <i data-lucide="package" class="w-4 h-4"></i>
          <span>Product Catalog</span>
        </button>
        <button data-tab="categories" class="admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentAdminTab === 'categories' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}">
          <i data-lucide="folder-tree" class="w-4 h-4"></i>
          <span>Category Manager</span>
        </button>
        <button data-tab="inventory" class="admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentAdminTab === 'inventory' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}">
          <i data-lucide="boxes" class="w-4 h-4"></i>
          <span>Warehouse Inventory</span>
        </button>
        <button data-tab="orders" class="admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentAdminTab === 'orders' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}">
          <i data-lucide="shopping-cart" class="w-4 h-4"></i>
          <span>Orders & Invoices</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="admin-tab-content" class="space-y-8">
        <div class="py-20 text-center text-slate-400">Loading operational workspace...</div>
      </div>

      <!-- Global Modal Container -->
      <div id="admin-modal-container"></div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  // Tab switching listener
  app.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchAdminTab(tab);
    });
  });

  // Refresh button listener
  document.getElementById('admin-refresh-btn')?.addEventListener('click', () => {
    loadActiveTab();
  });

  // Pre-fetch categories for product form dropdowns
  try {
    cachedCategories = await api.categories.list();
  } catch (err) {
    cachedCategories = [];
  }

  await loadActiveTab();
}

export async function renderAdminInventoryPage() {
  await renderAdminPage('inventory');
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabName;
    if (isTarget) {
      btn.className = 'admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all bg-brand-600 text-white shadow-sm';
    } else {
      btn.className = 'admin-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all bg-white text-slate-600 hover:bg-slate-50 border border-slate-200';
    }
  });
  loadActiveTab();
}

async function loadActiveTab() {
  if (currentAdminTab === 'analytics') {
    await loadAnalyticsTab();
  } else if (currentAdminTab === 'products') {
    await loadProductsTab();
  } else if (currentAdminTab === 'categories') {
    await loadCategoriesTab();
  } else if (currentAdminTab === 'inventory') {
    await loadInventoryTab();
  } else if (currentAdminTab === 'orders') {
    await loadOrdersTab();
  }
}

// ============================================================================
// 1. ANALYTICS & VISUAL METRICS TAB
// ============================================================================
async function loadAnalyticsTab() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="py-20 text-center text-slate-400">Computing analytics across MySQL InnoDB tables...</div>`;

  try {
    const data = await api.admin.analytics();

    // Compute chart values for Monthly Revenue
    const monthlyList = data.monthly_revenue || [];
    const maxRevenue = monthlyList.length > 0 
      ? Math.max(...monthlyList.map(m => Number(m.revenue) || 0), 1000)
      : 1000;

    // Inventory Health summary
    const inv = data.inventory_distribution || { in_stock: 0, low_stock: 0, out_of_stock: 0, total_units: 0 };

    container.innerHTML = `
      <!-- Top 4 KPI Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-2">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Gross Revenue</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="indian-rupee" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-3xl font-extrabold text-slate-900">&#8377;${Number(data.total_revenue).toLocaleString('en-IN')}</p>
          <p class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
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

      <!-- Visual Analytics Grid: Monthly Revenue Bar Chart & Order Status Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Monthly Revenue Responsive Bar Chart -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="trending-up" class="w-4 h-4 text-brand-600"></i>
                <span>Monthly Revenue Performance</span>
              </h3>
              <p class="text-xs text-slate-400">Aggregated from delivered and completed customer orders</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              InnoDB Aggregate
            </span>
          </div>

          ${monthlyList.length > 0 ? `
            <div class="space-y-4">
              <div class="h-56 flex items-end justify-around gap-4 pt-8 px-2 border-b border-slate-200">
                ${monthlyList.map(m => {
                  const revNum = Number(m.revenue) || 0;
                  const pct = Math.max(Math.round((revNum / maxRevenue) * 100), 8);
                  return `
                    <div class="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div class="text-[10px] font-bold text-slate-600 group-hover:text-brand-600 transition-colors opacity-90">
                        &#8377;${(revNum >= 1000 ? (revNum / 1000).toFixed(1) + 'k' : revNum)}
                      </div>
                      <div 
                        class="w-full max-w-[54px] rounded-t-xl bg-gradient-to-t from-brand-600 to-brand-400 group-hover:from-brand-700 group-hover:to-brand-500 transition-all shadow-sm relative cursor-pointer" 
                        style="height: ${pct}%;"
                        title="${m.month}: &#8377;${revNum.toLocaleString('en-IN')} (${m.order_count} orders)"
                      ></div>
                      <span class="text-[11px] font-semibold text-slate-500 pt-2 border-t border-transparent group-hover:text-slate-900">
                        ${m.month}
                      </span>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Total Calculated Months: ${monthlyList.length}</span>
                <span class="font-semibold text-slate-600">Peak Month: &#8377;${maxRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ` : `
            <div class="py-16 text-center text-slate-400 text-xs">No historical monthly order data recorded yet.</div>
          `}
        </div>

        <!-- Order Status Distribution -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
          <div class="border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="pie-chart" class="w-4 h-4 text-brand-600"></i>
              <span>Order Status Distribution</span>
            </h3>
            <p class="text-xs text-slate-400">Lifecycle status across all ${data.total_orders} platform orders</p>
          </div>

          <div class="space-y-4">
            ${(data.order_status_distribution || []).map(st => {
              const colorMap = {
                'Delivered': 'bg-emerald-500',
                'Shipped': 'bg-indigo-500',
                'Processing': 'bg-blue-500',
                'Confirmed': 'bg-brand-500',
                'Pending': 'bg-amber-500',
                'Cancelled': 'bg-rose-500',
              };
              const bgClass = colorMap[st.status] || 'bg-slate-400';
              return `
                <div class="space-y-1.5 text-xs">
                  <div class="flex items-center justify-between font-semibold">
                    <span class="text-slate-700 flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full ${bgClass}"></span>
                      <span>${st.status}</span>
                    </span>
                    <span class="text-slate-900 font-bold">${st.count} orders (${st.percentage}%)</span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div class="${bgClass} h-full rounded-full transition-all" style="width: ${st.percentage}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Inventory Health Snapshot -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 mt-4 text-xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Warehouse Stock Health</span>
            <div class="grid grid-cols-3 gap-2 text-center pt-1">
              <div class="p-2 rounded-xl bg-white border border-slate-200/60">
                <span class="text-lg font-extrabold text-emerald-600">${inv.in_stock}</span>
                <p class="text-[10px] text-slate-500 font-semibold mt-0.5">Optimal Stock</p>
              </div>
              <div class="p-2 rounded-xl bg-white border border-slate-200/60">
                <span class="text-lg font-extrabold text-amber-600">${inv.low_stock}</span>
                <p class="text-[10px] text-slate-500 font-semibold mt-0.5">Low Stock</p>
              </div>
              <div class="p-2 rounded-xl bg-white border border-slate-200/60">
                <span class="text-lg font-extrabold text-rose-600">${inv.out_of_stock}</span>
                <p class="text-[10px] text-slate-500 font-semibold mt-0.5">Out of Stock</p>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 text-center pt-1">Total Warehouse Units: <strong class="text-slate-700">${inv.total_units}</strong> units across 14 products</p>
          </div>
        </div>

      </div>

      <!-- Top-Selling Products & Category Revenue Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Top 5 Best-Selling Products -->
        <div class="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="award" class="w-4 h-4 text-brand-600"></i>
              <span>Top-Selling Products</span>
            </h3>
            <span class="text-xs text-slate-400 font-semibold">Ranked by Units Sold</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th class="py-2.5 px-3 font-bold">Rank & Product</th>
                  <th class="py-2.5 px-3 font-bold">Category</th>
                  <th class="py-2.5 px-3 font-bold text-center">Units Sold</th>
                  <th class="py-2.5 px-3 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${(data.top_selling_products || []).map((p, idx) => `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full ${idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'} text-[10px] font-bold flex items-center justify-center">
                          #${idx + 1}
                        </span>
                        <span class="font-bold text-slate-900 truncate max-w-[170px]">${p.product_name}</span>
                      </div>
                    </td>
                    <td class="py-3 px-3 text-slate-500">${p.category_name}</td>
                    <td class="py-3 px-3 text-center font-bold text-slate-800">${p.units_sold}</td>
                    <td class="py-3 px-3 text-right font-extrabold text-slate-900">&#8377;${Number(p.revenue).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Category Sales Contribution -->
        <div class="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="layers" class="w-4 h-4 text-brand-600"></i>
              <span>Category Revenue Contribution</span>
            </h3>
            <span class="text-xs text-slate-400 font-semibold">Catalog Breakdown</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th class="py-2.5 px-3 font-bold">Category</th>
                  <th class="py-2.5 px-3 font-bold text-center">Catalog Products</th>
                  <th class="py-2.5 px-3 font-bold text-center">Units Sold</th>
                  <th class="py-2.5 px-3 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${(data.category_sales || []).map(cat => `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-3 font-bold text-slate-900">${cat.category_name}</td>
                    <td class="py-3 px-3 text-center text-slate-600">${cat.total_products}</td>
                    <td class="py-3 px-3 text-center font-semibold text-slate-800">${cat.total_units_sold}</td>
                    <td class="py-3 px-3 text-right font-extrabold text-slate-900">&#8377;${Number(cat.total_revenue).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Recent Orders Stream with Status Progression -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4 text-left">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="activity" class="w-4 h-4 text-brand-600"></i>
            <span>Recent Platform Invoices Stream</span>
          </h3>
          <span class="text-xs text-slate-400">Latest 10 Transactions</span>
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
              ${(data.recent_orders || []).map(o => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-slate-900">#${o.order_id}</td>
                  <td class="py-3.5 px-4">
                    <p class="font-bold text-slate-800">${o.customer_name}</p>
                    <p class="text-[10px] text-slate-400">${o.customer_email}</p>
                  </td>
                  <td class="py-3.5 px-4 font-bold text-slate-900">&#8377;${Number(o.total_amount).toLocaleString('en-IN')}</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${o.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : o.order_status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : o.order_status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                      ${o.order_status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-[11px] text-slate-600">${o.tracking_number || 'Pending'}</td>
                  <td class="py-3.5 px-4 text-right">
                    ${o.order_status !== 'Delivered' && o.order_status !== 'Cancelled' ? `
                      <select data-advance-order="${o.order_id}" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium focus:ring-1 focus:ring-brand-200">
                        <option value="">Update Status...</option>
                        <option value="Confirmed">Mark Confirmed</option>
                        <option value="Shipped">Mark Shipped</option>
                        <option value="Delivered">Mark Delivered</option>
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

    // Handle quick status progression
    container.querySelectorAll('[data-advance-order]').forEach(select => {
      select.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        const orderId = parseInt(select.getAttribute('data-advance-order'), 10);
        if (!newStatus) return;

        try {
          await api.admin.updateOrderStatus(orderId, { order_status: newStatus });
          toast.success(`Order #${orderId} progressed to ${newStatus}. Milestones synchronized.`);
          loadAnalyticsTab();
        } catch (err) {
          toast.error(err.message || 'Failed to update order status.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load analytics: ${err.message}</div>`;
  }
}

// ============================================================================
// 2. PRODUCT CATALOG MANAGEMENT TAB
// ============================================================================
async function loadProductsTab(searchTerm = '', categoryFilter = null, statusFilter = null) {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="py-20 text-center text-slate-400">Loading catalog items...</div>`;

  try {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (categoryFilter) params.category_id = categoryFilter;
    if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
      params.is_active = statusFilter === 'true';
    }

    const products = await api.admin.products(params);

    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
        
        <!-- Controls Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Product Catalog Management</h2>
            <p class="text-xs text-slate-500">Manage catalog specifications, pricing, stock allocation, and lifecycle states.</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button id="btn-add-product" class="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <input 
              type="text" 
              id="product-search-input" 
              placeholder="Search by title..." 
              value="${searchTerm}"
              class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <select id="product-cat-filter" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-200">
              <option value="">All Categories</option>
              ${cachedCategories.map(c => `
                <option value="${c.category_id}" ${categoryFilter == c.category_id ? 'selected' : ''}>${c.category_name}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <select id="product-status-filter" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-200">
              <option value="">All Statuses</option>
              <option value="true" ${statusFilter === 'true' ? 'selected' : ''}>Active Only</option>
              <option value="false" ${statusFilter === 'false' ? 'selected' : ''}>Archived Only</option>
            </select>
          </div>
        </div>

        <!-- Catalog Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th class="py-3 px-3 font-bold">ID</th>
                <th class="py-3 px-3 font-bold">Product</th>
                <th class="py-3 px-3 font-bold">Category</th>
                <th class="py-3 px-3 font-bold text-right">Price</th>
                <th class="py-3 px-3 font-bold text-center">Stock</th>
                <th class="py-3 px-3 font-bold text-center">Status</th>
                <th class="py-3 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${products.map(p => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-3 font-mono font-bold text-slate-400">#${p.product_id}</td>
                  <td class="py-3.5 px-3">
                    <div class="flex items-center gap-3">
                      <img 
                        src="${p.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'}" 
                        alt="${p.product_name}" 
                        class="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                        onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100'"
                      />
                      <div class="max-w-[200px]">
                        <p class="font-bold text-slate-900 truncate">${p.product_name}</p>
                        <p class="text-[10px] text-slate-400 font-mono truncate">${p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-3 text-slate-600 font-semibold">${p.category_name}</td>
                  <td class="py-3.5 px-3 text-right font-extrabold text-slate-900">&#8377;${Number(p.price).toLocaleString('en-IN')}</td>
                  <td class="py-3.5 px-3 text-center">
                    <span class="font-bold ${p.stock_quantity <= p.low_stock_threshold ? 'text-amber-600' : 'text-slate-800'}">
                      ${p.stock_quantity}
                    </span>
                    <span class="text-[10px] text-slate-400 block font-normal">min ${p.low_stock_threshold}</span>
                  </td>
                  <td class="py-3.5 px-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}">
                      ${p.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td class="py-3.5 px-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button 
                        data-edit-product='${JSON.stringify(p).replace(/'/g, "&apos;")}' 
                        class="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                        title="Edit Product"
                      >
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                      </button>
                      <button 
                        data-toggle-product="${p.product_id}" 
                        class="p-1.5 rounded-lg ${p.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} transition-colors" 
                        title="${p.is_active ? 'Archive Product' : 'Activate Product'}"
                      >
                        <i data-lucide="${p.is_active ? 'archive' : 'check'}" class="w-4 h-4"></i>
                      </button>
                      <button 
                        data-delete-product="${p.product_id}" 
                        data-delete-name="${p.product_name}" 
                        class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors" 
                        title="Delete Product"
                      >
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="text-xs text-slate-400 text-right pt-2">
          Total Products in View: <strong class="text-slate-700">${products.length}</strong>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Filter event listeners
    const searchInput = document.getElementById('product-search-input');
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        loadProductsTab(searchInput.value, document.getElementById('product-cat-filter')?.value, document.getElementById('product-status-filter')?.value);
      }
    });

    document.getElementById('product-cat-filter')?.addEventListener('change', (e) => {
      loadProductsTab(searchInput?.value || '', e.target.value, document.getElementById('product-status-filter')?.value);
    });

    document.getElementById('product-status-filter')?.addEventListener('change', (e) => {
      loadProductsTab(searchInput?.value || '', document.getElementById('product-cat-filter')?.value, e.target.value);
    });

    // Add Product Modal trigger
    document.getElementById('btn-add-product')?.addEventListener('click', () => {
      openProductModal();
    });

    // Edit Product listeners
    container.querySelectorAll('[data-edit-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const product = JSON.parse(btn.getAttribute('data-edit-product'));
          openProductModal(product);
        } catch (e) {
          toast.error('Could not parse product data for edit.');
        }
      });
    });

    // Toggle Product Status listeners
    container.querySelectorAll('[data-toggle-product]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-toggle-product'), 10);
        try {
          const res = await api.admin.toggleProductStatus(id);
          toast.success(res.message);
          loadProductsTab(searchInput?.value || '', document.getElementById('product-cat-filter')?.value, document.getElementById('product-status-filter')?.value);
        } catch (err) {
          toast.error(err.message || 'Toggle failed.');
        }
      });
    });

    // Delete Product listeners
    container.querySelectorAll('[data-delete-product]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-delete-product'), 10);
        const name = btn.getAttribute('data-delete-name');
        if (!confirm(`Are you sure you want to remove product #${id} ("${name}")?\nIf the product is referenced in historical orders, it will be safely archived instead of deleting records.`)) {
          return;
        }

        try {
          const res = await api.admin.deleteProduct(id);
          toast.success(res.message);
          loadProductsTab(searchInput?.value || '', document.getElementById('product-cat-filter')?.value, document.getElementById('product-status-filter')?.value);
        } catch (err) {
          toast.error(err.message || 'Deletion failed.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load products: ${err.message}</div>`;
  }
}

// Product Create / Edit Modal
function openProductModal(product = null) {
  const modalContainer = document.getElementById('admin-modal-container');
  if (!modalContainer) return;

  const isEditing = !!product;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="${isEditing ? 'edit-3' : 'plus-circle'}" class="w-4 h-4 text-brand-600"></i>
            <span>${isEditing ? `Edit Product #${product.product_id}` : 'Create New Catalog Product'}</span>
          </h3>
          <button id="modal-close-btn" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="product-modal-form" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Product Title *</label>
            <input type="text" id="m-prod-name" required value="${product?.product_name || ''}" placeholder="e.g. Sony WH-1000XM5 Wireless Headphones" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Category *</label>
              <select id="m-prod-cat" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
                ${cachedCategories.map(c => `
                  <option value="${c.category_id}" ${product?.category_id === c.category_id ? 'selected' : ''}>${c.category_name}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Price (&#8377; INR) *</label>
              <input type="number" step="0.01" min="1" id="m-prod-price" required value="${product?.price || ''}" placeholder="29990.00" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
            </div>
          </div>

          ${!isEditing ? `
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Initial Stock *</label>
                <input type="number" min="0" id="m-prod-qty" required value="15" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Low-Stock Alert Level</label>
                <input type="number" min="1" id="m-prod-threshold" value="5" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
              </div>
            </div>
          ` : ''}

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Product Description</label>
            <textarea id="m-prod-desc" rows="3" placeholder="Detailed technical specifications..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">${product?.description || ''}</textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Image URL</label>
            <input type="url" id="m-prod-img" value="${product?.image_url || ''}" placeholder="https://images.unsplash.com/photo-..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" id="modal-cancel-btn" class="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Cancel</button>
            <button type="submit" id="modal-submit-btn" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm">
              ${isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: modalContainer });

  const closeModal = () => { modalContainer.innerHTML = ''; };
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);

  document.getElementById('product-modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('modal-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    const name = document.getElementById('m-prod-name')?.value?.trim();
    const catId = parseInt(document.getElementById('m-prod-cat')?.value, 10);
    const price = parseFloat(document.getElementById('m-prod-price')?.value);
    const desc = document.getElementById('m-prod-desc')?.value?.trim();
    const img = document.getElementById('m-prod-img')?.value?.trim();

    try {
      if (isEditing) {
        await api.admin.updateProduct(product.product_id, {
          product_name: name,
          category_id: catId,
          price: price,
          description: desc,
          image_url: img
        });
        toast.success(`Product #${product.product_id} updated.`);
      } else {
        const qty = parseInt(document.getElementById('m-prod-qty')?.value, 10) || 15;
        const thresh = parseInt(document.getElementById('m-prod-threshold')?.value, 10) || 5;
        await api.admin.createProduct({
          category_id: catId,
          product_name: name,
          price: price,
          description: desc,
          image_url: img,
          initial_quantity: qty,
          low_stock_threshold: thresh,
          is_active: true
        });
        toast.success(`Product "${name}" created with 1:1 inventory record.`);
      }
      closeModal();
      loadProductsTab();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
      submitBtn.disabled = false;
      submitBtn.innerText = isEditing ? 'Save Changes' : 'Create Product';
    }
  });
}

// ============================================================================
// 3. CATEGORY MANAGEMENT TAB
// ============================================================================
async function loadCategoriesTab() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="py-20 text-center text-slate-400">Loading catalog categories...</div>`;

  try {
    const categories = await api.admin.categories();
    cachedCategories = categories;

    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
        
        <!-- Controls Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Category Hierarchy Manager</h2>
            <p class="text-xs text-slate-500">Configure catalog departments and maintain referential integrity.</p>
          </div>

          <button id="btn-add-category" class="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm">
            <i data-lucide="folder-plus" class="w-4 h-4"></i>
            <span>Add New Category</span>
          </button>
        </div>

        <!-- Categories Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th class="py-3 px-3 font-bold">ID</th>
                <th class="py-3 px-3 font-bold">Category</th>
                <th class="py-3 px-3 font-bold">Slug</th>
                <th class="py-3 px-3 font-bold">Description</th>
                <th class="py-3 px-3 font-bold text-center">Associated Products</th>
                <th class="py-3 px-3 font-bold text-center">Status</th>
                <th class="py-3 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${categories.map(c => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-3 font-mono font-bold text-slate-400">#${c.category_id}</td>
                  <td class="py-3.5 px-3">
                    <div class="flex items-center gap-2.5">
                      <img 
                        src="${c.image_url || 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=100'}" 
                        alt="${c.category_name}" 
                        class="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100"
                        onerror="this.src='https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=100'"
                      />
                      <span class="font-bold text-slate-900">${c.category_name}</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-3 font-mono text-[11px] text-slate-500">${c.slug}</td>
                  <td class="py-3.5 px-3 text-slate-500 max-w-xs truncate">${c.description || '—'}</td>
                  <td class="py-3.5 px-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] ${c.product_count > 0 ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-slate-100 text-slate-600'}">
                      ${c.product_count} products
                    </span>
                  </td>
                  <td class="py-3.5 px-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${c.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}">
                      ${c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="py-3.5 px-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button 
                        data-edit-category='${JSON.stringify(c).replace(/'/g, "&apos;")}' 
                        class="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors" 
                        title="Edit Category"
                      >
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                      </button>
                      <button 
                        data-delete-category="${c.category_id}" 
                        data-cat-name="${c.category_name}" 
                        data-prod-count="${c.product_count}" 
                        class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors" 
                        title="Delete Category"
                      >
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Add category trigger
    document.getElementById('btn-add-category')?.addEventListener('click', () => {
      openCategoryModal();
    });

    // Edit category listeners
    container.querySelectorAll('[data-edit-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const cat = JSON.parse(btn.getAttribute('data-edit-category'));
          openCategoryModal(cat);
        } catch (e) {
          toast.error('Could not parse category details.');
        }
      });
    });

    // Delete category listeners
    container.querySelectorAll('[data-delete-category]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-delete-category'), 10);
        const name = btn.getAttribute('data-cat-name');
        const prodCount = parseInt(btn.getAttribute('data-prod-count'), 10);

        if (prodCount > 0) {
          alert(`Cannot delete category "${name}" because it contains ${prodCount} active product(s).\n\nTo prevent orphaned products, please reassign those products first or deactivate this category.`);
          return;
        }

        if (!confirm(`Are you sure you want to permanently delete empty category "${name}" (#${id})?`)) {
          return;
        }

        try {
          const res = await api.admin.deleteCategory(id);
          toast.success(res.message);
          loadCategoriesTab();
        } catch (err) {
          toast.error(err.message || 'Category deletion failed.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load categories: ${err.message}</div>`;
  }
}

// Category Create / Edit Modal
function openCategoryModal(category = null) {
  const modalContainer = document.getElementById('admin-modal-container');
  if (!modalContainer) return;

  const isEditing = !!category;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="${isEditing ? 'edit-3' : 'folder-plus'}" class="w-4 h-4 text-brand-600"></i>
            <span>${isEditing ? `Edit Category #${category.category_id}` : 'Create New Category'}</span>
          </h3>
          <button id="modal-cat-close" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="cat-modal-form" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Category Name *</label>
            <input type="text" id="m-cat-name" required value="${category?.category_name || ''}" placeholder="e.g. Smart Wearables" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea id="m-cat-desc" rows="3" placeholder="Department overview..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">${category?.description || ''}</textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Cover Image URL</label>
            <input type="url" id="m-cat-img" value="${category?.image_url || ''}" placeholder="https://images.unsplash.com/photo-..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-200">
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" id="modal-cat-cancel" class="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Cancel</button>
            <button type="submit" id="modal-cat-submit" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm">
              ${isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: modalContainer });

  const closeModal = () => { modalContainer.innerHTML = ''; };
  document.getElementById('modal-cat-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cat-cancel')?.addEventListener('click', closeModal);

  document.getElementById('cat-modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('modal-cat-submit');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    const name = document.getElementById('m-cat-name')?.value?.trim();
    const desc = document.getElementById('m-cat-desc')?.value?.trim();
    const img = document.getElementById('m-cat-img')?.value?.trim();

    try {
      if (isEditing) {
        await api.admin.updateCategory(category.category_id, {
          category_name: name,
          description: desc,
          image_url: img
        });
        toast.success(`Category "${name}" updated.`);
      } else {
        await api.admin.createCategory({
          category_name: name,
          description: desc,
          image_url: img,
          is_active: true
        });
        toast.success(`Category "${name}" created.`);
      }
      closeModal();
      loadCategoriesTab();
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
      submitBtn.disabled = false;
      submitBtn.innerText = isEditing ? 'Save Changes' : 'Create Category';
    }
  });
}

// ============================================================================
// 4. WAREHOUSE INVENTORY RESTOCK TAB
// ============================================================================
async function loadInventoryTab(lowStockOnly = false) {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="py-20 text-center text-slate-400">Loading stock allocations...</div>`;

  try {
    const items = await api.admin.inventory(lowStockOnly);

    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
        
        <!-- Controls Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Warehouse Inventory & Stock Restock</h2>
            <p class="text-xs text-slate-500">1:1 Normalized Relational Entity: <code class="font-mono text-brand-700">inventory</code></p>
          </div>

          <label class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" id="check-low-stock-tab" ${lowStockOnly ? 'checked' : ''} class="rounded text-brand-600 focus:ring-brand-500">
            <span>Show Low Stock Only (&le; Threshold)</span>
          </label>
        </div>

        <!-- Inventory Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th class="py-3 px-4 font-bold">Product ID</th>
                <th class="py-3 px-4 font-bold">Product Name</th>
                <th class="py-3 px-4 font-bold">Category</th>
                <th class="py-3 px-4 font-bold text-center">Current Quantity</th>
                <th class="py-3 px-4 font-bold text-center">Reorder Threshold</th>
                <th class="py-3 px-4 font-bold text-center">Health Status</th>
                <th class="py-3 px-4 font-bold text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${items.map(item => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-slate-400 font-mono">#${item.product_id}</td>
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
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Filter checkbox listener
    document.getElementById('check-low-stock-tab')?.addEventListener('change', (e) => {
      loadInventoryTab(e.target.checked);
    });

    // Quick restock prompt listener
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
          loadInventoryTab(document.getElementById('check-low-stock-tab')?.checked || false);
        } catch (err) {
          toast.error(err.message || 'Restock failed.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load inventory: ${err.message}</div>`;
  }
}

// ============================================================================
// 5. ORDERS & INVOICES MANAGEMENT TAB
// ============================================================================
async function loadOrdersTab(statusFilter = '') {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="py-20 text-center text-slate-400">Loading order records...</div>`;

  try {
    const orders = await api.admin.orders(statusFilter || null);

    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-6">
        
        <!-- Controls Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Order & Consignment Invoices</h2>
            <p class="text-xs text-slate-500">Advance order fulfillment, record carrier dispatches, and trigger customer status milestones.</p>
          </div>

          <div class="flex items-center gap-2">
            <select id="orders-status-filter" class="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-200">
              <option value="" ${!statusFilter ? 'selected' : ''}>All Statuses</option>
              <option value="Pending" ${statusFilter === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${statusFilter === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Processing" ${statusFilter === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${statusFilter === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${statusFilter === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${statusFilter === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th class="py-3 px-3 font-bold">Order ID</th>
                <th class="py-3 px-3 font-bold">Customer Details</th>
                <th class="py-3 px-3 font-bold">Date</th>
                <th class="py-3 px-3 font-bold text-right">Grand Total</th>
                <th class="py-3 px-3 font-bold text-center">Status</th>
                <th class="py-3 px-3 font-bold">Payment</th>
                <th class="py-3 px-3 font-bold">Tracking #</th>
                <th class="py-3 px-3 font-bold text-right">Advance Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${orders.map(o => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-3 font-mono font-bold text-slate-900">#${o.order_id}</td>
                  <td class="py-3.5 px-3">
                    <p class="font-bold text-slate-800">${o.customer_name}</p>
                    <p class="text-[10px] text-slate-400">${o.customer_email}</p>
                  </td>
                  <td class="py-3.5 px-3 text-slate-500">${new Date(o.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td class="py-3.5 px-3 text-right font-extrabold text-slate-900">&#8377;${Number(o.total_amount).toLocaleString('en-IN')}</td>
                  <td class="py-3.5 px-3 text-center">
                    <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${o.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : o.order_status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : o.order_status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                      ${o.order_status}
                    </span>
                  </td>
                  <td class="py-3.5 px-3">
                    <p class="font-bold text-slate-700">${o.payment_method || 'N/A'}</p>
                    <span class="text-[10px] text-slate-400">${o.payment_status || 'Pending'}</span>
                  </td>
                  <td class="py-3.5 px-3 font-mono text-[11px] text-slate-600">${o.tracking_number || 'Pending'}</td>
                  <td class="py-3.5 px-3 text-right">
                    ${o.order_status !== 'Delivered' && o.order_status !== 'Cancelled' ? `
                      <select data-advance-order-manage="${o.order_id}" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium focus:ring-1 focus:ring-brand-200">
                        <option value="">Update Status...</option>
                        <option value="Confirmed">Mark Confirmed</option>
                        <option value="Processing">Mark Processing</option>
                        <option value="Shipped">Mark Shipped</option>
                        <option value="Delivered">Mark Delivered</option>
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

    // Filter listener
    document.getElementById('orders-status-filter')?.addEventListener('change', (e) => {
      loadOrdersTab(e.target.value);
    });

    // Advance order listener
    container.querySelectorAll('[data-advance-order-manage]').forEach(select => {
      select.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        const orderId = parseInt(select.getAttribute('data-advance-order-manage'), 10);
        if (!newStatus) return;

        try {
          await api.admin.updateOrderStatus(orderId, { order_status: newStatus });
          toast.success(`Order #${orderId} marked as ${newStatus}. Milestones updated.`);
          loadOrdersTab(document.getElementById('orders-status-filter')?.value || '');
        } catch (err) {
          toast.error(err.message || 'Failed to update order status.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load orders: ${err.message}</div>`;
  }
}
