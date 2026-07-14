'use client';

import { useEffect } from 'react';

/**
 * Regista o service worker do PWA. Só em produção, para não interferir com o
 * hot-reload/caching durante o desenvolvimento.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return undefined;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* silencioso — a app continua a funcionar sem o SW */
      });
    };

    if (document.readyState === 'complete') {
      register();
      return undefined;
    }

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
