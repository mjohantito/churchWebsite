// Injects the server-rendered homepage into dist/index.html.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { render } = await import(pathToFileURL(`${root}dist-ssr/entry-server.js`).href);

const file = `${root}dist/index.html`;
const template = readFileSync(file, 'utf8');
if (!template.includes('<!--app-html-->')) throw new Error('Missing <!--app-html--> marker in dist/index.html');
writeFileSync(file, template.replace('<!--app-html-->', render('/')));
rmSync(`${root}dist-ssr`, { recursive: true, force: true });
console.log('Prerendered / into dist/index.html');
