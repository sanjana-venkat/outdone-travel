# Personal Intelligence Schema

This schema explains how to turn place, dates, and intent into a personalized itinerary.

## Input fields

```json
{
  "place": "Destination city, region, neighborhood, or country",
  "dates": "Travel date or date range",
  "intent": "What the user wants from the trip",
  "mood": "Optional mood",
  "companions": "Optional",
  "constraints": {
    "budget": "Optional",
    "diet": "Optional",
    "mobility": "Optional",
    "time_available": "Optional",
    "transportation": "Optional",
    "weather_sensitivity": "Optional"
  },
  "personal_signals": {
    "saved_places": "Optional",
    "calendar": "Optional",
    "gmail_bookings": "Optional",
    "maps_history": "Optional",
    "youtube_interests": "Optional",
    "search_intent": "Optional",
    "stated_preferences": "Optional"
  }
}
```

## Personalization dimensions

Infer these dimensions before planning:

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
  "visual_taste": "practical | aesthetic | design-forward | local",
  "planning_confidence": "low | medium | high"
}
```

## Mood mapping

```txt
relaxing, chill, easy, peaceful -> slow
do a lot, packed, maximize, cover more -> fast-paced
thrill, active, outdoors, bold -> adventurous
couple, date, anniversary, honeymoon -> romantic
local, non-touristy, unique, aesthetic -> hidden gems
must-see, first time, famous, classic -> iconic spots
friends, nightlife, meet people, lively -> social
solo, quiet, intimate, low-crowd -> private
parks, hikes, gardens, outdoors -> nature
food, restaurants, cafes, vegetarian, dessert -> culinary
```

## Planning priorities by mood

### Slow
Prioritize fewer stops, calm cafés, gardens, scenic walks, buffers, and low-friction meals.

### Fast-paced
Prioritize dense areas, efficient routing, iconic clusters, short stops, and variety.

### Adventurous
Prioritize active routes, hikes, water, physical experiences, and bold local activities.

### Romantic
Prioritize slower timing, scenic moments, gardens, sunset, intimate food stops, and a soft evening finish.

### Hidden gems
Prioritize independent cafés, local neighborhoods, bookstores, street art, small galleries, non-obvious viewpoints, and places locals would actually use.

### Iconic spots
Prioritize major landmarks, classic views, first-time visitor anchors, and highly recognizable places.

### Social
Prioritize markets, lively food halls, nightlife corridors, plazas, walkable districts, and high-energy neighborhoods.

### Private
Prioritize low-crowd places, quiet galleries, gardens, scenic pauses, and intimate cafés.

### Nature
Prioritize parks, gardens, lakes, waterfront, hikes, and viewpoints.

### Culinary
Prioritize breakfast, cafés, food markets, restaurant districts, dessert, and dinner reservations.

## Quality rule

For every stop, answer:

```txt
Why is this right for this person, on this day, with this mood?
```
