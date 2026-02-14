import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '4rem 2rem',
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-secondary)'
        }}>
            <div style={{
                maxWidth: '1440px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '3rem'
            }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-family-display)' }}>Lunes Protocol</h4>
                    <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6', maxWidth: '35ch' }}>
                        Providing deep observability and verifiable transparency for the Lunes Blockchain ecosystem. Built for developers, validators, and explorers.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', gap: '4rem' }}>
                    <div>
                        <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Infrastructure</h5>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>Mainnet Shard</li>
                            <li>Archive Nodes</li>
                            <li>SubQuery Indexer</li>
                        </ul>
                    </div>
                    <div>
                        <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authority</h5>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{
                                padding: '4px 8px',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                SSL SECURE
                            </div>
                            <div style={{
                                padding: '4px 8px',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                NODE v1.2.0
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                maxWidth: '1440px',
                margin: '3rem auto 0',
                paddingTop: '2rem',
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 'var(--text-xs)'
            }}>
                <p>Lunes Explorer © {new Date().getFullYear()} Precision Engineering.</p>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <span style={{ color: 'var(--color-success)' }}>● System Status: Operational</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
