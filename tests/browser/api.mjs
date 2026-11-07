// Isolated test server: exercise the real HTTP API with a mocked Groq transport.
import { startTravelApi } from '../../server/start.mjs';
import { recommendationFixture } from '../fixtures/recommendations.mjs';
await startTravelApi({ port: Number(process.env.API_PORT || 3011), options: {
  groqKey: 'test-only',
  fetchImpl: async (_url, options) => {
    const input = JSON.parse(JSON.parse(options.body).messages[1].content);
    return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(recommendationFixture(input.preferences)) } }] }));
  },
} });
