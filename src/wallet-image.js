import QRCode from 'qrcode';
import { websiteUrl } from './contact.js';
import { walletModel } from './wallet.js';

function imageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Immagine non disponibile.'));
    image.src = url;
  });
}

async function faviconImage(website) {
  if (!website.trim()) return null;
  const origin = new URL(websiteUrl(website)).origin;
  for (const source of [new URL('/favicon.ico', origin).href, `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`]) {
    let objectUrl;
    try {
      // A CORS fetch keeps the exported canvas readable; never draw an opaque image.
      const response = await fetch(source, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(3500) });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (!blob.type.startsWith('image/') || blob.size > 512000) continue;
      objectUrl = URL.createObjectURL(blob);
      return await imageFromUrl(objectUrl);
    } catch { /* Try the next source, then use company initials. */ }
    finally { if (objectUrl) URL.revokeObjectURL(objectUrl); }
  }
  return null;
}

function fitText(context, value, x, y, width, maxSize, weight = '500') {
  let size = maxSize;
  do { context.font = `${weight} ${size}px sans-serif`; size -= 1; } while (context.measureText(value).width > width && size >= 19);
  let text = value;
  while (context.measureText(text).width > width && text.length) text = text.slice(0, -1);
  if (text !== value && text.length > 1) text = text.slice(0, -1) + '…';
  context.fillText(text, x, y);
}

export async function prepareLogoUpload(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5000000) throw new Error('Scegli un logo PNG, JPG o WebP fino a 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = await imageFromUrl(url);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const scale = Math.min(256 / image.width, 256 / image.height);
    const width = image.width * scale, height = image.height * scale;
    canvas.getContext('2d').drawImage(image, (256 - width) / 2, (256 - height) / 2, width, height);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

export async function createWalletImage(contact, theme, settings) {
  const model = walletModel(contact, theme, settings);
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1440;
  const context = canvas.getContext('2d');
  context.fillStyle = model.background;
  context.fillRect(0, 0, 1080, 1440);
  context.fillStyle = model.foreground;
  let logo = null;
  if (model.showLogo) logo = model.logo ? await imageFromUrl(model.logo) : await faviconImage(contact.website);
  if (model.showLogo) {
    context.save();
    context.fillStyle = '#ffffff';
    context.beginPath(); context.roundRect(72, 72, 100, 100, 20); context.fill();
    if (logo) {
      const scale = Math.min(76 / logo.width, 76 / logo.height);
      context.drawImage(logo, 122 - logo.width * scale / 2, 122 - logo.height * scale / 2, logo.width * scale, logo.height * scale);
    } else {
      context.fillStyle = '#183c32';
      context.font = '500 32px sans-serif';
      context.textAlign = 'center';
      context.fillText(contact.company.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'SC', 122, 133);
    }
    context.restore();
  }
  context.fillStyle = model.foreground;
  const headingX = model.showLogo ? 200 : 72;
  fitText(context, model.heading, headingX, 132, 1008 - headingX, 34);
  fitText(context, contact.firstName, 72, 290, 936, 80);
  fitText(context, contact.lastName, 72, 388, 936, 88);
  if (model.role) fitText(context, model.role, 72, 445, 936, 31, '400');
  let lineY = 510;
  for (const value of [model.email, model.phone].filter(Boolean)) {
    fitText(context, value, 72, lineY, 936, 28, '400');
    lineY += 43;
  }
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, model.qrValue, { width: 660, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#183c32', light: '#ffffff' } });
  context.drawImage(qr, 210, 652);
  context.fillStyle = model.foreground;
  context.font = '400 25px sans-serif';
  context.textAlign = 'center';
  context.fillText('Inquadra per salvare il contatto completo', 540, 1377);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Impossibile esportare la tessera.')), 'image/png'));
  return { file: new File([blob], 'square-tessera-wallet.png', { type: 'image/png' }), logoFallback: model.showLogo && !model.logo && !!contact.website && !logo };
}
