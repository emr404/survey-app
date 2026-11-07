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

## Deploy: Netlify + Render

1. Push the prepared code to `main` when ready to deploy.
2. Render: New → Web Service → connect this repo. Use Node, build `npm ci --omit=dev`, start `npm run api`, health check `/api/status`, Free instance.
3. Render environment: `GROQ_API_KEY`, `GROQ_MODEL=openai/gpt-oss-20b`, `NODE_VERSION=22`, `NODE_ENV=production`, `ALLOWED_ORIGIN=https://travel-companion-emr.netlify.app`. Render supplies `PORT`.
4. Deploy and open `https://YOUR-SERVICE.onrender.com/api/status`. It should show `available: true` (key configured; not a model or quota check).
5. Netlify → your existing site → Project configuration → Environment variables: add `VUE_APP_API_BASE_URL=https://YOUR-SERVICE.onrender.com` with Build scope, and `NODE_VERSION=22`.
6. Netlify build command: `npm run build`; publish directory: `dist`. Trigger a new deploy after saving variables.
7. Open the site, generate recommendations, open a destination and refresh. `public/_redirects` handles direct links and refreshes.

The frontend only needs the public Render URL. Keep the Groq key in Render, never in a `VUE_APP_` variable or Netlify frontend build. Free Render services sleep after inactivity; the first request may need a retry. CORS limits browser origins, not direct API clients. This portfolio API has in-memory request limits and no accounts.
