/* PROTOTYPE — ticket 08. Zero-dependency static server for the repo root.
 *
 * The 3D prototype needs ES modules and fetch(), which file:// forbids.
 * Serving the repo root means the 2D fallback is reachable in the next tab,
 * which is the whole point of a gate:
 *
 *   node prototypes/forest-world-3d/serve.mjs
 *   3D  http://localhost:5173/prototypes/forest-world-3d/
 *   2D  http://localhost:5173/prototypes/forest-world/
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PORT = +(process.env.PORT || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found');
  }
}).listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(networkInterfaces()).flat().find((n) => n.family === 'IPv4' && !n.internal);
  console.log(`3D  http://localhost:${PORT}/prototypes/forest-world-3d/`);
  console.log(`2D  http://localhost:${PORT}/prototypes/forest-world/`);
  if (lan) console.log(`phone  http://${lan.address}:${PORT}/prototypes/forest-world-3d/`);
});
