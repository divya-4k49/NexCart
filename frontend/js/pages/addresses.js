/**
 * Customer Saved Delivery Addresses Management Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderAddressesPage() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.isCustomer()) {
    window.location.hash = '#/login';
    return;
  }

  app.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-left">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Saved Delivery Destinations</h1>
          <p class="text-sm text-slate-500 mt-1">Manage multiple addresses for one-click checkout.</p>
        </div>
        <button id="btn-toggle-new-addr" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 transition-colors flex items-center gap-1.5">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Add Destination</span>
        </button>
      </div>

      <!-- Add Address Drawer/Form -->
      <div id="new-addr-form-card" class="hidden mb-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
        <h3 class="text-sm font-bold text-slate-900">Add New Shipping Address</h3>
        <form id="address-create-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-slate-600 mb-1">Recipient Name</label>
            <input type="text" id="new-recipient" required placeholder="Full Name" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800">
          </div>
          <div>
            <label class="block text-slate-600 mb-1">Contact Phone</label>
            <input type="text" id="new-phone" required placeholder="+91 9876543210" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800">
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-600 mb-1">Street Address</label>
            <input type="text" id="new-street" required placeholder="Flat, Apartment, Road" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800">
          </div>
          <div>
            <label class="block text-slate-600 mb-1">City</label>
            <input type="text" id="new-city" required placeholder="Ahmedabad" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800">
          </div>
          <div>
            <label class="block text-slate-600 mb-1">State</label>
            <input type="text" id="new-state" required placeholder="Gujarat" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800">
          </div>
          <div>
            <label class="block text-slate-600 mb-1">PIN / Postal Code</label>
            <input type="text" id="new-zip" required placeholder="380015" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800">
          </div>
          <div>
            <label class="block text-slate-600 mb-1">Address Type</label>
            <select id="new-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium">
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="College">College</option>
            </select>
          </div>
          <div class="sm:col-span-2 flex items-center gap-2 pt-2">
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700">Save Address</button>
            <button type="button" id="btn-cancel-new-addr" class="px-4 py-2.5 rounded-xl text-slate-500 text-xs hover:text-slate-800">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Address Grid -->
      <div id="addresses-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="col-span-full py-16 text-center text-slate-400 text-sm">Loading address book...</div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  // Toggle Form
  const formCard = document.getElementById('new-addr-form-card');
  document.getElementById('btn-toggle-new-addr')?.addEventListener('click', () => {
    formCard?.classList.toggle('hidden');
  });
  document.getElementById('btn-cancel-new-addr')?.addEventListener('click', () => {
    formCard?.classList.add('hidden');
  });

  // Handle Form Submit
  document.getElementById('address-create-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.addresses.create({
        recipient_name: document.getElementById('new-recipient')?.value?.trim(),
        phone: document.getElementById('new-phone')?.value?.trim(),
        street_address: document.getElementById('new-street')?.value?.trim(),
        city: document.getElementById('new-city')?.value?.trim(),
        state: document.getElementById('new-state')?.value?.trim(),
        postal_code: document.getElementById('new-zip')?.value?.trim(),
        country: 'India',
        address_type: document.getElementById('new-type')?.value || 'Home',
        is_default: false
      });
      toast.success('Address saved successfully!');
      formCard?.classList.add('hidden');
      loadAddresses();
    } catch (err) {
      toast.error(err.message || 'Could not save address.');
    }
  });

  await loadAddresses();
}

async function loadAddresses() {
  const container = document.getElementById('addresses-grid');
  if (!container) return;

  try {
    const list = await api.addresses.list();

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="map-pin-off" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800">No saved addresses</h3>
          <p class="text-xs text-slate-500">Add an address above to make checkout instant.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons({ root: container });
      return;
    }

    container.innerHTML = list.map(addr => `
      <div class="bg-white p-6 rounded-3xl border ${addr.is_default ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200/80'} shadow-subtle flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">${addr.address_type}</span>
              ${addr.is_default ? `
                <span class="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-bold text-[10px] border border-brand-200">Default Delivery</span>
              ` : ''}
            </div>
            ${!addr.is_default ? `
              <button 
                data-set-default="${addr.address_id}" 
                class="text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors"
              >
                Set as Default
              </button>
            ` : ''}
          </div>

          <h3 class="text-base font-bold text-slate-900">${addr.recipient_name}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">${addr.street_address}, ${addr.city}, ${addr.state} - ${addr.postal_code}</p>
          <p class="text-xs text-slate-400">Phone: ${addr.phone}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
          <button 
            data-delete-addr="${addr.address_id}" 
            class="text-rose-600 hover:text-rose-800 font-semibold transition-colors flex items-center gap-1"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Handle Set Default
    container.querySelectorAll('[data-set-default]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-set-default'), 10);
        try {
          await api.addresses.setDefault(id);
          toast.success('Default address updated.');
          loadAddresses();
        } catch (err) {
          toast.error(err.message || 'Could not set default address.');
        }
      });
    });

    // Handle Delete
    container.querySelectorAll('[data-delete-addr]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-delete-addr'), 10);
        if (!confirm('Are you sure you want to remove this address?')) return;
        try {
          await api.addresses.delete(id);
          toast.info('Address removed.');
          loadAddresses();
        } catch (err) {
          toast.error(err.message || 'Could not delete address.');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="py-8 text-rose-500 text-sm">Failed to load addresses: ${err.message}</div>`;
  }
}
