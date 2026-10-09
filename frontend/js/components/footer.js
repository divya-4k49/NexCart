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
            Your Next Shopping Experience. An enterprise-grade, 3-tier e-commerce order management system powered by MySQL 8.0 and FastAPI.
          </p>
          <div class="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              MySQL 8.0 Live
            </span>
            <span class="px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              12 Relational Entities
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

        <!-- Col 4: Faculty & Technical Evaluation -->
        <div>
          <h3 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">DBMS Cornerstone</h3>
          <p class="text-xs text-slate-400 mb-3">
            Built for college evaluation with strict 3NF database normalization, ACID transactions, and zero entity shortcuts.
          </p>
          <ul class="space-y-2.5 text-sm">
            <li>
              <a href="/docs" target="_blank" class="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>FastAPI Swagger UI (/docs)</span>
              </a>
            </li>
            <li>
              <a href="/api/health/db-tables" target="_blank" class="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors">
                <i data-lucide="database" class="w-3.5 h-3.5"></i>
                <span>Live Table Row Counts</span>
              </a>
            </li>
            <li>
              <a href="#/admin" class="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span>Admin Executive Portal</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div class="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>&copy; 2026 NexCart Systems. Built with Python FastAPI, SQLAlchemy 2.0, and MySQL 8.0.</p>
        <p class="flex items-center gap-1">
          <span>Engineered with</span>
          <span class="text-rose-500">&hearts;</span>
          <span>for Academic & Real-World Excellence</span>
        </p>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}
