import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getTravelArchetype(moods = []) {
  const ids = moods.map((m) => m.id);
  const has = (value) => ids.includes(value);
  if (has("romantic") && has("active") && has("nature")) return { name: "The Scenic Spark", line: "You move through places like someone who notices everything — the light, the pace, the person beside you." };
  if (has("romantic") && has("slow-easy")) return { name: "The Soft Landing", line: "You travel to feel, not to collect. Unhurried, intentional, and present in every moment." };
  if (has("romantic") && has("cultural")) return { name: "The Intimate Explorer", line: "You want beauty with substance — places that mean something, shared with someone who matters." };
  if (has("culinary") && has("cultural")) return { name: "The Local Romantic", line: "You find culture through flavor. Markets, kitchens, and hole-in-the-wall restaurants are your galleries." };
  if (has("culinary") && has("social")) return { name: "The Table Hopper", line: "For you, the best conversations happen over food. You eat where the locals eat and stay twice as long." };
  if (has("adventurous") && has("active")) return { name: "The Momentum Seeker", line: "You don't sit still. You're drawn to edges, ascents, and the quiet satisfaction of having pushed yourself." };
  if (has("adventurous") && has("nature")) return { name: "The Raw Wanderer", line: "Crowds bore you. You're after the kind of beauty that takes effort to reach — and silence when you get there." };
  if (has("nature") && has("slow-easy")) return { name: "The Quiet Wanderer", line: "You travel to exhale. Open skies, slow mornings, and nothing on a schedule you didn't write yourself." };
  if (has("social") && has("active")) return { name: "The Energy Chaser", line: "You move fast and meet people doing the same. Cities feel alive to you — and you want to be in the middle of it." };
  if (has("cultural") && has("slow-easy")) return { name: "The Considered Traveler", line: "You'd rather understand one place deeply than skim ten. Depth over distance, always." };
  if (has("night-owl") && has("adventurous")) return { name: "The Electric Nomad", line: "Plans are a starting point for you — not a constraint. You follow what feels right and rarely regret it." };
  if (has("night-owl")) return { name: "The Night Wanderer", line: "You come alive after dark. The best version of any city is the one that only exists after sunset." };
  if (has("romantic")) return { name: "The Slow Romantic", line: "You travel to feel something. Golden hour, good wine, and nowhere to be — that's the whole point." };
  if (has("adventurous")) return { name: "The Edge Seeker", line: "You measure a trip by what made your heart rate spike. Comfort is a baseline, not the goal." };
  if (has("culinary")) return { name: "The Flavor Pilgrim", line: "You plan trips around meals and discover everything else along the way. Eating well is non-negotiable." };
  if (has("social")) return { name: "The Connector", line: "You leave places with new numbers in your phone. Energy, people, and a full table — that's your version of a great trip." };
  if (has("nature")) return { name: "The Landscape Chaser", line: "You're drawn to places that make you feel small in the best way. Wild, open, and far from anything ordinary." };
  if (has("cultural")) return { name: "The Context Seeker", line: "You want the story behind the place. History, art, architecture — you travel to understand, not just to see." };
  if (has("active")) return { name: "The Kinetic Traveler", line: "You see a city best from a run or a bike. Movement is how you think, explore, and decompress." };
  if (has("slow-easy")) return { name: "The Unhurried", line: "You know that the best travel memories are almost never the rushed ones. You give places the time they deserve." };
  if (moods.length) return { name: "The Mood-Led Traveler", line: "You know what you want today — and you're building a day around exactly that feeling." };
  return { name: "The Mood-Led Traveler", line: "You know what you want today — and you're building a day around exactly that feeling." };
}

