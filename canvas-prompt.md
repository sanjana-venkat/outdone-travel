Use this repository as the source of truth.

Read these files first:

1. `skills.md`
2. `design.md`
3. `personal-intelligence-schema.md`
4. `itinerary-contract.json`
5. `example-output.json`
6. `app/index.html`

Create a Gemini Canvas HTML visualization for the user's travel itinerary.

The user will provide:

- place
- dates
- intent

You must:

1. Infer the user's mood if missing.
2. Apply the personal intelligence schema.
3. Plan the itinerary before writing the HTML.
4. Use real, high-quality place recommendations.
5. Avoid generic top-10 lists.
6. Produce a complete self-contained HTML page.
7. Render the final decided itinerary immediately.
8. Include a static route preview, place visuals, edit mode, inline add/delete stops, and an “I like it” success modal.
9. Do not require API keys or external API calls.

The final HTML must not ask the user to choose a destination or mood. It should show the itinerary the LLM already decided.

Use the style and behavior rules in `design.md`.

Use the data shape in `itinerary-contract.json`.

Use `app/index.html` as the implementation reference and visual baseline.
