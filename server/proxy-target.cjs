const { readFileSync } = require('node:fs');

function resolveApiTarget(runtimeFile, explicitTarget, defaultPort = 3001) {
  if (explicitTarget) return explicitTarget;
  try {
    const { port } = JSON.parse(readFileSync(runtimeFile, 'utf8'));
    if (Number.isInteger(port) && port > 0 && port <= 65535) return `http://127.0.0.1:${port}`;
  } catch { /* No running API has announced its port yet. */ }
  return `http://127.0.0.1:${defaultPort}`;
}
module.exports = { resolveApiTarget };
