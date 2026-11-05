export const defaultContact = {
  firstName: '',
  lastName: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
};

const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

export function websiteUrl(value) {
  if (!value.trim()) return '';
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Inserisci un sito web valido.');
  return url.href;
}

// Fold at 75 UTF-8 octets without splitting a Unicode character.
export function foldLine(line) {
  let result = '', current = '', size = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (size + bytes > 75) { result += current + '\r\n'; current = ' '; size = 1; }
    current += char;
    size += bytes;
  }
  return result + current;
}

export function createVCard(contact) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeText(contact.lastName)};${escapeText(contact.firstName)};;;`,
    `FN:${escapeText(`${contact.firstName} ${contact.lastName}`.trim())}`,
    `ORG:${escapeText(contact.company)}`,
    `TITLE:${escapeText(contact.title)}`,
    `EMAIL;TYPE=INTERNET,WORK:${escapeText(contact.email)}`,
    `TEL;TYPE=CELL:${escapeText(contact.phone)}`,
  ];
  if (contact.website?.trim()) lines.push(`URL:${escapeText(websiteUrl(contact.website))}`);
  lines.push('END:VCARD');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function contactFile(contact) {
  const name = `${contact.firstName}-${contact.lastName}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  return new File([createVCard(contact)], `${name || 'contatto'}.vcf`, { type: 'text/vcard;charset=utf-8' });
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