function buildGoogleMapsTripUrl(stops = []) {
  const names = stops.map((stop) => stop.googlePlaceName || stop.name || stop.photoQuery).filter(Boolean).slice(0, 10);
  if (!names.length) return "";
  if (names.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(names[0])}`;
  const origin = names[0];
  const destination = names[names.length - 1];
  const waypoints = names.slice(1, -1).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  return url;
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function prettyDate(value) {
  if (!value) return "Today";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

const fallbackDestinationSuggestions = [
  { label: "Kyoto, Japan", aliases: ["kyoto"] },
  { label: "Oaxaca, Mexico", aliases: ["oaxaca"] },
  { label: "Big Island, Hawaii", aliases: ["big island", "hawaii"] },
  { label: "Kauai, Hawaii", aliases: ["kauai"] },
  { label: "San Francisco, CA", aliases: ["san francisco", "sf", "frisco", "bay area"] },
  { label: "New York City", aliases: ["new york", "nyc"] },
  { label: "Paris, France", aliases: ["paris"] },
  { label: "Tokyo, Japan", aliases: ["tokyo"] }
];

const moodVibes = [
  {
    id: "adventurous",
    title: "Adventurous",
    tag: "Ziplines, cliff jumps, paragliding",
    signal: "high-adrenaline experiences only — ziplines, cliff jumps, paragliding, bungee, white-water rafting, via ferrata, skydiving, anything with a safety briefing or waiver. Avoid gentle walks or casual hikes. The user wants their heart rate elevated and a story to tell.",
    icon: "△",
    img: "https://images.pexels.com/photos/6454835/pexels-photo-6454835.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "slow-scenic",
    title: "Slow & scenic",
    tag: "Boat rides, cafes, golden hour",
    signal: "slow-paced activities in beautiful natural or semi-natural settings — boat rides, lakeside cafes, scenic viewpoints at golden hour, waterfront walks, picnics, a ferry across a bay, a quiet garden, watching the world from a hilltop. Minimal transit. Maximum stillness. Nothing rushed, nothing loud.",
    icon: "〰",
    img: "https://images.pexels.com/photos/5366283/pexels-photo-5366283.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "cultural",
    title: "Cultural",
    tag: "History, architecture, depth",
    signal: "places with historical or artistic meaning — museums, temples, ancient ruins, galleries, heritage neighborhoods, local rituals or ceremonies, architecture worth understanding. Prioritize depth over breadth. One place understood fully beats three places rushed through.",
    icon: "▱",
    img: "https://images.pexels.com/photos/6673989/pexels-photo-6673989.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "culinary",
    title: "Culinary",
    tag: "Local spots, markets, food-first",
    signal: "food-first planning — build the day around meals, markets, and food experiences. Local breakfast spots, street food tours, neighborhood lunch spots, food markets, a memorable dinner. Avoid tourist restaurants. Prioritize places locals actually eat. Respect dietary preference strictly.",
    icon: "╯",
    img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "offbeat",
    title: "Offbeat",
    tag: "Unexpected, quirky, rare finds",
    signal: "find the weird, specific, memorable thing that most visitors never discover — a tiny museum dedicated to one obscure subject, a secret garden hidden behind an unmarked door, an eccentric local institution, a shop that sells only one thing, an underground venue, an alley mural that locals know. Not just 'avoid tourists' — actively seek the surprising and eccentric. If a stop doesn't make someone say 'I never would have found this', replace it.",
    icon: "⊹",
    img: "https://images.pexels.com/photos/29285032/pexels-photo-29285032.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "social",
    title: "Social",
    tag: "Lively, group-friendly, energy",
    signal: "group-friendly, lively environments — rooftop bars, night markets, live music venues, public squares with energy, cooking classes, tours where you meet people, communal dining. The atmosphere should buzz. Designed for someone who recharges around others.",
    icon: "♧",
    img: "https://images.pexels.com/photos/4349791/pexels-photo-4349791.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "active",
    title: "Active",
    tag: "Hiking, cycling, kayaking, sports",
    signal: "movement-led day — hiking trails, cycling routes, morning runs, kayaking, swimming, walking tours of neighborhoods, paddleboarding, beach volleyball, water sports. The user wants to feel their body moving through a place, not sitting still.",
    icon: "⌁",
    img: "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "night-owl",
    title: "Night owl",
    tag: "Live music, late nights, city alive",
    signal: "evening and nighttime experiences only — plan the day to start late and peak after dark. Live music venues, jazz bars, rooftop bars at sunset, late dinner spots, night markets, dancing, the city at its most electric. Every stop should feel like something that only exists after 6pm. Designed for someone who comes alive at night.",
    icon: "◑",
    img: "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "romantic",
    title: "Romantic",
    tag: "Intimate, partner-focused",
    signal: "partner-focused itinerary — intimate settings, beautiful light, meaningful moments. Golden hour viewpoints, candlelit dinner, a walk through a lantern-lit street, a private beach, a rooftop with a view. Every stop should feel like it was chosen with someone specific in mind. Avoid anything loud, rushed, or group-oriented.",
    icon: "♡",
    img: "https://images.pexels.com/photos/12165831/pexels-photo-12165831.jpeg?auto=compress&cs=tinysrgb&w=1400"
  }
];

function PlacesCarousel({ moods, places }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % moods.length), 2000);
    return () => clearInterval(t);
  }, [moods.length]);
  const cleanName = (raw, fallback) => {
    if (!raw) return fallback;
    const parts = raw.split(",");
    return parts[0].trim();
  };
  return (
    <div className="places-carousel">
      {moods.map((m, i) => {
        const place = places[i];
        const rating = (4.1 + i * 0.15).toFixed(1);
        const name = cleanName(place?.name, m.title);
        return (
          <div key={m.id + i} className={`pc-slide${i === idx ? " pc-active" : i === (idx - 1 + moods.length) % moods.length ? " pc-prev" : ""}`}>
            <img src={m.img} alt="" />
            <div className="pc-ov"/>
            <div className="pc-meta">
              <span className="pc-name">{name}</span>
              <div className="pc-chips">
                <span className="pc-rating-chip">★ {rating}</span>
                {place && <span className="pc-type-chip">{m.title}</span>}
              </div>
            </div>
          </div>
        );
      })}
      <div className="pc-dots">
        {moods.map((_, i) => <span key={i} className={`pc-dot${i === idx ? " pc-dot-active" : ""}`}/>)}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("Paris");
  const [placePredictions, setPlacePredictions] = useState([]);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [date, setDate] = useState(getToday());
  const [diet, setDiet] = useState("Vegetarian");
  const [planFor, setPlanFor] = useState("Date");
  const [selectedMoods, setSelectedMoods] = useState(["active", "romantic"]);
  const [loadingLine, setLoadingLine] = useState(0);
  const [placesPhotos, setPlacesPhotos] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeSaved, setSubscribeSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [calendarState, setCalendarState] = useState("idle");
  const [customActivity, setCustomActivity] = useState("");
  const shellRef = useRef(null);

  function goTo(s) {
    window.scrollTo({ top: 0, behavior: "instant" });
    setStep(s);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("i");
    if (!id) return;
    fetch(`/api/save-itinerary?id=${encodeURIComponent(id)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(payload => {
        if (payload.itinerary) setItinerary(payload.itinerary);
        if (payload.destination) setDestination(payload.destination);
        if (payload.date) setDate(payload.date);
        if (payload.selectedMoods) setSelectedMoods(payload.selectedMoods.map(m => m.id || m));
        if (payload.diet) setDiet(payload.diet);
        if (payload.planFor) setPlanFor(payload.planFor);
        setStep("result");
      })
      .catch(() => console.warn("Could not load shared itinerary"));
  }, []);

  useEffect(() => {
    document.title = "Travel DNA — Mood-first travel planning";
    const setFavicon = (href, type) => {
      let el = document.querySelector(`link[rel~="icon"]`);
      if (!el) { el = document.createElement("link"); el.rel = "icon"; document.head.appendChild(el); }
      el.type = type; el.href = href;
    };
    const svgMark = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="%230d1a14"/><path d="M8 4 C8 10,24 10,24 16 C24 22,8 22,8 28" fill="none" stroke="%23339989" stroke-width="2.5" stroke-linecap="round"/><path d="M24 4 C24 10,8 10,8 16 C8 22,24 22,24 28" fill="none" stroke="%235EC4B5" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/><circle cx="16" cy="8.5" r="2" fill="%23339989"/><circle cx="16" cy="16" r="2" fill="%23339989"/><circle cx="16" cy="23.5" r="2" fill="%23339989"/></svg>`;
    setFavicon(`data:image/svg+xml,${svgMark}`, "image/svg+xml");
    let apple = document.querySelector("link[rel='apple-touch-icon']");
    if (!apple) { apple = document.createElement("link"); apple.rel = "apple-touch-icon"; apple.sizes = "180x180"; document.head.appendChild(apple); }
    apple.href = "/apple-touch-icon.png";
  }, []);

  useEffect(() => {
    let rafId;
    const moveGlow = (event) => {
      if (!shellRef.current) return;
      rafId = requestAnimationFrame(() => {
        shellRef.current.style.setProperty("--mx", `${event.clientX}px`);
        shellRef.current.style.setProperty("--my", `${event.clientY}px`);
      });
    };
    window.addEventListener("pointermove", moveGlow);
    return () => { window.removeEventListener("pointermove", moveGlow); if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== "login") return;
    let attempts = 0;
    let cancelled = false;
    const loadGoogleButton = () => {
      const buttonContainer = document.getElementById("googleSignIn");
      if (cancelled || !buttonContainer) { attempts += 1; if (!cancelled && attempts < 30) setTimeout(loadGoogleButton, 200); return; }
      if (!window.google?.accounts?.id) { attempts += 1; if (attempts < 40) setTimeout(loadGoogleButton, 200); return; }
      setGoogleReady(true);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          setUser({ name: payload.name, email: payload.email, picture: payload.picture });
          goTo("setup");
        }
      });
      buttonContainer.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainer, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 320 });
    };
    loadGoogleButton();
    return () => { cancelled = true; };
  }, [step]);

  useEffect(() => {
    const query = destination.trim();
    if (query.length < 2) { setPlacePredictions([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAutocompleting(true);
      try {
        const response = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data.suggestions)) setPlacePredictions(data.suggestions);
      } catch (error) {
        console.warn("Autocomplete fallback:", error);
        if (!cancelled) setPlacePredictions([]);
      } finally {
        if (!cancelled) setIsAutocompleting(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [destination]);

  const fallbackFilteredDestinations = fallbackDestinationSuggestions.filter((item) => {
    const query = destination.toLowerCase().trim();
    return item.label.toLowerCase().includes(query) || item.aliases.some((alias) => alias.includes(query));
  });

  const destinationOptions = placePredictions.length
    ? placePredictions
    : fallbackFilteredDestinations.slice(0, 6).map((item) => ({ label: item.label, source: "fallback" }));

  const selectedMoodObjects = selectedMoods.map((id) => moodVibes.find((vibe) => vibe.id === id)).filter(Boolean);
  const travelArchetype = getTravelArchetype(selectedMoodObjects);
  const tripMapsUrl = itinerary?.stops?.length ? buildGoogleMapsTripUrl(itinerary.stops) : "";

  const loadingItems = useMemo(() => [
    user?.name ? `${user.name}'s lightweight profile` : "Quick feeler profile",
    "Today's mood signals",
    "Dietary preferences",
    "Destination context",
    "Google Places candidates",
    "Real place photos and ratings",
    "Gemini itinerary generation"
  ], [user]);

  function toggleMood(id) {
    setSelectedMoods((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  async function generatePlan() {
    goTo("loading");
    setError("");
    setLoadingLine(0);
    setItinerary(null);
    setPlacesPhotos([]);

    const CLAMP_AT = 5;
    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, CLAMP_AT));
    }, 2400);

    const fetchPlaces = async () => {
      try {
        const res = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(destination)}`);
        const data = await res.json();
        const photos = await Promise.all(
          [destination, ...selectedMoodObjects.map(m => `${destination} ${m.title}`)].slice(0, 5).map(async (q) => {
            try {
              const r = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(q)}`);
              const d = await r.json();
              const first = (d.suggestions || [])[0];
              return first ? { name: first.label || first, placeId: first.placeId } : null;
            } catch { return null; }
          })
        );
        setPlacesPhotos(photos.filter(Boolean));
      } catch (e) {}
    };

    const geminiPromise = fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, destination, dates: prettyDate(date), date, diet, travelWith: planFor, selectedMoods: selectedMoodObjects, customActivity: customActivity.trim() || null, instruction: "Create a real, specific, mood-first day plan. Infer longer-term travel style lightly from Google profile if available, but do not ask the user to select it. Use selectedMoods as today's short-term intent — the signal field for each mood is the critical instruction that defines what kinds of activities to include or exclude. If customActivity is provided, treat it as a must-include experience and build at least one stop around it. Return concrete places. The server will enrich stops with Google Places photos, ratings, addresses, and map links." })
    });

    fetchPlaces();

    try {
      const res = await geminiPromise;
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "Gemini API route failed");
      clearInterval(interval);
      setLoadingLine(6);
      setItinerary(data);
      setTimeout(() => goTo("result"), 800);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || "Gemini could not generate the plan.");
      goTo("apiError");
    }
  }

  async function addToCalendar() {
    if (!itinerary?.stops?.length) return;
    setCalendarState("loading");

    const tripDate = date || getToday();
    const destName = itinerary.destination || destination;

    if (user) {
      try {
        await new Promise((resolve, reject) => {
          if (!window.google?.accounts?.oauth2) return reject(new Error("GIS not loaded"));
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "https://www.googleapis.com/auth/calendar.events",
            callback: async (tokenResponse) => {
              if (tokenResponse.error) return reject(new Error(tokenResponse.error));
              try {
                const accessToken = tokenResponse.access_token;
                const stopsText = itinerary.stops.map((s, i) =>
                  `${String(i + 1).padStart(2, "0")}. ${s.time || ""} ${s.name}${s.address ? ` — ${s.address}` : ""}`
                ).join("\n");

                const event = {
                  summary: `Travel DNA: ${destName}`,
                  description: `${itinerary.summary || ""}\n\n${stopsText}\n\nGenerated by Travel DNA`,
                  location: destName,
                  start: { date: tripDate },
                  end:   { date: tripDate },
                };

                const res = await fetch(
                  "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(event),
                  }
                );
                if (!res.ok) throw new Error("Calendar API error");
                resolve();
              } catch (e) { reject(e); }
            },
          });
          client.requestAccessToken();
        });
        setCalendarState("done");
        setTimeout(() => setCalendarState("idle"), 3000);
      } catch (err) {
        console.error("Calendar error:", err);
        setCalendarState("error");
        setTimeout(() => setCalendarState("idle"), 3000);
      }
      return;
    }

    const fmt = (d) => d.replace(/-/g, "");
    const stopsText = itinerary.stops.map((s, i) =>
      `${String(i + 1).padStart(2, "0")}. ${s.time || ""} ${s.name}${s.address ? " — " + s.address : ""}`
    ).join("\\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Travel DNA//EN",
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${fmt(tripDate)}`,
      `DTEND;VALUE=DATE:${fmt(tripDate)}`,
      `SUMMARY:Travel DNA: ${destName}`,
      `DESCRIPTION:${(itinerary.summary || "").replace(/,/g, "\\,")}\\n\\n${stopsText}`,
      `LOCATION:${destName}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `travel-dna-${destName.replace(/\s+/g, "-").toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
    setCalendarState("done");
    setTimeout(() => setCalendarState("idle"), 3000);
  }

  return (
    <div className={`app-shell${step === "login" ? " login-active" : ""}`} ref={shellRef}>
      <style>{css}</style>

      <nav className="navbar">
        <div className="nav-left-group nav-desktop">
          <svg className="nav-mark" width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Travel DNA">
            <path d="M8 4 C8 10,24 10,24 16 C24 22,8 22,8 28" fill="none" stroke="#339989" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 4 C24 10,8 10,8 16 C8 22,24 22,24 28" fill="none" stroke="#5EC4B5" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
            <circle cx="16" cy="8.5" r="2" fill="#339989"/>
            <circle cx="16" cy="16" r="2" fill="#339989"/>
            <circle cx="16" cy="23.5" r="2" fill="#339989"/>
          </svg>
          <div className="nav-steps nav-left">
            {[{ label: "Setup", value: "setup" }, { label: "Mood", value: "mood" }, { label: "Result", value: "result" }].map((item, i) => {
              const order = ["setup", "mood", "result"];
              const active = step === item.value;
              const done = order.indexOf(step) > i || step === "loading";
              const disabled = item.value === "result" && !itinerary;
              return (
                <button type="button" className={active ? "active" : done ? "done" : ""} key={item.value} disabled={disabled} onClick={() => { if (!disabled) goTo(item.value); }}>
                  <i /> {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="nav-actions nav-desktop">
          <button className="btn-accent nav-subscribe" onClick={() => setShowSubscribe(true)}>Subscribe for updates</button>
        </div>

        <div className="nav-mobile">
          <button
            className={`hamburger${menuOpen ? " hamburger-open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
          <button className="btn-accent nav-subscribe" onClick={() => setShowSubscribe(true)}>Subscribe for updates</button>
        </div>

        {menuOpen && (
          <div className="mobile-drawer" onClick={() => setMenuOpen(false)}>
            <div className="mobile-drawer-inner" onClick={e => e.stopPropagation()}>
              <div className="drawer-header">
                <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4 C8 10,24 10,24 16 C24 22,8 22,8 28" fill="none" stroke="#339989" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M24 4 C24 10,8 10,8 16 C8 22,24 22,24 28" fill="none" stroke="#5EC4B5" strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
                  <circle cx="16" cy="8.5" r="2" fill="#339989"/>
                  <circle cx="16" cy="16" r="2" fill="#339989"/>
                  <circle cx="16" cy="23.5" r="2" fill="#339989"/>
                </svg>
                <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
              </div>
              <p className="mobile-drawer-label">Navigation</p>
              {[{ label: "Setup", value: "setup" }, { label: "Mood", value: "mood" }, { label: "Result", value: "result" }].map((item, i) => {
                const order = ["setup", "mood", "result"];
                const active = step === item.value;
                const done = order.indexOf(step) > i || step === "loading";
                const disabled = item.value === "result" && !itinerary;
                return (
                  <button
                    type="button"
                    className={`drawer-item${active ? " drawer-item-active" : ""}${done ? " drawer-item-done" : ""}${disabled ? " drawer-item-disabled" : ""}`}
                    key={item.value}
                    disabled={disabled}
                    onClick={() => { if (!disabled) { goTo(item.value); setMenuOpen(false); } }}
                  >
                    <span className="drawer-dot" />
                    {item.label}
                    {done && !active && <span className="drawer-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {step === "login" && (
        <div className="lp-shell">
          <div className="lp-bg-outer">
            <img src="https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1400" alt="" className="lp-bg-outer-img" />
            <div className="lp-bg-outer-dim" />
          </div>

          <div className="lp-card">
            <div className="lp-card-left">
              <div className="lp-right-text">
                <p className="lp-eyebrow">Powered by Gemini ✦</p>
                <h1 className="lp-h1">Today feels<br/><span className="lp-accent">different.</span></h1>
                <p className="lp-sub">Tell us how you feel — we build your entire day around it. Mood-first, always.</p>
              </div>

              <div className="lp-actions">
                <div className="lp-google-wrap">
                  <div id="googleSignIn" />
                  {!googleReady && GOOGLE_CLIENT_ID && <div className="google-loading">Loading Google…</div>}
                </div>
                <button className="lp-ghost-btn" onClick={() => goTo("setup")}>
                  Continue without sign in
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              <p className="lp-fine">No account needed. Sign in later to save itineraries.</p>
            </div>

            <div className="lp-card-right">
              <div className="lp-panel-overlay" />
              <div className="lp-panel-itin">
                <div className="lp-itin-line lp-itin-1">
                  <span className="lp-itin-time">08:30</span>
                  <span className="lp-itin-label">Quiet temple morning</span>
                </div>
                <div className="lp-itin-line lp-itin-2">
                  <span className="lp-itin-time">12:00</span>
                  <span className="lp-itin-label">Vegetarian lunch nearby</span>
                </div>
                <div className="lp-itin-line lp-itin-3">
                  <span className="lp-itin-time">17:30</span>
                  <span className="lp-itin-label">Golden-hour walk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "setup" && (
        <main className="screen setup-screen on">
          <div className="partnership-box">
            {user && <div className="profile-chip"><img src={user.picture} alt="" />{user.name}</div>}
            <div className="partnership-box-inner">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,marginTop:1}}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              <span><strong>We don't have your search history or past trips yet</strong> — so we need to ask. A Google partnership would let us skip this entirely. For now, a few quick questions and Gemini handles the rest.</span>
            </div>
          </div>

          <section className="setup-header">
            <p className="label">Step 1 / 2</p>
            <h2>Set the plan.</h2>
            <p>Tell us where, when, and what constraints matter.</p>
          </section>

          <div className="setup-stack">
            <div className="setup-card">
              <span className="setup-card-label">WHERE</span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, neighborhood, or place"
                autoComplete="off"
                className="setup-card-input"
              />
              {destinationOptions.length > 0 && !destinationOptions.find(o => o.label === destination) && (
                <div className="setup-suggestions">
                  {destinationOptions.map((item) => (
                    <button
                      type="button"
                      key={item.placeId || item.label}
                      className="setup-sug"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setDestination(item.label); setPlacePredictions([]); }}
                    >
                      {item.label}
                    </button>
                  ))}
                  {isAutocompleting && <div className="autocomplete-loading">Searching…</div>}
                </div>
              )}
            </div>

            <div className="setup-card">
              <span className="setup-card-label">WHEN</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="setup-card-input" />
            </div>

            <div className="setup-card">
              <span className="setup-card-label">DIETARY PREFERENCE</span>
              <div className="chips">
                {["Vegetarian", "Vegan", "No restrictions", "Gluten-free"].map(o => (
                  <button key={o} type="button" className={diet === o ? "chip active" : "chip"} onClick={() => setDiet(o)}>{o}</button>
                ))}
              </div>
            </div>

            <div className="setup-card">
              <span className="setup-card-label">GOING WITH</span>
              <div className="chips">
                {["Solo", "Date", "Friends", "Family", "Workday"].map(o => (
                  <button key={o} type="button" className={planFor === o ? "chip active" : "chip"} onClick={() => setPlanFor(o)}>{o}</button>
                ))}
              </div>
            </div>

            <button className="btn-accent" onClick={() => goTo("mood")}>Choose today's mood →</button>
          </div>
        </main>
      )}

      {step === "mood" && (
        <main className="screen mood-screen on">
          <section className="mood-header">
            <p className="label">Step 2 / 2 · Choose up to 3</p>
            <h2>What's your <span className="gem">vibe?</span></h2>
            <p>This one input reshapes your entire day. It's the variable Gemini can't infer from data alone.</p>
          </section>
          <section className="mood-grid image-grid">
            {moodVibes.map((vibe, index) => (
              <button type="button" key={vibe.id} className={selectedMoods.includes(vibe.id) ? "image-mood-tile active" : "image-mood-tile"} onClick={() => toggleMood(vibe.id)}>
                <img src={vibe.img} alt={vibe.title} loading="lazy" />
                <span className="tile-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="image-tile-overlay" />
                <div className="image-tile-content">
                  <strong>{vibe.title}</strong>
                  <p>{vibe.tag}</p>
                </div>
              </button>
            ))}
          </section>

          <div className="custom-activity-wrap">
            <div className="setup-card custom-activity-card">
              <span className="setup-card-label">WANT TO CUSTOMIZE FURTHER?</span>
              <input
                id="customActivity"
                className="setup-card-input"
                type="text"
                value={customActivity}
                onChange={e => setCustomActivity(e.target.value)}
                placeholder="Tell us a specific activity you want — ziplining, a cooking class, sunset at a rooftop bar…"
                maxLength={200}
              />
            </div>
          </div>

          <section className="build-cta-row">
            <button className="btn-accent" onClick={generatePlan}>Build itinerary</button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="loading-screen on">
          <div className="loader-head">
            <h2 className="loader-headline">Decoding your <span className="gem">Travel DNA</span></h2>
            <p className="loader-sub">{destination} · {selectedMoodObjects.map(m => m.title).join(", ")}</p>
          </div>
          <div className="loader-stage">
            <div className={`ls${loadingLine === 0 ? " ls-active" : " ls-done"}`}>
              <div className="ls-profile">
                <div className="profile-ring-wrap">
                  <svg className="profile-ring-svg" viewBox="0 0 120 120">
                    <circle className="ring-bg" cx="60" cy="60" r="54"/>
                    <circle className="ring-fill" cx="60" cy="60" r="54"/>
                  </svg>
                  {user?.picture
                    ? <img className="profile-pic" src={user.picture} alt={user.name} />
                    : <div className="profile-pic profile-pic-fallback">
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="19" cy="14" r="7" fill="var(--ink-3)" opacity="0.6"/>
                          <path d="M4 34c0-8.284 6.716-13 15-13s15 4.716 15 13" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
                        </svg>
                      </div>
                  }
                </div>
                <div className="profile-meta">
                  <p className="profile-name">{user?.name || "Quick feeler mode"}</p>
                  {user?.email && <p className="profile-email">{user.email}</p>}
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine === 1 || loadingLine === 2 ? " ls-active" : loadingLine > 2 ? " ls-done" : ""}`}>
              <div className="ls-moods">
                {selectedMoodObjects.slice(0, 3).map((mood, i) => (
                  <div className={`lcard lcard-${i}`} key={mood.id}>
                    <img src={mood.img} alt="" />
                    <div className="lcard-ov" />
                    <span className="lcard-lbl">{mood.title}</span>
                  </div>
                ))}
                <div className="lspills">
                  {[...selectedMoodObjects.map(m => m.title), diet, planFor].filter(Boolean).map((label, i) => (
                    <span className={`lspill lspill-${i}`} key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine === 3 ? " ls-active" : loadingLine > 3 ? " ls-done" : ""}`}>
              <div className="ls-map">
                <div className="map-dest-label">{destination}</div>
                <div className="map-sketch">
                  <svg viewBox="0 0 420 155" xmlns="http://www.w3.org/2000/svg" className="map-svg">
                    <path d="M 0 95 Q 60 88 110 98 Q 160 108 200 100 Q 260 90 300 96 Q 360 104 420 98" fill="none" stroke="rgba(51,153,137,.18)" strokeWidth="8" strokeLinecap="round"/>
                    <circle cx="50" cy="60" r="10" fill="rgba(51,153,137,.12)"/>
                    <circle cx="62" cy="54" r="8" fill="rgba(51,153,137,.1)"/>
                    <circle cx="150" cy="130" r="9" fill="rgba(51,153,137,.1)"/>
                    <circle cx="163" cy="136" r="7" fill="rgba(51,153,137,.08)"/>
                    <circle cx="360" cy="110" r="11" fill="rgba(51,153,137,.1)"/>
                    <circle cx="374" cy="116" r="8" fill="rgba(51,153,137,.08)"/>
                    <line x1="0" y1="50" x2="420" y2="50" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="0" y1="100" x2="420" y2="100" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="105" y1="0" x2="105" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="210" y1="0" x2="210" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="315" y1="0" x2="315" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line className="map-line ml1" x1="80" y1="118" x2="185" y2="62"/>
                    <line className="map-line ml2" x1="185" y1="62" x2="275" y2="85"/>
                    <line className="map-line ml3" x1="275" y1="85" x2="345" y2="42"/>
                    <circle className="map-dot md1" cx="80" cy="118" r="6"/>
                    <circle className="map-dot md2" cx="185" cy="62" r="6"/>
                    <circle className="map-dot md3" cx="275" cy="85" r="6"/>
                    <circle className="map-dot md4" cx="345" cy="42" r="6"/>
                    <circle className="map-traveller" cx="80" cy="118" r="9" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6"/>
                    <circle className="map-traveller-dot" cx="80" cy="118" r="4" fill="var(--accent)"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine === 4 ? " ls-active" : loadingLine > 4 ? " ls-done" : ""}`}>
              <div className="ls-places-chips">
                <p className="places-chips-label">Scanning Google Places for {destination}</p>
                <div className="places-chips-wrap">
                  {(placesPhotos.length
                    ? placesPhotos.map(p => p.name)
                    : selectedMoodObjects.map(m => `${destination} ${m.title}`)
                  ).map((name, i) => {
                    const clean = name.split(",")[0].trim();
                    const rating = (4.1 + i * 0.15).toFixed(1);
                    return (
                      <div className={`place-chip pc-anim-${i}`} key={i}>
                        <span className="place-chip-name">{clean}</span>
                        <span className="place-chip-rating">★ {rating}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine >= 5 ? " ls-active" : ""}`}>
              <div className="wire-frame">
                <div className="wire-meta">
                  <div className="wire-tag"/>
                  <div className="wire-title"/>
                </div>
                <div className="wire-stops">
                  {[0,1].map(i => (
                    <div className="wire-stop" key={i}>
                      <div className="wire-dot"/>
                      <div className="wire-lines">
                        <div className="wire-line wl-a" style={{animationDelay:`${i*0.2}s`}}/>
                        <div className="wire-line wl-b" style={{animationDelay:`${i*0.2+0.1}s`}}/>
                      </div>
                      <div className="wire-img" style={{animationDelay:`${i*0.15}s`}}/>
                    </div>
                  ))}
                </div>
                <div className="wire-gemini-badge">
                  <span className="gorb-core-sm">✦</span>
                  <span>Gemini writing your plan…</span>
                </div>
              </div>
            </div>
          </div>

          <div className="loader-bottom">
            <div className="loader-list">
              {loadingItems.map((item, i) => (
                <div key={item} className={`loader-item${i < loadingLine ? " li-done" : ""}${i === loadingLine ? " li-active" : ""}`}>
                  <span className="li-dot" />
                  <span className="li-text">{item}</span>
                  {i < loadingLine && <span className="li-badge">Done</span>}
                </div>
              ))}
            </div>
            <div className="loader-bar-track">
              <div className="loader-bar-fill" style={{ width: `${Math.round(((loadingLine + 1) / loadingItems.length) * 100)}%` }} />
            </div>
            <p className="loader-pct">{Math.round(((loadingLine + 1) / loadingItems.length) * 100)}% complete</p>
          </div>
        </main>
      )}

      {step === "apiError" && (
        <main className="screen loading-screen on">
          <div className="api-error-card">
            <p className="label">Travel DNA preview</p>
            <h2>Live planning is taking a short pause.</h2>
            <p>The prototype could not finish a fresh plan right now. Review your setup or try again in a moment.</p>
            <div className="error-actions">
              <button className="btn-outline" onClick={() => goTo("setup")}>Edit setup</button>
              <button className="btn-accent" onClick={generatePlan}>Try Gemini again ✦</button>
            </div>
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="result-screen on">
          <section className="res-hero">
            <img
              className="res-bg-img"
              src={itinerary?.heroImageUrl || selectedMoodObjects[0]?.img || moodVibes[0].img}
              alt=""
            />
            <div className="res-glass-panel">
              <div className="res-glass-top">
                <p className="archetype-line">{travelArchetype.line}</p>
                <span className="res-date-tag">{itinerary?.dates || prettyDate(date)}</span>
              </div>
              <h2 className="res-dest">{itinerary?.destination || destination}</h2>
              {itinerary?.summary && (
                <p className="res-summary">{itinerary.summary}</p>
              )}
              {itinerary?.generatedBy === "fallback" && (
                <div className="fallback-banner">
                  <span>Preview mode</span>
                  <p>Live planning is temporarily capped, so Travel DNA is showing a designed preview while place details continue to enrich.</p>
                  <button type="button" onClick={() => setShowSubscribe(true)}>Like this idea? Get updates</button>
                </div>
              )}
            </div>
          </section>

          <section className="action-bar">
            <div className="action-icons-row">
              <button className="icon-btn" onClick={() => goTo("setup")} title="Edit setup">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Edit</span>
              </button>
              <button className="icon-btn" onClick={generatePlan} title="Regenerate">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9a6 6 0 0110.5-4M15 9a6 6 0 01-10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 5h2.5V2.5M5 13H2.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Redo</span>
              </button>
              <button
                className={`icon-btn${shareCopied ? " icon-btn-active" : ""}${shareLoading ? " icon-btn-loading" : ""}`}
                disabled={shareLoading}
                onClick={async () => {
                  if (shareLoading) return;
                  setShareLoading(true);
                  try {
                    const res = await fetch("/api/save-itinerary", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ itinerary, destination, date, selectedMoods: selectedMoodObjects, diet, planFor }),
                    });
                    const { id, error } = await res.json();
                    if (!id) throw new Error(error || "No ID returned");
                    const shareUrl = `${window.location.origin}${window.location.pathname}?i=${id}`;
                    if (navigator.share) {
                      await navigator.share({ title: `Travel DNA — ${itinerary?.destination || destination}`, text: itinerary?.summary || "Check out this itinerary.", url: shareUrl });
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2500);
                    }
                  } catch (e) { console.error("Share failed:", e); }
                  finally { setShareLoading(false); }
                }}
                title="Share itinerary"
              >
                {shareLoading ? (
                  <svg className="cal-spin" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/></svg>
                ) : shareCopied ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="13" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><line x1="11.1" y1="4.6" x2="6.9" y2="7.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="6.9" y1="10.1" x2="11.1" y2="13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                )}
                <span>{shareLoading ? "Saving…" : shareCopied ? "Copied!" : "Share"}</span>
              </button>
              <button
                className={`icon-btn cal-icon-btn-${calendarState}`}
                onClick={addToCalendar}
                disabled={calendarState === "loading"}
                title={user ? "Add to Google Calendar" : "Download .ics"}
              >
                {calendarState === "loading" && <svg className="cal-spin" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/></svg>}
                {calendarState === "done"    && <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {calendarState === "error"   && <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 6v4M9 12v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/></svg>}
                {calendarState === "idle"    && <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8h14" stroke="currentColor" strokeWidth="1.5"/><path d="M6 1.5v3M12 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                <span>
                  {calendarState === "loading" ? "Adding…" :
                   calendarState === "done"    ? (user ? "Added!" : "Saved!") :
                   calendarState === "error"   ? "Failed" : "Calendar"}
                </span>
              </button>
            </div>
            {tripMapsUrl && (
              <a className="btn-accent maps-trip-btn action-primary-cta" href={tripMapsUrl} target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                Open trip in Google Maps
              </a>
            )}
          </section>

          <section className="timeline">
            <p className="label">Today's flow</p>
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={`${stop.name}-${i}`}>
                <div className={i === 0 ? "s-pin s-pin-featured" : "s-pin"}>
                  <span className="s-pin-index">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="s-body">
                  <p className="s-cat">{stop.category}</p>
                  <h3>{stop.time} <span>{stop.period}</span></h3>
                  <h4>{stop.name}</h4>
                  <div className="place-meta prominent">
                    {stop.rating && (
                      <a className="rating-pill" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.googlePlaceName || stop.name)}`} target="_blank" rel="noreferrer">★ {stop.rating}{stop.userRatingCount ? ` · ${stop.userRatingCount.toLocaleString()} reviews` : ""}</a>
                    )}
                    {stop.openNow !== undefined && <span>{stop.openNow ? "Open now" : "Hours vary"}</span>}
                    {stop.address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`} target="_blank" rel="noreferrer">{stop.address}</a>
                    )}
                    {!stop.rating && stop.placesStatus !== "google-places" && <span className="demo-pill">Places details unavailable in fallback</span>}
                  </div>
                  <p>{stop.description}</p>
                  <div className="s-photo">
                    <img src={stop.imageUrl || stop.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img} alt={stop.name} loading="lazy" />
                    <div className="s-photo-ov" />
                    <span>{stop.googlePlaceName || stop.address || stop.category || stop.name}</span>
                  </div>
                  <small>{stop.routeFromPrevious}</small>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}

      {showSubscribe && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="subscribe-modal glass-panel">
            <button className="modal-close" type="button" onClick={() => { setShowSubscribe(false); setSubscribeSaved(false); }}>×</button>
            <div className="spark">✦</div>
            <p className="label">Early access</p>
            <h2>Like this idea?</h2>
            <p>Travel DNA is running in demo mode right now. Gemini API credits are limited, so fallback plans keep the experience alive while the product evolves.</p>
            <p>Subscribe to get updates when live personalization, better Google Places photos, saved preferences, and richer planning are ready.</p>
            <form className="subscribe-form" onSubmit={(event) => {
              event.preventDefault();
              if (!subscribeEmail.trim()) return;
              const existing = JSON.parse(localStorage.getItem("travelDnaSubscribers") || "[]");
              localStorage.setItem("travelDnaSubscribers", JSON.stringify([...existing, subscribeEmail.trim()]));
              setSubscribeSaved(true);
            }}>
              <input type="email" placeholder="you@example.com" value={subscribeEmail} onChange={(event) => setSubscribeEmail(event.target.value)} required />
              <button className="btn-accent" type="submit">Keep me updated</button>
            </form>
            {subscribeSaved && <div className="subscribe-success">You're on the list. For now this is saved locally for the prototype.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <div className="field-block">
      <p className="field-label">{label}</p>
      <div className="chips">
        {options.map((option) => (
          <button type="button" className={value === option ? "chip active" : "chip"} onClick={() => setValue(option)} key={option}>{option}</button>
        ))}
      </div>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

html, body, #root {
  width: 100%; min-height: 100%;
  max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important;
}
*, *::before, *::after { box-sizing: border-box; }

:root {
  --bg: #F5F4F0;
  --surface: #EDECEA;
  --surface-2: #E4E2DE;
  --surface-3: #D8D6D2;
  --panel: #EDECEA;
  --panel-2: #E4E2DE;
  --panel-3: #FFFFFF;
  --line: rgba(0,0,0,.08);
  --line-strong: rgba(0,0,0,.14);
  --ink: #080808;
  --ink-2: #3A3A38;
  --ink-3: #8A897F;
  --accent: #339989;
  --gold: #339989;
  --gold-bright: #339989;
  --gold-line: rgba(51,153,137,.35);
  --ease: cubic-bezier(.2,.8,.2,1);
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--bg); color: var(--ink);
  overflow-x: hidden; -webkit-font-smoothing: antialiased;
}
button, input { font: inherit; }
button { cursor: pointer; }

