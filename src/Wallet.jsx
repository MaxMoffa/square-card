import React, { useRef, useState } from 'react';
import { DownloadSimple, ImageSquare, Palette, UploadSimple, Wallet as WalletIcon } from '@phosphor-icons/react';
import CompanyLogo from './CompanyLogo.jsx';
import QR from './QR.jsx';
import { walletColors, walletModel } from './wallet.js';
import { prepareLogoUpload } from './wallet-image.js';
import './wallet.css';

export function WalletButtons({ onSelect }) {
  return <div className="wallet-provider-buttons" aria-label="Prepara la tessera per il Wallet">
    <button onClick={() => onSelect('apple')} aria-label="Prepara tessera per Apple Wallet"><WalletIcon size={17} weight="light" />Apple Wallet</button>
    <button onClick={() => onSelect('google')} aria-label="Prepara tessera per Google Wallet"><WalletIcon size={17} weight="light" />Google Wallet</button>
  </div>;
}

export function WalletPreview({ contact, theme, settings }) {
  const model = walletModel(contact, theme, settings);
  return <div className="wallet-pass" style={{ '--pass-bg': model.background, '--pass-ink': model.foreground }} aria-label="Anteprima della tessera da esportare">
    <div className="wallet-pass-heading">{model.showLogo && (model.logo ? <span className="wallet-pass-logo company-logo has-favicon"><img src={model.logo} alt={`Logo di ${contact.company || 'azienda'}`} /></span> : <CompanyLogo website={contact.website} company={contact.company} className="wallet-pass-logo" />)}<span>{model.heading}</span></div>
    <div className="wallet-pass-name">{contact.firstName || 'Nome'}<br />{contact.lastName || 'Cognome'}</div>
    {model.showRole && <div className="wallet-pass-role">{model.role || 'Il tuo ruolo'}</div>}
    <div className="wallet-pass-fields">{model.showEmail && <span>{model.email || 'La tua email'}</span>}{model.showPhone && <span>{model.phone || 'Il tuo telefono'}</span>}</div>
    <QR value={model.qrValue} size={220} />
    <div className="wallet-pass-note">Il tuo contatto, sempre con te.</div>
  </div>;
}

export function WalletSettings({ contact, theme, settings, onChange, onSelect }) {
  const uploadRef = useRef(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const model = walletModel(contact, theme, settings);
  const update = changes => onChange(previous => ({ ...previous, ...changes }));
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try { update({ logo: await prepareLogoUpload(file), showLogo: true }); }
    catch (error) { setError(error.message); }
    finally { setUploading(false); event.target.value = ''; }
  }
  return <section className="wallet-settings" aria-labelledby="wallet-settings-title">
    <div className="wallet-section-heading"><span><WalletIcon size={21} weight="light" /></span><div><h2 id="wallet-settings-title">Anche nel tuo Wallet.</h2><p>Colore, logo e dettagli. Una tessera che ti somiglia.</p></div></div>
    <div className="wallet-editor-grid"><div className="wallet-editor-preview"><WalletPreview contact={contact} theme={theme} settings={settings} /><small>Anteprima del PNG da importare</small></div>
      <div className="wallet-controls">
        <label className="wallet-control-label"><Palette size={16} />Colore della tessera</label>
        <div className="wallet-color-swatches">{walletColors.map(color => <button key={color} style={{ backgroundColor: color }} className={model.background === color ? 'selected' : ''} onClick={() => update({ color })} aria-label={`Colore ${color}`} aria-pressed={model.background === color} />)}<label className="wallet-custom-color" title="Scegli un colore personalizzato"><input type="color" value={model.background} onChange={event => update({ color: event.target.value })} aria-label="Colore personalizzato della tessera" /><Palette size={15} /></label></div>
        <div className="wallet-color-meta"><code>{model.background.toUpperCase()}</code><button onClick={() => update({ color: '' })}>Usa colore del biglietto</button></div>
        <label className="wallet-heading-input"><span>Titolo della tessera <small>Facoltativo</small></span><input name="wallet-heading" maxLength={60} value={settings.heading} placeholder={contact.company || 'La tua azienda'} onChange={event => update({ heading: event.target.value })} /></label>
        <div className="wallet-control-label"><ImageSquare size={16} />Logo aziendale</div>
        <label className="wallet-checkbox"><input type="checkbox" checked={settings.showLogo} onChange={event => update({ showLogo: event.target.checked })} />Mostra il logo sulla tessera</label>
        <p className="wallet-helper">Automatico dalla favicon del sito. Alcuni siti ne impediscono l'esportazione: carica un logo per includerlo sempre. Il file resta su questo browser.</p>
        <div className="wallet-logo-actions"><button onClick={() => uploadRef.current.click()} disabled={uploading}><UploadSimple size={15} />{uploading ? 'Caricamento…' : 'Carica logo'}</button>{settings.logo && <button onClick={() => update({ logo: '' })}>Usa favicon</button>}</div>
        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} aria-label="Carica logo per la tessera Wallet" className="wallet-file-input" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="wallet-control-label wallet-fields-label">Campi visibili sulla tessera</div>
        <div className="wallet-field-options">{[['showRole', 'Ruolo'], ['showEmail', 'Email'], ['showPhone', 'Telefono']].map(([key, label]) => <label className="wallet-checkbox" key={key}><input type="checkbox" checked={settings[key]} onChange={event => update({ [key]: event.target.checked })} />{label}</label>)}</div>
        <p className="wallet-helper">Il QR contiene sempre il contatto completo. Il testo usa un contrasto automatico per restare leggibile.</p>
      </div>
    </div>
    <div className="wallet-settings-footer"><WalletButtons onSelect={onSelect} /><span>Importazione guidata da immagine</span></div>
  </section>;
}

