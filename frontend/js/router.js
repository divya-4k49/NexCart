/**
 * Hash-based Single Page Application (SPA) Client-side Router
 */

import { renderNavbar } from './components/navbar.js';
import { renderHomePage } from './pages/home.js';
import { renderShopPage } from './pages/shop.js';
import { renderProductDetailPage } from './pages/productDetail.js';
import { renderCartPage } from './pages/cart.js';
import { renderCheckoutPage } from './pages/checkout.js';
import { renderOrdersPage } from './pages/orders.js';
import { renderTrackingPage } from './pages/tracking.js';
import { renderAddressesPage } from './pages/addresses.js';
import { renderLoginPage, renderRegisterPage } from './pages/auth.js';
import { renderAdminPage, renderAdminInventoryPage } from './pages/admin.js';

export function initRouter() {
  const handleRoute = () => {
    window.scrollTo(0, 0);

    const hash = window.location.hash || '#/';
    const [pathPart, queryPart] = hash.split('?');
    
    // Parse query parameters
    const params = {};
    if (queryPart) {
      new URLSearchParams(queryPart).forEach((val, key) => {
        params[key] = val;
      });
    }

    // Refresh navbar state on navigation
    renderNavbar();

    // 1. Home Page
    if (pathPart === '#/' || pathPart === '#' || pathPart === '') {
      renderHomePage();
      return;
    }

    // 2. Shop / Catalog
    if (pathPart === '#/shop') {
      renderShopPage(params);
      return;
    }

    // 3. Product Details: #/product/:id
    const productMatch = pathPart.match(/^#\/product\/([^\/]+)$/);
    if (productMatch) {
      renderProductDetailPage(productMatch[1]);
      return;
    }

    // 4. Cart
    if (pathPart === '#/cart') {
      renderCartPage();
      return;
    }

    // 5. Checkout
    if (pathPart === '#/checkout') {
      renderCheckoutPage();
      return;
    }

    // 6. Orders History
    if (pathPart === '#/orders') {
      renderOrdersPage();
      return;
    }

    // 7. Tracking: #/track or #/track/:trackingNo
    const trackMatch = pathPart.match(/^#\/track(?:\/([^\/]+))?$/);
    if (trackMatch) {
      const trkNum = trackMatch[1] ? decodeURIComponent(trackMatch[1]) : '';
      renderTrackingPage(trkNum);
      return;
    }

    // 8. Addresses
    if (pathPart === '#/addresses') {
      renderAddressesPage();
      return;
    }

    // 9. Login & Register
    if (pathPart === '#/login') {
      renderLoginPage();
      return;
    }
    if (pathPart === '#/register') {
      renderRegisterPage();
      return;
    }

    // 10. Admin Portal & Inventory
    if (pathPart === '#/admin') {
      renderAdminPage();
      return;
    }
    if (pathPart === '#/admin/inventory') {
      renderAdminInventoryPage();
      return;
    }

    // 404 Fallback
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="max-w-md mx-auto my-auto py-24 text-center space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900">Page Not Found</h2>
          <p class="text-xs text-slate-500">The destination route "${hash}" does not exist in NexCart.</p>
          <a href="#/" class="inline-block px-5 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors">
            Return to Home
          </a>
        </div>
      `;
    }
  };

  // Listen to hash changes and initial load
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', handleRoute);
  
  // Immediate invocation if DOM already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    handleRoute();
  }
}
