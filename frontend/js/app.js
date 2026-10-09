/**
 * NexCart Application Entry Point
 * Bootstraps global state, components, and router.
 */

import { api } from './api.js';
import { state } from './state.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { initRouter } from './router.js';
import { toast } from './components/toast.js';

async function bootstrap() {
  console.log('[NexCart] Initializing application...');

  // 1. Initial Render of Chrome (Navbar & Footer)
  renderNavbar();
  renderFooter();

  // 2. Subscribe Navbar to State Changes (Cart Badge & Auth)
  state.subscribe((event) => {
    if (event === 'AUTH_CHANGED' || event === 'CART_UPDATED' || event === 'INIT_COMPLETE') {
      renderNavbar();
    }
  });

  // 3. Test Backend & MySQL Connection
  try {
    const health = await api.health.check();
    if (health.status === 'healthy') {
      console.log(`[NexCart] Connected to MySQL 8.0: ${health.database.database} (v${health.database.version})`);
    } else {
      console.warn('[NexCart] Backend running with degraded database status.');
    }
  } catch (err) {
    console.error('[NexCart] Backend connection check failed:', err);
    toast.error('Could not connect to FastAPI backend server. Please verify "python run.py" is running on port 8000.', 7000);
  }

  // 4. Initialize Global State (Session & Cart)
  await state.init();

  // 5. Initialize SPA Client-side Router
  initRouter();
}

// Start application
bootstrap();
