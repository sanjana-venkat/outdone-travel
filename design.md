# Design System: Travel Personal Intelligence

## Product feel

The interface should feel like a premium Gemini-powered travel product:

- calm
- magical
- personal
- editorial
- highly usable
- lightweight
- not like a dashboard

The goal is for the user to feel:

> This itinerary was designed around me, not around the destination.

## Design principles

### 1. Personal before generic

Every stop should feel chosen for a reason. The UI should emphasize why each stop fits the user's mood, intent, and context.

### 2. Final itinerary, not a form

The final HTML should start on the itinerary page. Do not include destination input, date input, or mood selection unless the user explicitly asks for a full product flow.

The model already planned the itinerary before creating the HTML.

### 3. Magical but practical

Use floating gradients, soft shadows, elegant cards, and gentle animation. Do not sacrifice readability.

### 4. Mobile-first, desktop-polished

Mobile should be stacked and easy. Desktop should use a centered canvas with a left itinerary column and right route preview.

## Mood system

Use exactly these moods:

- slow
- fast-paced
- adventurous
- romantic
- hidden gems
- iconic spots
- social
- private
- nature
- culinary

## Layout

### Desktop

Use a centered app canvas.

Recommended max width:

```css
max-width: 1180px;
```

Itinerary page:

```txt
Top: destination summary, date, mood, intent
Left column: itinerary stops
Right column: static map/route preview
Bottom right: Edit + I like it CTAs
```

### Mobile

Single column:

```txt
Destination summary
Personal intelligence summary
Itinerary cards
Route preview
Edit + I like it CTAs
```

Buttons should be full width on mobile.

## Color system

### Light mode

```css
--bg: #E9EDF5;
--surface: #F8FAFE;
--card: #FFFFFF;
--text: #1F1F1F;
--muted: #747775;
--primary: #1A73E8;
--primary-soft: #E8F0FE;
--accent: #3DE1D1;
--divider: rgba(0,0,0,0.08);
```

### Dark mode

```css
--bg: #080B11;
--surface: #0D1118;
--card: #121822;
--text: #F5F7FB;
--muted: #97A1B4;
--primary: #9E77FF;
--primary-soft: rgba(158,119,255,0.18);
--accent: #3DE1D1;
--divider: rgba(255,255,255,0.11);
```

## Button rules

Primary CTA:

```txt
I like it
```

Secondary CTA:

```txt
Edit
```

Do not use:

```txt
Book this itinerary
View itinerary
disabled primary CTAs
```

Primary buttons should be one solid color, not gradients.

Desktop:

```txt
Primary CTA bottom right, hugging the content.
```

Mobile:

```txt
Primary CTA full width.
```

## Itinerary card requirements

Each stop card should show:

- time
- place name
- category tag
- description
- why this fits
- booking label
- travel to next stop
- editorial image/visual card

## Image treatment

Do not use broken external image links.

Use CSS-generated visual cards or stable embedded visuals.

Visual categories:

```txt
coffee/bookstore -> warm gradient, book/cup icon
nature -> green/blue gradient, leaf/mountain icon
art/culture -> purple/blue gradient, gallery/frame icon
food -> warm orange/cream gradient, fork/plate icon
evening/viewpoint -> dark blue/purple gradient, moon/skyline icon
active/adventure -> blue/green gradient, trail/path icon
```

## Static route preview

Do not use live Google Maps APIs in the final HTML unless explicitly requested.

Create a Google Maps-inspired route panel using:

- soft map-like background
- route line
- numbered pins
- distance/time rows
- total travel estimate

## Edit mode

When the user clicks `Edit`:

- do not open an edit modal
- show delete icons directly on cards
- show an inline add-stop form below the list
- allow adding time, place name, category, and note
- update the itinerary and route preview client-side

## Success modal

When the user clicks `I like it`, show:

```txt
Your itinerary has been added to your calendar and Gemini has booked reservations.
```

Close should be the primary CTA.

Do not include `View itinerary`.

Show simulated reservation cards:

- Google Calendar
- OpenTable
- Timed entry
- Activity booking
