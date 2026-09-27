import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import './styles.css';
// The authentication owner can render <Dashboard token={token_acesso} />.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.hash === '#/admin' ? <Admin /> : <Dashboard />}
  </React.StrictMode>,
);
