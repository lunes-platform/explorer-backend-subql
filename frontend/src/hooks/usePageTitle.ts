import { useEffect } from 'react';

const BASE_TITLE = 'Lunes Explorer';
const BASE_DESC = 'Explore the Lunes blockchain in real-time. View blocks, transactions, accounts, tokens, NFTs, staking, validators, smart contracts, and analytics.';

function setMetaTag(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Blockchain Explorer for Lunes Network`;
    const desc = description || BASE_DESC;

    document.title = fullTitle;

    // Update meta tags dynamically
    setMetaTag('description', desc);
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', desc, true);
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', desc);

    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      canonical.href = window.location.href.split('?')[0];
    }

    return () => {
      document.title = `${BASE_TITLE} — Blockchain Explorer for Lunes Network`;
      setMetaTag('description', BASE_DESC);
      setMetaTag('og:title', `${BASE_TITLE} — Blockchain Explorer for Lunes Network`, true);
      setMetaTag('og:description', BASE_DESC, true);
    };
  }, [title, description]);
}
