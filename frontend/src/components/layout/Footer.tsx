import { motion } from 'framer-motion';
import { Github, Twitter, MessageCircle, Globe, Shield, Server, Database, ExternalLink } from 'lucide-react';
import { LunesLogo } from '../common/LunesLogo';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        explore: [
            { label: 'Blocks', href: '/blocks' },
            { label: 'Transactions', href: '/extrinsics' },
            { label: 'Tokens', href: '/tokens' },
            { label: 'Contracts', href: '/contracts' },
            { label: 'NFTs', href: '/nfts' },
        ],
        network: [
            { label: 'Staking', href: '/staking' },
            { label: 'Validators', href: '/staking' },
            { label: 'Rich List', href: '/rich-list' },
            { label: 'Analytics', href: '/analytics' },
        ],
        ecosystem: [
            { label: 'Projects', href: '/projects' },
            { label: 'Register Project', href: '/project/register' },
            { label: 'Verify Project', href: '/project/verify' },
            { label: 'Advertise', href: '/advertise' },
        ],
    };

    const socialLinks = [
        { icon: Globe, href: 'https://lunes.io', label: 'Website' },
        { icon: Twitter, href: 'https://twitter.com/lunesplatform', label: 'Twitter' },
        { icon: MessageCircle, href: 'https://t.me/lunesplatform', label: 'Telegram' },
        { icon: Github, href: 'https://github.com/lunes-platform', label: 'GitHub' },
    ];

    return (
        <footer style={{
            marginTop: 'auto',
            background: 'linear-gradient(180deg, var(--bg-app) 0%, rgba(15, 15, 25, 0.95) 100%)',
            borderTop: '1px solid rgba(108, 56, 255, 0.15)',
            color: 'var(--text-secondary)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute',
                bottom: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(108, 56, 255, 0.08) 0%, transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
            }} />

            <div style={{
                maxWidth: '1440px',
                margin: '0 auto',
                padding: '4rem 2rem 2rem',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '3rem',
                    marginBottom: '3rem',
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ gridColumn: 'span 2' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                            <LunesLogo size={32} />
                            <div>
                                <h4 style={{
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-family-display)',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    margin: 0,
                                }}>
                                    Lunes Explorer
                                </h4>
                                <span style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)',
                                }}>
                                    Deep observability for the Lunes Blockchain
                                </span>
                            </div>
                        </div>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            lineHeight: '1.7',
                            maxWidth: '45ch',
                            color: 'var(--text-muted)',
                            marginBottom: '1.5rem',
                        }}>
                            Providing verifiable transparency for the Lunes ecosystem.
                            Built for developers, validators, and explorers.
                        </p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'rgba(108, 56, 255, 0.1)',
                                        border: '1px solid rgba(108, 56, 255, 0.2)',
                                        color: 'var(--text-secondary)',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(108, 56, 255, 0.2)';
                                        e.currentTarget.style.borderColor = 'rgba(108, 56, 255, 0.4)';
                                        e.currentTarget.style.color = 'var(--color-brand-400)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(108, 56, 255, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(108, 56, 255, 0.2)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                    title={social.label}
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h5 style={{
                            color: 'var(--text-primary)',
                            marginBottom: '1rem',
                            fontSize: 'var(--text-xs)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 600,
                        }}>
                            Explore
                        </h5>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            fontSize: 'var(--text-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}>
                            {footerLinks.explore.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        style={{
                                            color: 'var(--text-muted)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--color-brand-400)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                        }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h5 style={{
                            color: 'var(--text-primary)',
                            marginBottom: '1rem',
                            fontSize: 'var(--text-xs)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 600,
                        }}>
                            Network
                        </h5>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            fontSize: 'var(--text-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}>
                            {footerLinks.network.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        style={{
                                            color: 'var(--text-muted)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--color-brand-400)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                        }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h5 style={{
                            color: 'var(--text-primary)',
                            marginBottom: '1rem',
                            fontSize: 'var(--text-xs)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 600,
                        }}>
                            Ecosystem
                        </h5>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            fontSize: 'var(--text-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}>
                            {footerLinks.ecosystem.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        style={{
                                            color: 'var(--text-muted)',
                                            textDecoration: 'none',
                                            transition: 'color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--color-brand-400)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                        }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                <div style={{
                    padding: '1.5rem 0',
                    borderTop: '1px solid rgba(108, 56, 255, 0.1)',
                    borderBottom: '1px solid rgba(108, 56, 255, 0.1)',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'rgba(108, 56, 255, 0.1)',
                            border: '1px solid rgba(108, 56, 255, 0.2)',
                            borderRadius: '8px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                        }}>
                            <Server size={14} />
                            Mainnet Shard
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'rgba(108, 56, 255, 0.1)',
                            border: '1px solid rgba(108, 56, 255, 0.2)',
                            borderRadius: '8px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                        }}>
                            <Database size={14} />
                            Archive Nodes
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'rgba(108, 56, 255, 0.1)',
                            border: '1px solid rgba(108, 56, 255, 0.2)',
                            borderRadius: '8px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                        }}>
                            <Shield size={14} />
                            SSL Secure
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: 'var(--text-sm)',
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--color-success)',
                            boxShadow: '0 0 8px var(--color-success)',
                        }} />
                        <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                            All Systems Operational
                        </span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                }}>
                    <p style={{ margin: 0 }}>
                        © {currentYear} Lunes Explorer. Built with precision.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <a
                            href="https://lunes.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-brand-400)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                        >
                            lunes.io
                            <ExternalLink size={12} />
                        </a>
                        <span>|</span>
                        <span>Powered by SubQuery</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
