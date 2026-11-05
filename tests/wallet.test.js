import test from 'node:test';
import assert from 'node:assert/strict';
import { createVCard } from '../src/contact.js';
import { normalizeWalletSettings, walletColors, walletDefaults, walletModel } from '../src/wallet.js';

const contact = { firstName: 'Test', lastName: 'Contact', title: 'Designer', company: 'Example', email: 'test@example.com', phone: '+1 202 555 0142', website: 'example.com' };

test('existing profiles receive compatible Wallet defaults', () => {
  assert.deepEqual(normalizeWalletSettings(), walletDefaults);
  assert.deepEqual(normalizeWalletSettings(null), walletDefaults);
  assert.equal(walletModel(contact, 'studio', {}).background, '#efd7ba');
});

test('hiding visible fields never removes them from the QR contact', () => {
  const model = walletModel(contact, 'essential', { showEmail: false, showPhone: false, showRole: false });
  assert.equal(model.email, '');
  assert.equal(model.phone, '');
  assert.equal(model.role, '');
  assert.equal(model.qrValue, createVCard(contact));
  assert.ok(model.qrValue.includes('EMAIL;TYPE=INTERNET,WORK:test@example.com'));
  assert.ok(model.qrValue.includes('TEL;TYPE=CELL:+1 202 555 0142'));
});

test('customization validates saved colors, titles and uploaded logos', () => {
  const options = normalizeWalletSettings({ color: '#ABCDEF', heading: 'A'.repeat(90), logo: 'data:image/svg+xml;base64,PHN2Zz4=' });
  assert.equal(options.color, '#abcdef');
  assert.equal(options.heading.length, 60);
  assert.equal(options.logo, '');
  assert.equal(normalizeWalletSettings({ color: 'red; background: url(x)' }).color, '');
  assert.equal(normalizeWalletSettings({ logo: 'data:image/png;base64,aGVsbG8=' }).logo, 'data:image/png;base64,aGVsbG8=');
  assert.equal(normalizeWalletSettings({ logo: 'data:image/png;base64,' + 'A'.repeat(400001) }).logo, '');
});

test('automatic text contrast meets WCAG AA for every palette color', () => {
  const luminance = hex => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  };
  for (const color of [...walletColors, '#000000', '#ffffff', '#757575', '#ffff00']) {
    const model = walletModel(contact, 'essential', { color });
    const background = luminance(model.background), foreground = luminance(model.foreground);
    const contrast = (Math.max(background, foreground) + .05) / (Math.min(background, foreground) + .05);
    assert.ok(contrast >= 4.5, `${color}: ${contrast}`);
  }
});

test('incomplete website drafts do not break the Wallet editor', () => {
  const model = walletModel({ ...contact, website: 'not a website' }, 'essential', {});
  assert.equal(model.qrValue, createVCard({ ...contact, website: '' }));
});
