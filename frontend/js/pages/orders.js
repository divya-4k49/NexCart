/**
 * Customer Orders History & Lifecycle Management Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderOrdersPage() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isCustomer()) {
    window.location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Order History & Invoices</h1>
        <p class="text-sm text-slate-500 mt-1">Review your past purchases, shipment progress, and invoice snapshots.</p>
      </div>

      <div id="orders-list-container" class="space-y-4">
        <div class="py-20 text-center text-slate-400">Loading order records from MySQL...</div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  await loadOrdersList();
}

async function loadOrdersList() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  try {
    const orders = await api.orders.list();

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-subtle">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="package" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900">No orders placed yet</h3>
          <p class="text-xs text-slate-500">Your historical orders and purchase receipts will appear here once placed.</p>
          <a href="#/shop" class="inline-block px-5 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors">
            Start Shopping
          </a>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ root: container });
      return;
    }

    container.innerHTML = orders.map(ord => {
      const isCancellable = ['Pending', 'Confirmed'].includes(ord.order_status);
      const statusColors = {
        Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        Processing: 'bg-blue-50 text-blue-700 border-blue-200',
        Confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
        Pending: 'bg-amber-50 text-amber-700 border-amber-200',
        Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
      };
      const badgeStyle = statusColors[ord.order_status] || 'bg-slate-50 text-slate-700 border-slate-200';

      return `
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4 text-left">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                #${ord.order_id}
              </span>
              <div>
                <p class="text-xs text-slate-400">Date Placed: ${new Date(ord.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p class="text-sm font-bold text-slate-900">&#8377;${Number(ord.total_amount).toLocaleString('en-IN')} &bull; ${ord.total_items} items</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}">
                ${ord.order_status}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span class="text-slate-400 font-medium">Payment Settlement:</span>
              <p class="font-semibold text-slate-800 mt-0.5">${ord.payment_method || 'N/A'} &bull; <span class="${ord.payment_status === 'Completed' ? 'text-emerald-600 font-bold' : 'text-amber-600'}">${ord.payment_status}</span></p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Courier Shipping:</span>
              <p class="font-semibold text-slate-800 mt-0.5">${ord.shipping_status || 'Pending'}</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Tracking Number:</span>
              <p class="font-mono text-slate-900 mt-0.5 truncate">${ord.tracking_number || 'Pending Assignment'}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div>
              ${isCancellable ? `
                <button 
                  data-cancel-order="${ord.order_id}"
                  class="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                >
                  Cancel Order & Restock
                </button>
              ` : `
                <span class="text-[11px] text-slate-400 italic">Order past cancellation window</span>
              `}
            </div>

            <div class="flex items-center gap-2">
              ${ord.tracking_number ? `
                <a 
                  href="#/track/${encodeURIComponent(ord.tracking_number)}" 
                  class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors"
                >
                  <i data-lucide="truck" class="w-3.5 h-3.5"></i>
                  <span>Live Tracking</span>
                </a>
              ` : ''}
              
              <button 
                data-view-order="${ord.order_id}"
                class="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-brand-600 text-xs font-semibold transition-colors"
              >
                View Full Receipt
              </button>
            </div>
          </div>

        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Handle Order Cancellation
    container.querySelectorAll('[data-cancel-order]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const oId = parseInt(btn.getAttribute('data-cancel-order'), 10);
        if (!confirm(`Are you sure you want to cancel Order #${oId}? All purchased products will be automatically restocked into MySQL inventory.`)) {
          return;
        }

        try {
          btn.disabled = true;
          const res = await api.orders.cancel(oId);
          toast.success(res.message || `Order #${oId} cancelled and items restocked.`);
          loadOrdersList();
        } catch (err) {
          toast.error(err.message || 'Could not cancel order.');
          btn.disabled = false;
        }
      });
    });

    // Handle View Full Order Modal
    container.querySelectorAll('[data-view-order]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const oId = parseInt(btn.getAttribute('data-view-order'), 10);
        await openOrderReceiptModal(oId);
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load orders: ${err.message}</div>`;
  }
}

async function openOrderReceiptModal(orderId) {
  try {
    const order = await api.orders.get(orderId);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span class="text-xs text-brand-600 font-bold uppercase tracking-wider">Purchase Invoice</span>
            <h3 class="text-xl font-extrabold text-slate-900">Order #${order.order_id}</h3>
          </div>
          <button id="modal-close-btn" class="p-2 text-slate-400 hover:text-slate-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span class="font-bold text-slate-900">${state.user?.full_name} (${state.user?.email})</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Delivered To:</span>
            <span class="font-medium text-slate-900 text-right">${order.address?.street_address}, ${order.address?.city}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Payment Method:</span>
            <span class="font-medium text-slate-900">${order.payment?.payment_method} (${order.payment?.payment_status})</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Transaction Ref:</span>
            <span class="font-mono text-slate-800">${order.payment?.transaction_reference || 'N/A'}</span>
          </div>
        </div>

        <!-- Purchased Line Items -->
        <div class="border-t border-b border-slate-100 py-3 space-y-2">
          <p class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Items Snapshot (Frozen Unit Price)</p>
          ${order.items.map(it => `
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-700">${it.quantity}x ${it.product_name}</span>
              <span class="font-bold text-slate-900">&#8377;${Number(it.subtotal).toLocaleString('en-IN')}</span>
            </div>
          `).join('')}
        </div>

        <div class="flex items-center justify-between text-base font-extrabold text-slate-900">
          <span>Grand Total:</span>
          <span class="text-brand-600">&#8377;${Number(order.total_amount).toLocaleString('en-IN')}</span>
        </div>

        <div class="pt-2">
          <button id="modal-ok-btn" class="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
            Close Receipt
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);
    modal.querySelector('#modal-ok-btn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

  } catch (err) {
    toast.error(err.message || 'Could not load order details.');
  }
}
