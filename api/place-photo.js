/* global process, Buffer */
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default async function handler(req, res) {
  const { name } = req.query;

  if (!GOOGLE_MAPS_API_KEY) return res.status(500).send("Missing GOOGLE_MAPS_API_KEY");
  if (!name) return res.status(400).send("Missing photo name");

  try {
    const photoName = decodeURIComponent(name);
    const response = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_MAPS_API_KEY}`,
      { redirect: "follow" }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Photo proxy error:", text);
      return res.status(response.status).send(text);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Photo proxy crashed:", error);
    return res.status(500).send("Photo proxy failed");
  }
}