.app-shell {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  padding: 0 0 80px; background: var(--bg); overflow-x: hidden;
}
.stars, .aurora { display: none !important; }

/* ── NAVBAR ── */
.navbar {
  position: sticky; top: 0; z-index: 999;
  width: 100%; height: 68px;
  padding: 0 clamp(24px, 4vw, 56px);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg);
}
.login-active .navbar { display: none; }
.login-active { overflow: hidden; height: 100vh; }
.navbar::before { display: none; }
.nav-steps, .nav-actions, .error-actions { display: flex; align-items: center; gap: 6px; }

.nav-desktop { display: flex; align-items: center; gap: 6px; }
.nav-left-group { display: flex; align-items: center; gap: 12px; }
.nav-mark { display: block; flex-shrink: 0; }
.nav-steps { display: flex; align-items: center; gap: 4px; }
.nav-steps i { display: none; }
.nav-steps button {
  display: inline-flex; align-items: center;
  padding: 6px 14px; border: none;
  border-radius: 999px; background: transparent;
  font-size: 13px; font-weight: 500; color: var(--ink-3);
  letter-spacing: -.01em; transition: background .15s, color .15s;
}
.nav-steps button::before { display: none; }
.nav-steps button:hover:not(:disabled) { background: rgba(0,0,0,.06); color: var(--ink-2); }
.nav-steps button.active { background: rgba(0,0,0,.09); color: var(--ink); font-weight: 700; }
.nav-steps button.done { color: var(--ink-2); }
.nav-steps button:disabled { opacity: .3; cursor: not-allowed; }

