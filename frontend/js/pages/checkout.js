/**
 * ACID Transactional Checkout Page Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderCheckoutPage() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isCustomer()) {
    window.location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <a href="#/cart" class="hover:text-brand-600 transition-colors">Cart</a>
          <span>/</span>
          <span class="text-slate-800 font-semibold">Checkout</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout & Order Placement</h1>
        <p class="text-sm text-slate-500 mt-1">Select your delivery destination and demo payment method.</p>
      </div>

      <div id="checkout-content" class="py-12 text-center text-slate-400">
        Loading checkout details...
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  await loadCheckoutView();
}

async function loadCheckoutView() {
  const container = document.getElementById('checkout-content');
  if (!container) return;

  try {
    const [cartSummary, addresses] = await Promise.all([
      api.cart.get(),
      api.addresses.list()
    ]);

    const items = cartSummary.items || [];
    if (items.length === 0) {
      container.innerHTML = `
        <div class="max-w-md mx-auto py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8">
          <h2 class="text-lg font-bold text-slate-800">Your cart is empty</h2>
          <p class="text-xs text-slate-500">You must add items to your cart before proceeding to checkout.</p>
          <a href="#/shop" class="inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors">
            Browse Storefront
          </a>
        </div>
      `;
      return;
    }

    let selectedAddressId = addresses.find(a => a.is_default)?.address_id || (addresses[0]?.address_id || null);
    let selectedPaymentMethod = 'UPI Demo';

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
        
        <!-- Left: Address Selection & Payment Methods -->
        <div class="lg:col-span-8 space-y-8">
          
          <!-- Section 1: Delivery Address -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <i data-lucide="map-pin" class="w-4 h-4 text-brand-600"></i>
                <span>1. Select Delivery Address</span>
              </h2>
              <button id="btn-toggle-add-address" class="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Add New Address</span>
              </button>
            </div>

            <!-- Inline Add Address Form -->
            <div id="add-address-form" class="hidden p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">New Shipping Destination</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label class="block text-slate-600 mb-1">Recipient Name</label>
                  <input type="text" id="addr-name" placeholder="Full Name" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                </div>
                <div>
                  <label class="block text-slate-600 mb-1">Phone Number</label>
                  <input type="text" id="addr-phone" placeholder="+91 9876543210" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-slate-600 mb-1">Street Address</label>
                  <input type="text" id="addr-street" placeholder="Flat / Building / Street" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                </div>
                <div>
                  <label class="block text-slate-600 mb-1">City</label>
                  <input type="text" id="addr-city" placeholder="Bengaluru" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                </div>
                <div>
                  <label class="block text-slate-600 mb-1">State</label>
                  <input type="text" id="addr-state" placeholder="Karnataka" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                </div>
                <div>
                  <label class="block text-slate-600 mb-1">Postal Code (PIN)</label>
                  <input type="text" id="addr-zip" placeholder="560001" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                </div>
                <div>
                  <label class="block text-slate-600 mb-1">Address Label</label>
                  <select id="addr-type" class="w-full bg-white border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-brand-200">
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="College">College</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-2 pt-2">
                <button id="btn-save-address" class="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700">Save Address</button>
                <button id="btn-cancel-address" class="px-4 py-2 rounded-xl text-slate-500 text-xs hover:text-slate-800">Cancel</button>
              </div>
            </div>

            <!-- Saved Addresses Radio Grid -->
            <div id="address-radio-list" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${addresses.length > 0 ? addresses.map(a => `
                <label class="p-4 rounded-2xl border ${selectedAddressId === a.address_id ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer flex items-start gap-3 transition-all">
                  <input type="radio" name="checkout-address" value="${a.address_id}" ${selectedAddressId === a.address_id ? 'checked' : ''} class="mt-1 text-brand-600 focus:ring-brand-500">
                  <div class="space-y-1 text-xs">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900">${a.recipient_name}</span>
                      <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">${a.address_type}</span>
                      ${a.is_default ? '<span class="text-[10px] font-bold text-brand-600">Default</span>' : ''}
                    </div>
                    <p class="text-slate-600 leading-relaxed">${a.street_address}, ${a.city}, ${a.state} - ${a.postal_code}</p>
                    <p class="text-slate-400">Phone: ${a.phone}</p>
                  </div>
                </label>
              `).join('') : `
                <div class="col-span-full p-4 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
                  No saved addresses found. Please add a shipping destination above to proceed.
                </div>
              `}
            </div>
          </div>

          <!-- Section 2: Demo Payment Method -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <i data-lucide="credit-card" class="w-4 h-4 text-brand-600"></i>
              <span>2. Select Payment Method</span>
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label class="p-4 rounded-2xl border ${selectedPaymentMethod === 'PhonePe' ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-200' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer flex flex-col justify-between gap-3 transition-all relative overflow-hidden group">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-[11px]">P</span>
                    <span class="text-xs font-bold text-slate-900">PhonePe Gateway</span>
                  </div>
                  <input type="radio" name="checkout-payment" value="PhonePe" class="text-purple-600 focus:ring-purple-500">
                </div>
                <div>
                  <p class="text-[11px] text-slate-500">Instant UPI, QR code & card settlement.</p>
                  <span class="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                    <i data-lucide="zap" class="w-3 h-3"></i>
                    <span>UAT Sandbox Simulation Ready</span>
                  </span>
                </div>
              </label>

              <label class="p-4 rounded-2xl border ${selectedPaymentMethod === 'UPI Demo' ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer flex flex-col justify-between gap-3 transition-all">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">UPI Demo</span>
                  <input type="radio" name="checkout-payment" value="UPI Demo" checked class="text-brand-600 focus:ring-brand-500">
                </div>
                <p class="text-[11px] text-slate-500">Google Pay, BHIM & standard UPI test simulation.</p>
              </label>

              <label class="p-4 rounded-2xl border ${selectedPaymentMethod === 'Card Demo' ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer flex flex-col justify-between gap-3 transition-all">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">Card Demo</span>
                  <input type="radio" name="checkout-payment" value="Card Demo" class="text-brand-600 focus:ring-brand-500">
                </div>
                <p class="text-[11px] text-slate-500">Visa, Mastercard & RuPay test gateway simulation.</p>
              </label>

              <label class="p-4 rounded-2xl border ${selectedPaymentMethod === 'Cash on Delivery' ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer flex flex-col justify-between gap-3 transition-all">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">Cash on Delivery</span>
                  <input type="radio" name="checkout-payment" value="Cash on Delivery" class="text-brand-600 focus:ring-brand-500">
                </div>
                <p class="text-[11px] text-slate-500">Pay cash upon delivery at your doorstep.</p>
              </label>
            </div>
          </div>

        </div>

        <!-- Right: Invoice Breakdown & Checkout Trigger -->
        <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-6">
          <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Order Invoice</h3>

          <!-- Items list condensed -->
          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            ${items.map(it => `
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 max-w-[190px]">
                  <span class="font-bold text-slate-400">${it.quantity}x</span>
                  <span class="text-slate-700 truncate">${it.product_name}</span>
                </div>
                <span class="font-bold text-slate-900">&#8377;${Number(it.item_total).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>

          <div class="border-t border-slate-100 pt-3 space-y-2 text-xs">
            <div class="flex items-center justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span class="font-bold text-slate-800">&#8377;${Number(cartSummary.subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span>Shipping Fee</span>
              <span class="font-bold text-emerald-600">${cartSummary.shipping_fee === 0 ? 'FREE' : `&#8377;${Number(cartSummary.shipping_fee).toLocaleString('en-IN')}`}</span>
            </div>
            <div class="border-t border-slate-100 pt-2 flex items-center justify-between text-sm">
              <span class="font-bold text-slate-900">Total Payable</span>
              <span class="text-lg font-extrabold text-brand-600">&#8377;${Number(cartSummary.grand_total).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-brand-50/60 border border-brand-100 text-[11px] text-brand-900 space-y-1">
            <p class="font-bold flex items-center gap-1.5 text-brand-700">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-brand-600"></i>
              <span>100% Safe & Secure Checkout</span>
            </p>
            <p class="text-slate-600 leading-relaxed">
              Your order is protected with end-to-end encryption, guaranteed stock reservation, and instant courier shipment tracking.
            </p>
          </div>

          <button 
            id="btn-place-order" 
            class="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-brand-600 text-white font-extrabold text-sm shadow-md hover:bg-brand-700 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            ${!selectedAddressId ? 'disabled' : ''}
          >
            <span>Confirm & Place Order</span>
            <i data-lucide="check-circle" class="w-4 h-4"></i>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Handle address selection change
    container.querySelectorAll('input[name="checkout-address"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedAddressId = parseInt(e.target.value, 10);
        document.getElementById('btn-place-order').disabled = !selectedAddressId;
      });
    });

    // Handle payment selection change
    container.querySelectorAll('input[name="checkout-payment"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedPaymentMethod = e.target.value;
        container.querySelectorAll('input[name="checkout-payment"]').forEach(r => {
          const card = r.closest('label');
          if (!card) return;
          if (r.checked) {
            const isPhonePe = r.value === 'PhonePe';
            card.className = `p-4 rounded-2xl border ${isPhonePe ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-200' : 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-200'} cursor-pointer flex flex-col justify-between gap-3 transition-all relative overflow-hidden group`;
          } else {
            card.className = 'p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex flex-col justify-between gap-3 transition-all relative overflow-hidden group';
          }
        });
      });
    });

    // Handle Inline Add Address toggle
    const addAddressForm = document.getElementById('add-address-form');
    document.getElementById('btn-toggle-add-address')?.addEventListener('click', () => {
      addAddressForm?.classList.toggle('hidden');
    });
    document.getElementById('btn-cancel-address')?.addEventListener('click', () => {
      addAddressForm?.classList.add('hidden');
    });

    // Save Address handler
    document.getElementById('btn-save-address')?.addEventListener('click', async () => {
      const recipient_name = document.getElementById('addr-name')?.value?.trim();
      const phone = document.getElementById('addr-phone')?.value?.trim();
      const street_address = document.getElementById('addr-street')?.value?.trim();
      const city = document.getElementById('addr-city')?.value?.trim();
      const state = document.getElementById('addr-state')?.value?.trim();
      const postal_code = document.getElementById('addr-zip')?.value?.trim();
      const address_type = document.getElementById('addr-type')?.value || 'Home';

      if (!recipient_name || !phone || !street_address || !city || !state || !postal_code) {
        toast.warning('Please complete all address fields.');
        return;
      }

      try {
        await api.addresses.create({
          recipient_name,
          phone,
          street_address,
          city,
          state,
          postal_code,
          country: 'India',
          address_type,
          is_default: true
        });
        toast.success('Address added to your address book!');
        loadCheckoutView();
      } catch (err) {
        toast.error(err.message || 'Could not save address.');
      }
    });

    // Place Order handler (ACID transaction execution)
    document.getElementById('btn-place-order')?.addEventListener('click', async () => {
      if (!selectedAddressId) {
        toast.warning('Please select a valid delivery address.');
        return;
      }

      const btn = document.getElementById('btn-place-order');
      btn.disabled = true;
      btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Executing ACID Transaction...</span>`;

      try {
        const orderResult = await api.orders.checkout({
          address_id: selectedAddressId,
          payment_method: selectedPaymentMethod
        });

        // Sync local cart state
        state.setCart({ items: [], total_items: 0, subtotal: 0, shipping_fee: 0, grand_total: 0 });

        // Show Success View
        renderOrderSuccessView(orderResult.order, orderResult.message);
      } catch (err) {
        toast.error(err.message || 'Checkout failed. Stock has been rolled back safely.');
        btn.disabled = false;
        btn.innerHTML = `<span>Confirm & Place Order</span><i data-lucide="check-circle" class="w-4 h-4"></i>`;
        if (window.lucide) window.lucide.createIcons({ root: btn });
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Checkout error: ${err.message}</div>`;
  }
}

function renderOrderSuccessView(order, successMessage) {
  const container = document.getElementById('checkout-content');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-2xl mx-auto py-8 text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-subtle">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <i data-lucide="check" class="w-8 h-8 stroke-[3]"></i>
      </div>

      <div class="space-y-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Order Placed Successfully in MySQL
        </span>
        <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Thank you for your order!</h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto">${successMessage || `Order #${order.order_id} has been recorded and inventory stock was safely decremented.`}</p>
      </div>

      <!-- Quick Receipt Snapshot -->
      <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
          <div>
            <span class="text-slate-400">Order ID:</span>
            <p class="font-bold text-slate-900 text-sm">#${order.order_id}</p>
          </div>
          <div>
            <span class="text-slate-400">Grand Total:</span>
            <p class="font-bold text-brand-600 text-sm">&#8377;${Number(order.total_amount).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span class="text-slate-400">Payment Status:</span>
            <p class="font-bold text-slate-900">${order.payment?.payment_status || 'Pending'} (${order.payment?.payment_method})</p>
          </div>
          <div>
            <span class="text-slate-400">Tracking Number:</span>
            <p class="font-mono font-bold text-slate-900 truncate">${order.shipping?.tracking_number || 'Pending'}</p>
          </div>
        </div>

        <div>
          <span class="text-slate-400">Delivering to:</span>
          <p class="font-medium text-slate-800">${order.address?.recipient_name} &bull; ${order.address?.street_address}, ${order.address?.city} (${order.address?.postal_code})</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
        <a 
          href="#/track/${encodeURIComponent(order.shipping?.tracking_number)}" 
          class="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 text-white font-bold text-xs shadow-md hover:bg-brand-700 transition-colors"
        >
          <i data-lucide="truck" class="w-4 h-4"></i>
          <span>Track Delivery Stepper</span>
        </a>
        <a 
          href="#/orders" 
          class="px-6 py-3 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
        >
          View My Orders
        </a>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: container });
}
