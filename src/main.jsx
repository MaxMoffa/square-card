import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DownloadSimple as ArrowDownTray, ArrowRight, ArrowSquareOut, Briefcase, CaretDown, Check, CheckCircle, Copy, CreditCard, DeviceMobile, Envelope, Fingerprint, Globe, Info, Leaf, LinkSimple, LockSimple, PencilSimple, Phone, QrCode, ShareNetwork, Sparkle, SquaresFour, Tag, User, WifiHigh, X } from '@phosphor-icons/react';
import QRCode from 'qrcode';
import { contactFile, createVCard, defaultContact, downloadFile, websiteUrl } from './contact.js';
import './styles.css';
import ContactPresentation from './ContactPresentation.jsx';
import CompanyLogo from './CompanyLogo.jsx';

const themes = [
  { id: 'essential', name: 'Essential', description: 'Naturale. Essenziale. Tuo.', tag: 'Il più scelto', color: '#244b40' },
  { id: 'studio', name: 'Studio', description: 'Un carattere che si nota.', tag: 'Creativo', color: '#ee765e' },
  { id: 'executive', name: 'Executive', description: 'Lascia il segno, con discrezione.', tag: 'Elegante', color: '#272833' },
];
const STORAGE_KEY = 'square-contact-v1';
const currentPage = () => window.location.hash === '#/personalizza' ? 'personalizza' : 'biglietto';
function initialData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { contact: Object.fromEntries(Object.entries(defaultContact).map(([key, value]) => [key, typeof saved?.contact?.[key] === 'string' ? saved.contact[key].slice(0, 120) : value])), theme: themes.some(t => t.id === saved?.theme) ? saved.theme : 'essential' };
  } catch { return { contact: defaultContact, theme: 'essential' }; }
}
function QR({ value, className = '', size = 220 }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setSrc(''); setError(false);
    QRCode.toDataURL(value, { width: size * 2, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#183c32', light: '#ffffff' } }).then(url => { if (active) setSrc(url); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [value, size]);
  return <div className={`qr ${className}`} aria-busy={!src && !error}>{src ? <img src={src} alt="QR Code del contatto in formato vCard" width={size} height={size} /> : <span>{error ? 'QR non disponibile: riduci i dati.' : <QrCode size={32} />}</span>}</div>;
}
function BusinessCard({ contact, theme, vcard, mini = false }) {
  return <div className={`business-card ${theme} ${mini ? 'mini' : ''}`}>
    <div className="card-top"><CompanyLogo website={contact.website} company={contact.company} className="card-avatar" /><span className="card-company">{contact.company || 'La tua azienda'}</span><WifiHigh className="card-nfc" size={25} weight="light" /></div>
    <div className="card-watermark" aria-hidden="true">{contact.firstName.charAt(0).toLowerCase() || 's'}<span>.</span></div>
    <div className="card-bottom"><div className="card-person"><h2>{contact.firstName || 'Nome'}<br />{contact.lastName || 'Cognome'}<span className="name-period">.</span></h2><p>{contact.title || 'Il tuo ruolo'}</p><div className="card-email">{contact.email || 'La tua email'}</div></div>{mini ? <div className="mini-qr"><QrCode weight="regular" /></div> : <QR value={vcard} size={120} />}</div>
    <div className="card-footer"><span>FACCIAMO CONNESSIONE</span><span>square <span className="little-square">▧</span></span></div>
  </div>;
}
function App() {
  const [initial] = useState(initialData);
  const [page, setPage] = useState(currentPage);
  const [contact, setContactState] = useState(initial.contact);
  const [theme, setThemeState] = useState(initial.theme);
  const profileRef = useRef(initial);
  const [view, setView] = useState('card');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState('saved');
  const [nfcStatus, setNfcStatus] = useState('idle');
  const [nfcError, setNfcError] = useState('');
  const [consent, setConsent] = useState(false);
  const firstNameRef = useRef(null);
  const dialogRef = useRef(null);
  const abortRef = useRef(null);
  const shareLock = useRef(false);
  const pendingValidation = useRef(false);
  const nfcSupported = 'NDEFReader' in window && window.isSecureContext;
  let vcard = '', invalidWebsite = false;
  try { vcard = createVCard(contact); } catch { invalidWebsite = true; vcard = createVCard({ ...contact, website: '' }); }
  const valid = !!(contact.firstName.trim() && contact.lastName.trim() && contact.company.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) && /^[+\d][\d\s().-]{5,}$/.test(contact.phone) && !invalidWebsite);

  useEffect(() => {
    const onHashChange = () => { setPage(currentPage()); setModal(null); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('card-view', page === 'biglietto');
    document.title = page === 'biglietto' ? `${contact.firstName} ${contact.lastName} · Square` : 'Personalizza il biglietto · Square';
    if (page === 'personalizza' && pendingValidation.current) {
      pendingValidation.current = false;
      document.querySelector('#contact-form')?.reportValidity();
    }
    return () => document.documentElement.classList.remove('card-view');
  }, [page, contact.firstName, contact.lastName]);

  // Persist inside the edit event so closing the tab cannot cancel a pending save.
  function persistProfile(profile) {
    profileRef.current = profile;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); setSaved('saved'); }
    catch { setSaved('error'); }
  }
  function setContact(update) {
    const next = typeof update === 'function' ? update(profileRef.current.contact) : update;
    persistProfile({ ...profileRef.current, contact: next });
    setContactState(next);
  }
  function setTheme(next) {
    persistProfile({ ...profileRef.current, theme: next });
    setThemeState(next);
  }
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && dialog && !dialog.open) dialog.showModal();
    if (!modal && dialog?.open) dialog.close();
    if (modal !== 'nfc') { abortRef.current?.abort(); setNfcStatus('idle'); setNfcError(''); setConsent(false); }
  }, [modal]);
  useEffect(() => () => abortRef.current?.abort(), []);

  function validate() {
    if (valid) return true;
    setModal(null);
    if (page === 'biglietto') { pendingValidation.current = true; navigate('personalizza'); }
    else document.querySelector('#contact-form')?.reportValidity();
    setToast('Completa nome, cognome, azienda, email e telefono validi.');
    return false;
  }
  function download() {
    if (!validate()) return;
    downloadFile(contactFile(contact));
    setToast('Contatto scaricato. Apri il file .vcf per salvarlo in rubrica.');
  }
  async function share() {
    if (!validate() || shareLock.current) return;
    const file = contactFile(contact);
    shareLock.current = true;
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: `${contact.firstName} ${contact.lastName}` });
      else { downloadFile(file); setToast('File .vcf pronto: puoi inviarlo via email, WhatsApp o messaggio.'); }
    } catch (error) { if (error.name !== 'AbortError') setToast('Condivisione non riuscita. Puoi scaricare il contatto.'); }
    finally { shareLock.current = false; }
  }
  async function copy() {
    if (!validate()) return;
    try {
      await navigator.clipboard.writeText(`${contact.firstName} ${contact.lastName}\n${contact.title} · ${contact.company}\n${contact.email}\n${contact.phone}${contact.website ? '\n' + websiteUrl(contact.website) : ''}`);
      setToast('Dati del contatto copiati.');
    } catch { setToast('Copia non disponibile. Scarica il contatto in formato .vcf.'); }
  }
  async function saveQR() {
    if (!validate()) return;
    try {
      const url = await QRCode.toDataURL(vcard, { width: 1200, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#183c32', light: '#ffffff' } });
      const blob = await (await fetch(url)).blob();
      downloadFile(new File([blob], 'square-contatto-qr.png', { type: 'image/png' }));
      setToast('QR Code scaricato. Pronto da condividere.');
    } catch { setToast('Impossibile creare il QR. Prova a ridurre la lunghezza dei dati.'); }
  }
  async function writeNFC() {
    if (!validate() || !nfcSupported || !consent || nfcStatus === 'writing') return;
    const controller = new AbortController();
    abortRef.current = controller;
    setNfcStatus('writing'); setNfcError('');
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const reader = new window.NDEFReader();
      await reader.write({ records: [{ recordType: 'mime', mediaType: 'text/vcard', data: new TextEncoder().encode(vcard) }] }, { signal: controller.signal });
      setNfcStatus('success');
    } catch (error) {
      setNfcStatus('idle');
      setNfcError(error.name === 'AbortError' ? 'Scrittura annullata o tempo scaduto. Puoi riprovare.' : error.name === 'NotAllowedError' ? 'Accesso NFC non autorizzato. Controlla i permessi del browser.' : 'Scrittura non riuscita. Verifica NFC attivo, tag scrivibile e spazio sufficiente.');
    } finally { clearTimeout(timeout); }
  }
  function navigate(destination) {
    if (destination === 'biglietto' && !validate()) return;
    setModal(null);
    window.location.hash = `/${destination}`;
    setPage(destination);
    window.scrollTo(0, 0);
  }
  function editDetails() { firstNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstNameRef.current?.focus({ preventScroll: true }); }
  function openShare() { if (validate()) setModal('share'); }

  return <>
    {page === 'biglietto' ? <ContactPresentation contact={contact} theme={theme} qr={<QR value={vcard} size={320} />} onSave={download} onShare={share} onNearby={() => setModal('nearby')} onQR={() => { if (validate()) setModal('qr'); }} /> : <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#/biglietto" aria-label="Square, il mio biglietto"><SquaresFour weight="fill" size={31} /><span>square<span className="brand-dot">.</span></span></a>
      <div className="workspace"><span className="workspace-icon">{`${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}` || 'SC'}</span><div><strong>Il tuo spazio</strong><span>Personale</span></div><CaretDown size={14} /></div>
      <span className="nav-label">IL TUO NETWORK, IN TASCA</span>
      <nav aria-label="Navigazione principale">
        <button className="nav-item" onClick={() => navigate('biglietto')}><CreditCard size={20} weight="duotone" />Il mio biglietto<span className="nav-count">1</span></button>
        <button className="nav-item active" onClick={editDetails}><PencilSimple size={20} />Personalizza</button>
        <button className="nav-item" onClick={() => setModal('help')}><Info size={20} />Come funziona<ArrowSquareOut className="nav-external" size={14} /></button>
      </nav>
      <div className="sidebar-note"><div className="leaf-icon"><Leaf size={22} weight="duotone" /></div><strong>Meno carta.<br />Più connessioni.</strong><p>Un piccolo gesto digitale.<br />Un nuovo modo di presentarti.</p><span>Fatto per incontrarsi <ArrowRight size={15} /></span></div>
      <button className="sidebar-user" onClick={editDetails}><span className="user-avatar">{contact.firstName.charAt(0)}{contact.lastName.charAt(0)}</span><span><strong>{contact.firstName || 'Il tuo'} {contact.lastName || 'profilo'}</strong><small>Il tuo profilo personale</small></span><CaretDown size={14} /></button>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Il tuo spazio <span>/</span><strong>Personalizza</strong></div><div className="topbar-right"><span className={`save-status ${saved}`}><span />{saved === 'saved' ? 'Salvato sul dispositivo' : saved === 'saving' ? 'Salvataggio…' : 'Salvataggio non disponibile'}</span><button className="button primary share-button" onClick={() => navigate('biglietto')}><ArrowSquareOut size={17} />Apri biglietto</button></div></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow"><span />IL TUO SPAZIO CREATIVO</div><h1>Il tuo biglietto,<br className="mobile-break" /> a modo tuo<span>.</span></h1><p>Scegli uno stile e aggiungi i tuoi dati. Al resto pensa Square.</p></div><span className="page-mark"><Fingerprint size={53} weight="thin" /></span></div>
        <div className="studio-layout">
          <section className="design-column" aria-label="Design del biglietto">
            <div className="preview-panel">
              <div className="preview-toolbar"><span><span className="live-dot" />Anteprima in tempo reale</span><div className="view-switch" aria-label="Tipo di anteprima"><button className={view === 'card' ? 'selected' : ''} onClick={() => setView('card')} aria-pressed={view === 'card'}><CreditCard size={16} />Biglietto</button><button className={view === 'qr' ? 'selected' : ''} onClick={() => setView('qr')} aria-pressed={view === 'qr'}><QrCode size={16} />QR Code</button></div></div>
              <div className={`preview-canvas ${view === 'qr' ? 'qr-canvas' : ''}`}><div className="canvas-orbit orbit-one" /><div className="canvas-orbit orbit-two" /><div className="canvas-caption"><span>UN BIGLIETTO. INFINITE POSSIBILITÀ.</span><span>100% digitale</span></div>
                {view === 'card' ? <div className="card-stage"><div className={`card-back ${theme}`}><SquaresFour size={28} weight="fill" /><span>Nice to meet you.</span></div><div className="main-card-wrap" key={theme}><BusinessCard contact={contact} theme={theme} vcard={vcard} /></div></div> : <div className="large-qr-preview"><QR value={vcard} size={215} /><strong>{contact.firstName} {contact.lastName}</strong><span>Inquadra. Salva. Restiamo in contatto.</span></div>}
                <div className="canvas-bottom"><span><LockSimple size={13} />I tuoi dati, solo quando vuoi.</span><button onClick={() => { if (validate()) setModal('preview'); }}><ArrowSquareOut size={15} />Apri anteprima</button></div>
              </div>
              <div className="card-actions"><button onClick={download}><ArrowDownTray size={19} /><span>Scarica contatto</span><span className="file-badge">.vcf</span></button><button onClick={() => { if (validate()) setModal('qr'); }}><QrCode size={19} />Mostra QR</button><button onClick={() => setModal('nfc')}><WifiHigh size={21} />Tag NFC<span className={`availability-dot ${nfcSupported ? 'available' : ''}`} /></button></div>
            </div>
            <div className="style-heading"><div><h2>Tre modi di essere te.</h2><p>Scegli lo stile che ti somiglia.</p></div><span>0{themes.findIndex(t => t.id === theme) + 1} <span>/ 03</span></span></div>
            <div className="theme-options" aria-label="Scegli una variante">{themes.map((t, index) => <button key={t.id} className={`theme-option ${theme === t.id ? 'chosen' : ''}`} onClick={() => setTheme(t.id)} aria-pressed={theme === t.id} aria-label={`Scegli ${t.name}`}><div className={`theme-swatch ${t.id}`}><div className="swatch-top"><span>{contact.company || 'La tua azienda'}</span><WifiHigh size={13} /></div><div className="swatch-bottom"><span>{contact.firstName || 'Nome'}<br />{contact.lastName || 'Cognome'}<b>.</b></span><QrCode size={30} weight="regular" /></div></div><div className="theme-name"><strong>{t.name}</strong><span className="radio-circle">{theme === t.id && <Check size={10} weight="bold" />}</span></div><span className="theme-description">{t.description}</span></button>)}</div>
            <div className="connection-note"><span className="connection-icon"><LinkSimple size={17} /></span><p>Non serve un'app per conoscersi.<span>Il tuo contatto si salva direttamente in rubrica.</span></p><ArrowRight size={18} /></div>
          </section>
          <section className="details-panel" aria-labelledby="details-title"><div className="details-heading"><span className="edit-icon"><PencilSimple size={19} /></span><div><h2 id="details-title">Fai le presentazioni.</h2><p>Il tuo prossimo contatto parte da qui.</p></div></div>
            <form id="contact-form" onSubmit={event => event.preventDefault()}>
              <div className="form-section-label"><User size={15} />INFORMAZIONI PERSONALI</div>
              <div className="name-fields"><Field label="Nome" name="firstName" contact={contact} setContact={setContact} inputRef={firstNameRef} autoComplete="given-name" required /><Field label="Cognome" name="lastName" contact={contact} setContact={setContact} autoComplete="family-name" required /></div>
              <Field label="Email" name="email" icon={Envelope} type="email" contact={contact} setContact={setContact} autoComplete="email" required />
              <Field label="Telefono" name="phone" icon={Phone} type="tel" contact={contact} setContact={setContact} autoComplete="tel" pattern="[+0-9][0-9 .()\-]{5,}" required />
              <div className="form-divider" /><div className="form-section-label"><Briefcase size={15} />IL TUO LAVORO</div>
              <Field label="Azienda" name="company" icon={Briefcase} contact={contact} setContact={setContact} autoComplete="organization" required />
              <Field label="Ruolo" name="title" optional contact={contact} setContact={setContact} autoComplete="organization-title" />
              <Field label="Sito web" name="website" optional icon={Globe} contact={contact} setContact={setContact} autoComplete="url" />
              {invalidWebsite && <p className="form-error" role="alert">Inserisci un sito web valido.</p>}
            </form>
            <div className="autosave-note"><CheckCircle size={15} weight="fill" /><span>Le modifiche si aggiornano in automatico.</span></div>
            <button className="contact-preview-link" onClick={() => navigate('biglietto')}>Apri il tuo biglietto<ArrowSquareOut size={15} /></button>
          </section>
        </div>
        <footer className="page-footer"><span><SquaresFour size={16} weight="fill" />Piccolo biglietto, grandi connessioni.</span><button onClick={() => setModal('privacy')}><LockSimple size={13} />Privacy prima di tutto</button></footer>
      </main>
    </div>
    </div>}
    <dialog ref={dialogRef} className={`modal ${modal === 'preview' ? 'preview-modal' : ''}`} onCancel={() => setModal(null)} onClick={e => { if (e.target === dialogRef.current) setModal(null); }}><button className="modal-close icon-button" onClick={() => setModal(null)} aria-label="Chiudi finestra"><X size={20} /></button>
      {(modal === 'share' || modal === 'qr') && <><div className="modal-eyebrow"><ShareNetwork size={16} />FACCIAMO CONNESSIONE</div><h2>{modal === 'share' ? 'Il tuo prossimo incontro.' : 'Un gesto. Già in rubrica.'}</h2><p className="modal-description">Inquadra il QR per salvare il contatto.<br />Nessuna app, nessuna registrazione.</p><QR value={vcard} size={250} className="modal-qr" /><strong className="modal-person">{contact.firstName} {contact.lastName}</strong><span className="modal-role">{contact.title}{contact.title && ' · '}{contact.company}</span><button className="button primary full-width" onClick={modal === 'share' ? share : saveQR}>{modal === 'share' ? <ShareNetwork size={19} /> : <ArrowDownTray size={19} />}{modal === 'share' ? 'Invia il contatto' : 'Scarica QR Code'}</button><div className="modal-secondary-actions"><button onClick={download}><ArrowDownTray size={17} />Scarica .vcf</button><button onClick={copy}><Copy size={17} />Copia dati</button></div><p className="small-print">Nome, cognome, azienda, email e telefono.<br />Un contatto completo, pronto da salvare.</p></>}
      {modal === 'preview' && <><div className="modal-eyebrow"><CreditCard size={16} />IL TUO BIGLIETTO</div><BusinessCard contact={contact} theme={theme} vcard={vcard} /><div className="preview-contact-links"><a href={`mailto:${contact.email}`}><Envelope size={19} /><span>{contact.email}</span><ArrowSquareOut size={16} /></a><a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={19} /><span>{contact.phone}</span><ArrowSquareOut size={16} /></a>{contact.website && <a href={websiteUrl(contact.website)} target="_blank" rel="noreferrer"><Globe size={19} /><span>{contact.website}</span><ArrowSquareOut size={16} /></a>}</div><button className="button primary full-width" onClick={download}><ArrowDownTray size={19} />Salva in rubrica</button></>}
      {modal === 'nearby' && <><div className="nearby-illustration" aria-hidden="true"><DeviceMobile size={62} weight="thin" /><ShareNetwork size={25} weight="light" /><DeviceMobile size={62} weight="thin" /></div><h2>Da telefono a telefono.</h2><p className="modal-description">Invia il contatto completo dal menu del tuo telefono, oppure fai inquadrare il QR.</p><div className="nearby-explanation"><strong>Il semplice avvicinamento non funziona da questa pagina.</strong><p>Il browser non può scambiare contatti via NFC tra due telefoni. Su iPhone, NameDrop è una funzione del sistema: non legge i dati di questo biglietto.</p><p>Per condividere anche azienda, email e telefono, invia il file contatto o usa il QR.</p></div><button className="button primary full-width" onClick={share}><ShareNetwork size={19} />Invia il contatto completo</button><button className="nearby-qr-button" onClick={() => { if (validate()) setModal('qr'); }}><QrCode size={19} />Mostra QR Code</button><p className="small-print">Se disponibile, puoi scegliere AirDrop o Quick Share nel menu di condivisione del dispositivo. Altrimenti puoi inviare il file .vcf via messaggio. <a href="https://developer.chrome.com/docs/capabilities/nfc" target="_blank" rel="noreferrer">Compatibilità NFC</a> · <a href="https://support.apple.com/guide/iphone/iph1b6c664b7/ios" target="_blank" rel="noreferrer">NameDrop</a></p></>}
      {modal === 'nfc' && <><div className="modal-feature-icon"><WifiHigh size={32} /></div><h2>Prepara un tag NFC.</h2><p className="modal-description">Scrivi il contatto su un tag fisico NFC. Questa funzione non trasferisce dati avvicinando due telefoni.</p>{nfcSupported ? <><div className={`nfc-status ${nfcStatus}`}><Tag size={32} /><strong>{nfcStatus === 'writing' ? 'Avvicina un tag NFC scrivibile' : nfcStatus === 'success' ? 'Contatto scritto sul tag!' : 'Il tuo dispositivo supporta Web NFC'}</strong><span>{nfcStatus === 'writing' ? 'Tieni il tag vicino al telefono fino alla conferma.' : nfcStatus === 'success' ? 'Il tag è pronto. La lettura dipende dal dispositivo ricevente.' : 'Attiva NFC e prepara un tag con spazio sufficiente per il contatto.'}</span></div><label className="nfc-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={nfcStatus === 'writing'} /><span>Scrivi sul mio tag. Eventuali dati già presenti verranno sostituiti.</span></label>{nfcError && <p className="form-error" role="alert">{nfcError}</p>}<button className="button primary full-width" onClick={writeNFC} disabled={!consent || nfcStatus === 'writing'}><WifiHigh size={20} />{nfcStatus === 'writing' ? 'In attesa del tag…' : 'Scrivi contatto sul tag'}</button>{nfcStatus === 'writing' && <button className="text-button" onClick={() => abortRef.current?.abort()}>Annulla scrittura</button>}</> : <><div className="nfc-status"><DeviceMobile size={31} /><strong>NFC non disponibile in questo browser</strong><span>Per scrivere un tag usa Chrome su Android, con NFC e una connessione HTTPS. Puoi sempre condividere il QR o il file contatto.</span></div><button className="button primary full-width" onClick={() => { if (validate()) setModal('qr'); }}><QrCode size={19} />Condividi con QR Code</button></>}<p className="small-print">Web NFC scrive tag compatibili. Non trasferisce dati direttamente tra due telefoni. <a href="https://developer.chrome.com/docs/capabilities/nfc" target="_blank" rel="noreferrer">Compatibilità NFC</a></p></>}
      {modal === 'help' && <><div className="modal-feature-icon"><Sparkle size={30} /></div><h2>Piacere, Square.</h2><p className="modal-description">Il biglietto che non finisce in un cassetto.</p><div className="help-steps"><div><span>1</span><section><h3>Fai le presentazioni</h3><p>Inserisci i tuoi dati e scegli uno dei tre stili. Le modifiche si salvano su questo dispositivo.</p></section></div><div><span>2</span><section><h3>Trova il tuo modo</h3><p>Mostra il QR, invia il file .vcf o scrivi il tuo contatto su un tag NFC supportato.</p></section></div><div><span>3</span><section><h3>Restiamo in contatto</h3><p>Chi riceve il contatto può salvarlo nella propria rubrica, senza registrarsi. Aggiorna e condividi di nuovo se i tuoi dati cambiano.</p></section></div></div><button className="button primary full-width" onClick={() => setModal(null)}>Crea la tua connessione<ArrowRight size={18} /></button></>}
      {modal === 'privacy' && <><div className="modal-feature-icon"><LockSimple size={30} /></div><h2>Il controllo resta tuo.</h2><div className="privacy-copy"><p>I dati del biglietto vengono salvati nel browser di questo dispositivo. Il QR viene generato qui e contiene direttamente i dati del tuo contatto.</p><p>Chi vede il QR può leggere e salvare questi dati. Il file .vcf e il tag NFC contengono gli stessi dati. Condividili con chi desideri.</p><p>Non inviamo il contatto a un servizio QR esterno. Il sito carica i caratteri da Google Fonts. Non è presente un database dei contatti.</p><p>Per il logo carichiamo la favicon dal sito aziendale. Se non è disponibile, richiediamo la favicon a Google, inviando solo l'indirizzo di origine del sito, senza i dati del contatto.</p><p>Il QR e i file già condivisi non si aggiornano automaticamente: dopo una modifica, condividi il nuovo contatto.</p></div><button className="button primary full-width" onClick={() => setModal(null)}>Ho capito<Check size={18} /></button></>}
    </dialog>
    {toast && <div className="toast" role="status"><CheckCircle size={21} weight="fill" /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Chiudi notifica"><X size={17} /></button></div>}
  </>;
}

function Field({ label, name, contact, setContact, icon: Icon, optional, inputRef, ...props }) {
  return <label className="field"><span className="field-label">{label}{optional && <small>Facoltativo</small>}</span><span className={`input-wrap ${Icon ? 'with-icon' : ''}`}>{Icon && <Icon size={16} />}<input ref={inputRef} name={name} value={contact[name]} maxLength={120} onChange={e => setContact(prev => ({ ...prev, [name]: e.target.value }))} {...props} /></span></label>;
}

createRoot(document.getElementById('root')).render(<App />);