.nav-mobile { display: none; width: 100%; align-items: center; justify-content: space-between; }
.nav-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; font-weight: 400; color: var(--ink); letter-spacing: -.02em; }

.hamburger {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  gap: 5px; width: 40px; height: 40px;
  background: transparent; border: none; border-radius: 0;
  padding: 0; cursor: pointer; transition: opacity .15s;
}
.hamburger:hover { background: transparent; opacity: .7; }
.hamburger span {
  display: block; width: 18px; height: 1.5px;
  background: var(--ink); border-radius: 2px;
  transition: transform .25s var(--ease), opacity .2s;
  transform-origin: center;
}
.hamburger-open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.hamburger-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger-open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

.mobile-drawer {
  position: fixed; inset: 0; z-index: 998;
  background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
  animation: drawerBgIn .2s ease both;
}
@keyframes drawerBgIn { from { opacity: 0; } to { opacity: 1; } }
.mobile-drawer-inner {
  position: absolute; top: 0; left: 0; bottom: 0;
  width: min(280px, 80vw);
  background: var(--bg); border-right: 1px solid var(--line-strong);
  display: flex; flex-direction: column;
  animation: sidebarSlideIn .28s var(--ease) both;
  overflow-y: auto;
}
@keyframes sidebarSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
.drawer-header {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--line);
}
.drawer-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 17px; font-weight: 400; color: var(--ink);
  letter-spacing: -.02em; flex: 1;
}
.drawer-close {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--line-strong); background: var(--surface-2);
  color: var(--ink); font-size: 18px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}
.mobile-drawer-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); padding: 20px 20px 8px; margin: 0; }
.drawer-item {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 14px 20px;
  background: transparent; border: none;
  font-size: 15px; font-weight: 600; color: var(--ink-2);
  text-align: left; transition: background .15s, color .15s; cursor: pointer;
}
.drawer-item:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }
.drawer-item-active { color: var(--accent) !important; background: rgba(51,153,137,.07) !important; }
.drawer-item-done { color: var(--ink); }
.drawer-item-disabled { opacity: .35; cursor: not-allowed; }
.drawer-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: var(--surface-3); border: 1.5px solid var(--line-strong);
}
.drawer-item-active .drawer-dot { background: var(--accent); border-color: var(--accent); }
.drawer-item-done .drawer-dot { background: var(--ink); border-color: var(--ink); }
.drawer-check { margin-left: auto; font-size: 11px; font-weight: 800; color: var(--accent); }
.drawer-footer { margin-top: auto; padding: 20px; border-top: 1px solid var(--line); }
.drawer-subscribe { width: 100%; justify-content: center; min-height: 48px !important; font-size: 14px !important; }

/* ── BUTTONS ── */
.btn-outline, .btn-accent { border-radius: 14px; font-weight: 700; font-size: 14px; transition: opacity .15s, background .15s; }
.btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 52px; padding: 0 24px;
  background: transparent; border: 1.5px solid var(--line-strong); color: var(--ink); text-decoration: none;
}
.btn-outline:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
.btn-accent {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 52px; padding: 0 26px;
  background: var(--ink); color: #fff; border: none; font-weight: 700;
}
.btn-accent:hover { opacity: .88; }
.btn-accent:active { transform: scale(.98); }
.btn-accent, .btn-outline { text-decoration: none !important; }
.nav-subscribe { min-height: 44px !important; padding: 0 24px !important; font-size: 13px; background: var(--ink) !important; border: none !important; color: #fff !important; font-weight: 700 !important; border-radius: 12px !important; }
.nav-subscribe:hover { opacity: .85 !important; }

/* ── CHIPS (global) ── */
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 8px 16px; border-radius: 999px;
  border: 1.5px solid var(--line-strong);
  background: transparent; font-size: 13px; font-weight: 600;
  color: var(--ink-3); cursor: pointer; transition: all .15s;
}
.chip:hover { border-color: var(--ink); color: var(--ink); }
.chip.active { border-color: var(--accent); color: var(--accent); background: rgba(51,153,137,.08); font-weight: 700; }

/* ── SETUP ── */
.setup-screen { max-width: 680px; }
.partnership-box {
  max-width: 600px; background: var(--surface);
  border: 1px solid var(--line-strong); border-radius: 16px;
  padding: 14px 18px; margin-bottom: 4px;
}
.partnership-box-inner {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 13px; line-height: 1.6; color: var(--ink-3);
}
.partnership-box-inner strong { color: var(--ink-2); font-weight: 700; }
.setup-header { margin-bottom: 32px; }
.setup-stack { display: flex; flex-direction: column; gap: 28px; max-width: 600px; }
.custom-activity-wrap { margin-top: 48px; max-width: 960px; }
.custom-activity-card { max-width: 100%; }
.setup-card {
  background: #fff; border-radius: 20px; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.08); position: relative;
}
.setup-card-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
.setup-card-input {
  background: transparent !important; border: none !important; box-shadow: none !important;
  border-radius: 0 !important; min-height: 0 !important; padding: 0 !important;
  font-size: 16px !important; font-weight: 600 !important; color: var(--ink) !important; width: 100%;
}
.setup-card-input:focus { box-shadow: none !important; }
.setup-card-input::placeholder { color: var(--ink-3); font-weight: 400; }
input[type="date"].setup-card-input { font-size: 15px !important; }
.setup-suggestions {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: #fff; border-radius: 16px; box-shadow: 0 8px 28px rgba(0,0,0,.13);
  z-index: 200; padding: 6px; display: flex; flex-direction: column; gap: 2px;
}
.setup-sug {
  display: block; width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px;
  border: none; background: transparent; font-size: 14px; font-weight: 500; color: var(--ink);
  cursor: pointer; transition: background .1s;
}
.setup-sug:hover, .setup-sug.active { background: var(--surface); }

@media(max-width: 760px) {
  .setup-stack { max-width: 100%; }
  .setup-card { padding: 16px 18px; }
}

/* ── SCREENS ── */
.screen { display: block; width: 100%; max-width: 1160px; padding: clamp(40px,6vw,82px) clamp(20px,4vw,56px); animation: scIn .3s var(--ease) both; }
@keyframes scIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── TYPE ── */
.label, .field-label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
h1, h2 { font-family: 'DM Serif Display', Georgia, serif; color: var(--ink); }
h1 { font-size: clamp(46px,6.2vw,82px) !important; font-weight: 400; line-height: 1.05; letter-spacing: -.02em !important; margin: 0; max-width: 840px; }
h2 { font-size: clamp(36px,4.5vw,60px); font-weight: 400; line-height: 1.1; letter-spacing: -.015em; margin: 10px 0 10px; }
p { font-size: 16px; line-height: 1.72; color: var(--ink-2); }
.gem, h1 span { color: var(--accent) !important; background: none !important; -webkit-text-fill-color: currentColor !important; }
.glass-panel { background: var(--surface); border: 1px solid var(--line-strong); box-shadow: none; }

/* ══════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════ */
.lp-shell {
  width: 100%; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 16px; position: relative; overflow: hidden;
}
.lp-bg-outer { position: fixed; inset: 0; z-index: 0; }
.lp-bg-outer-img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(.92) saturate(1.2); transform: scale(1.02);
}
.lp-bg-outer-dim { position: absolute; inset: 0; background: rgba(0,0,0,.05); }

.lp-card {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 1fr 1.3fr;
  width: min(880px, 100%);
  height: min(480px, calc(100vh - 32px));
  border-radius: 22px; overflow: hidden;
  border: 5px solid #fff; box-shadow: none;
  animation: lpCardIn .9s var(--ease) both;
}
@keyframes lpCardIn {
  from { opacity: 0; transform: translateY(16px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.lp-card-left {
  background: #fff; padding: 24px 26px 20px;
  display: flex; flex-direction: column; gap: 12px; overflow: hidden;
}
.lp-panel-logo { display: none; }
.lp-right-text { display: flex; flex-direction: column; }
.lp-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); margin: 0 0 5px; }
.lp-h1 { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(26px, 3vw, 40px); font-weight: 400; line-height: .97; letter-spacing: -.03em; color: var(--ink); margin: 0 0 7px; }
.lp-accent { color: var(--accent) !important; }
.lp-sub { font-size: 12px; line-height: 1.5; color: var(--ink-3); margin: 0; }
.lp-actions { display: flex; flex-direction: column; gap: 6px; }
.lp-google-wrap { min-height: 36px; display: flex; align-items: center; }
.lp-ghost-btn { display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding: 0 14px; background: transparent; border: 1.5px solid var(--line-strong); border-radius: 11px; font-size: 12px; font-weight: 600; color: var(--ink); cursor: pointer; transition: all .18s; gap: 8px; }
.lp-ghost-btn:hover { border-color: var(--ink); background: var(--surface); }
.lp-fine { font-size: 10px; color: var(--ink-3); line-height: 1.4; }

.lp-card-right { position: relative; overflow: hidden; background: transparent; }
.lp-panel-img { display: none; }
.lp-panel-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 50%);
}
.lp-panel-itin { position: absolute; bottom: 28px; left: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; }
.lp-itin-line {
  display: flex; align-items: center; gap: 18px; padding: 12px 18px;
  background: rgba(8,8,8,.42);
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.13); border-radius: 14px;
  opacity: 0; animation: lpLineIn .5s var(--ease) forwards;
}
.lp-itin-1 { animation-delay: .8s; }
.lp-itin-2 { animation-delay: 1.05s; }
.lp-itin-3 { animation-delay: 1.3s; }
@keyframes lpLineIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lp-itin-time { font-size: 12px; font-weight: 800; color: var(--accent); min-width: 40px; font-variant-numeric: tabular-nums; }
.lp-itin-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.92); }

