/* global process */
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
  "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1400"
];

function stripCodeFence(text = "") {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
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

function getMoodText(selectedMoods = []) {
  return selectedMoods.map((item) => `${item.title}: ${item.signal || item.tag || ""}`).join("; ");
}

function parseStopMinutes(stop = {}) {
  const raw = `${stop.time || ""} ${stop.period || ""}`.trim().toLowerCase();
  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.replace(/\./g, "");
  if (meridiem === "pm" && hour !== 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function stopTimeRank(stop = {}) {
  const minutes = parseStopMinutes(stop);
  if (minutes != null) return minutes;
  const text = `${stop.period || ""} ${stop.category || ""} ${stop.name || ""} ${stop.description || ""}`.toLowerCase();
  if (/(sunrise|breakfast|coffee|morning|dawn)/.test(text)) return 8 * 60;
  if (/(brunch|late morning)/.test(text)) return 10 * 60;
  if (/(lunch|noon|midday)/.test(text)) return 13 * 60;
  if (/(snack|dessert|afternoon)/.test(text)) return 15 * 60;
  if (/(dinner|sunset|evening)/.test(text)) return 19 * 60;
  if (/(night|drinks|bar|club|late)/.test(text)) return 21 * 60;
  return 16 * 60;
}

function orderStopsByTime(stops = []) {
  return [...stops].sort((a, b) => stopTimeRank(a) - stopTimeRank(b));
}

function fallbackItinerary({ destination, dates, diet, travelWith, selectedMoods }) {
  const dest = destination || "Kyoto, Japan";
  const d = dates || "Today";
  const moods = (selectedMoods || []).map((m) => m.title).filter(Boolean);
  const moodLine = moods.length ? moods.join(" + ") : "Slow & easy";
  const kyoto = dest.toLowerCase().includes("kyoto");

  const stops = kyoto ? [
    ["8:00","AM","BREAKFAST · FOOD","Kishin Kitchen Kyoto","Kishin Kitchen Kyoto",`A calm breakfast option to start the day with ${diet || "your food preferences"} in mind.`,"Start of plan"],
    ["9:00","AM","DAWN · RESET","Kyoto Gyoen National Garden","Kyoto Gyoen National Garden Kyoto","Start with a quiet, low-crowd walk that matches today's energy.","Easy walk after breakfast"],
    ["10:30","AM","COFFEE · PAUSE","Cafe Bibliotic Hello!","Cafe Bibliotic Hello Kyoto",`A relaxed cafe pause that works well for ${diet || "your food preferences"}.`,"Easy walk or short taxi from the garden"],
    ["11:30","AM","LOCAL · CULTURE","Nanzen-ji Temple","Nanzen-ji Temple Kyoto","A textured cultural stop that feels calmer than a generic top-10 itinerary.","Gentle transit east toward Higashiyama"],
    ["12:45","PM","LUNCH · FOOD","TowZen Kyoto","TowZen Kyoto",`A plant-forward lunch option compatible with ${diet || "your preferences"}.`,"Short ride from Nanzen-ji"],
    ["2:15","PM","MARKET · SNACK","Nishiki Market","Nishiki Market Kyoto","A flexible food and browsing stop for snacks, sweets, and local texture.","Transit back toward central Kyoto"],
    ["3:30","PM","CULTURE · WALK","Gion Shirakawa","Gion Shirakawa Kyoto","A scenic neighborhood walk with architecture, water, and quiet corners.","Short walk from market area"],
    ["4:45","PM","GOLDEN HOUR · VIEW","Shogunzuka Seiryuden","Shogunzuka Seiryuden Kyoto","A late-day viewpoint for photos, conversation, and emotional payoff.","Short taxi or scenic transit"],
    ["6:15","PM","DESSERT · FOOD","Kagizen Yoshifusa","Kagizen Yoshifusa Kyoto","A classic sweets stop before dinner if you want a slower evening rhythm.","Taxi or transit back into Gion"],
    ["7:30","PM","DINNER · FOOD","Ain Soph Journey Kyoto","Ain Soph Journey Kyoto",`A plant-forward dinner ending built around ${travelWith || "your group"} and ${diet || "your preferences"}.`,"Finish with an easy evening route"],
    ["9:00","PM","NIGHT · WALK","Pontocho Alley","Pontocho Alley Kyoto","A compact evening stroll with lanterns, narrow lanes, and river-adjacent atmosphere.","Walk from dinner"],
    ["10:00","PM","DRINKS · FOOD","L'Escamoteur Bar Kyoto","L'Escamoteur Bar Kyoto","A memorable final drink option if the night still has energy.","Short taxi or walk from Pontocho"]
  ] : [
    ["8:30","AM","BREAKFAST · FOOD",`${dest} breakfast cafe`,`${dest} best breakfast cafe`,`A real breakfast search target aligned to ${diet || "your food preferences"}.`,"Start of plan"],
    ["9:30","AM","START · LOCAL",`${dest} historic center`,`${dest} historic center`,`Start with a low-friction local walk that reflects ${moodLine.toLowerCase()} energy.`,"Easy walk after breakfast"],
    ["10:45","AM","COFFEE · FOOD",`${dest} specialty coffee`,`${dest} specialty coffee`,`A relaxed coffee stop aligned to ${diet || "your food preferences"}.`,"Short walk or quick ride"],
    ["11:45","AM","CULTURE · ACTIVITY",`${dest} museum`,`${dest} museum`,"A concrete cultural search target to compare with the rest of the plan.","Easy transition from coffee"],
    ["1:00","PM","LUNCH · FOOD",`${dest} vegetarian lunch`,`${dest} vegetarian lunch`,`A lunch stop chosen around ${diet || "your food preferences"}.`,"Short ride from the morning activity"],
    ["2:15","PM","DISCOVERY · CULTURE",`${dest} cultural district`,`${dest} cultural district`,"A place to explore without making the day feel overplanned.","Easy transition from lunch"],
    ["3:30","PM","MARKET · FOOD",`${dest} food market`,`${dest} food market`,"A flexible food and browsing stop for snacks, sweets, or local specialties.","Short walk or ride"],
    ["4:45","PM","MOOD · VIEW",`${dest} scenic viewpoint`,`${dest} scenic viewpoint`,"A late-day visual moment to make the plan memorable.","Short taxi or scenic route"],
    ["6:00","PM","DESSERT · FOOD",`${dest} dessert cafe`,`${dest} dessert cafe`,`A lighter food stop before dinner, compatible with ${diet || "your preferences"} when possible.`,"Easy transit from the viewpoint"],
    ["7:30","PM","DINNER · FOOD",`${dest} dinner restaurant`,`${dest} dinner restaurant`,`A closing meal chosen around ${travelWith || "your group"} and ${diet || "your preferences"}.`,"Simple evening route"],
    ["9:00","PM","EVENING · ACTIVITY",`${dest} evening walk`,`${dest} evening walk`,"A low-friction evening option after dinner.","Walk or short ride from dinner"],
    ["10:00","PM","DRINKS · FOOD",`${dest} cocktail bar`,`${dest} cocktail bar`,"A final optional drinks stop if the night still has energy.","Short ride from the evening walk"]
  ];

  return {
    destination: dest,
    dates: d,
    selectedMood: moodLine,
    generatedBy: "fallback",
    summary: "Gemini credits are limited, so Travel DNA generated a local fallback preview while still enriching places with Google Places.",
    stops: stops.map(([time, period, category, name, photoQuery, description, routeFromPrevious]) => ({
      time, period, category, name, photoQuery, description, routeFromPrevious
    }))
  };
}

async function searchGooglePlace({ query, destination }) {
  if (!GOOGLE_MAPS_API_KEY) return null;

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
        "places.photos",
        "places.types",
        "places.priceLevel"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery: `${query} ${destination || ""}`.trim(),
      maxResultCount: 1,
      languageCode: "en"
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Places SearchText error:", data);
    return null;
  }
  return data?.places?.[0] || null;
}

function photoUrlFromPlace(place) {
  const photoName = place?.photos?.[0]?.name;
  return photoName ? `/api/place-photo?name=${encodeURIComponent(photoName)}` : null;
}

async function enrichStopWithPlaces(stop, destination, index, usedImages) {
  const place = await searchGooglePlace({ query: stop.photoQuery || stop.name, destination });

  if (!place) {
    return {
      ...stop,
      imageUrl: stop.imageUrl || uniqueFallbackImage(index, usedImages),
      placesStatus: "fallback-image",
      placeSource: "Fallback image"
    };
  }

  const googlePhoto = photoUrlFromPlace(place);

  return {
    ...stop,
    placeId: place.id,
    googlePlaceName: place.displayName?.text,
    address: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openNow: place.currentOpeningHours?.openNow,
    mapsUrl: place.googleMapsUri,
    priceLevel: place.priceLevel,
    placeTypes: place.types || [],
    imageUrl: googlePhoto || uniqueFallbackImage(index, usedImages),
    placesStatus: googlePhoto ? "google-places" : "fallback-image",
    placeSource: googlePhoto ? "Google Places" : "Fallback image"
  };
}

async function enrichItinerary(itinerary, destination) {
  const stops = orderStopsByTime(Array.isArray(itinerary.stops) ? itinerary.stops : []);
  const usedImages = new Set();

  itinerary.stops = orderStopsByTime(await Promise.all(
    stops.map((stop, index) => enrichStopWithPlaces(stop, itinerary.destination || destination, index, usedImages))
  ));

  itinerary.heroImageUrl =
    itinerary.stops.find((s) => s.placesStatus === "google-places")?.imageUrl ||
    itinerary.stops[0]?.imageUrl ||
    FALLBACK_IMAGES[0];

  itinerary.hasGooglePlacesData = itinerary.stops.some((s) => s.placeId);
  itinerary.hasGooglePhotos = itinerary.stops.some((s) => s.placesStatus === "google-places");

  return itinerary;
}

async function generateWithGemini(payload) {
  const { user, destination, dates, diet, travelWith, selectedMoods = [], instruction = "" } = payload;
  const moodText = getMoodText(selectedMoods);

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
- Respect dietary preference.
- Return exactly 12 stops in the top-level stops array. No fewer.
- Start with morning or breakfast, then late morning, lunch, afternoon, dinner, evening, and night. The returned array must already be chronological.
- Include at least 5 food or drink stops across breakfast, coffee, lunch, snack, dessert, dinner, drinks, food markets, or cafes.
- For restaurants and food stops, choose places likely compatible with the dietary preference and include the meal type in category.
- Include a balanced mix of food and activities. Do not return only sights or only activities.
- Include routeFromPrevious for each stop.
- Include photoQuery as the exact Google Maps search query that should find that stop.
- If the client supplied extra instruction, honor it unless it conflicts with these rules.
- Return ONLY valid JSON. No markdown.

Client instruction:
${instruction || "None"}

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
}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.72, maxOutputTokens: 8192, responseMimeType: "application/json" }
      })
    }
  );

  const raw = await geminiRes.json();
  if (!geminiRes.ok) throw new Error(raw?.error?.message || "Gemini API request failed.");

  const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");

  return safeJsonParse(text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const payload = req.body || {};
  const { destination } = payload;

  try {
    let itinerary;

    if (!GEMINI_API_KEY) {
      itinerary = fallbackItinerary(payload);
      itinerary.fallbackReason = "Missing GEMINI_API_KEY";
    } else {
      try {
        itinerary = await generateWithGemini(payload);
        itinerary.generatedBy = "gemini";
      } catch (error) {
        console.error("Gemini fallback:", error.message);
        itinerary = fallbackItinerary(payload);
        itinerary.fallbackReason = error.message;
      }
    }

    const enriched = await enrichItinerary(itinerary, destination);
    return res.status(200).json(enriched);
  } catch (error) {
    console.error("Generate route crashed:", error);

    const fallback = fallbackItinerary(payload);
    const enriched = await enrichItinerary(fallback, destination);

    return res.status(200).json({
      ...enriched,
      fallbackReason: error.message || "Could not generate itinerary."
    });
  }
}
