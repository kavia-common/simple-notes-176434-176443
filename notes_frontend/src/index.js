import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// One-time startup diagnostic (non-secret). Logs Supabase URL host if present.
(function logSupabaseUrlHost() {
  try {
    const raw =
      process.env.REACT_APP_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      '';
    if (raw) {
      const url = new URL(raw.replace(/^http:\/\//i, 'https://'));
      // eslint-disable-next-line no-console
      console.info(`[Startup] Using Supabase URL host: ${url.host}`);
    } else {
      // eslint-disable-next-line no-console
      console.warn('[Startup] No Supabase URL configured. App will load with empty state.');
    }
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[Startup] Supabase URL could not be parsed. Check your .env value.');
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
