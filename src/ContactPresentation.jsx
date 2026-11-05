import React from 'react';
import { ArrowDown, DownloadSimple as ArrowDownTray, ArrowUpRight, DeviceMobile, Envelope, Globe, PencilSimple, Phone, ShareNetwork, SquaresFour } from '@phosphor-icons/react';
import { websiteUrl } from './contact.js';
import CompanyLogo from './CompanyLogo.jsx';
import './presentation.css';

export default function ContactPresentation({ contact, theme, qr, onSave, onShare, onNearby, onQR }) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  let website = '';
  try { website = websiteUrl(contact.website); } catch { /* Invalid drafts remain editable. */ }

  return <main className={`card-page ${theme}`} aria-label="Il mio biglietto da visita">
    <section className={`signature-shell ${theme}`} aria-label={`Biglietto di ${fullName}`}>
      <div className="signature-surface">
        <div className="signature-top">
          <div className="signature-company"><CompanyLogo website={contact.website} company={contact.company} className="signature-monogram" /><span>{contact.company || 'La tua azienda'}</span></div>
          <span className="signature-brand"><SquaresFour size={18} weight="fill" /><span>square.</span></span>
        </div>
        <div className="signature-body">
          <div className="signature-identity">
            <h1 className="signature-name" title={fullName}><span>{contact.firstName || 'Nome'}</span><span>{contact.lastName || 'Cognome'}<b>.</b></span></h1>
            {contact.title && <p className="signature-title">{contact.title}</p>}
            <div className="signature-contact-links">
              {contact.email && <a href={`mailto:${contact.email}`} title={contact.email}><Envelope size={18} weight="light" /><span>{contact.email}</span><ArrowUpRight size={13} /></a>}
              {contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={18} weight="light" /><span>{contact.phone}</span><ArrowUpRight size={13} /></a>}
              {website && <a href={website} target="_blank" rel="noreferrer" title={contact.website}><Globe size={18} weight="light" /><span>{contact.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</span><ArrowUpRight size={13} /></a>}
            </div>
          </div>
          <div className="signature-qr-area">
            <div className="signature-orbit" aria-hidden="true"><span /><span /><span /></div>
            <div className="signature-qr-content">
              <span className="signature-qr-label">IL PIACERE DI RESTARE IN CONTATTO<ArrowDown size={13} /></span>
              <button className="signature-qr-frame" onClick={onQR} aria-label="Mostra QR Code" title="Ingrandisci QR Code">{qr}<span className="signature-qr-corner" aria-hidden="true"><ArrowUpRight size={16} /></span></button>
              <p className="signature-qr-caption">Inquadra. Salva.<span>Ci sentiamo presto.</span></p>
            </div>
          </div>
        </div>
        <div className="signature-footer">
          <div className="signature-actions" aria-label="Condividi il contatto">
            <button className="signature-save" onClick={onSave} aria-label="Salva contatto in rubrica"><span>Salva contatto</span><span className="signature-button-icon"><ArrowDownTray size={19} weight="light" /></span></button>
            <button className="signature-send" onClick={onShare} aria-label="Condividi biglietto"><ShareNetwork size={19} weight="light" /><span>Invia contatto</span></button>
            <button className="signature-nearby" onClick={onNearby} aria-label="Condividi tra telefoni" title="Condividi tra telefoni"><DeviceMobile size={21} weight="light" /><span>Tra telefoni</span></button>
          </div>
          <a className="personalize-link" href="#/personalizza" aria-label="Personalizza biglietto"><PencilSimple size={16} weight="light" /><span>Personalizza</span></a>
        </div>
      </div>
    </section>
  </main>;
}
