# Talaria

Set travel preferences, get explained destination recommendations, refine your search and explore destination details.

## Run

Requires Node 22.9+.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and add your [Groq key](https://console.groq.com/keys).
3. Run `npm run api` and `npm run serve` in separate terminals.
4. Open http://localhost:8080. Restart the API after configuration changes.

## Notes

- Vue 3, TypeScript, Vuex and a Node API. Groq is the only AI provider. Its free plan has request limits.
- The `openai/gpt-oss-20b` model runs on Groq. Keys stay on the server. Responses are validated; requests support cancellation and retry.
- Costs, journey times and passport-specific visa guidance are preliminary, without live travel or entry-rule checks. Budgets are per person and exclude travel to the destination. No booking or payment.
- Photos come from Wikimedia with attribution. Images can be unavailable.
- Preferences and Groq recommendations are saved in this browser.
- GFS Neohellenic is self-hosted, with its OFL licence in `src/assets/fonts`.

## Checks

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.

Tests use a mocked Groq transport and test-only fixtures. Browser checks cover mobile and desktop. No model requests are made by automated tests.
