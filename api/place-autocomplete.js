const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default async function handler(req, res) {
  const input = String(req.query.input || "").trim();

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(200).json({ suggestions: [] });
  }

  if (input.length < 2) {
    return res.status(200).json({ suggestions: [] });
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY
      },
      body: JSON.stringify({
  input,
  languageCode: "en"
})
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Autocomplete API error:", data);
      return res.status(200).json({ suggestions: [] });
    }

    const suggestions = (data.suggestions || [])
      .map((item) => {
        const prediction = item.placePrediction;
        const label =
          prediction?.structuredFormat?.mainText?.text && prediction?.structuredFormat?.secondaryText?.text
            ? `${prediction.structuredFormat.mainText.text}, ${prediction.structuredFormat.secondaryText.text}`
            : prediction?.text?.text;

        return label
          ? {
              label,
              placeId: prediction?.placeId,
              source: "google"
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, 6);

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ suggestions: [] });
  }
}
