import http from 'node:http';
import { parseEnv } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildRequest, readMove, evaluateRequests } from './jev-api.mjs';

async function getApiKey() {
  if (process.env.JEV_API_KEY !== undefined) return process.env.JEV_API_KEY.trim();
  try {
    const env = parseEnv(await readFile(new URL('.env', import.meta.url), 'utf8'));
    return (env.JEV_API_KEY || '').trim();
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}
const port = Number(process.env.PORT || 4317);
const origin = `http://127.0.0.1:${port}`;
const root = new URL('./', import.meta.url);
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
const server = http.createServer(async (req, res) => {
  if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== origin)) return json(res, 403, { error: 'Open the local game URL.' });
  const path = new URL(req.url, origin).pathname;
  try {
    if (path === '/api/status' && req.method === 'GET') return json(res, 200, { configured: Boolean(await getApiKey()) });
    if (path.startsWith('/api/') && req.method === 'POST') {
      if (req.headers['content-type'] !== 'application/json') return json(res, 415, { error: 'JSON required.' });
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 30000) return json(res, 413, { error: 'Request too large.' });
      }
      const data = JSON.parse(body);
      if (path === '/api/move') {
        const apiKey = await getApiKey();
        if (!apiKey) return json(res, 400, { error: 'Set JEV_API_KEY in the local .env file.' });
        const serverStart = performance.now();
        const request = buildRequest(data);
        const start = performance.now();
        const evaluate = async request => {
          const upstream = await fetch('https://api.typesafe.ai/v1/systemone', {
            method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(request), signal: AbortSignal.timeout(30000)
          });
          if (!upstream.ok) {
            const error = new Error('Jev request failed');
            error.upstreamStatus = upstream.status;
            throw error;
          }
          return upstream.json();
        };
        const { raw: result, calls } = await evaluateRequests(request, evaluate);
        const apiMs = performance.now() - start;
        const plan = readMove(result, request, data.board);
        return json(res, 200, { ...plan, apiMs, serverMs: performance.now() - serverStart,
          apiCalls: calls.length, calls, requestBytes: calls.reduce((sum, call) => sum + call.requestBytes, 0), questionCount: Object.keys(request.questions).length,
          cellCount: plan.estimates.length, request, raw: result });
      }
      return json(res, 404, { error: 'Not found.' });
    }
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
    const asset = path === '/' ? 'index.html' : path.slice(1);
    if (!/^(index\.html|style\.css|sketch\.js|cell\.js|jev\.js|AI\/[\w.-]+\.js|libraries\/[\w.-]+\.js|src\/[\w.-]+\.(png|svg|ttf))$/.test(asset)) return json(res, 404, { error: 'Not found.' });
    const bytes = await readFile(fileURLToPath(new URL(asset, root)));
    res.writeHead(200, { 'Content-Type': mime[asset.slice(asset.lastIndexOf('.'))] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(bytes);
  } catch (error) {
    if (error.upstreamStatus) return json(res, 502, { error: `Jev returned HTTP ${error.upstreamStatus}. Check your key, balance or rate limit and try again.` });
    json(res, error instanceof TypeError || error instanceof SyntaxError ? 400 : 502, { error: error.name === 'TimeoutError' ? 'Jev timed out. Click again to retry.' : 'Could not complete the request. Check the key and try again.' });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Minesweeper: ${origin}`));
