import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 8787);

function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

const fileEnv = loadEnvFile();

function getApiKey(request) {
  const headerKey = request.headers['x-groq-key'];
  if (headerKey && headerKey.startsWith('gsk_')) return headerKey;
  return process.env.GROQ_API_KEY || fileEnv.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || fileEnv.VITE_GROQ_API_KEY || '';
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-groq-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    setCors(res);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname !== '/api/groq') {
    setCors(res);
    return sendJson(res, 404, { error: 'Not Found' });
  }

  if (req.method !== 'POST') {
    setCors(res);
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  const apiKey = getApiKey(req);
  if (!apiKey) {
    setCors(res);
    return sendJson(res, 400, { error: 'Missing GROQ_API_KEY on server' });
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString('utf8');
  });

  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify(payload)
      });
      clearTimeout(timeoutId);

      const text = await upstream.text();
      setCors(res);
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      return res.end(text);
    } catch (err) {
      setCors(res);
      if (err.name === 'AbortError') {
        return sendJson(res, 504, { error: 'Upstream timed out after 30s' });
      }
      return sendJson(res, 500, { error: 'Proxy error', details: err?.message || 'Unknown error' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Groq proxy listening on http://localhost:${PORT}`);
});
