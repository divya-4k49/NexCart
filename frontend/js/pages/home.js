/**
 * Modern E-Commerce Home Page Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderHomePage() {
  const app = document.getElementById('app');
  if (!app) return;

  // Initial skeleton
  app.innerHTML = `
    <div class="space-y-16 pb-16">
      
      <!-- 1. Hero Section -->
      <section class="relative hero-gradient pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 overflow-hidden">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold">
                <span class="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                <span>Production Relational DBMS Demo &bull; 12 Entities</span>
              </div>
              
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Your Next <span class="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Shopping Experience</span>
              </h1>
              
              <p class="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Discover flagship smartphones, M3 workstations, noise-canceling audio, and mechanical peripherals. Backed by strict ACID transactional inventory management.
              </p>

              <div class="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a href="#/shop" class="flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/25 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30 transition-all transform hover:-translate-y-0.5">
                  <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                  <span>Explore Catalog</span>
                </a>
                <a href="#/track" class="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                  <i data-lucide="truck" class="w-4 h-4"></i>
                  <span>Track Order</span>
                </a>
              </div>

              <!-- Trust Stats -->
              <div class="pt-8 border-t border-slate-200/70 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p class="text-2xl font-bold text-slate-900">14</p>
                  <p class="text-xs text-slate-500 font-medium">Curated Tech Products</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-slate-900">100%</p>
                  <p class="text-xs text-slate-500 font-medium">ACID Atomic Checkout</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-slate-900">&#8377;999</p>
                  <p class="text-xs text-slate-500 font-medium">Free Shipping Minimum</p>
                </div>
              </div>
            </div>

            <!-- Hero Graphic Card (Featured Showcase) -->
            <div class="lg:col-span-5 relative flex justify-center">
              <div class="relative w-full max-w-md">
                <div class="absolute -top-4 -left-4 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl -z-10"></div>
                <div class="absolute -bottom-4 -right-4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl -z-10"></div>
                
                <div class="glass-panel p-6 rounded-3xl shadow-xl border border-white/60">
                  <div class="relative overflow-hidden rounded-2xl aspect-[4/3] bg-slate-100 mb-5 group">
                    <img 
                      src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" 
                      alt="MacBook Pro 16 M3 Max" 
                      class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    >
                    <span class="absolute top-3 left-3 bg-brand-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      Flagship Choice
                    </span>
                  </div>

                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold uppercase tracking-wider text-brand-600">Laptops & Computers</span>
                      <div class="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                        <span>5.0</span>
                      </div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 leading-snug">MacBook Pro 16" M3 Max</h3>
                    <p class="text-xs text-slate-500 line-clamp-2">Apple M3 Max chip with 16-core CPU, 40-core GPU, 48GB Unified Memory.</p>
                    <div class="flex items-center justify-between pt-3">
                      <div>
                        <span class="text-xs text-slate-400 font-normal">Starting at</span>
                        <p class="text-xl font-bold text-slate-900">&#8377;3,49,900</p>
                      </div>
                      <a href="#/product/1" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-brand-600 transition-colors">
                        View Product
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- 2. Value Proposition Strip -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div class="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-subtle flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
              <i data-lucide="zap" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Swift Express Dispatch</h4>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">Integrated tracking with BlueDart, Delhivery, and SpeedShip.</p>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-subtle flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <i data-lucide="shield-check" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">ACID Stock Safety</h4>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">Pessimistic row locking ensures zero out-of-stock overselling.</p>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-subtle flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <i data-lucide="award" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Verified Reviews</h4>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">Reviews verified against customer order histories in MySQL.</p>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-subtle flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <i data-lucide="credit-card" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Instant Demo Payments</h4>
              <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">Interactive mock simulations for UPI, Cards, and Cash on Delivery.</p>
            </div>
          </div>

        </div>
      </section>

      <!-- 3. Category Showcase Grid -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-8">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Departments</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Shop by Category</h2>
          </div>
          <a href="#/shop" class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
            <span>View All</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </a>
        </div>

        <div id="home-category-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <!-- Populated dynamically -->
          <div class="col-span-full py-12 text-center text-slate-400 text-sm">Loading categories...</div>
        </div>
      </section>

      <!-- 4. Featured Products Showcase -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-8">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-brand-600">Handpicked</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Featured Tech Products</h2>
          </div>
          <a href="#/shop?sort_by=rating" class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group">
            <span>Highest Rated</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </a>
        </div>

        <div id="home-featured-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Populated dynamically -->
          <div class="col-span-full py-12 text-center text-slate-400 text-sm">Loading catalog items...</div>
        </div>
      </section>

      <!-- 5. DBMS Academic Showcase Banner -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div class="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="max-w-2xl space-y-4">
            <span class="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              DBMS Cornerstone Evaluation Ready
            </span>
            <h3 class="text-2xl sm:text-3xl font-bold tracking-tight">Need to test MySQL queries or check table schemas?</h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              NexCart includes automated verification endpoints, interactive Swagger UI documentation, and direct MySQL 8.0 schema verification.
            </p>
            <div class="flex flex-wrap items-center gap-4 pt-2">
              <a href="/docs" target="_blank" class="px-5 py-2.5 rounded-full bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>Open FastAPI Swagger Docs</span>
              </a>
              <a href="/api/health/db-tables" target="_blank" class="px-5 py-2.5 rounded-full bg-slate-800/80 text-white text-xs font-bold border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-2">
                <i data-lucide="database" class="w-3.5 h-3.5"></i>
                <span>Inspect All 12 Tables (Live JSON)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: app });
  }

  // Load Categories & Featured Products Asynchronously
  loadCategoryGrid();
  loadFeaturedGrid();
}

/**
 * Load and render categories in home grid
 */
