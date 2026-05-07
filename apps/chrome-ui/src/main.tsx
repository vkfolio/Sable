import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

if (!window.sable) {
  // Fail loudly — every UI affordance assumes the preload bridge.
  rootEl.textContent = 'Sable preload bridge missing — window.sable is undefined.';
  console.error('window.sable is not defined; preload script did not load.');
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
