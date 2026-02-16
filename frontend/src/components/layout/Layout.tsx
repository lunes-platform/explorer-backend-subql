import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <a
                href="#main-content"
                className="skip-to-content"
                style={{
                    position: 'absolute',
                    top: '-100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    padding: '8px 24px',
                    background: 'var(--color-brand-600)',
                    color: '#fff',
                    borderRadius: '0 0 8px 8px',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'top 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.top = '0'; }}
                onBlur={(e) => { e.currentTarget.style.top = '-100%'; }}
            >
                Skip to main content
            </a>
            <Header />
            <main id="main-content" role="main" className="container" style={{ flex: 1, paddingBottom: '3rem', paddingTop: '2rem' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