async function loadCategoryGrid() {
  const container = document.getElementById('home-category-grid');
  if (!container) return;

  try {
    const categories = state.categories.length > 0 ? state.categories : await api.categories.list();
    if (!categories || categories.length === 0) {
      container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-sm">No categories found in database.</div>`;
      return;
    }

    container.innerHTML = categories.map(cat => `
      <a href="#/shop?category_id=${cat.category_id}" class="group block p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-300 hover:shadow-lg transition-all text-center">
        <div class="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3 relative">
          <img 
            src="${cat.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80'}" 
            alt="${cat.category_name}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          >
        </div>
        <h4 class="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-brand-600 transition-colors truncate">${cat.category_name}</h4>
        <p class="text-[11px] text-slate-400 mt-0.5">${cat.product_count} ${cat.product_count === 1 ? 'Product' : 'Products'}</p>
      </a>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="col-span-full py-6 text-center text-rose-500 text-xs font-medium">Failed to load categories: ${err.message}</div>`;
  }
}

/**
 * Load and render featured products in home grid
 */
async function loadFeaturedGrid() {
  const container = document.getElementById('home-featured-grid');
  if (!container) return;

  try {
    const products = await api.products.featured(8);
    if (!products || products.length === 0) {
      container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-400 text-sm">No featured products available.</div>`;
      return;
    }

    container.innerHTML = products.map(prod => `
      <div class="product-card group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle">
        
        <!-- Thumbnail & Badges -->
        <a href="#/product/${prod.product_id}" class="relative block aspect-[4/3] bg-slate-100 overflow-hidden">
          <img 
            src="${prod.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'}" 
            alt="${prod.product_name}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          >
          <span class="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/60 shadow-sm">
            ${prod.category_name}
          </span>
          ${!prod.is_in_stock ? `
            <span class="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              Out of Stock
            </span>
          ` : prod.stock_quantity <= 5 ? `
            <span class="absolute top-2.5 right-2.5 bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              Only ${prod.stock_quantity} left
            </span>
          ` : ''}
        </a>

        <!-- Content & Action -->
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="flex items-center text-amber-500">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
              </div>
              <span class="text-xs font-bold text-slate-700">${prod.average_rating > 0 ? prod.average_rating.toFixed(1) : 'New'}</span>
              ${prod.review_count > 0 ? `<span class="text-[11px] text-slate-400">(${prod.review_count})</span>` : ''}
            </div>

            <a href="#/product/${prod.product_id}" class="block font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
              ${prod.product_name}
            </a>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p class="text-base font-extrabold text-slate-900">&#8377;${Number(prod.price).toLocaleString('en-IN')}</p>
            </div>
            
            <button 
              data-add-cart="${prod.product_id}"
              class="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-brand-600 hover:text-white transition-colors"
              title="Add to Shopping Cart"
              ${!prod.is_in_stock ? 'disabled' : ''}
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }

    // Attach "Add to Cart" click handlers
    container.querySelectorAll('[data-add-cart]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const pId = parseInt(btn.getAttribute('data-add-cart'), 10);
        if (!state.isCustomer()) {
          toast.warning('Please sign in as a Customer to add products to your cart.');
          window.location.hash = '#/login';
          return;
        }

        try {
          btn.disabled = true;
          const updatedCart = await api.cart.add(pId, 1);
          state.setCart(updatedCart);
          toast.success('Product added to your shopping cart!');
        } catch (err) {
          toast.error(err.message || 'Could not add product to cart.');
        } finally {
          btn.disabled = false;
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="col-span-full py-6 text-center text-rose-500 text-xs font-medium">Failed to load featured products: ${err.message}</div>`;
  }
}
