/**
 * Catalog & Shop Browsing Page Component with Dynamic Filters
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderShopPage(queryParams = {}) {
  const app = document.getElementById('app');
  if (!app) return;

  const categories = state.categories.length > 0 ? state.categories : await api.categories.list();

  // Active filter state
  let currentFilters = {
    search: queryParams.search || '',
    category_id: queryParams.category_id || '',
    min_price: queryParams.min_price || '',
    max_price: queryParams.max_price || '',
    min_rating: queryParams.min_rating || '',
    in_stock: queryParams.in_stock !== undefined ? queryParams.in_stock : '',
    sort_by: queryParams.sort_by || 'newest',
    page: parseInt(queryParams.page, 10) || 1,
    limit: 12,
  };

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      
      <!-- Breadcrumb & Header -->
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <a href="#/" class="hover:text-brand-600 transition-colors">Home</a>
          <span>/</span>
          <span class="text-slate-800 font-semibold">Product Catalog</span>
        </nav>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Catalog & Storefront</h1>
            <p class="text-sm text-slate-500 mt-1">Explore 14 curated high-performance tech devices.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Sort by:</span>
            <select id="shop-sort-select" class="bg-white border border-slate-200 text-sm rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-200">
              <option value="newest" ${currentFilters.sort_by === 'newest' ? 'selected' : ''}>Newest Arrivals</option>
              <option value="price_asc" ${currentFilters.sort_by === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price_desc" ${currentFilters.sort_by === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="rating" ${currentFilters.sort_by === 'rating' ? 'selected' : ''}>Customer Rating</option>
              <option value="name_asc" ${currentFilters.sort_by === 'name_asc' ? 'selected' : ''}>Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Layout: Sidebar Filters + Products Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Filter Sidebar -->
        <aside class="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i data-lucide="sliders-horizontal" class="w-4 h-4 text-brand-600"></i>
              <span>Filter Catalog</span>
            </h3>
            <button id="shop-clear-filters" class="text-xs text-brand-600 hover:text-brand-800 font-medium">Reset</button>
          </div>

          <!-- Keyword Search -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Search</label>
            <div class="relative">
              <input 
                type="text" 
                id="filter-search" 
                value="${currentFilters.search}" 
                placeholder="Name or specs..." 
                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
              <div class="absolute left-2.5 top-2.5 text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
            </div>
          </div>

          <!-- Categories Radio List -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Categories</label>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2.5 text-sm text-slate-700 hover:text-brand-600 cursor-pointer">
                <input type="radio" name="filter-category" value="" ${!currentFilters.category_id ? 'checked' : ''} class="text-brand-600 focus:ring-brand-500">
                <span class="flex-1">All Departments</span>
              </label>
              ${categories.map(c => `
                <label class="flex items-center gap-2.5 text-sm text-slate-700 hover:text-brand-600 cursor-pointer">
                  <input type="radio" name="filter-category" value="${c.category_id}" ${String(currentFilters.category_id) === String(c.category_id) ? 'checked' : ''} class="text-brand-600 focus:ring-brand-500">
                  <span class="flex-1 truncate">${c.category_name}</span>
                  <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">${c.product_count}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Price Boundaries -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Price Range (&#8377;)</label>
            <div class="grid grid-cols-2 gap-2">
              <input type="number" id="filter-min-price" placeholder="Min" value="${currentFilters.min_price}" min="0" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200">
              <input type="number" id="filter-max-price" placeholder="Max" value="${currentFilters.max_price}" min="0" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200">
            </div>
          </div>

          <!-- Minimum Rating Filter -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Minimum Rating</label>
            <select id="filter-rating" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200">
              <option value="" ${!currentFilters.min_rating ? 'selected' : ''}>All Ratings</option>
              <option value="4.0" ${currentFilters.min_rating === '4.0' ? 'selected' : ''}>★ 4.0 Stars & above</option>
              <option value="4.5" ${currentFilters.min_rating === '4.5' ? 'selected' : ''}>★ 4.5 Stars & above</option>
            </select>
          </div>

          <!-- In-Stock Filter Checkbox -->
          <div>
            <label class="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-600 cursor-pointer">
              <input type="checkbox" id="filter-instock" ${currentFilters.in_stock === 'true' || currentFilters.in_stock === true ? 'checked' : ''} class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500">
              <span>In-Stock Items Only</span>
            </label>
          </div>

          <button id="btn-apply-filters" class="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all">
            Apply Filters
          </button>
        </aside>

        <!-- Right Product Grid Area -->
        <main class="lg:col-span-9 space-y-6">
          <div id="shop-products-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full py-20 text-center text-slate-400">Loading catalog...</div>
          </div>

          <!-- Pagination Container -->
          <div id="shop-pagination" class="flex items-center justify-between border-t border-slate-200 pt-6"></div>
        </main>

      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: app });
  }

  // Trigger data load
  await fetchAndRenderProducts(currentFilters);

  // Bind Listeners
  document.getElementById('shop-sort-select')?.addEventListener('change', (e) => {
    currentFilters.sort_by = e.target.value;
    currentFilters.page = 1;
    fetchAndRenderProducts(currentFilters);
  });

  document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
    currentFilters.search = document.getElementById('filter-search')?.value?.trim() || '';
    const selectedCat = document.querySelector('input[name="filter-category"]:checked');
    currentFilters.category_id = selectedCat ? selectedCat.value : '';
    currentFilters.min_price = document.getElementById('filter-min-price')?.value?.trim() || '';
    currentFilters.max_price = document.getElementById('filter-max-price')?.value?.trim() || '';
    currentFilters.min_rating = document.getElementById('filter-rating')?.value || '';
    currentFilters.in_stock = document.getElementById('filter-instock')?.checked ? 'true' : '';
    currentFilters.page = 1;
    fetchAndRenderProducts(currentFilters);
  });

  document.getElementById('shop-clear-filters')?.addEventListener('click', () => {
    currentFilters = {
      search: '',
      category_id: '',
      min_price: '',
      max_price: '',
      min_rating: '',
      in_stock: '',
      sort_by: 'newest',
      page: 1,
      limit: 12
    };
    renderShopPage(currentFilters);
  });
}

/**
 * Fetch and render products with live controls
 */