/* Mobile */
@media(max-width: 700px) {
  .lp-shell { padding: 20px 16px; }
  .lp-card { grid-template-columns: 1fr; grid-template-rows: auto 260px; border-width: 4px; }
  .lp-card-left { padding: 32px 24px 28px; gap: 20px; }
}

/* ── MOOD GRID ── */
.mood-screen { max-width: 1240px; }
.mood-grid.image-grid { display: grid !important; grid-template-columns: repeat(3,minmax(0,1fr)) !important; gap: 14px !important; width: 100% !important; }
.image-mood-tile { position: relative; overflow: hidden; border: 4px solid transparent !important; border-radius: 28px !important; padding: 0; text-align: left; background: var(--surface); height: 220px !important; min-height: 220px !important; transition: border-color .15s; box-shadow: none; }
.image-mood-tile:hover { border-color: var(--line-strong) !important; }
.image-mood-tile.active { border-color: var(--gold-bright) !important; box-shadow: 0 0 0 1px var(--gold-bright) !important; }
.image-mood-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.86) saturate(1.08); transition: transform .4s var(--ease); }
.image-mood-tile:hover img, .image-mood-tile.active img { transform: scale(1.03); }
.image-tile-overlay { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.48),rgba(0,0,0,.04) 68%); }
.tile-number { position: absolute; left: 16px; top: 16px; z-index: 2; font-size: 11px; letter-spacing: .1em; font-weight: 800; color: rgba(255,255,255,.45); }
.image-tile-content { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 2; }
.image-tile-content strong { display: block; font-size: clamp(18px,1.8vw,24px); font-weight: 900; line-height: 1; letter-spacing: -.03em; color: #fff; }
.image-tile-content p { margin: 6px 0 0; color: rgba(255,255,255,.6); font-size: 12px; font-weight: 600; line-height: 1.3; }

.custom-activity-wrap { margin-top: 40px; max-width: 960px; display: grid; gap: 10px; }
.custom-activity-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
.custom-activity-input {
  width: 100%; background: #fff; border: none; border-radius: 20px;
  min-height: 64px; padding: 0 24px; font-size: 15px; font-weight: 500;
  color: var(--ink); outline: none; box-shadow: 0 1px 6px rgba(0,0,0,.08);
  transition: box-shadow .2s; min-width: 0;
}
.custom-activity-input:focus { box-shadow: 0 2px 12px rgba(0,0,0,.12); }
.custom-activity-input::placeholder { color: var(--ink-3); font-weight: 400; }
.build-cta-row { margin: 34px 0 0; display: flex; justify-content: flex-end; }

/* ── LOADING SCREEN ── */
.loading-screen {
  width: 100%; min-height: calc(100vh - 68px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 20px; padding: 24px clamp(20px,4vw,56px) 32px;
  animation: scIn .3s var(--ease) both; overflow: hidden;
}
.loader-stage { position: relative; width: min(460px, 100%); height: 200px; flex-shrink: 0; overflow: hidden; }
.ls {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity .6s var(--ease); overflow: hidden;
}
.ls.ls-active { opacity: 1; pointer-events: auto; }
.ls.ls-done { opacity: 0; }

.ls-profile { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.profile-ring-wrap { position: relative; width: 110px; height: 110px; }
.profile-ring-svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--surface-2); stroke-width: 4; }
.ring-fill { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 339; stroke-dashoffset: 339; animation: ringFill 2.2s var(--ease) forwards; }
@keyframes ringFill { to { stroke-dashoffset: 50; } }
.profile-pic { position: absolute; inset: 8px; border-radius: 50%; object-fit: cover; width: calc(100% - 16px); height: calc(100% - 16px); }
.profile-pic-fallback { position: absolute; inset: 8px; border-radius: 50%; background: var(--surface-2); display: flex; align-items: center; justify-content: center; }
.profile-pic-fallback span { font-size: 32px; font-weight: 800; color: var(--ink-3); }
.share-btn { gap: 7px; min-width: 100px; }
.share-btn svg { flex-shrink: 0; }
.share-btn-copied { border-color: var(--accent) !important; color: var(--accent) !important; }
.share-btn-loading { opacity: .7; cursor: wait; }
.cal-btn { gap: 7px; min-width: 148px; }
.cal-btn svg { flex-shrink: 0; }
.cal-btn-done  { border-color: var(--accent) !important; color: var(--accent) !important; }
.cal-btn-error { border-color: #c0392b !important; color: #c0392b !important; }
.cal-btn-loading { opacity: .7; cursor: wait; }
@keyframes calSpin { to { transform: rotate(360deg); } }
.cal-spin { animation: calSpin .8s linear infinite; }
.profile-meta { text-align: center; }
.profile-name { font-size: 16px; font-weight: 700; color: var(--ink); margin: 0; line-height: 1.3; }
.profile-email { font-size: 12px; color: var(--ink-3); margin: 3px 0 0; }

.ls-moods { position: relative; width: 100%; height: 100%; overflow: hidden; }
.lcard { position: absolute; border-radius: 18px; overflow: hidden; border: 1px solid var(--line-strong); }
.lcard img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.58) saturate(.8); }
.lcard-ov { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.65),transparent 55%); }
.lcard-lbl { position: absolute; bottom: 10px; left: 12px; font-size: 12px; font-weight: 800; color: #fff; }
.lcard-0 { width: 138px; height: 100px; left: 10px; top: 28px; animation: lc0 3.6s ease-in-out infinite; z-index: 1; opacity: 1; }
.lcard-1 { width: 172px; height: 130px; left: 50%; top: 10px; animation: lc1 3.6s ease-in-out infinite; transform: translateX(-50%); z-index: 3; opacity: 1; }
.lcard-2 { width: 132px; height: 98px; right: 10px; top: 32px; animation: lc2 3.6s ease-in-out infinite; z-index: 1; opacity: 1; }
@keyframes lc0 { 0% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; z-index:3; } 15% { transform: translate(-90px,-20px) rotate(-18deg) scale(.88); opacity:1; z-index:1; } 40% { transform: translate(-90px,-20px) rotate(-18deg) scale(.88); opacity:1; z-index:1; } 70% { transform: translate(0,0) rotate(-3deg) scale(1); opacity:1; z-index:1; } 100% { transform: translate(0,0) rotate(-3deg) scale(1); opacity:1; z-index:1; } }
@keyframes lc1 { 0% { transform: translateX(-50%) translateY(0) scale(1.05); opacity:1; z-index:2; } 25% { transform: translateX(-50%) translateY(-12px) scale(1.08); opacity:1; z-index:4; } 60% { transform: translateX(-50%) translateY(0) scale(1); opacity:1; z-index:3; } 100% { transform: translateX(-50%) translateY(0) scale(1); opacity:1; z-index:3; } }
@keyframes lc2 { 0% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; z-index:3; } 20% { transform: translate(90px,-20px) rotate(18deg) scale(.88); opacity:1; z-index:1; } 50% { transform: translate(90px,-20px) rotate(18deg) scale(.88); opacity:1; z-index:1; } 80% { transform: translate(0,0) rotate(3deg) scale(1); opacity:1; z-index:1; } 100% { transform: translate(0,0) rotate(3deg) scale(1); opacity:1; z-index:1; } }
.lspills { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; flex-wrap: nowrap; }
.lspill { padding: 6px 13px; border-radius: 999px; background: var(--bg); border: 1px solid var(--line-strong); font-size: 11px; font-weight: 700; color: var(--ink-2); white-space: nowrap; opacity: 0; transform: translateY(10px); animation: spillIn 2.2s var(--ease) forwards; }
.lspill-0 { animation-delay: .4s; }
.lspill-1 { animation-delay: .65s; background: var(--ink); color: var(--bg); border-color: var(--ink); }
.lspill-2 { animation-delay: .9s; background: var(--ink); color: var(--bg); border-color: var(--ink); }
.lspill-3 { animation-delay: 1.1s; }
.lspill-4 { animation-delay: 1.3s; }
@keyframes spillIn { 0% { opacity:0; transform:translateY(10px); } 60%,100% { opacity:1; transform:translateY(0); } }

.ls-map { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
.map-dest-label { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; }
.map-sketch { width: 100%; border-radius: 14px; background: var(--surface); border: 1px solid var(--line-strong); padding: 8px; overflow: hidden; }
.map-svg { width: 100%; height: 155px; }
.map-line { stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 300; stroke-dashoffset: 300; animation: drawLine 0.7s var(--ease) forwards; opacity: 0.7; }
.ml1 { animation-delay: 0.3s; } .ml2 { animation-delay: 1.1s; } .ml3 { animation-delay: 1.9s; }
@keyframes drawLine { to { stroke-dashoffset: 0; } }
.map-dot { fill: var(--accent); opacity: 0; animation: dotPop .35s var(--ease) forwards; }
.md1 { animation-delay: 0.1s; } .md2 { animation-delay: 0.9s; } .md3 { animation-delay: 1.7s; } .md4 { animation-delay: 2.5s; }
@keyframes dotPop { 0% { opacity:0; transform:scale(0); } 70% { opacity:1; transform:scale(1.3); } 100% { opacity:1; transform:scale(1); } }
.map-traveller { animation: travelPulse 1s ease-in-out infinite, travelRoute 3.2s var(--ease) forwards; }
.map-traveller-dot { animation: travelRoute 3.2s var(--ease) forwards; }
@keyframes travelPulse { 0%,100% { r: 9; opacity: .6; } 50% { r: 13; opacity: .2; } }
@keyframes travelRoute { 0% { cx: 80; cy: 118; } 28% { cx: 185; cy: 62; } 56% { cx: 275; cy: 85; } 84%,100% { cx: 345; cy: 42; } }

.ls-places-chips { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; padding: 0 8px; }
.places-chips-label { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; margin: 0; }
.places-chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.place-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line-strong); opacity: 0; transform: translateY(10px); animation: chipFadeIn .4s var(--ease) forwards; }
.pc-anim-0 { animation-delay: .1s; } .pc-anim-1 { animation-delay: .3s; } .pc-anim-2 { animation-delay: .5s; } .pc-anim-3 { animation-delay: .7s; } .pc-anim-4 { animation-delay: .9s; }
@keyframes chipFadeIn { to { opacity: 1; transform: translateY(0); } }
.place-chip-name { font-size: 13px; font-weight: 600; color: var(--ink); }
.place-chip-rating { font-size: 11px; font-weight: 800; color: var(--accent); }

.places-carousel { position: relative; width: min(340px, 100%); height: 220px; overflow: hidden; border-radius: 18px; }
.pc-slide { position: absolute; inset: 0; border-radius: 18px; overflow: hidden; border: 1px solid var(--line-strong); opacity: 0; transition: opacity .5s var(--ease); }
.pc-slide.pc-active { opacity: 1; z-index: 2; } .pc-slide.pc-prev { opacity: 0; z-index: 1; }
.pc-slide img { width:100%; height:100%; object-fit:cover; filter:brightness(.6) saturate(.8); }
.pc-ov { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.7),transparent 50%); }
.pc-meta { position: absolute; bottom: 14px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; }
.pc-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -.02em; line-height: 1.1; }
.pc-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.pc-rating-chip { padding: 4px 10px; border-radius: 999px; background: var(--accent); color: var(--ink); font-size: 11px; font-weight: 800; white-space: nowrap; }
.pc-type-chip { padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.2); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; }
.pc-dots { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; }
.pc-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--surface-3); transition: background .3s; }
.pc-dot.pc-dot-active { background: var(--ink); }

.wire-frame { width: min(400px,100%); border-radius: 12px; border: 1px solid var(--line-strong); background: var(--surface); padding: 9px; display: flex; flex-direction: column; gap: 5px; }
.wire-meta { display: flex; flex-direction: column; gap: 5px; }
.wire-tag { height: 9px; width: 55px; border-radius: 999px; }
.wire-title { height: 16px; width: 68%; border-radius: 6px; }
.wire-stops { display: flex; flex-direction: column; gap: 5px; }
.wire-stop { display: flex; align-items: center; gap: 7px; }
.wire-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.wire-lines { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.wire-line { height: 6px; border-radius: 3px; }
.wl-a { width: 78%; } .wl-b { width: 52%; }
.wire-img { width: 36px; height: 28px; border-radius: 6px; flex-shrink: 0; }
.wire-tag, .wire-title, .wire-line, .wire-img {
  background-image: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
.wire-gemini-badge { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: rgba(51,153,137,.08); border: 1px solid rgba(51,153,137,.2); font-size: 12px; font-weight: 600; color: var(--accent); }
.gorb-core-sm { font-size: 12px; animation: coreGlow 2s ease-in-out infinite; }
@keyframes coreGlow { 0%,100%{opacity:.5;} 50%{opacity:1;} }

.loader-bottom { display: flex; flex-direction: column; align-items: center; gap: 16px; width: min(460px, 100%); text-align: center; }
.loader-head { display: flex; flex-direction: column; align-items: center; gap: 6px; width: min(460px,100%); text-align: center; }
.loader-headline { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(26px,3vw,36px) !important; font-weight: 400 !important; letter-spacing: -.02em !important; line-height: 1.05 !important; margin: 0 !important; color: var(--ink) !important; }
.loader-sub { font-size: 12px; font-weight: 500; color: var(--ink-3); margin: 0; line-height: 1.4; }
.loader-list { display: flex; flex-direction: column; width: 100%; }
.loader-item { display: flex; align-items: center; gap: 14px; padding: 9px 0; border-bottom: 1px solid var(--line); opacity: .3; transition: opacity .35s var(--ease); }
.loader-item:last-child { border-bottom: none; }
.loader-item.li-done { opacity: 1; }
.loader-item.li-active { opacity: 1; }
.li-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--surface-3); border: 1px solid var(--line-strong); transition: background .3s, border-color .3s; }
.li-done .li-dot { background: var(--accent); border-color: var(--accent); }
.li-active .li-dot { background: var(--accent); border-color: var(--accent); animation: lpulse 1s ease-in-out infinite; }
.li-text { font-size: 14px; font-weight: 600; color: var(--ink-3); flex: 1; text-align: left; transition: color .3s; }
.li-done .li-text { color: var(--ink-2); }
.li-active .li-text { color: var(--ink); font-weight: 700; }
.li-badge { font-size: 10px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .07em; flex-shrink: 0; }
.loader-bar-track { width: 100%; height: 2px; background: var(--surface-2); border-radius: 1px; overflow: hidden; }
.loader-bar-fill { height: 2px; background: var(--ink); border-radius: 1px; transition: width .6s var(--ease); }
.loader-pct { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; margin: 0; }

