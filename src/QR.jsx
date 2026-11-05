import React, { useEffect, useState } from 'react';
import { QrCode } from '@phosphor-icons/react';
import QRCode from 'qrcode';

export default function QR({ value, className = '', size = 220 }) {
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