async function fetchAndRenderProducts(filters) {
  const container = document.getElementById('shop-products-container');
  const paginationContainer = document.getElementById('shop-pagination');
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full py-20 flex flex-col items-center justify-center gap-3">
      <div class="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      <p class="text-xs text-slate-500 font-medium">Filtering catalog in MySQL...</p>
    </div>
  `;

  try {
    const res = await api.products.list(filters);
    const items = res.items || [];
    const total = res.total || 0;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80 p-8">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="package-search" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800">No products match your criteria</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">Try resetting filters, lowering price boundaries, or using a broader search keyword.</p>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      if (window.lucide) window.lucide.createIcons({ root: container });
      return;
    }

    container.innerHTML = items.map(prod => `
      <div class="product-card group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle">
        
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

    // Pagination Controls
    if (paginationContainer) {
      paginationContainer.innerHTML = `
        <div class="text-xs text-slate-500">
          Showing <span class="font-bold text-slate-800">${items.length}</span> of <span class="font-bold text-slate-800">${total}</span> products
        </div>
        <div class="flex items-center gap-2">
          <button id="shop-prev-page" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" ${res.page <= 1 ? 'disabled' : ''}>
            Previous
          </button>
          <span class="text-xs font-semibold text-slate-600">Page ${res.page} of ${res.total_pages || 1}</span>
          <button id="shop-next-page" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" ${res.page >= res.total_pages ? 'disabled' : ''}>
            Next
          </button>
        </div>
      `;

      document.getElementById('shop-prev-page')?.addEventListener('click', () => {
        if (filters.page > 1) {
          filters.page--;
          fetchAndRenderProducts(filters);
        }
      });

      document.getElementById('shop-next-page')?.addEventListener('click', () => {
        if (filters.page < res.total_pages) {
          filters.page++;
          fetchAndRenderProducts(filters);
        }
      });
    }

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }

    // Bind Add to Cart
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
    container.innerHTML = `<div class="col-span-full py-8 text-center text-rose-500 text-sm">Failed to load catalog: ${err.message}</div>`;
  }
}