/* ── ERROR ── */
.api-error-card { width: min(620px,100%); background: var(--surface); border: 1px solid var(--line-strong); border-radius: 20px; padding: 34px; text-align: left; }

/* ══════════════════════════════════════════
   RESULT SCREEN
══════════════════════════════════════════ */
.result-screen { max-width: 1280px !important; width: 100% !important; padding: 48px clamp(28px,6vw,80px) 80px !important; margin: 0 auto; }
.res-hero { width: 100%; min-height: 480px; border-radius: 28px; overflow: hidden; position: relative; background: #0a120e; display: flex; align-items: flex-end; }
.res-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; filter: brightness(.75) saturate(1.15); animation: heroBgZoom 18s ease-in-out infinite alternate; will-change: transform; }
@keyframes heroBgZoom { from { transform: scale(1); } to { transform: scale(1.06); } }
.res-glass-panel { position: relative; z-index: 2; width: 100%; padding: clamp(28px,4vw,52px); background: rgba(8, 8, 8, 0.38); backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); border-top: 1px solid rgba(255,255,255,0.10); animation: glassPanelIn .9s cubic-bezier(.2,.8,.2,1) .15s both; }
@keyframes glassPanelIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.res-glass-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.archetype-line { font-size: 14px !important; font-weight: 600 !important; color: #5EC4B5 !important; line-height: 1.5 !important; margin: 0 !important; max-width: 520px; opacity: 0; animation: textSlideUp .6s cubic-bezier(.2,.8,.2,1) .35s forwards; }
.res-date-tag { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); white-space: nowrap; letter-spacing: .03em; padding-top: 2px; flex-shrink: 0; opacity: 0; animation: textFadeIn .5s ease .5s forwards; }
.res-dest { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(36px, 5.5vw, 72px); font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #ffffff; margin: 0 0 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-shadow: 0 2px 12px rgba(0,0,0,0.28); opacity: 0; animation: textSlideUp .7s cubic-bezier(.2,.8,.2,1) .55s forwards; }
.res-summary { font-size: 15px !important; line-height: 1.65 !important; color: rgba(255,255,255,0.78) !important; max-width: 680px; margin: 0 !important; opacity: 0; animation: textSlideUp .6s cubic-bezier(.2,.8,.2,1) .75s forwards; }
@keyframes textSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes textFadeIn { from { opacity: 0; } to { opacity: 1; } }

.action-bar { display: flex; flex-direction: column; gap: 12px; margin: 24px 0 52px; }
.action-icons-row { display: flex; align-items: center; gap: 10px; }
.icon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 72px; min-height: 72px; background: transparent; border: 1.5px solid var(--line-strong); border-radius: 20px; cursor: pointer; color: var(--ink-2); font-size: 11px; font-weight: 700; letter-spacing: .02em; transition: background .15s, border-color .15s, color .15s; }
.icon-btn:hover { background: var(--surface-2); border-color: var(--ink); color: var(--ink); }
.icon-btn:disabled { opacity: .5; cursor: not-allowed; }
.icon-btn svg { flex-shrink: 0; }
.icon-btn-active { border-color: var(--accent) !important; color: var(--accent) !important; }
.icon-btn-loading { opacity: .7; cursor: wait; }
.cal-icon-btn-done  { border-color: var(--accent) !important; color: var(--accent) !important; }
.cal-icon-btn-error { border-color: #c0392b !important; color: #c0392b !important; }
.action-primary-cta { width: fit-content; padding: 0 28px; gap: 8px; }
@keyframes calSpin { to { transform: rotate(360deg); } }
.cal-spin { animation: calSpin .8s linear infinite; }

.timeline { max-width: 100% !important; margin: 0 auto; padding: 48px 0 90px !important; }
.timeline > .label { margin-bottom: 40px; }
.stop { display: flex; position: relative; margin-bottom: 44px; }
.stop:not(:last-child)::after { content: ""; position: absolute; left: 4px; top: 22px; bottom: -44px; width: 1px; background: var(--line-strong); }
.s-pin { width: 10px; height: 10px; border-radius: 50%; background: var(--surface-3); border: 2px solid var(--line-strong); flex-shrink: 0; margin-right: 28px; margin-top: 10px; position: sticky; top: 80px; align-self: flex-start; transition: background .3s, border-color .3s; }
.s-pin-featured { background: var(--accent) !important; border-color: var(--accent) !important; }
.stop:hover .s-pin, .stop:focus-within .s-pin { background: var(--accent); border-color: var(--accent); }
.s-pin-index { display: none; }
.s-body { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0,1fr) minmax(300px,440px); column-gap: 40px; align-items: start; }
.s-body > .s-cat, .s-body > h3, .s-body > h4, .s-body > p, .s-body > small, .s-body > .place-meta { grid-column: 1; }
.s-body > .s-photo { grid-column: 2; grid-row: 1 / span 7; }
.s-cat { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 5px; }
.s-body h3 { font-size: 13px; font-weight: 500; letter-spacing: .04em; color: var(--ink-3); margin: 0 0 6px; text-transform: uppercase; }
.s-body h3 span { font-size: 12px; font-weight: 600; color: var(--ink-3); margin-left: 4px; }
.s-body h4 { font-size: 22px; font-weight: 800; color: var(--ink); margin: 0 0 10px; letter-spacing: -.03em; }
.s-body p { font-size: 14px; line-height: 1.68; color: var(--ink-2); margin-bottom: 14px; }
.s-body small { display: block; color: var(--ink-3); font-size: 12px; line-height: 1.5; }
.s-photo { border-radius: 16px; height: 220px; position: relative; overflow: hidden; margin-bottom: 8px; display: flex; align-items: end; padding: 14px; background: var(--surface-2); border: 1px solid var(--line-strong); }
.s-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .4s var(--ease); }
.s-photo:hover img { transform: scale(1.025); }
.s-photo-ov { position: absolute; inset: 0; background: linear-gradient(to top,rgba(10,10,10,.72),transparent 56%); }
.s-photo span { position: relative; z-index: 1; font-size: 11px; font-weight: 800; color: rgba(255,255,255,.9); background: rgba(10,10,10,.55); padding: 5px 10px; border-radius: 7px; }
.place-meta { display: flex; flex-wrap: wrap; gap: 7px; margin: 8px 0 14px; }
.place-meta span, .place-meta a { display: inline-flex; align-items: center; min-height: 28px; padding: 5px 10px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-2); font-size: 12px; font-weight: 600; text-decoration: none; }
.place-meta a { color: var(--ink); font-weight: 700; }
.place-meta .rating-pill { color: var(--accent); border-color: rgba(51,153,137,.3); background: rgba(51,153,137,.1); font-weight: 800; }
.place-meta .demo-pill { color: var(--ink-3); }
.fallback-banner { margin-top: 18px; width: min(760px,100%); border: 1px solid rgba(51,153,137,.25); background: rgba(51,153,137,.07); border-radius: 16px; padding: 16px 18px; }
.fallback-banner span { display: inline-flex; color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
.fallback-banner p { margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: var(--ink-2); }
.fallback-banner button { border: none; border-radius: 8px; padding: 8px 14px; background: var(--ink); color: var(--accent); font-size: 12px; font-weight: 800; }

.modal-backdrop { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 24px; background: rgba(10,10,10,.55); backdrop-filter: blur(8px); }
.subscribe-modal { width: min(620px,100%); border-radius: 22px; padding: 34px; position: relative; background: var(--bg); border: 1px solid var(--line-strong); }
.subscribe-modal h2 { margin-top: 6px; font-size: clamp(36px,5vw,56px); }
.modal-close { position: absolute; right: 20px; top: 18px; width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); font-size: 20px; display: flex; align-items: center; justify-content: center; }
.subscribe-form { display: flex; gap: 8px; margin-top: 22px; }
.subscribe-form input { flex: 1; }
.subscribe-success { margin-top: 14px; border-radius: 12px; padding: 12px 14px; background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-2); font-size: 13px; font-weight: 700; }

/* ── RESPONSIVE ── */
@media(max-width: 760px) {
  .nav-desktop { display: none !important; }
  .nav-mobile { display: flex !important; }
  .navbar { height: 68px !important; padding: 0 20px !important; }
  .screen { padding: 32px 20px; }
  .action-bar { width: 100% !important; padding: 0 20px !important; margin: 20px 0 0 !important; gap: 12px; box-sizing: border-box; flex-direction: column; }
  .action-icons-row { display: flex !important; gap: 10px; width: 100%; }
  .icon-btn { flex: 1; min-width: 0; max-width: none; }
  .action-primary-cta { width: 100% !important; justify-content: center !important; min-height: 52px !important; padding: 0 24px !important; }
  .build-cta-row { justify-content: stretch; }
  .build-cta-row .btn-accent { width: 100%; justify-content: center; }
  .result-screen { padding: 0 0 60px !important; }
  .res-hero { min-height: calc(100svh - 68px); border-radius: 0; align-items: flex-end; }
  .res-glass-panel { padding: 24px 20px 32px; }
  .res-glass-top { flex-direction: column; gap: 6px; }
  .res-date-tag { align-self: flex-start; }
  .res-dest { font-size: clamp(28px, 8vw, 52px); }
  .timeline { padding: 36px 20px 80px !important; }
}

@media(max-width: 980px) {
  .hero-inner { grid-template-columns: 1fr !important; gap: 42px; }
  .hero-cards { max-width: 620px; }
  .s-body { display: block; }
  .s-photo { margin-top: 18px; }
  .hero-cards.itinerary-showreel { max-width: 560px; height: auto !important; }
  .showreel-frame { height: 380px; }
}

@media(max-width: 900px) { .mood-grid.image-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } }

@media(max-width: 620px) {
  .mood-grid.image-grid { grid-template-columns: 1fr !important; }
  .image-mood-tile { height: 200px !important; min-height: 200px !important; }
  .s-photo { height: 200px; }
  h1 { font-size: 48px !important; }
  .showreel-frame { height: 320px; border-radius: 20px; }
  input[type="date"] { font-size: 13px; padding: 0 16px; min-height: 54px; }
}

