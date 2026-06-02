# Travel Personal Intelligence Itinerary Skill

## Purpose

This skill creates a personalized travel itinerary from a user’s place, dates, and intent, then outputs a beautiful self-contained HTML visualization of the final decided itinerary.

The LLM is responsible for planning before producing HTML. The HTML should not ask the user for more input, call APIs, require API keys, or generate the itinerary at runtime. It should simply render the itinerary that the model already planned.

The goal is:

> Make the user feel like the itinerary was designed around them, not around the destination.

## User input

The user may provide:

```txt
Place: destination city, region, neighborhood, or country
Dates: travel date or date range
Intent: what they want from the trip
Mood: optional
Companions: optional
Constraints: optional
Personal context: optional
```

## Minimum behavior

If the user gives place, dates, and intent, proceed.

If dates are missing, assume a one-day itinerary and state that assumption.

If mood is missing, infer one from intent.

If place is missing, ask one short clarification.

## Allowed moods

Use exactly:

```txt
slow
fast-paced
adventurous
romantic
hidden gems
iconic spots
social
private
nature
culinary
```

## Personal intelligence

Before planning, infer:

```json
{
  "pace": "slow | medium | fast",
  "novelty": "familiar | balanced | hidden gems",
  "social_energy": "private | balanced | social",
  "physical_energy": "low | medium | high",
  "food_importance": "low | medium | high",
  "nature_importance": "low | medium | high",
  "culture_importance": "low | medium | high",
  "romance_importance": "low | medium | high",
  "tourist_tolerance": "low | medium | high",
  "visual_taste": "practical | aesthetic | design-forward | local"
}
```

Use explicit user input first. Then use conversation context if available. If no personal context is available, infer only from place, dates, intent, and mood.

## Planning rules

The itinerary should include:

- 4 to 7 stops per day
- realistic timing
- meal breaks
- one flexible buffer if needed
- travel time between stops
- reason each stop fits the user
- bookable moments where relevant
- image description for each stop
- static map route data

Do not overpack unless mood is `fast-paced`.

Avoid generic top-10 lists.

## Final HTML requirements

The final HTML must be:

- complete
- self-contained
- responsive
- runnable in a browser
- polished
- no API keys
- no runtime fetch calls
- no external booking/calendar/maps APIs

The HTML should show the final itinerary immediately.

Do not include:

- destination input
- mood selection
- API setup
- Google Maps API
- Places API
- Directions API
- OpenTable API
- Calendar API

## Required UI

The HTML should include:

- destination/date/mood summary
- personal intelligence summary
- itinerary cards
- editorial visual/image placeholder for each card
- static map route preview
- distance/time between stops
- edit mode
- delete icons
- inline add-stop form
- primary `I like it` CTA
- success modal
- light/dark mode toggle

## Edit behavior

When the user clicks `Edit`:

- show delete icons directly on itinerary cards
- show inline add-stop form below the list
- allow adding time, place name, category, and note
- update the itinerary client-side

## CTA behavior

Primary CTA:

```txt
I like it
```

Secondary CTA:

```txt
Edit
```

Do not include:

```txt
Book this itinerary
View itinerary
```

## Success modal

When the user clicks `I like it`, show:

```txt
Your itinerary has been added to your calendar and Gemini has booked reservations.
```

Close should be the primary CTA.

Show simulated reservation cards for bookable moments:

- Google Calendar
- OpenTable
- Timed entry
- Activity booking

## Output format

Return:

1. Short summary of the personalized plan.
2. One complete self-contained HTML file.

The HTML is the visualization of the itinerary the LLM already planned.
