/**
 * Order Tracking & Milestone Stepper Component
 */

import { api } from '../api.js';
import { toast } from '../components/toast.js';

export async function renderTrackingPage(trackingNumber = '') {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div class="text-center space-y-3 mb-10">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
          <i data-lucide="truck" class="w-3.5 h-3.5"></i>
          <span>Live Courier Tracking</span>
        </span>
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Shipment Progression Stepper</h1>
        <p class="text-sm text-slate-500 max-w-md mx-auto">Track your package across SpeedShip, BlueDart, and Delhivery courier hubs.</p>
        
        <!-- Tracking Number Input Form -->
        <form id="tracking-search-form" class="max-w-md mx-auto pt-4 flex gap-2">
          <input 
            type="text" 
            id="tracking-input" 
            value="${trackingNumber}"
            placeholder="e.g. TRK-IND-202609-0001" 
            class="flex-1 text-sm bg-white border border-slate-300 rounded-2xl px-4 py-3 font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
          <button type="submit" class="px-6 py-3 rounded-2xl bg-brand-600 text-white font-bold text-xs shadow-md hover:bg-brand-700 transition-colors flex items-center gap-1.5">
            <i data-lucide="search" class="w-4 h-4"></i>
            <span>Track</span>
          </button>
        </form>
      </div>

      <div id="tracking-result-container" class="space-y-6">
        ${trackingNumber ? '<div class="py-12 text-center text-slate-400 text-sm">Querying logistics network...</div>' : `
          <div class="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-xs text-slate-400 space-y-2">
            <p>Sample tracking numbers from our database:</p>
            <div class="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono">
              <button class="sample-trk px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-700 transition-colors">TRK-IND-202609-0001</button>
              <button class="sample-trk px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-700 transition-colors">TRK-IND-202609-0002</button>
              <button class="sample-trk px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-700 transition-colors">TRK-IND-202609-0003</button>
              <button class="sample-trk px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-700 transition-colors">TRK-IND-202609-0004</button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: app });

  // Handle Form Submission
  document.getElementById('tracking-search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('tracking-input')?.value?.trim();
    if (val) {
      window.location.hash = `#/track/${encodeURIComponent(val)}`;
    }
  });

  // Handle Sample Buttons
  document.querySelectorAll('.sample-trk').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#/track/${encodeURIComponent(btn.textContent.trim())}`;
    });
  });

  if (trackingNumber) {
    await fetchAndRenderTracking(trackingNumber);
  }
}

async function fetchAndRenderTracking(trackingNo) {
  const container = document.getElementById('tracking-result-container');
  if (!container) return;

  try {
    const data = await api.orders.trackPublic(trackingNo);
    
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-8 text-left">
        
        <!-- Header Info -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracking Number</span>
            <h3 class="text-xl font-mono font-extrabold text-slate-900">${data.tracking_number}</h3>
            <p class="text-xs text-slate-500">Carrier: <span class="font-bold text-slate-800">${data.carrier}</span> &bull; Order ID: <span class="font-bold text-slate-800">#${data.order_id}</span></p>
          </div>

          <div class="text-left sm:text-right">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${data.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-brand-50 text-brand-700 border-brand-200'} border">
              ${data.shipping_status || data.order_status}
            </span>
            ${data.estimated_delivery ? `
              <p class="text-xs text-slate-500 mt-1">Est. Delivery: <span class="font-bold text-slate-900">${new Date(data.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
            ` : ''}
          </div>
        </div>

        <!-- Visual Milestone Stepper -->
        <div class="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          ${data.steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isCancelled = step.status === 'cancelled';

            let iconHtml = `<i data-lucide="circle" class="w-3.5 h-3.5"></i>`;
            let dotStyle = 'bg-slate-200 text-slate-400 border-white';

            if (isCompleted) {
              iconHtml = `<i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>`;
              dotStyle = 'bg-emerald-600 text-white border-emerald-100 shadow-md shadow-emerald-500/20';
            } else if (isCurrent) {
              iconHtml = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>`;
              dotStyle = 'bg-brand-600 text-white border-brand-100 ring-4 ring-brand-100 shadow-md shadow-brand-500/20';
            } else if (isCancelled) {
              iconHtml = `<i data-lucide="x" class="w-3.5 h-3.5 stroke-[3]"></i>`;
              dotStyle = 'bg-rose-600 text-white border-rose-100';
            }

            return `
              <div class="relative flex items-start gap-4">
                <div class="absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 ${dotStyle} flex items-center justify-center -translate-x-1/2">
                  ${iconHtml}
                </div>
                
                <div class="space-y-0.5">
                  <div class="flex items-center gap-3">
                    <h4 class="text-sm font-bold ${isCurrent ? 'text-brand-600 font-extrabold' : isCompleted ? 'text-slate-900' : isCancelled ? 'text-rose-600' : 'text-slate-400'}">
                      ${step.step_name}
                    </h4>
                    ${step.timestamp ? `
                      <span class="text-[11px] text-slate-400 font-medium">
                        ${new Date(step.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ` : ''}
                  </div>
                  <p class="text-xs text-slate-500">${step.description}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Destination Footnote -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i data-lucide="map-pin" class="w-4 h-4 text-brand-600"></i>
            <span>Destination: <strong class="text-slate-900">${data.recipient_name} &bull; ${data.shipping_city}, ${data.shipping_state}</strong></span>
          </div>
          <span class="text-[11px] text-slate-400">Database verified</span>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

  } catch (err) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <i data-lucide="alert-circle" class="w-6 h-6"></i>
        </div>
        <h3 class="text-base font-bold text-slate-900">Tracking Number Not Found</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">${err.message}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: container });
  }
}
