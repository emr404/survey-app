# Talaria notes

The journey is: preferences → recommendations → comparison → editable itinerary → approval.

- Recommendations explain their fit and trade-offs.
- Refinements change visible preferences before the user applies them.
- Results remain saved during navigation, errors and cancellation.
- Activities can be added, edited, removed and reordered within a day.
- Approval belongs to an exact revision. Edits require another approval.
- Model responses are validated on the server and client. Keys stay on the server.
- The UI takes inspiration from [BoardUI](https://www.boardui.com/), using neutral surfaces, sans-serif type and compact controls. Background illustrations are original SVGs.

The default demo uses authored examples. Live mode uses the existing OpenAI integration. Neither mode verifies prices, availability, routes or local conditions. There are no bookings or payments.

Checks cover validation, refinements, cancellation, invalid responses, approval and the full journey in desktop and mobile Chrome. Run them with the commands in the README. Browser screenshots are saved in `artifacts/qa/`.

This is a local portfolio prototype: one saved itinerary, no accounts or device sync. No user research, live model evaluation or measured usability gains are claimed.