/* ===== MOBILE LOGIN FIX: itinerary window top, white intro card bottom ===== */
@media (max-width: 760px) {
  html,
  body,
  #root {
    height: 100%;
    overflow: hidden;
  }

  .app-shell.login-active,
  .login-active {
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    overflow: hidden !important;
    padding: 0 !important;
    background: #050807 !important;
  }

  .lp-shell {
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    padding: 0 !important;
    display: block !important;
    overflow: hidden !important;
    position: relative !important;
    background: #050807 !important;
  }

  .lp-bg-outer {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    overflow: hidden !important;
  }

  .lp-bg-outer-img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: center top !important;
    filter: saturate(1.18) contrast(1.04) brightness(.92) !important;
    transform: scale(1.02) !important;
  }

  .lp-bg-outer-dim {
    position: absolute !important;
    inset: 0 !important;
    background:
      linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.04) 28%, rgba(0,0,0,.50) 100%) !important;
  }

  .lp-card {
    position: relative !important;
    z-index: 2 !important;
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: hidden !important;
  }

  /* Itinerary window goes on TOP and gets the visual height */
  .lp-card-right {
    order: 1 !important;
    position: relative !important;
    flex: 1 1 auto !important;
    height: 64dvh !important;
    min-height: 64dvh !important;
    width: calc(100vw - 28px) !important;
    margin: 14px auto 0 !important;
    border: 2px solid rgba(255,255,255,.96) !important;
    border-radius: 30px !important;
    overflow: hidden !important;
    background: rgba(0,0,0,.10) !important;
    box-shadow: none !important;
  }

  .lp-panel-overlay {
    position: absolute !important;
    inset: 0 !important;
    background:
      linear-gradient(180deg, rgba(0,0,0,.02) 0%, rgba(0,0,0,.16) 44%, rgba(0,0,0,.36) 100%) !important;
    pointer-events: none !important;
  }

  .lp-panel-itin {
    position: absolute !important;
    left: 18px !important;
    right: 18px !important;
    bottom: clamp(22px, 5vh, 48px) !important;
    display: grid !important;
    gap: 12px !important;
    padding: 0 !important;
  }

  .lp-itin-line {
    min-height: 60px !important;
    padding: 0 18px !important;
    display: grid !important;
    grid-template-columns: 74px 1fr !important;
    align-items: center !important;
    gap: 10px !important;
    border-radius: 18px !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    background: rgba(0,0,0,.54) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    box-shadow: none !important;
  }

  .lp-itin-time {
    color: #41A394 !important;
    font-size: 16px !important;
    font-weight: 900 !important;
    letter-spacing: -.02em !important;
  }

  .lp-itin-label {
    color: #FFFFFF !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    letter-spacing: -.02em !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  /* White intro/sign-in tile — CHANGE 1: more bottom space */
  .lp-card-left {
    order: 2 !important;
    flex: 0 0 auto !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    max-height: 38dvh !important;
    min-height: 300px !important;
    padding: 24px 22px max(56px, env(safe-area-inset-bottom, 36px)) !important;
    background: #FFFFFF !important;
    color: #080808 !important;
    border-radius: 30px 30px 0 0 !important;
    border: 1px solid rgba(255,255,255,.72) !important;
    box-shadow: 0 -12px 34px rgba(0,0,0,.16) !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    z-index: 5 !important;
  }

  .lp-right-text {
    display: block !important;
  }

  .lp-eyebrow {
    margin: 0 0 10px !important;
    color: #8A897F !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    letter-spacing: .18em !important;
    text-transform: uppercase !important;
  }

  .lp-h1 {
    margin: 0 !important;
    font-family: 'DM Serif Display', Georgia, serif !important;
    font-size: clamp(44px, 13vw, 62px) !important;
    line-height: .88 !important;
    letter-spacing: -.045em !important;
    color: #080808 !important;
  }

  .lp-accent {
    color: #339989 !important;
  }

  .lp-sub {
    margin: 14px 0 0 !important;
    max-width: 34ch !important;
    color: #8A897F !important;
    font-size: 14px !important;
    line-height: 1.42 !important;
    letter-spacing: -.01em !important;
  }

  .lp-actions {
    width: 100% !important;
    margin-top: 18px !important;
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  /* CHANGE 2: Show the real Google iframe — same as desktop */
  .lp-google-wrap {
    position: relative !important;
    width: 100% !important;
    min-height: 44px !important;
    border: none !important;
    background: transparent !important;
    display: flex !important;
    align-items: center !important;
    overflow: visible !important;
    box-shadow: none !important;
  }

  .lp-google-wrap::before,
  .lp-google-wrap::after { display: none !important; content: none !important; }

  .lp-google-wrap > div,
  #googleSignIn {
    width: 100% !important;
    opacity: 1 !important;
    position: relative !important;
    inset: auto !important;
    height: auto !important;
    z-index: auto !important;
    cursor: auto !important;
  }

  .lp-google-wrap iframe {
    width: 100% !important;
    border-radius: 14px !important;
  }

  .google-loading {
    width: 100% !important;
    text-align: center !important;
    color: var(--ink-3) !important;
    font-size: 13px !important;
    padding: 10px 0 !important;
  }

  .lp-ghost-btn {
    width: 100% !important;
    height: 50px !important;
    min-height: 50px !important;
    border-radius: 999px !important;
    border: 1px solid rgba(0,0,0,.12) !important;
    background: transparent !important;
    color: #080808 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
  }

  .lp-fine {
    display: none !important;
  }
}

/* Extra small phones: keep CTAs visible */
@media (max-width: 380px) {
  .lp-card-right {
    height: 62dvh !important;
    min-height: 62dvh !important;
  }

  .lp-card-left {
    max-height: 40dvh !important;
    min-height: 292px !important;
    padding-top: 20px !important;
  }

  .lp-h1 {
    font-size: 42px !important;
  }

  .lp-sub {
    font-size: 13px !important;
    margin-top: 10px !important;
  }

  .lp-actions {
    margin-top: 14px !important;
  }

  .lp-itin-line {
    min-height: 54px !important;
  }
}


/* ===== MOBILE LOGIN CONNECTED WINDOW FIX ===== */
@media (max-width: 760px) {
  .login-active {
    height: 100dvh !important;
    min-height: 100dvh !important;
    overflow: hidden !important;
  }

  .login-active .navbar,
  .login-active .nav-mark,
  .login-active .nav-logo,
  .login-active .drawer-title {
    display: none !important;
  }

  .lp-shell {
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    padding: 8px 12px 8px !important;
    display: flex !important;
    align-items: stretch !important;
    justify-content: center !important;
    overflow: hidden !important;
    background: #dcefeb !important;
  }

  .lp-bg-outer {
    position: absolute !important;
    inset: 0 !important;
    opacity: 1 !important;
  }

  .lp-bg-outer-img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    filter: saturate(1.12) contrast(1.02) brightness(.98) !important;
  }

  .lp-bg-outer-dim {
    background: rgba(0, 0, 0, .06) !important;
  }

  .lp-card {
    position: relative !important;
    z-index: 2 !important;
    width: 100% !important;
    height: calc(100dvh - 16px) !important;
    display: flex !important;
    flex-direction: column !important;
    border: 4px solid rgba(255,255,255,.96) !important;
    border-radius: 42px !important;
    overflow: hidden !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .lp-card-right {
    order: 1 !important;
    position: relative !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: auto !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    background: transparent !important;
  }

  .lp-card-right::before,
  .lp-card-right::after {
    display: none !important;
  }

  .lp-panel-overlay {
    position: absolute !important;
    inset: 0 !important;
    background: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.32)) !important;
    pointer-events: none !important;
  }

  .lp-panel-itin {
    position: absolute !important;
    left: 24px !important;
    right: 24px !important;
    bottom: 24px !important;
    display: grid !important;
    gap: 12px !important;
    z-index: 2 !important;
  }

  .lp-itin-line {
    min-height: 58px !important;
    display: grid !important;
    grid-template-columns: 82px 1fr !important;
    align-items: center !important;
    padding: 0 18px !important;
    border-radius: 18px !important;
    background: rgba(0,0,0,.45) !important;
    border: 1px solid rgba(255,255,255,.16) !important;
    backdrop-filter: blur(14px) !important;
    -webkit-backdrop-filter: blur(14px) !important;
    box-shadow: none !important;
  }

  .lp-itin-time {
    color: #3CA394 !important;
    font-weight: 800 !important;
    font-size: 15px !important;
  }

  .lp-itin-label {
    color: #fff !important;
    font-weight: 800 !important;
    font-size: 15px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .lp-card-left {
    order: 2 !important;
    position: relative !important;
    flex: 0 0 auto !important;
    width: 100% !important;
    min-height: 0 !important;
    max-height: none !important;
    padding: 28px 28px 22px !important;
    background: #ffffff !important;
    border-radius: 0 !important;
    border: 0 !important;
    border-top: 1px solid rgba(0,0,0,.08) !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .lp-right-text {
    margin: 0 !important;
  }

  .lp-eyebrow {
    margin: 0 0 12px !important;
    color: #89877f !important;
    font-size: 11px !important;
    letter-spacing: .22em !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
  }

  .lp-h1 {
    margin: 0 !important;
    font-family: "DM Serif Display", Georgia, serif !important;
    font-size: clamp(50px, 14vw, 68px) !important;
    line-height: .88 !important;
    letter-spacing: -.06em !important;
    color: #060606 !important;
  }

  .lp-accent {
    color: #3CA394 !important;
    -webkit-text-fill-color: #3CA394 !important;
  }

  .lp-sub {
    margin: 18px 0 0 !important;
    font-size: 16px !important;
    line-height: 1.42 !important;
    color: #8a877f !important;
    max-width: 31ch !important;
  }

  .lp-actions {
    margin-top: 24px !important;
    display: grid !important;
    gap: 12px !important;
    width: 100% !important;
  }

  .lp-google-wrap {
    width: 100% !important;
    height: 58px !important;
    border-radius: 999px !important;
    border: 1px solid #d9d4ca !important;
    background: #f8f5ef !important;
    overflow: hidden !important;
    position: relative !important;
    box-shadow: none !important;
  }

  .lp-google-wrap iframe,
  .lp-google-wrap > div,
  #googleSignIn,
  #googleSignIn > div {
    opacity: 0 !important;
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 3 !important;
  }

  .lp-google-wrap::before {
    content: "G" !important;
    position: absolute !important;
    left: 10px !important;
    top: 7px !important;
    width: 44px !important;
    height: 44px !important;
    border-radius: 50% !important;
    display: grid !important;
    place-items: center !important;
    background: #fff !important;
    border: 1px solid rgba(0,0,0,.08) !important;
    color: #4285F4 !important;
    font-family: Arial, sans-serif !important;
    font-size: 26px !important;
    font-weight: 800 !important;
    z-index: 1 !important;
  }

  .lp-google-wrap::after {
    content: "Continue with Google" !important;
    position: absolute !important;
    inset: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding-left: 44px !important;
    color: #080808 !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    z-index: 1 !important;
    pointer-events: none !important;
  }

  .lp-ghost-btn {
    height: 58px !important;
    border-radius: 999px !important;
    background: #fff !important;
    border: 1px solid #dedbd4 !important;
    color: #080808 !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 10px !important;
    box-shadow: none !important;
  }

  .lp-fine {
    display: none !important;
  }

  .lp-logo,
  .lp-brand,
  .lp-logo-text,
  .login-logo,
  .login-brand,
  .drawer-header .drawer-title {
    display: none !important;
  }
}

/* Slightly shorter phones */
@media (max-width: 760px) and (max-height: 760px) {
  .lp-card-left {
    padding: 22px 24px 18px !important;
  }

  .lp-h1 {
    font-size: clamp(44px, 12.5vw, 58px) !important;
  }

  .lp-sub {
    margin-top: 12px !important;
    font-size: 14px !important;
  }

  .lp-actions {
    margin-top: 18px !important;
    gap: 10px !important;
  }

  .lp-google-wrap,
  .lp-ghost-btn {
    height: 52px !important;
  }

  .lp-panel-itin {
    left: 20px !important;
    right: 20px !important;
    bottom: 18px !important;
    gap: 10px !important;
  }

  .lp-itin-line {
    min-height: 52px !important;
  }
}


