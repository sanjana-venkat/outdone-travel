export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

  const body = req.body || {};
  const prompt = `
You are Travel DNA, a personalized itinerary engine.
Generate ONLY valid JSON. No markdown.

Input:
${JSON.stringify(body, null, 2)}

Return this exact shape:
{
  "destination": "",
  "dates": "",
  "intent": "",
  "selectedMood": "",
  "travelDNA": {
    "pacing": 0,
    "socialEnergy": 0,
    "adventure": 0,
    "structure": 0,
    "discovery": 0
  },
  "stops": [
    {
      "time": "",
      "duration": "",
      "category": "",
      "name": "",
      "description": "",
      "mapsQuery": "",
      "photoQuery": "",
      "routeFromPrevious": ""
    }
  ]
}

Rules:
- 5 to 7 stops.
- Use real places when possible.
- Respect dietary needs.
- Avoid generic top-10 tourist lists.
- Make the itinerary feel driven by selected visual vibes and slider values.
- photoQuery should be 3 to 6 search words for a relevant travel image.
- mapsQuery should include place name + city/country.
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'No response from Gemini' });
    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
}
