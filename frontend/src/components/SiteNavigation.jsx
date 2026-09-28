import React from 'react';

const items = [
    { id: 'dashboard', href: '#/', label: 'Dashboard' },
    { id: 'mapa', href: '#/mapa', label: 'Mapa' },
];

export default function SiteNavigation({ active }) {
    return (
        <nav className="site-nav" aria-label="Navegação principal">
            {items.map((item) => (
                <a
                    key={item.id}
                    href={item.href}
                    aria-current={active === item.id ? 'page' : undefined}
                >
                    {item.label}
                </a>
            ))}
        </nav>
    );
}
