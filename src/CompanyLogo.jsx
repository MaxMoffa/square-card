import React, { useState } from 'react';
import { websiteUrl } from './contact.js';

export default function CompanyLogo({ website, company, className = '' }) {
  let origin = '';
  try { if (website.trim()) origin = new URL(websiteUrl(website)).origin; } catch { /* Show initials while the website is incomplete. */ }
  const initials = company.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase() || 'SC';
  return <LogoImage key={origin} origin={origin} company={company} initials={initials} className={className} />;
}

function LogoImage({ origin, company, initials, className }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sources = origin ? [new URL('/favicon.ico', origin).href, `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`] : [];
  const source = sources[sourceIndex];

  return <span className={`company-logo ${className} ${loaded ? 'has-favicon' : ''}`}>
    <span className="company-logo-initials" aria-hidden={loaded || undefined} aria-label={`Logo di ${company || 'azienda'}`}>{initials}</span>
    {source && <img key={source} src={source} alt={`Logo di ${company || 'azienda'}`} referrerPolicy="no-referrer" decoding="async" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setSourceIndex(index => index + 1); }} />}
  </span>;
}
