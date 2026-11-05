import { createVCard } from './contact.js';

export const walletDefaults = { color: '', heading: '', showLogo: true, logo: '', showRole: true, showEmail: true, showPhone: true };
export const walletColors = ['#1d463b', '#243c69', '#292a31', '#efd7ba', '#7b343e', '#644a78'];
const themeColors = { essential: '#1d463b', studio: '#efd7ba', executive: '#282b32' };

export function normalizeWalletSettings(value) {
  const data = value && typeof value === 'object' ? value : {};
  return {
    color: /^#[a-f\d]{6}$/i.test(data.color) ? data.color.toLowerCase() : '',
    heading: typeof data.heading === 'string' ? data.heading.slice(0, 60) : '',
    showLogo: typeof data.showLogo === 'boolean' ? data.showLogo : true,
    logo: typeof data.logo === 'string' && data.logo.length <= 400000 && /^data:image\/(?:png|jpeg|webp);base64,[a-z\d+/=]+$/i.test(data.logo) ? data.logo : '',
    ...Object.fromEntries(['showRole', 'showEmail', 'showPhone'].map(key => [key, typeof data[key] === 'boolean' ? data[key] : true])),
  };
}

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function walletModel(contact, theme, settings) {
  const options = normalizeWalletSettings(settings);
  const background = options.color || themeColors[theme] || themeColors.essential;
  const lightContrast = 1.05 / (luminance(background) + 0.05);
  const darkContrast = (luminance(background) + 0.05) / 0.05;
  let qrValue;
  try { qrValue = createVCard(contact); } catch { qrValue = createVCard({ ...contact, website: '' }); }
  return {
    ...options,
    background,
    foreground: lightContrast >= darkContrast ? '#ffffff' : '#000000',
    heading: options.heading.trim() || contact.company || 'La tua azienda',
    fullName: `${contact.firstName} ${contact.lastName}`.trim(),
    role: options.showRole ? contact.title : '',
    email: options.showEmail ? contact.email : '',
    phone: options.showPhone ? contact.phone : '',
    // Visibility settings affect the printed fields, never the complete contact.
    qrValue,
  };
}