export function WalletDialog({ provider, contact, theme, settings, onDownload, onQRDownload, busy }) {
  const apple = provider === 'apple';
  return <div className="wallet-dialog-content"><div className="modal-eyebrow"><WalletIcon size={16} />IMPORTAZIONE GUIDATA</div><h2>La tua tessera.<br />Nel tuo Wallet.</h2><p className="modal-description">Prepara la tessera per {apple ? 'Apple Wallet' : 'Google Wallet'}, poi aggiungila dall'app sul telefono.</p>
    <WalletPreview contact={contact} theme={theme} settings={settings} />
    <button className="button primary full-width" onClick={onDownload} disabled={busy}><DownloadSimple size={18} />{busy ? 'Preparazione tessera…' : 'Scarica tessera PNG'}</button>
    <ol className="wallet-import-steps">{apple ? <><li>Su iOS 27 o successivo, apri Wallet e scegli <strong>+ · Crea un pass</strong>.</li><li>Importa l'immagine se l'opzione è disponibile. In alternativa crea il pass manualmente e scansiona il QR da un altro schermo.</li><li>Controlla nome e QR prima di salvare. L'importazione da foto richiede un iPhone e funzioni compatibili.</li></> : <><li>Apri Google Wallet e scegli <strong>Aggiungi a Wallet · Foto</strong> oppure <strong>Tutto il resto</strong>.</li><li>Scegli l'immagine scaricata e controlla che il QR venga riconosciuto.</li><li>Verifica i dettagli, personalizza i campi disponibili e tocca <strong>Aggiungi</strong>. Le opzioni dipendono dal paese e dalla versione dell'app.</li></>}</ol>
    <button className="wallet-qr-only" onClick={onQRDownload}><DownloadSimple size={16} />Scarica solo il QR</button>
    <div className="wallet-import-note"><strong>Questa pagina prepara un'immagine, non un pass firmato.</strong><p>L'aggiunta automatica non è attiva. Per abilitarla servono account emittente, certificati e un servizio di firma. Importando una foto, il Wallet può modificare colori, logo e disposizione dei campi.</p><p>Il QR rappresenta il contatto: non abilita lo scambio NFC tra telefoni. Dopo una modifica, esporta e importa di nuovo la tessera.</p></div>
    <a className="wallet-official-help" href={apple ? 'https://support.apple.com/guide/iphone/create-passes-el8l5r9jnhyv/27/ios/27' : 'https://support.google.com/wallet/answer/12060038?hl=it'} target="_blank" rel="noreferrer">Guida ufficiale {apple ? 'Apple' : 'Google'}<span>↗</span></a>
  </div>;
}
