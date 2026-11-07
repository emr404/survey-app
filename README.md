# Talaria

A travel planner inspired by Hermes, with a Greek-inspired T mark. Compare destinations, edit the itinerary and approve your final plan.

Built with Vue 3, TypeScript, Vuex and a small Node API.

## Run

Requires Node 22.9+.

```sh
npm ci
npm run api
```

In another terminal:

```sh
npm run serve
```

Open http://localhost:8080, or the URL printed in the terminal.

If API port 3001 is busy, a free port is chosen automatically. The frontend follows it; restart `npm run serve` once after this update.

The default demo needs no API key. Try London, Europe, three days and a daily budget of 120 GBP.

## AI and data

The demo uses labelled sample destinations and estimates. It cannot interpret free-text constraints. Nothing is checked against live travel data or booked.

To use the existing OpenAI integration, copy `.env.example` to `.env.local`, set `AI_MODE=live` and add your server-side `OPENAI_API_KEY`. Restart the API. Live requests can incur API charges; their output is still unverified.

Your preferences, results, edits and approval are saved in this browser. Budgets are per person, excluding travel to the destination. Changing the plan requires a new approval.

Trip length accepts positive whole days, with no 14-day cap. Longer live itineraries are generated in sections; these can take longer and use more API calls.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser tests use installed Chrome and local demo servers. No paid calls are made.

[Project notes](docs/portfolio.md)
