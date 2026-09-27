import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import './styles.css';
function App() {
    const [path, setPath] = React.useState(window.location.hash);
    React.useEffect(() => {
        const update = () => setPath(window.location.hash);
        window.addEventListener('hashchange', update);
        return () => window.removeEventListener('hashchange', update);
    }, []);
    return path === '#/mapa' ? <Map /> : <Dashboard />;
}
createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