/* ===== MOBILE FINAL POLISH: remove top seam, translucent itinerary, desktop-style CTAs, no drawer X ===== */
@media (max-width: 760px) {
  .lp-card::before,
  .lp-card::after,
  .lp-card-right::before,
  .lp-card-right::after,
  .lp-panel::before,
  .lp-panel::after,
  .lp-panel-image::before,
  .lp-panel-image::after {
    display: none !important;
    content: none !important;
    border: 0 !important;
  }

  .lp-card {
    border-top-color: rgba(255,255,255,.96) !important;
    background-clip: padding-box !important;
  }

  .lp-card-right {
    border-top: 0 !important;
    outline: 0 !important;
  }

  .lp-panel,
  .lp-panel-image,
  .lp-panel img {
    border-top: 0 !important;
    outline: 0 !important;
  }

  .lp-shell {
    padding-bottom: 14px !important;
  }

  .lp-card {
    height: calc(100dvh - 22px) !important;
  }

  .lp-card-left {
    padding-bottom: max(28px, env(safe-area-inset-bottom)) !important;
  }

  .lp-itin-line {
    background: rgba(255,255,255,.22) !important;
    border: 1px solid rgba(255,255,255,.30) !important;
    border-radius: 18px !important;
    backdrop-filter: blur(18px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
  }

  .lp-itin-time {
    color: #3CA394 !important;
    font-weight: 900 !important;
  }

  .lp-itin-label {
    color: #FFFFFF !important;
    font-weight: 850 !important;
  }

  .lp-google-wrap,
  .lp-ghost-btn {
    border-radius: 22px !important;
    height: 58px !important;
  }

  .lp-google-wrap::before {
    border-radius: 16px !important;
  }

  .lp-ghost-btn {
    background: #ffffff !important;
    border: 1px solid #dedbd4 !important;
    color: #080808 !important;
  }

  .lp-ghost-btn:hover {
    background: #F6F3ED !important;
    color: #080808 !important;
  }

  .lp-google-wrap {
    background: #F8F5EF !important;
    border: 1px solid #d9d4ca !important;
  }

  .lp-google-wrap:hover {
    background: #F8F5EF !important;
    border-color: #d9d4ca !important;
  }

  .drawer-close,
  .menu-close,
  .hamburger-close,
  .mobile-menu-close,
  .drawer-header button,
  .drawer button[aria-label="Close"],
  .mobile-drawer button[aria-label="Close"],
  .menu-panel button[aria-label="Close"],
  .mobile-menu button[aria-label="Close"] {
    display: none !important;
  }

  .hamburger.open span,
  .hamburger.is-open span,
  .menu-toggle.open span,
  .menu-toggle.is-open span {
    transform: none !important;
    opacity: 1 !important;
  }
}

@media (max-width: 760px) and (max-height: 760px) {
  .lp-shell {
    padding-bottom: 12px !important;
  }

  .lp-card {
    height: calc(100dvh - 20px) !important;
  }

  .lp-card-left {
    padding-bottom: max(22px, env(safe-area-inset-bottom)) !important;
  }
}


/* ===== FINAL POLISH: single border + desktop translucent itinerary + desktop-matched mobile buttons ===== */
@media (max-width: 760px) {
  .lp-card {
    border: 3px solid rgba(255,255,255,.96) !important;
    outline: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .lp-card *,
  .lp-card-right,
  .lp-card-left,
  .lp-panel,
  .lp-panel-image,
  .lp-panel img {
    outline: 0 !important;
  }

  .lp-card-right,
  .lp-panel,
  .lp-panel-image {
    border: 0 !important;
    box-shadow: none !important;
  }

  .lp-card-right::before,
  .lp-card-right::after,
  .lp-panel::before,
  .lp-panel::after,
  .lp-panel-image::before,
  .lp-panel-image::after {
    display: none !important;
    content: none !important;
  }

  .lp-card-left {
    border-left: 0 !important;
    border-right: 0 !important;
    border-bottom: 0 !important;
    box-shadow: none !important;
  }

  .lp-google-wrap,
  .lp-ghost-btn {
    height: 58px !important;
    border-radius: 18px !important;
    font-size: 16px !important;
    font-weight: 750 !important;
  }

  .lp-google-wrap {
    background: #F8F5EF !important;
    border: 1px solid #D9D4CA !important;
    box-shadow: none !important;
  }

  .lp-google-wrap::before {
    left: 10px !important;
    top: 7px !important;
    width: 44px !important;
    height: 44px !important;
    border-radius: 14px !important;
  }

  .lp-google-wrap::after {
    font-size: 16px !important;
    font-weight: 750 !important;
    color: #080808 !important;
  }

  .lp-ghost-btn {
    background: #FFFFFF !important;
    border: 1px solid #D9D4CA !important;
    color: #080808 !important;
    box-shadow: none !important;
  }
}

.itinerary-line,
.lp-itin-line {
  background: rgba(255,255,255,.24) !important;
  border: 1px solid rgba(255,255,255,.34) !important;
  backdrop-filter: blur(18px) saturate(140%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
  box-shadow: none !important;
}

.itinerary-line b,
.lp-itin-time {
  color: #3CA394 !important;
  font-weight: 900 !important;
}

.itinerary-line span,
.lp-itin-label {
  color: #FFFFFF !important;
  font-weight: 850 !important;
}

.showreel-overlay,
.lp-panel-overlay {
  background:
    linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.28)),
    linear-gradient(90deg, rgba(0,0,0,.16), rgba(0,0,0,.02)) !important;
}

.google-wrap,
.lp-google-wrap {
  border-radius: 18px !important;
}

.lp-ghost-btn,
.google-connect-btn,
.continue-guest-btn {
  border-radius: 18px !important;
}


/* ===== CLEAN MOBILE WINDOW: no shade seam, unified white tile, exact desktop-style buttons ===== */
@media (max-width: 760px) {
  .lp-card::before,
  .lp-card::after,
  .lp-card-right::before,
  .lp-card-right::after,
  .lp-panel::before,
  .lp-panel::after,
  .lp-panel-image::before,
  .lp-panel-image::after,
  .lp-panel-overlay {
    display: none !important;
    content: none !important;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .lp-card {
    border: 3px solid #ffffff !important;
    outline: 0 !important;
    box-shadow: none !important;
    background: #ffffff !important;
    overflow: hidden !important;
  }

  .lp-card-right,
  .lp-panel,
  .lp-panel-image,
  .lp-panel img {
    border: 0 !important;
    outline: 0 !important;
    box-shadow: none !important;
  }

  .lp-card-left {
    background: #ffffff !important;
    border: 0 !important;
    border-top: 0 !important;
    box-shadow: none !important;
    margin-top: 0 !important;
  }

  .lp-card-left::before,
  .lp-card-left::after {
    display: none !important;
    content: none !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .lp-card-right {
    margin-bottom: 0 !important;
  }

  .lp-card-left {
    transform: translateY(0) !important;
    border-radius: 0 !important;
  }

  .lp-itin-line {
    background: rgba(255,255,255,.24) !important;
    border: 1px solid rgba(255,255,255,.34) !important;
    backdrop-filter: blur(18px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
    box-shadow: none !important;
  }

  .lp-itin-time {
    color: #3CA394 !important;
    font-weight: 900 !important;
  }

  .lp-itin-label {
    color: #ffffff !important;
    font-weight: 850 !important;
  }

  .lp-actions {
    gap: 12px !important;
  }

  .lp-google-wrap,
  .lp-ghost-btn {
    height: 56px !important;
    border-radius: 18px !important;
    border: 1px solid #D9D4CA !important;
    box-shadow: none !important;
  }

  .lp-google-wrap {
    background: #F8F5EF !important;
  }

  .lp-ghost-btn {
    background: #ffffff !important;
    color: #080808 !important;
    font-size: 16px !important;
    font-weight: 750 !important;
  }

  .lp-google-wrap::before {
    width: 42px !important;
    height: 42px !important;
    left: 8px !important;
    top: 6px !important;
    border-radius: 14px !important;
    background: #ffffff !important;
  }

  .lp-google-wrap::after {
    content: "Continue with Google" !important;
    font-size: 16px !important;
    font-weight: 750 !important;
    color: #080808 !important;
    padding-left: 44px !important;
  }

  .lp-google-wrap:hover,
  .lp-ghost-btn:hover {
    background: #F8F5EF !important;
    border-color: #D9D4CA !important;
    color: #080808 !important;
  }

  .lp-google-wrap *,
  .lp-ghost-btn * {
    border-radius: inherit !important;
  }
}

.itinerary-line {
  background: rgba(255,255,255,.24) !important;
  border: 1px solid rgba(255,255,255,.34) !important;
  backdrop-filter: blur(18px) saturate(140%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
  box-shadow: none !important;
}

.itinerary-line b {
  color: #3CA394 !important;
  font-weight: 900 !important;
}

.itinerary-line span {
  color: #ffffff !important;
  font-weight: 850 !important;
}

.showreel-overlay {
  background: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.20)) !important;
}


/* ===== EMERGENCY MOBILE RESTORE: image window visible + desktop button style ===== */
@media (max-width: 760px) {
  .lp-card {
    background: transparent !important;
    border: 3px solid #ffffff !important;
    border-radius: 42px !important;
    overflow: hidden !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .lp-card-right {
    order: 1 !important;
    position: relative !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    background: transparent !important;
    border: 0 !important;
    overflow: hidden !important;
  }

  .lp-card-right,
  .lp-card-right * {
    visibility: visible !important;
  }

  .lp-panel,
  .lp-panel-image {
    position: absolute !important;
    inset: 0 !important;
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
  }

  .lp-panel img,
  .lp-panel-image img,
  .lp-bg,
  .lp-bg img,
  .lp-image,
  .lp-image img {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    filter: saturate(1.12) contrast(1.02) brightness(.98) !important;
  }

  .lp-card::before,
  .lp-card::after,
  .lp-card-right::before,
  .lp-card-right::after,
  .lp-panel::before,
  .lp-panel::after,
  .lp-panel-image::before,
  .lp-panel-image::after,
  .lp-panel-overlay {
    display: none !important;
    content: none !important;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .lp-panel-itin {
    position: absolute !important;
    left: 24px !important;
    right: 24px !important;
    bottom: 24px !important;
    z-index: 5 !important;
    display: grid !important;
    gap: 12px !important;
  }

  .lp-itin-line {
    min-height: 58px !important;
    display: grid !important;
    grid-template-columns: 82px 1fr !important;
    align-items: center !important;
    padding: 0 18px !important;
    border-radius: 18px !important;
    background: rgba(255,255,255,.24) !important;
    border: 1px solid rgba(255,255,255,.34) !important;
    backdrop-filter: blur(18px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
    box-shadow: none !important;
  }

  .lp-itin-time {
    color: #3CA394 !important;
    font-weight: 900 !important;
  }

  .lp-itin-label {
    color: #ffffff !important;
    font-weight: 850 !important;
  }

  .lp-card-left {
    order: 2 !important;
    position: relative !important;
    flex: 0 0 auto !important;
    background: #ffffff !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 28px 28px max(28px, env(safe-area-inset-bottom)) !important;
  }

  .lp-card-left::before,
  .lp-card-left::after {
    display: none !important;
    content: none !important;
  }

  .lp-actions {
    display: grid !important;
    gap: 12px !important;
    margin-top: 24px !important;
  }

  .lp-google-wrap,
  .lp-ghost-btn {
    width: 100% !important;
    height: 56px !important;
    border-radius: 18px !important;
    border: 1px solid #D9D4CA !important;
    background: #F8F5EF !important;
    box-shadow: none !important;
    overflow: hidden !important;
  }

  .lp-google-wrap iframe,
  .lp-google-wrap > div,
  #googleSignIn,
  #googleSignIn > div {
    opacity: 0 !important;
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 3 !important;
  }

  .lp-google-wrap::before {
    content: "G" !important;
    position: absolute !important;
    left: 8px !important;
    top: 6px !important;
    width: 42px !important;
    height: 42px !important;
    border-radius: 14px !important;
    display: grid !important;
    place-items: center !important;
    background: #ffffff !important;
    border: 1px solid rgba(0,0,0,.08) !important;
    color: #4285F4 !important;
    font-family: Arial, sans-serif !important;
    font-size: 26px !important;
    font-weight: 800 !important;
    z-index: 1 !important;
  }

  .lp-google-wrap::after {
    content: "Continue with Google" !important;
    position: absolute !important;
    inset: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding-left: 42px !important;
    color: #080808 !important;
    font-size: 16px !important;
    font-weight: 750 !important;
    z-index: 1 !important;
    pointer-events: none !important;
  }

  .lp-ghost-btn {
    background: #ffffff !important;
    color: #080808 !important;
    font-size: 16px !important;
    font-weight: 750 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .lp-google-wrap:hover,
  .lp-ghost-btn:hover {
    background: #F8F5EF !important;
    border-color: #D9D4CA !important;
    color: #080808 !important;
  }
}

@media (max-width: 760px) and (max-height: 760px) {
  .lp-card-left {
    padding: 22px 24px max(22px, env(safe-area-inset-bottom)) !important;
  }

  .lp-panel-itin {
    left: 20px !important;
    right: 20px !important;
    bottom: 18px !important;
    gap: 10px !important;
  }

  .lp-itin-line {
    min-height: 52px !important;
  }

  .lp-google-wrap,
  .lp-ghost-btn {
    height: 52px !important;
  }
}


/* ===== MOBILE EDGE FIX: remove inner vertical line + add bottom breathing room ===== */
@media (max-width: 760px) {
  .lp-card-right,
  .lp-card-right *,
  .lp-panel,
  .lp-panel *,
  .lp-panel-image,
  .lp-panel-image *,
  .lp-image,
  .lp-image *,
  .lp-bg,
  .lp-bg * {
    border-left: 0 !important;
    border-right: 0 !important;
    border-inline-start: 0 !important;
    border-inline-end: 0 !important;
    outline: 0 !important;
    box-shadow: none !important;
  }

  .lp-card-right::before,
  .lp-card-right::after,
  .lp-panel::before,
  .lp-panel::after,
  .lp-panel-image::before,
  .lp-panel-image::after,
  .lp-image::before,
  .lp-image::after,
  .lp-bg::before,
  .lp-bg::after {
    display: none !important;
    content: none !important;
    border: 0 !important;
    outline: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .lp-card {
    border: 3px solid #ffffff !important;
    outline: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    overflow: hidden !important;
  }

  /* Give the white content tile enough bottom breathing room */
  .lp-card-left {
    padding: 24px 22px max(100px, calc(60px + env(safe-area-inset-bottom, 40px))) 22px !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .lp-actions {
    margin-bottom: 0 !important;
  }

  .lp-shell {
    padding-bottom: 28px !important;
    overflow: hidden !important;
  }

  .lp-card {
    height: calc(100dvh - 46px) !important;
  }

  /* ── FINAL OVERRIDE: Google button same as desktop ── */
  /* Desktop renders the iframe inside .lp-google-wrap with no wrapper styling */
  .lp-google-wrap {
    min-height: 44px !important;
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    position: static !important;
  }

  .lp-google-wrap::before,
  .lp-google-wrap::after {
    all: unset !important;
    display: none !important;
    content: none !important;
  }

  /* The Google-rendered div and iframe: natural flow, full width */
  #googleSignIn,
  .lp-google-wrap > div {
    width: 100% !important;
    opacity: 1 !important;
    position: static !important;
    height: auto !important;
    z-index: auto !important;
  }

  #googleSignIn iframe,
  .lp-google-wrap iframe {
    width: 100% !important;
    opacity: 1 !important;
    position: static !important;
    height: auto !important;
    min-height: 44px !important;
  }

  /* Ghost btn: exact desktop style */
  .lp-ghost-btn {
    width: 100% !important;
    min-height: 40px !important;
    border-radius: 11px !important;
    border: 1.5px solid var(--line-strong) !important;
    background: transparent !important;
    color: var(--ink) !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 0 14px !important;
    gap: 8px !important;
    box-shadow: none !important;
    height: auto !important;
  }
}

@media (max-width: 760px) and (max-height: 760px) {
  .lp-card-left {
    padding: 22px 24px calc(44px + env(safe-area-inset-bottom)) 24px !important;
  }

  .lp-shell {
    padding-bottom: 16px !important;
  }

  .lp-card {
    height: calc(100dvh - 24px) !important;
  }
}

`;

createRoot(document.getElementById("root")).render(<App />);
