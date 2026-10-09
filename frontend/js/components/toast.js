/**
 * Toast Notification System
 * Lightweight floating notification manager.
 */

export const toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Icon and Color Theme Mapping
    const configs = {
      success: {
        bg: 'bg-emerald-600',
        text: 'text-white',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
      },
      error: {
        bg: 'bg-rose-600',
        text: 'text-white',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
      },
      warning: {
        bg: 'bg-amber-500',
        text: 'text-slate-900',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      },
      info: {
        bg: 'bg-slate-800',
        text: 'text-white',
        icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      }
    };

    const config = configs[type] || configs.info;

    const el = document.createElement('div');
    el.id = id;
    el.className = `${config.bg} ${config.text} pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg toast-enter transition-all select-none text-sm font-medium`;
    el.innerHTML = `
      <div class="flex-shrink-0 mt-0.5">${config.icon}</div>
      <div class="flex-1 break-words">${message}</div>
      <button class="flex-shrink-0 text-white/70 hover:text-white transition-colors ml-1 focus:outline-none" aria-label="Close">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    // Close button handler
    const closeBtn = el.querySelector('button');
    const dismiss = () => {
      el.classList.remove('toast-enter');
      el.classList.add('toast-exit');
      setTimeout(() => el.remove(), 220);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(el);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  },

  success(msg, dur) { this.show(msg, 'success', dur); },
  error(msg, dur) { this.show(msg, 'error', dur); },
  warning(msg, dur) { this.show(msg, 'warning', dur); },
  info(msg, dur) { this.show(msg, 'info', dur); }
};
