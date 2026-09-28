import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Map from './pages/Map';
import './styles.css';
function App() {
    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const syncRoute = () => setHash(window.location.hash);
        window.addEventListener('hashchange', syncRoute);
        return () => window.removeEventListener('hashchange', syncRoute);
    }, []);

    // The authentication owner can render <Dashboard token={token_acesso} />.
    if (hash === '#/admin') return <Admin />;
    if (hash === '#/mapa') return <Map />;
    return <Dashboard />;
}
createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
