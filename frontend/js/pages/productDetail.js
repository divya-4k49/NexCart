/**
 * Single Product Details Page Component
 */

import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from '../components/toast.js';

export async function renderProductDetailPage(productId) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div id="product-detail-container" class="space-y-12">
        <div class="py-24 text-center text-slate-400">Loading product details from MySQL...</div>
      </div>
    </div>
  `;

  try {
    const prod = await api.products.get(productId);
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    let selectedQty = 1;
    const maxStock = prod.stock_quantity || 0;

    container.innerHTML = `
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-slate-500">
        <a href="#/" class="hover:text-brand-600 transition-colors">Home</a>
        <span>/</span>
        <a href="#/shop" class="hover:text-brand-600 transition-colors">Shop</a>
        <span>/</span>
        <a href="#/shop?category_id=${prod.category_id}" class="hover:text-brand-600 transition-colors">${prod.category_name}</a>
        <span>/</span>
        <span class="text-slate-800 font-semibold truncate max-w-xs">${prod.product_name}</span>
      </nav>

      <!-- Main Product Grid: Gallery + Purchasing Card -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <!-- Left: Image Gallery -->
        <div class="lg:col-span-6 space-y-4">
          <div class="aspect-[4/3] rounded-3xl bg-slate-100 border border-slate-200/80 overflow-hidden shadow-sm relative">
            <img 
              src="${prod.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'}" 
              alt="${prod.product_name}"
              class="w-full h-full object-cover object-center"
            >
            <span class="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 border border-slate-200 shadow-sm">
              ${prod.category_name}
            </span>
          </div>
          
          <div class="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-center justify-between text-xs text-brand-900">
            <div class="flex items-center gap-2">
              <i data-lucide="database" class="w-4 h-4 text-brand-600"></i>
              <span class="font-medium">1:1 Normalized Relational Entity: <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-brand-200">inventory</code></span>
            </div>
            <span class="font-bold text-brand-700">${prod.stock_quantity} Units in Warehouse</span>
          </div>
        </div>

        <!-- Right: Purchasing & Stock Details -->
        <div class="lg:col-span-6 space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center text-amber-500">
                ${[1, 2, 3, 4, 5].map(star => `
                  <i data-lucide="star" class="w-4 h-4 ${star <= Math.round(prod.average_rating) ? 'fill-current' : 'text-slate-200'}"></i>
                `).join('')}
              </div>
              <span class="text-sm font-bold text-slate-800">${prod.average_rating > 0 ? prod.average_rating.toFixed(1) : 'New Product'}</span>
              <span class="text-xs text-slate-400">(${prod.review_count} verified ${prod.review_count === 1 ? 'review' : 'reviews'})</span>
            </div>

            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">${prod.product_name}</h1>
            <p class="text-xs text-slate-400 mt-1 font-mono">SKU / Slug: ${prod.slug}</p>
          </div>

          <!-- Price & Stock Indicator -->
          <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-400 font-medium uppercase tracking-wider">Inclusive of all taxes</span>
              <p class="text-3xl font-extrabold text-slate-900">&#8377;${Number(prod.price).toLocaleString('en-IN')}</p>
            </div>
            <div>
              ${prod.is_in_stock ? `
                <div class="text-right">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                    In Stock (${prod.stock_quantity} available)
                  </span>
                  ${prod.stock_quantity <= prod.low_stock_threshold ? `
                    <p class="text-[10px] text-amber-600 font-semibold mt-1">Low Stock Alert (≤ ${prod.low_stock_threshold})</p>
                  ` : ''}
                </div>
              ` : `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  <span class="w-2 h-2 rounded-full bg-rose-600"></span>
                  Out of Stock
                </span>
              `}
            </div>
          </div>

          <!-- Product Description -->
          <div class="space-y-2">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Description & Specifications</h3>
            <p class="text-sm text-slate-600 leading-relaxed">${prod.description || 'No description provided.'}</p>
          </div>

          <!-- Quantity Selector & Cart CTA -->
          ${prod.is_in_stock ? `
            <div class="pt-4 border-t border-slate-200/80 space-y-4">
              <div class="flex items-center gap-4">
                <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</label>
                <div class="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                  <button id="qty-decrement" class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
                    <i data-lucide="minus" class="w-4 h-4"></i>
                  </button>
                  <span id="qty-display" class="w-12 text-center text-sm font-bold text-slate-900">${selectedQty}</span>
                  <button id="qty-increment" class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                  </button>
                </div>
                <span class="text-xs text-slate-400">Max ${maxStock} units</span>
              </div>

              <div class="flex items-center gap-4">
                <button 
                  id="btn-add-to-cart" 
                  class="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-brand-600 text-white font-bold text-sm shadow-md hover:bg-brand-700 transition-all transform hover:-translate-y-0.5"
                >
                  <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                  <span>Add to Cart &bull; &#8377;<span id="btn-cart-total">${Number(prod.price).toLocaleString('en-IN')}</span></span>
                </button>
                <a 
                  href="#/cart" 
                  class="p-3.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                  title="Go to Cart"
                >
                  <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </a>
              </div>
            </div>
          ` : `
            <div class="p-4 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium text-center">
              This product is currently sold out. Check back soon for inventory restocks.
            </div>
          `}

        </div>
      </div>

      <!-- Reviews Section -->
      <section class="mt-16 pt-12 border-t border-slate-200 space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Verified Customer Reviews</h2>
            <p class="text-xs text-slate-500 mt-0.5">Enforced with Verified Purchase checks via <code class="font-mono text-brand-700">order_details</code> table in MySQL.</p>
          </div>
          
          ${state.isCustomer() ? `
            <button id="btn-toggle-review-form" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-600 text-xs font-semibold shadow-sm transition-all flex items-center gap-2">
              <i data-lucide="pen-line" class="w-3.5 h-3.5"></i>
              <span>Write a Review</span>
            </button>
          ` : `
            <p class="text-xs text-slate-400">Sign in as a customer who purchased this item to leave a review.</p>
          `}
        </div>

        <!-- Write Review Form Modal/Drawer -->
        <div id="review-form-container" class="hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-4">
          <h4 class="text-sm font-bold text-slate-900">Share your product experience</h4>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
              <select id="review-input-rating" class="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200">
                <option value="5">★★★★★ (5 Stars - Excellent)</option>
                <option value="4">★★★★☆ (4 Stars - Very Good)</option>
                <option value="3">★★★☆☆ (3 Stars - Average)</option>
                <option value="2">★★☆☆☆ (2 Stars - Below Average)</option>
                <option value="1">★☆☆☆☆ (1 Star - Poor)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Your Feedback</label>
              <textarea id="review-input-comment" rows="3" placeholder="How is the performance, build quality, or battery life?" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"></textarea>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button id="btn-submit-review" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors">
                Post Verified Review
              </button>
              <button id="btn-cancel-review" class="px-4 py-2.5 rounded-xl text-slate-500 text-xs font-medium hover:text-slate-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="space-y-4">
          ${prod.reviews && prod.reviews.length > 0 ? prod.reviews.map(rev => `
            <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center uppercase">
                    ${rev.customer_name?.charAt(0) || 'C'}
                  </div>
                  <span class="text-xs font-bold text-slate-900">${rev.customer_name}</span>
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <i data-lucide="check" class="w-3 h-3"></i> Verified Buyer
                  </span>
                </div>
                <div class="flex items-center text-amber-500">
                  ${[1, 2, 3, 4, 5].map(s => `
                    <i data-lucide="star" class="w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-slate-200'}"></i>
                  `).join('')}
                </div>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed pl-9">${rev.comment || 'No comment provided.'}</p>
            </div>
          `).join('') : `
            <div class="py-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80 p-6">
              No reviews yet for this product. Be the first verified purchaser to share feedback!
            </div>
          `}
        </div>
      </section>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }

    // Bind Quantity Buttons
    const qtyDisplay = document.getElementById('qty-display');
    const btnTotal = document.getElementById('btn-cart-total');

    document.getElementById('qty-decrement')?.addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty--;
        if (qtyDisplay) qtyDisplay.textContent = selectedQty;
        if (btnTotal) btnTotal.textContent = (Number(prod.price) * selectedQty).toLocaleString('en-IN');
      }
    });

    document.getElementById('qty-increment')?.addEventListener('click', () => {
      if (selectedQty < maxStock) {
        selectedQty++;
        if (qtyDisplay) qtyDisplay.textContent = selectedQty;
        if (btnTotal) btnTotal.textContent = (Number(prod.price) * selectedQty).toLocaleString('en-IN');
      } else {
        toast.warning(`Maximum available warehouse stock is ${maxStock} units.`);
      }
    });

    // Bind Add to Cart
    document.getElementById('btn-add-to-cart')?.addEventListener('click', async () => {
      if (!state.isCustomer()) {
        toast.warning('Please sign in as a Customer to add products to your cart.');
        window.location.hash = '#/login';
        return;
      }

      try {
        const updatedCart = await api.cart.add(prod.product_id, selectedQty);
        state.setCart(updatedCart);
        toast.success(`Added ${selectedQty}x ${prod.product_name} to cart!`);
      } catch (err) {
        toast.error(err.message || 'Could not add to cart.');
      }
    });

    // Bind Review Form Toggle
    const reviewForm = document.getElementById('review-form-container');
    document.getElementById('btn-toggle-review-form')?.addEventListener('click', () => {
      reviewForm?.classList.toggle('hidden');
    });
    document.getElementById('btn-cancel-review')?.addEventListener('click', () => {
      reviewForm?.classList.add('hidden');
    });

    // Bind Review Submission
    document.getElementById('btn-submit-review')?.addEventListener('click', async () => {
      const rating = parseInt(document.getElementById('review-input-rating')?.value, 10);
      const comment = document.getElementById('review-input-comment')?.value?.trim();

      try {
        await api.reviews.submit({
          product_id: prod.product_id,
          rating,
          comment
        });
        toast.success('Your verified review has been published!');
        renderProductDetailPage(productId);
      } catch (err) {
        toast.error(err.message || 'Failed to submit review.');
      }
    });

  } catch (err) {
    app.innerHTML = `
      <div class="max-w-md mx-auto py-24 text-center space-y-4">
        <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <i data-lucide="alert-circle" class="w-6 h-6"></i>
        </div>
        <h2 class="text-lg font-bold text-slate-900">Product Not Found</h2>
        <p class="text-xs text-slate-500">${err.message}</p>
        <a href="#/shop" class="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors">
          Return to Catalog
        </a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ root: app });
  }
}
