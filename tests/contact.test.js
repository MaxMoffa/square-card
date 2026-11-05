import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { contactFile, createVCard, foldLine, websiteUrl } from '../src/contact.js';

// Synthetic fixture: reserved example domain and fictional telephone number.
const defaultContact = { firstName: 'Test', lastName: 'Contact', title: 'Designer', company: 'Example', email: 'test@example.com', phone: '+1 202 555 0142', website: 'example.com' };

test('vCard contains all contact fields and CRLF line endings', () => {
  const vcard = createVCard(defaultContact);
  for (const field of ['BEGIN:VCARD', 'VERSION:3.0', 'N:Contact;Test;;;', 'FN:Test Contact', 'ORG:Example', 'EMAIL;TYPE=INTERNET,WORK:test@example.com', 'TEL;TYPE=CELL:+1 202 555 0142', 'URL:https://example.com/', 'END:VCARD']) assert.ok(vcard.includes(field), field);
  assert.ok(vcard.endsWith('\r\n'));
  assert.equal(vcard.replaceAll('\r\n', '').includes('\n'), false);
});

test('reserved characters and line injection are escaped', () => {
  const vcard = createVCard({ ...defaultContact, firstName: 'Èva;Rosa,\\', company: 'Studio\r\nTEL:injected' });
  assert.ok(vcard.includes('Èva\\;Rosa\\,\\\\'));
  assert.ok(vcard.includes('ORG:Studio\\nTEL:injected'));
  assert.equal(vcard.split('\r\n').some(line => line === 'TEL:injected'), false);
});

test('long Unicode values fold at 75 UTF-8 octets without data loss', () => {
  const original = 'FN:' + 'È🌿'.repeat(70);
  const folded = foldLine(original);
  for (const line of folded.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.equal(folded.replaceAll('\r\n ', ''), original);
});

test('downloaded contact is a vcf file with the complete payload', async () => {
  const file = contactFile({ ...defaultContact, firstName: 'Èva' });
  assert.equal(file.name, 'eva-contact.vcf');
  assert.match(file.type, /^text\/vcard/);
  assert.equal(await file.text(), createVCard({ ...defaultContact, firstName: 'Èva' }));
});

test('website normalization and optional empty website', () => {
  assert.equal(websiteUrl('example.com'), 'https://example.com/');
  assert.equal(websiteUrl('https://example.com/work'), 'https://example.com/work');
  assert.throws(() => websiteUrl('not a website'));
  assert.equal(createVCard({ ...defaultContact, website: '' }).includes('URL:'), false);
});

test('QR independently decodes to the exact complete vCard', () => {
  const vcard = createVCard({ ...defaultContact, firstName: 'Èva', company: 'Example; Design, S.r.l.' });
  const qr = QRCode.create(vcard, { errorCorrectionLevel: 'M' });
  const scale = 7, margin = 4;
  const width = (qr.modules.size + margin * 2) * scale;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y = 0; y < qr.modules.size; y++) for (let x = 0; x < qr.modules.size; x++) {
    if (!qr.modules.get(y, x)) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const offset = (((y + margin) * scale + dy) * width + (x + margin) * scale + dx) * 4;
      pixels[offset] = 24; pixels[offset + 1] = 60; pixels[offset + 2] = 50;
    }
  }
  assert.equal(jsQR(pixels, width, width)?.data, vcard);
});
