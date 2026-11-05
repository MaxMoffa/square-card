import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const assets = readdirSync('dist/assets');
const css = readFileSync(path.join('dist/assets', assets.find(name => name.endsWith('.css'))), 'utf8');
const js = readFileSync(path.join('dist/assets', assets.find(name => name.endsWith('.js'))), 'utf8');
const html = readFileSync('dist/index.html', 'utf8')
  .replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/, () => `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`)
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`);
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/square-card.html', html);
console.log('Artefatto autonomo: artifacts/square-card.html');
