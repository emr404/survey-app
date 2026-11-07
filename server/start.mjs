import { writeFileSync, renameSync, readFileSync, unlinkSync } from 'node:fs';
import { createTravelServer } from './app.mjs';

function listen(server, port) {
  return new Promise((resolve, reject) => {
    function cleanup() { server.removeListener('error', failed); server.removeListener('listening', ready); }
    function failed(error) { cleanup(); reject(error); }
    function ready() { cleanup(); resolve(); }
    server.once('error', failed); server.once('listening', ready);
    server.listen(port, '127.0.0.1');
  });
}

export async function startTravelApi({ port = 3001, runtimeFile, options = {}, report = console.log }) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('API_PORT must be a valid port number.');
  const server = createTravelServer(options);
  try { await listen(server, port); }
  catch (error) {
    if (error.code !== 'EADDRINUSE') throw error;
    report(`Port ${port} is already in use. Starting this API on an available port instead.`);
    await listen(server, 0);
  }
  const actualPort = server.address().port;
  if (runtimeFile) {
    try {
      const temporary = runtimeFile + '.' + process.pid + '.tmp';
      writeFileSync(temporary, JSON.stringify({ port: actualPort, pid: process.pid }));
      renameSync(temporary, runtimeFile);
    } catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
    server.on('close', () => {
      try {
        const current = JSON.parse(readFileSync(runtimeFile, 'utf8'));
        if (current.port === actualPort && current.pid === process.pid) unlinkSync(runtimeFile);
      } catch { /* Another process may now own the discovery file. */ }
    });
  }
  report(`Travel API (Groq) listening at http://127.0.0.1:${actualPort}`);
  if (runtimeFile) report('The frontend proxy follows this port automatically.');
  return server;
}
