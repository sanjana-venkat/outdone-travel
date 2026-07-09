/* global process */
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function formatModernSuggestions(data) {
  return (data.suggestions || [])
    .map((item) => {
      const prediction = item.placePrediction;
      if (!prediction) return null;

      const mainText = prediction.structuredFormat?.mainText?.text;
      const secondaryText = prediction.structuredFormat?.secondaryText?.text;
      const label =
        mainText && secondaryText ? `${mainText}, ${secondaryText}` : prediction.text?.text;

      return label ? { label, placeId: prediction.placeId, source: "google" } : null;
    })
    .filter(Boolean)
    .slice(0, 6);
}

async function fetchLegacySuggestions(input) {
  const params = new URLSearchParams({
    input,
    key: GOOGLE_MAPS_API_KEY,
    language: "en"
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
  );
  const data = await response.json();

  if (!response.ok || data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
    console.error("Legacy autocomplete API error:", data);
    return {
      suggestions: [],
      error: data.error_message || data.status || "Google Places Autocomplete failed"
    };
  }

  return {
    suggestions: (data.predictions || [])
      .map((prediction) =>
        prediction.description
          ? {
              label: prediction.description,
              placeId: prediction.place_id,
              source: "google"
            }
          : null
      )
      .filter(Boolean)
      .slice(0, 6)
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET." });

  const input = String(req.query.input || "").trim();

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(200).json({ suggestions: [], error: "Missing GOOGLE_MAPS_API_KEY" });
  }

  if (input.length < 2) return res.status(200).json({ suggestions: [] });

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
      },
      body: JSON.stringify({ input, languageCode: "en" })
    });

    const data = await response.json();

    if (response.ok) {
      const suggestions = formatModernSuggestions(data);
      if (suggestions.length > 0) return res.status(200).json({ suggestions });
    } else {
      console.error("Autocomplete API error:", data);
    }

    const legacyResult = await fetchLegacySuggestions(input);
    return res.status(200).json(legacyResult);
  } catch (error) {
    console.error("Autocomplete route crashed:", error);
    try {
      const legacyResult = await fetchLegacySuggestions(input);
      return res.status(200).json(legacyResult);
    } catch (legacyError) {
      console.error("Legacy autocomplete route crashed:", legacyError);
      return res.status(200).json({
        suggestions: [],
        error: legacyError.message || error.message || "Autocomplete route crashed"
      });
    }
  }
