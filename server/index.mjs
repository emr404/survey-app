import { fileURLToPath } from 'node:url';
import { startTravelApi } from './start.mjs';
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
try {
  const server = await startTravelApi({ port, host: process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1'), fallbackPort: !process.env.PORT, runtimeFile: process.env.API_DISCOVERY === 'off' || process.env.PORT ? null : fileURLToPath(new URL('../.travel-api.json', import.meta.url)),
    options: { allowedOrigin: process.env.ALLOWED_ORIGIN ? new URL(process.env.ALLOWED_ORIGIN).origin : undefined, groqKey: process.env.GROQ_API_KEY, groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b' } });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(); server.closeAllConnections();
  });
} catch (error) {
  console.error(`Could not start the travel API: ${error.message}`);
  process.exitCode = 1;
}
