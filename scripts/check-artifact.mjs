import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('artifacts/square-card.html', 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'JavaScript incorporato');
new Function(script);
assert.ok(html.includes('<style>'), 'CSS incorporato');
assert.equal(/(?:src|href)="\/assets\//.test(html), false, 'Nessuna risorsa locale esterna');
console.log('Artefatto HTML verificato: JavaScript valido, CSS e JS incorporati.');
