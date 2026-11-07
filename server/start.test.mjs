import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startTravelApi } from './start.mjs';
import proxy from './proxy-target.cjs';

test('occupied API port selects a free port and the frontend discovers it without killing the existing listener', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'travel-port-'));
  const runtimeFile = join(directory, 'api.json');
  const occupied = createServer((_request, response) => response.end('Existing service'));
  occupied.listen(0, '127.0.0.1'); await once(occupied, 'listening');
  const busyPort = occupied.address().port;
  let api;
  try {
    const messages = [];
    api = await startTravelApi({ port: busyPort, runtimeFile, options: { groqKey: 'test-only' }, report: message => messages.push(message) });
    const target = proxy.resolveApiTarget(runtimeFile);
    assert.notEqual(api.address().port, busyPort);
    assert.equal(JSON.parse(readFileSync(runtimeFile, 'utf8')).port, api.address().port);
    assert.equal(target, `http://127.0.0.1:${api.address().port}`);
    assert.equal((await (await fetch(target + '/api/status')).json()).mode, 'groq');
    assert.equal(await (await fetch(`http://127.0.0.1:${busyPort}`)).text(), 'Existing service');
    assert.ok(messages.some(message => message.includes('already in use')));
    assert.equal(proxy.resolveApiTarget(runtimeFile, 'http://127.0.0.1:3011'), 'http://127.0.0.1:3011');
    api.closeAllConnections(); await new Promise(resolve => api.close(resolve)); api = null;
    assert.equal(existsSync(runtimeFile), false);
    assert.equal(proxy.resolveApiTarget(runtimeFile), 'http://127.0.0.1:3001');
    writeFileSync(runtimeFile, '{invalid');
    assert.equal(proxy.resolveApiTarget(runtimeFile), 'http://127.0.0.1:3001');
  } finally {
    if (api) { api.closeAllConnections(); await new Promise(resolve => api.close(resolve)); }
    occupied.closeAllConnections(); await new Promise(resolve => occupied.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  }
});

test('production can bind publicly and fails instead of switching an occupied platform port', async () => {
  const api = await startTravelApi({ port: 0, host: '0.0.0.0', fallbackPort: false, options: { groqKey: 'test-only' }, report: () => {} });
  try {
    assert.equal(api.address().address, '0.0.0.0');
    const port = api.address().port;
    assert.equal((await fetch(`http://127.0.0.1:${port}/api/status`)).status, 200);
    await assert.rejects(startTravelApi({ port, host: '0.0.0.0', fallbackPort: false, report: () => {} }), { code: 'EADDRINUSE' });
  } finally { api.closeAllConnections(); await new Promise(resolve => api.close(resolve)); }
});
