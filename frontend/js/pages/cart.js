/**
 * Interactive Shopping Cart Page Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderCartPage() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isCustomer()) {
    app.innerHTML = `
      <div class="max-w-md mx-auto my-auto py-24 px-4 text-center space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
          <i data-lucide="shopping-cart" class="w-8 h-8"></i>
        </div>
        <h2 class="text-2xl font-bold text-slate-900">Your Cart is Waiting</h2>
        <p class="text-sm text-slate-500">Sign in to your customer account to view your saved items and proceed to checkout.</p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <a href="#/login" class="px-6 py-2.5 rounded-full bg-brand-600 text-white font-semibold text-xs shadow-sm hover:bg-brand-700 transition-colors">
            Sign In
          </a>
          <a href="#/shop" class="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors">
            Continue Shopping
          </a>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: app });
    return;
  }

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
        <p class="text-sm text-slate-500 mt-1">Review items saved in your MySQL database-backed session.</p>
      </div>

      <div id="cart-content-container" class="py-12 text-center text-slate-400">
        Loading cart summary...
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  await loadCartView();
}

async function loadCartView() {
  const container = document.getElementById('cart-content-container');
  if (!container) return;

  try {
    const summary = await api.cart.get();
    state.setCart(summary);

    const items = summary.items || [];
    const subtotal = Number(summary.subtotal || 0);
    const shippingFee = Number(summary.shipping_fee || 0);
    const grandTotal = Number(summary.grand_total || 0);
    const threshold = Number(summary.free_shipping_threshold || 999);
    const progressToFree = Math.min(100, Math.round((subtotal / threshold) * 100));
    const amountNeeded = threshold - subtotal;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="shopping-bag" class="w-8 h-8"></i>
          </div>
          <h2 class="text-lg font-bold text-slate-800">Your shopping cart is empty</h2>
          <p class="text-xs text-slate-500">Explore our flagship laptops, phones, and peripherals to add items to your cart.</p>
          <a href="#/shop" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-sm">
            <span>Start Shopping</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ root: container });
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
        
        <!-- Left: Line Items List -->
        <div class="lg:col-span-8 space-y-4">
          
          <!-- Free Shipping Tracker Strip -->
          <div class="p-4 rounded-2xl ${subtotal >= threshold ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-brand-50 border-brand-200 text-brand-900'} border">
            <div class="flex items-center justify-between text-xs font-bold mb-2">
              <span class="flex items-center gap-1.5">
                <i data-lucide="${subtotal >= threshold ? 'check-circle' : 'truck'}" class="w-4 h-4"></i>
                <span>${subtotal >= threshold ? 'Congratulations! You unlocked FREE Delivery!' : `Add ₹${amountNeeded.toLocaleString('en-IN')} more to unlock FREE Delivery!`}</span>
              </span>
              <span>${progressToFree}%</span>
            </div>
            <div class="w-full bg-white/80 rounded-full h-2 overflow-hidden">
              <div class="${subtotal >= threshold ? 'bg-emerald-500' : 'bg-brand-600'} h-2 rounded-full transition-all duration-500" style="width: ${progressToFree}%"></div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
            ${items.map(item => `
              <div class="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div class="flex items-center gap-4">
                  <a href="#/product/${item.product_id}" class="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 block">
                    <img 
                      src="${item.product_image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80'}" 
                      alt="${item.product_name}" 
                      class="w-full h-full object-cover"
                    >
                  </a>
                  <div class="space-y-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${item.category_name}</span>
                    <a href="#/product/${item.product_id}" class="block text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1">
                      ${item.product_name}
                    </a>
                    <p class="text-xs text-slate-500">&#8377;${Number(item.unit_price).toLocaleString('en-IN')} per unit</p>
                    ${!item.is_stock_sufficient ? `
                      <p class="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <i data-lucide="alert-triangle" class="w-3 h-3"></i>
                        <span>Insufficient stock! Only ${item.stock_available} available.</span>
                      </p>
                    ` : ''}
                  </div>
                </div>

                <!-- Quantity Controls & Line Subtotal -->
                <div class="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div class="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    <button 
                      data-qty-action="dec" 
                      data-cart-id="${item.cart_id}" 
                      data-qty="${item.quantity}"
                      class="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                    </button>
                    <span class="w-9 text-center text-xs font-bold text-slate-900">${item.quantity}</span>
                    <button 
                      data-qty-action="inc" 
                      data-cart-id="${item.cart_id}" 
                      data-qty="${item.quantity}"
                      data-max-stock="${item.stock_available}"
                      class="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>

                  <div class="text-right min-w-[90px]">
                    <p class="text-sm font-extrabold text-slate-900">&#8377;${Number(item.item_total).toLocaleString('en-IN')}</p>
                  </div>

                  <button 
                    data-remove-cart="${item.cart_id}"
                    class="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    title="Remove item from cart"
                  >
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>

              </div>
            `).join('')}
          </div>

          <div class="flex items-center justify-between pt-2">
            <a href="#/shop" class="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1.5">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
              <span>Continue Shopping</span>
            </a>
            <button id="btn-clear-cart" class="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors">
              Clear Shopping Cart
            </button>
          </div>
        </div>

        <!-- Right: Order Summary Card -->
        <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-6">
          <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between text-slate-600">
              <span>Subtotal (${summary.total_items} items)</span>
              <span class="font-bold text-slate-900">&#8377;${subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-1">
                <span>Shipping Fee</span>
                <span class="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Standard</span>
              </span>
              <span class="font-bold ${shippingFee === 0 ? 'text-emerald-600 uppercase text-xs' : 'text-slate-900'}">
                ${shippingFee === 0 ? 'FREE' : `&#8377;${shippingFee.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div class="border-t border-slate-100 pt-3 flex items-center justify-between text-base">
              <span class="font-bold text-slate-900">Grand Total</span>
              <span class="text-xl font-extrabold text-brand-600">&#8377;${grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
            <div class="flex items-center gap-1 text-slate-700 font-semibold">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-brand-600"></i>
              <span>ACID Safe Checkout</span>
            </div>
            <p>Row-level locks in MySQL ensure stock decrement is atomic during order placement.</p>
          </div>

          <a 
            href="#/checkout" 
            class="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-brand-600 text-white font-bold text-sm shadow-md hover:bg-brand-700 transition-all transform hover:-translate-y-0.5"
          >
            <span>Proceed to Checkout</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>

      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }

    // Bind Quantity Actions
    container.querySelectorAll('[data-qty-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-qty-action');
        const cartId = parseInt(btn.getAttribute('data-cart-id'), 10);
        const currentQty = parseInt(btn.getAttribute('data-qty'), 10);
        const maxStock = parseInt(btn.getAttribute('data-max-stock') || '999', 10);

        if (action === 'dec') {
          if (currentQty <= 1) {
            // Remove item
            await removeItem(cartId);
          } else {
            await updateItem(cartId, currentQty - 1);
          }
        } else if (action === 'inc') {
          if (currentQty >= maxStock) {
            toast.warning(`Only ${maxStock} units currently available in warehouse inventory.`);
            return;
          }
          await updateItem(cartId, currentQty + 1);
        }
      });
    });

    // Bind Single Remove
    container.querySelectorAll('[data-remove-cart]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cartId = parseInt(btn.getAttribute('data-remove-cart'), 10);
        await removeItem(cartId);
      });
    });

    // Bind Clear All
    document.getElementById('btn-clear-cart')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to empty your shopping cart?')) return;
      try {
        const updated = await api.cart.clear();
        state.setCart(updated);
        toast.info('Shopping cart cleared.');
        loadCartView();
      } catch (err) {
        toast.error(err.message || 'Could not clear cart.');
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load cart: ${err.message}</div>`;
  }
}

async function updateItem(cartId, newQty) {
  try {
    const updated = await api.cart.update(cartId, newQty);
    state.setCart(updated);
    loadCartView();
  } catch (err) {
    toast.error(err.message || 'Could not update item quantity.');
  }
}

async function removeItem(cartId) {
  try {
    const updated = await api.cart.remove(cartId);
    state.setCart(updated);
    toast.info('Item removed from cart.');
    loadCartView();
  } catch (err) {
    toast.error(err.message || 'Could not remove item.');
  }
}
