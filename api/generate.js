const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const FALLBACK_IMAGES = [
  "https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1510595/pexels-photo-1510595.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1400"
];

function stripCodeFence(text = "") {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeJsonParse(text) {
  const clean = stripCodeFence(text);
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function normalizeKey(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueFallbackImage(index, usedImages) {
  for (let offset = 0; offset < FALLBACK_IMAGES.length; offset += 1) {
    const candidate = FALLBACK_IMAGES[(index + offset) % FALLBACK_IMAGES.length];
    if (!usedImages.has(candidate)) {
      usedImages.add(candidate);
      return candidate;
    }
  }

  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function fallbackItinerary({ destination, dates, diet, travelWith, selectedMoods }) {
  const dest = destination || "Kyoto, Japan";
  const d = dates || "Today";
  const moods = (selectedMoods || []).map((m) => m.title).filter(Boolean);
  const moodLine = moods.length ? moods.join(" + ") : "Slow & easy";

  const baseStops = [
    {
      time: "8:30",
      period: "AM",
      category: "DAWN · RESET",
      name: dest.toLowerCase().includes("kyoto") ? "Kyoto Gyoen National Garden" : `${dest} morning walk`,
      description: `Start with a low-friction, mood-matched moment before the day gets crowded. This is designed around ${moodLine.toLowerCase()} energy.`,
      photoQuery: dest.toLowerCase().includes("kyoto") ? "Kyoto Gyoen National Garden, Kyoto" : `${dest} scenic morning`,
      routeFromPrevious: "Start of plan"
    },
    {
      time: "10:30",
      period: "AM",
      category: "COMFORT · PAUSE",
      name: dest.toLowerCase().includes("kyoto") ? "Cafe Bibliotic Hello!" : `Vegetarian-friendly café in ${dest}`,
      description: `A relaxed café pause that respects ${diet || "your dietary preference"} and gives the day room to breathe.`,
      photoQuery: dest.toLowerCase().includes("kyoto") ? "Cafe Bibliotic Hello Kyoto" : `${dest} vegetarian cafe`,
      routeFromPrevious: "Easy walk or short taxi from the previous stop"
    },
    {
      time: "1:00",
      period: "PM",
      category: "LOCAL · DISCOVERY",
      name: dest.toLowerCase().includes("kyoto") ? "Nanzen-ji Temple" : `${dest} cultural neighborhood`,
      description: "A textured local stop chosen to feel more personal than a generic top-10 itinerary.",
      photoQuery: dest.toLowerCase().includes("kyoto") ? "Nanzen-ji Temple Kyoto" : `${dest} cultural neighborhood`,
      routeFromPrevious: "Gentle route with room to wander"
    },
    {
      time: "4:30",
      period: "PM",
      category: "GOLDEN HOUR · MOOD",
      name: dest.toLowerCase().includes("kyoto") ? "Shogunzuka Seiryuden" : `${dest} sunset viewpoint`,
      description: "A beautiful late-day moment for reflection, photos, and emotional payoff.",
      photoQuery: dest.toLowerCase().includes("kyoto") ? "Shogunzuka Seiryuden Kyoto" : `${dest} sunset viewpoint`,
      routeFromPrevious: "Short taxi or scenic transit"
    },
    {
      time: "7:30",
      period: "PM",
      category: "DINNER · CLOSE",
      name: dest.toLowerCase().includes("kyoto") ? "Ain Soph Journey Kyoto" : `${dest} dinner spot`,
      description: `A dinner ending that keeps the day aligned with ${travelWith || "your group"} and ${diet || "your preferences"}.`,
      photoQuery: dest.toLowerCase().includes("kyoto") ? "Ain Soph Journey Kyoto" : `${dest} dinner restaurant`,
      routeFromPrevious: "Finish with an easy evening route"
    }
  ];

  return {
    destination: dest,
    dates: d,
    selectedMood: moodLine,
    generatedBy: "fallback",
    summary:
      "This is a Travel DNA fallback preview generated because Gemini free-tier credits are limited. It still uses your setup and mood signals, and attempts to enrich places with Google Places where available.",
    stops: baseStops
  };
}

async function searchGooglePlace({ query, destination }) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const textQuery = `${query} ${destination}`.trim();

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.currentOpeningHours.openNow",
        "places.photos"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 1,
      languageCode: "en"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Places API error:", data);
    return null;
  }

  return data?.places?.[0] || null;
}

function photoUrlFromPlace(place) {
  const photoName = place?.photos?.[0]?.name;
  if (!photoName) return null;
  return `/api/place-photo?name=${encodeURIComponent(photoName)}`;
}

async function enrichStopWithPlaces(stop, destination, index = 0, usedImages = new Set()) {
  const searchQuery = stop.photoQuery || stop.name;
  const place = await searchGooglePlace({ query: searchQuery, destination });

  if (!place) {
    console.warn("Places lookup returned no result:", { searchQuery, destination });
    return {
      ...stop,
      imageUrl: stop.imageUrl || uniqueFallbackImage(index, usedImages),
      placesStatus: "fallback-image"
    };
  }

  return {
    ...stop,
    name: stop.name || place.displayName?.text,
    placeId: place.id,
    googlePlaceName: place.displayName?.text,
    address: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openNow: place.currentOpeningHours?.openNow,
    mapsUrl: place.googleMapsUri,
    imageUrl: photoUrlFromPlace(place) || uniqueFallbackImage(index, usedImages),
    placesStatus: photoUrlFromPlace(place) ? "google-places" : "fallback-image"
  };
}

async function enrichItinerary(itinerary, destination) {
  const stops = Array.isArray(itinerary.stops) ? itinerary.stops : [];
  const usedImages = new Set();
  itinerary.stops = await Promise.all(
    stops.map((stop, index) => enrichStopWithPlaces(stop, itinerary.destination || destination, index, usedImages))
  );

  const firstGoogleImage = itinerary.stops.find((s) => s.placesStatus === "google-places")?.imageUrl;
  itinerary.heroImageUrl = firstGoogleImage || itinerary.stops[0]?.imageUrl || FALLBACK_IMAGES[0];

  return itinerary;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const {
    user,
    destination,
    dates,
    diet,
    travelWith,
    selectedMoods = []
  } = req.body || {};

  const fallback = () =>
    enrichItinerary(
      fallbackItinerary({ destination, dates, diet, travelWith, selectedMoods }),
      destination
    );

  if (!GEMINI_API_KEY) {
    const itinerary = await fallback();
    return res.status(200).json({
      ...itinerary,
      fallbackReason: "Missing Gemini API key"
    });
  }

  try {
    const moodText = selectedMoods
      .map((item) => `${item.title}: ${item.signal || item.tag}`)
      .join("; ");

    const prompt = `
You are Travel DNA, a mood-first planner powered by Gemini.

Create a REAL, SPECIFIC itinerary for:
Destination: ${destination}
Date: ${dates}
Diet: ${diet}
Planning for: ${travelWith}
User: ${user?.name || "guest"}

Today's mood layer:
${moodText || "No mood selected"}

Rules:
- Generate concrete places in or near the destination. No generic placeholders.
- It should not feel like a generic tourist top-10.
- Respect dietary preference.
- Include 4 to 6 stops.
- For restaurants, choose places likely compatible with the dietary preference.
- Include routeFromPrevious for each stop.
- Include photoQuery as the exact Google Maps search query that should find that stop.
- Return ONLY valid JSON. No markdown.

JSON schema:
{
  "destination": "string",
  "dates": "string",
  "selectedMood": "string",
  "summary": "string",
  "stops": [
    {
      "time": "8:30",
      "period": "AM",
      "category": "DAWN · NATURE",
      "name": "Specific place name",
      "description": "Specific reason this stop matches today's mood",
      "photoQuery": "Specific place name, destination",
      "routeFromPrevious": "short route note"
    }
  ]
}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const raw = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini fallback:", raw);
      const itinerary = await fallback();
      return res.status(200).json({
        ...itinerary,
        fallbackReason: raw?.error?.message || "Gemini API request failed."
      });
    }

    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      const itinerary = await fallback();
      return res.status(200).json({
        ...itinerary,
        fallbackReason: "Gemini returned an empty response."
      });
    }

    const itinerary = safeJsonParse(text);
    const enriched = await enrichItinerary(itinerary, destination);

    return res.status(200).json({
      ...enriched,
      generatedBy: "gemini"
    });
  } catch (error) {
    console.error("Fallback after error:", error);
    const itinerary = await fallback();
    return res.status(200).json({
      ...itinerary,
      fallbackReason: error.message || "Could not generate itinerary."
    });
  }
}
