/**
 * Global Footer Component
 */

export function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        
        <!-- Col 1: Brand Info -->
        <div class="space-y-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            </div>
            <span class="text-xl font-bold text-white tracking-tight">NexCart</span>
          </div>
          <p class="text-sm text-slate-400 leading-relaxed">
            Your Next Shopping Experience. Curated premium tech, flagship devices, and accessories delivered with express dispatch and guaranteed fulfillment.
          </p>
          <div class="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              100% Authentic Products
            </span>
            <span class="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              Express Dispatch
            </span>
          </div>
        </div>

        <!-- Col 2: Shop & Categories -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Storefront</h3>
          <ul class="space-y-2.5 text-sm">
            <li><a href="#/shop" class="hover:text-white transition-colors">All Products</a></li>
            <li><a href="#/shop?category_id=1" class="hover:text-white transition-colors">Laptops & Computers</a></li>
            <li><a href="#/shop?category_id=2" class="hover:text-white transition-colors">Smartphones & Tablets</a></li>
            <li><a href="#/shop?category_id=3" class="hover:text-white transition-colors">Audio & Headphones</a></li>
            <li><a href="#/shop?category_id=4" class="hover:text-white transition-colors">Smart Wearables</a></li>
            <li><a href="#/shop?category_id=5" class="hover:text-white transition-colors">Accessories & Peripherals</a></li>
          </ul>
        </div>

        <!-- Col 3: Customer Services -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Customer Services</h3>
          <ul class="space-y-2.5 text-sm">
            <li><a href="#/cart" class="hover:text-white transition-colors">View Shopping Cart</a></li>
            <li><a href="#/orders" class="hover:text-white transition-colors">Order History</a></li>
            <li><a href="#/track" class="hover:text-white transition-colors">Live Courier Tracking</a></li>
            <li><a href="#/addresses" class="hover:text-white transition-colors">Saved Delivery Addresses</a></li>
            <li><a href="#/login" class="hover:text-white transition-colors">Customer Login</a></li>
            <li><a href="#/register" class="hover:text-white transition-colors">Create Account</a></li>
          </ul>
        </div>

        <!-- Col 4: Help & Policies -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Customer Care & Portal</h3>
          <p class="text-xs text-slate-400 mb-3">
            Dedicated customer assistance and secure order management.
          </p>
          <ul class="space-y-2.5 text-sm">
            <li>
              <a href="#/track" class="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors">
                <i data-lucide="truck" class="w-3.5 h-3.5"></i>
                <span>Track Your Consignment</span>
              </a>
            </li>
            <li>
              <a href="#/orders" class="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors">
                <i data-lucide="package" class="w-3.5 h-3.5"></i>
                <span>Invoices & Order Status</span>
              </a>
            </li>
            <li>
              <a href="#/admin" class="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span>Admin Management Portal</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div class="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>&copy; 2026 NexCart Technologies Pvt. Ltd. All rights reserved.</p>
        <p class="flex items-center gap-1">
          <span>Engineered for seamless digital commerce</span>
        </p>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}
