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

function priceLabel(p) {
  if (p == null) return null;
  if (typeof p === "number") return p > 0 ? "$".repeat(Math.min(4, p)) : null;
  const map = { PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
  return map[p] || null;
}

function priceRange(p) {
  const label = priceLabel(p);
  const ranges = { "$": "$10–20", "$$": "$20–50", "$$$": "$50–100", "$$$$": "$100+" };
  return label ? ranges[label] : null;
}

// Nearest-neighbor ordering by coordinates when available
function sortByProximity(stops) {
  const coord = (s) => {
    const lat = s.lat ?? s.latitude ?? s.location?.lat ?? s.location?.latitude;
    const lng = s.lng ?? s.longitude ?? s.location?.lng ?? s.location?.longitude;
    return (lat != null && lng != null) ? { lat: +lat, lng: +lng } : null;
  };
  if (stops.filter(s => coord(s)).length < 2) return stops;
  const dist = (a, b) => {
    const dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
    const q = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(q));
  };
  const remaining = [...stops];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const last = coord(ordered[ordered.length - 1]);
    if (!last) { ordered.push(remaining.shift()); continue; }
    let bestI = 0, bestD = Infinity;
    remaining.forEach((s, i) => {
      const cc = coord(s);
      const d = cc ? dist(last, cc) : Infinity;
      if (d < bestD) { bestD = d; bestI = i; }
    });
    ordered.push(remaining.splice(bestI, 1)[0]);
  }
  return ordered;
}

// Activity suggestions per mood — powers the mood-page action search bar
// Landing-page preview itineraries — one per mood, cycled with the background
const loginItins = {
  adventurous: [["07:00", "Sunrise ridge hike"], ["12:30", "Cliffside lunch"], ["16:00", "Zipline over the valley"]],
  "slow-scenic": [["09:00", "Slow lakeside morning"], ["13:00", "Picnic under the pines"], ["18:00", "Golden-hour drift"]],
  cultural: [["08:30", "Quiet temple morning"], ["12:00", "Old-town walking tour"], ["17:30", "Evening gallery hop"]],
  culinary: [["09:30", "Farmers market graze"], ["13:00", "Chef's counter lunch"], ["19:30", "Tasting menu finale"]],
  offbeat: [["10:00", "Tiny obscure museum"], ["14:00", "Secret garden detour"], ["21:00", "Hidden speakeasy"]],
  social: [["11:00", "Brunch with the crew"], ["16:00", "Night market warm-up"], ["20:00", "Rooftop golden hour"]],
  active: [["06:30", "Sunrise paddle"], ["11:00", "Coastal bike loop"], ["15:30", "Boulder & stretch"]],
  "night-owl": [["17:00", "Aperitivo hour"], ["21:00", "Live jazz basement"], ["00:30", "Midnight street food"]],
  romantic: [["10:00", "Slow café morning"], ["17:45", "Golden hour viewpoint"], ["20:30", "Candlelit dinner"]],
};

const moodActivitySuggestions = {
  adventurous: ["Ziplining", "Cliff jumping", "Paragliding", "White-water rafting", "Bungee jump"],
  "slow-scenic": ["Sunset boat ride", "Lakeside cafe", "Golden hour picnic", "Scenic ferry crossing"],
  cultural: ["Museum deep-dive", "Historic walking tour", "Temple visit", "Local artisan market"],
  culinary: ["Street food crawl", "Cooking class", "Food market tour", "Chef's tasting menu"],
  offbeat: ["Hidden speakeasy", "Tiny obscure museum", "Secret garden", "Underground art venue"],
  social: ["Rooftop bar", "Night market", "Live music venue", "Group cooking class"],
  active: ["Kayaking", "Sunrise hike", "Bike tour", "Paddleboarding"],
  "night-owl": ["Jazz bar", "Stargazing", "Night market crawl", "Midnight rooftop views"],
  romantic: ["Sunset beach walk", "Candlelit dinner", "Stargazing", "Golden hour viewpoint"],
};

function buildGoogleMapsTripUrl(stops = [], travelMode = "walking") {
  const names = stops.map((stop) => stop.googlePlaceName || stop.name || stop.photoQuery).filter(Boolean).slice(0, 10);
  if (!names.length) return "";
  if (names.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(names[0])}`;
  const origin = names[0];
  const destination = names[names.length - 1];
  const waypoints = names.slice(1, -1).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;
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
            <div className="pc-ov" />
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
        {moods.map((_, i) => <span key={i} className={`pc-dot${i === idx ? " pc-dot-active" : ""}`} />)}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("");
  const [placePredictions, setPlacePredictions] = useState([]);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [date, setDate] = useState(getToday());
  const [diet, setDiet] = useState("Vegetarian");
  const [planFor, setPlanFor] = useState("Date");
  const [transportMode, setTransportMode] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [selectedMoods, setSelectedMoods] = useState([]);
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
  const [cardIndex, setCardIndex] = useState(0);
  const [savedCards, setSavedCards] = useState(new Set());
  const [swipeDir, setSwipeDir] = useState(1);
  const [activityFocus, setActivityFocus] = useState(false);
  const [customActivities, setCustomActivities] = useState([]);
  const [loginSlide, setLoginSlide] = useState(0);
  const [showTapHint, setShowTapHint] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const tapTimerRef = useRef(null);
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
      if (window.innerWidth <= 1024) {
        // Mobile/tablet: use prompt() triggered by our own styled button
        // renderButton still needed to initialize but hidden
        window.google.accounts.id.renderButton(buttonContainer, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 1 });
      } else {
        window.google.accounts.id.renderButton(buttonContainer, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 320 });
      }
    };
    loadGoogleButton();
    return () => { cancelled = true; };
  }, [step]);

  // Landing page: cinematic cycle through mood imagery + itinerary lines
  useEffect(() => {
    if (step !== "login") return;
    const t = setInterval(() => setLoginSlide(i => (i + 1) % moodVibes.length), 4500);
    return () => clearInterval(t);
  }, [step]);

  // Mobile result: one-time "double tap to save" hint overlay
  useEffect(() => {
    if (step !== "result") return;
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    setShowTapHint(true);
    const t = setTimeout(() => setShowTapHint(false), 3600);
    return () => clearTimeout(t);
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
  // Preload all itinerary images so switching cards feels instant on mobile
  useEffect(() => {
    if (!itinerary?.stops?.length) return;
    const imgs = [];
    const stops = itinerary.stops;
    stops.forEach((s, i) => {
      const url = s.imageUrl || s.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img;
      if (!url) return;
      const img = new Image();
      img.src = url;
      imgs.push(img);
    });
    return () => { /* allow garbage collection */ };
  }, [itinerary, selectedMoods]);
  const travelArchetype = getTravelArchetype(selectedMoodObjects);
  const googleTravelMode = transportMode === "Car" ? "driving" : transportMode === "Public transit" ? "transit" : "walking";
  const savedStopsList = (itinerary?.stops || []).filter((_, i) => savedCards.has(i));
  const mapsStops = savedStopsList.length ? sortByProximity(savedStopsList) : (itinerary?.stops || []);
  const tripMapsUrl = mapsStops.length ? buildGoogleMapsTripUrl(mapsStops, googleTravelMode) : "";

  const loadingItems = useMemo(() => [
    user?.name ? `${user.name}'s lightweight profile` : "Quick feeler profile",
    "Understanding today's intent",
    "Keeping your real constraints in mind",
    "Reading the destination context",
    "Looking for places that match today's mood",
    "Pulling real place photos and ratings",
    "Asking AI to think like today's version of you"
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
    setCardIndex(0);
    setSavedCards(new Set());

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
      } catch (e) { }
    };

    const geminiPromise = fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, destination, dates: prettyDate(date), date, diet, travelWith: planFor, transportMode, timeRange, selectedMoods: selectedMoodObjects, customActivity: [...customActivities, customActivity.trim()].filter(Boolean).join("; ") || null, instruction: "Create a real, specific, mood-first day plan. For each stop that is bookable (tours, tickets, activities like ziplining, theme parks, cabins, classes), include a bookingUrl field pointing to the official booking or ticketing page. For restaurants and paid venues, include priceLevel (1-4) when known. Infer longer-term travel style lightly from Google profile if available, but do not ask the user to select it. Use selectedMoods as today's short-term intent — the signal field for each mood is the critical instruction that defines what kinds of activities to include or exclude. If customActivity is provided, treat it as a must-include experience and build at least one stop around it. GEOGRAPHIC SCOPE: match the scope of the destination exactly as the user typed it. If the destination is a broad region, state, or country (for example 'Tamil Nadu', 'Tuscany', 'Portugal'), spread the stops across the ENTIRE region — pick the best mood-matching places even if they are hours apart, and do NOT cluster every stop in a single city or town. Only keep stops close together and walkable when the destination is a specific city or neighborhood. Return concrete places. The server will enrich stops with Google Places photos, ratings, addresses, and map links." })
    });

    fetchPlaces();

    try {
      const res = await geminiPromise;
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "The planning service is unavailable right now.");
      clearInterval(interval);
      setLoadingLine(6);
      setItinerary(data);
      setTimeout(() => goTo("result"), 800);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || "We could not generate the plan.");
      goTo("apiError");
    }
  }

  async function shareItinerary() {
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
  }

  function startOver() {
    setDestination(""); setDate(getToday()); setDiet("No preference"); setPlanFor("Date");
    setTransportMode(""); setTimeRange(""); setSelectedMoods([]); setCustomActivity("");
    setCustomActivities([]); setItinerary(null); setCardIndex(0); setSavedCards(new Set());
    goTo("setup");
  }

  // Front card interaction:
  // Desktop — single click advances (unchanged behavior).
  // Mobile  — single tap shuffles to the next card (wraps around),
  //           double tap hearts/unhearts the current card.
  function handleCardFrontClick(stops) {
    setShowTapHint(false);
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (!isMobile) {
      if (cardIndex < stops.length - 1) { setSwipeDir(1); setCardIndex(cardIndex + 1); }
      return;
    }
    if (tapTimerRef.current) {
      // Double tap → toggle heart
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      const idx = cardIndex;
      const willSave = !savedCards.has(idx);
      setSavedCards(prev => {
        const n = new Set(prev);
        if (willSave) n.add(idx); else n.delete(idx);
        return n;
      });
      if (willSave) {
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 750);
      }
    } else {
      // Single tap (after double-tap window passes) → next card
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        setSwipeDir(1);
        setCardIndex(i => (i + 1) % stops.length);
      }, 270);
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
                  end: { date: tripDate },
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
    <div className={`app-shell${step === "login" ? " login-active" : ""}${step === "result" ? " result-active" : ""}`} ref={shellRef}>
      <style>{css}</style>

      <nav className="navbar">
        <div className="nav-left-group nav-desktop">
          <svg className="nav-mark" width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Travel DNA">
            <path d="M8 4 C8 10,24 10,24 16 C24 22,8 22,8 28" fill="none" stroke="#339989" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 4 C24 10,8 10,8 16 C8 22,24 22,24 28" fill="none" stroke="#5EC4B5" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
            <circle cx="16" cy="8.5" r="2" fill="#339989" />
            <circle cx="16" cy="16" r="2" fill="#339989" />
            <circle cx="16" cy="23.5" r="2" fill="#339989" />
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
                  <path d="M8 4 C8 10,24 10,24 16 C24 22,8 22,8 28" fill="none" stroke="#339989" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M24 4 C24 10,8 10,8 16 C8 22,24 22,24 28" fill="none" stroke="#5EC4B5" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
                  <circle cx="16" cy="8.5" r="2" fill="#339989" />
                  <circle cx="16" cy="16" r="2" fill="#339989" />
                  <circle cx="16" cy="23.5" r="2" fill="#339989" />
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
            {moodVibes.map((v, i) => (
              <img
                key={v.id}
                src={v.img}
                alt=""
                className={`lp-bg-outer-img lp-bg-slide${i === loginSlide ? " lp-bg-live" : ""}`}
              />
            ))}
            <div className="lp-bg-outer-dim" />
          </div>

          <div className="lp-card">
            <div className="lp-card-left">
              <div className="lp-right-text">
                <p className="lp-eyebrow">Powered by AI ✦</p>
                <h1 className="lp-h1">Plan<br /><span className="lp-accent">in seconds.</span></h1>
                <p className="lp-sub"> Just tell us your trip details and your vibe, and get curated recommendations</p>
              </div>

              <div className="lp-actions">
                {/* Desktop: real Google iframe renders here */}
                <div className="lp-google-wrap">
                  <div id="googleSignIn" />
                  {!googleReady && GOOGLE_CLIENT_ID && <div className="google-loading">Loading…</div>}
                </div>
                {/* Mobile: plain visible button, triggers Google prompt() on click */}
                {GOOGLE_CLIENT_ID && (
                  <button
                    className="lp-google-btn-mobile"
                    onClick={() => window.google?.accounts?.id?.prompt()}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                )}
                <button className="lp-ghost-btn" onClick={() => goTo("setup")}>
                  Continue without sign in
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>

              <p className="lp-fine">No account needed. Sign in later to save itineraries.</p>
            </div>

            <div className="lp-card-right">
              {/* The "captured" wallpaper — condenses into the frame on each cycle */}
              <img key={`win-${loginSlide}`} src={moodVibes[loginSlide].img} alt="" className="lp-window-img" />
              <div className="lp-panel-overlay" />
              <span key={`tag-${loginSlide}`} className="lp-window-mood">
                <span className="lp-window-mood-icon">{moodVibes[loginSlide].icon}</span>
                {moodVibes[loginSlide].title}
              </span>
              <div className="lp-panel-itin" key={`itin-${loginSlide}`}>
                {(loginItins[moodVibes[loginSlide].id] || loginItins.cultural).map(([time, label], i) => (
                  <div key={label} className={`lp-itin-line lp-itin-drop`} style={{ animationDelay: `${.25 + i * .16}s` }}>
                    <span className="lp-itin-time">{time}</span>
                    <span className="lp-itin-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "setup" && (
        <main className="screen setup-screen on">
          <section className="setup-header">
            <p className="label">Step 1 of 2 - Setup</p>
            <h2>Let's get the basics.</h2>
            <p>Where you are, when you're going, and the few constraints that actually matter.</p>
          </section>

          <div className="setup-stack">
            <div className="setup-card">
              <span className="setup-card-label">WHERE</span>
              <input
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestinationSuggestions(true);
                }}
                onFocus={() => {
                  if (destination.trim().length >= 2) setShowDestinationSuggestions(true);
                }}
                placeholder="City, neighborhood or even country"
                autoComplete="off"
                className="setup-card-input"
              />
              {showDestinationSuggestions && destination.trim().length >= 2 && destinationOptions.length > 0 && !destinationOptions.find(o => o.label === destination) && (
                <div className="setup-suggestions">
                  {destinationOptions.map((item) => (
                    <button
                      type="button"
                      key={item.placeId || item.label}
                      className="setup-sug"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setDestination(item.label); setPlacePredictions([]); setShowDestinationSuggestions(false); }}
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
              <div className="setup-card-divider" />
              <span className="setup-card-label">START TIME <span className="setup-card-optional">— optional</span></span>
              <input type="time" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="setup-card-input" />
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
                {["Solo", "Date", "Friends", "Family", "Colleagues", "Kid friendly"].map(o => (
                  <button key={o} type="button" className={planFor === o ? "chip active" : "chip"} onClick={() => setPlanFor(o)}>{o}</button>
                ))}
              </div>
            </div>

            {/* TRANSPORT */}
            <div className="setup-card">
              <span className="setup-card-label">GETTING AROUND <span className="setup-card-optional">— optional</span></span>
              <div className="chips">
                {["Walking", "Car", "Public transit"].map(o => (
                  <button key={o} type="button" className={transportMode === o ? "chip active" : "chip"} onClick={() => setTransportMode(t => t === o ? "" : o)}>{o}</button>
                ))}
              </div>
            </div>

            {user && (
              <div className="partnership-box">
                <div className="profile-chip">
                  <img src={user.picture} alt="" />
                  <span className="profile-chip-name">{user.name}</span>
                </div>
                <p className="partnership-copy">
                  Soon, with your Google data, we might already know you're in Paris, that you're vegan, and who you're traveling with, so we can skip most of this.
                  <br /><br />
                  But one thing we probably shouldn't assume is how you <em>feel today</em>.
                </p>
              </div>
            )}

            <button className="btn-accent" disabled={!destination.trim()} onClick={() => goTo("mood")}>Next, your vibe →</button>
          </div>
        </main>
      )}

      {step === "mood" && (
        <main className="screen mood-screen on">
          <section className="mood-header">
            <p className="label">Step 2 of 2 - Mood</p>
            <h2>What's the <span className="gem">vibe today?</span></h2>
            <p>
              Maybe yesterday you wanted museums. Today you want beach sunsets.
              That's why we're asking. Pick up to three moods and we'll do the magic.
            </p>
          </section>
          <section className="mood-grid image-grid">
            {moodVibes.map((vibe, index) => (
              <button type="button" key={vibe.id} className={selectedMoods.includes(vibe.id) ? "image-mood-tile active" : "image-mood-tile"} onClick={() => toggleMood(vibe.id)}>
                <img src={vibe.img} alt={vibe.title} loading="lazy" />
                <span className="tile-number">{String(index + 1).padStart(2, "0")}</span>
                <span className={selectedMoods.includes(vibe.id) ? "tile-check active" : "tile-check"}>
                  {selectedMoods.includes(vibe.id) && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                      <path d="M5 12.5L10 17.5L19 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <div className="image-tile-overlay" />
                <div className="image-tile-content">
                  <strong>{vibe.title}</strong>
                  <p>{vibe.tag}</p>
                </div>
              </button>
            ))}
          </section>

          <div className="custom-activity-wrap">
            <div className="action-search">
              <span className="action-search-label">WANT SOMETHING SPECIFIC?</span>
              <div className={`action-search-bar${activityFocus ? " action-search-open" : ""}${customActivities.length ? " action-search-has-chips" : ""}`}>
                <svg className="action-search-icon" width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" /><path d="M14 14l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                <div className="action-search-field">
                  {customActivities.map((a) => (
                    <span key={a} className="activity-chip">
                      {a}
                      <button
                        type="button"
                        className="activity-chip-x"
                        onMouseDown={(e) => { e.preventDefault(); setCustomActivities(list => list.filter(x => x !== a)); }}
                        aria-label={`Remove ${a}`}
                      >×</button>
                    </span>
                  ))}
                  <input
                    id="customActivity"
                    type="text"
                    value={customActivity}
                    onChange={e => setCustomActivity(e.target.value)}
                    onFocus={() => setActivityFocus(true)}
                    onBlur={() => setTimeout(() => setActivityFocus(false), 150)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && customActivity.trim()) {
                        e.preventDefault();
                        const v = customActivity.trim();
                        setCustomActivities(list => list.includes(v) ? list : [...list, v]);
                        setCustomActivity("");
                      }
                      if (e.key === "Backspace" && !customActivity && customActivities.length) {
                        setCustomActivities(list => list.slice(0, -1));
                      }
                    }}
                    placeholder={customActivities.length ? "Add another…" : "Search activities — ziplining, cooking class, rooftop sunset…"}
                    maxLength={200}
                    autoComplete="off"
                  />
                </div>
                {(customActivity || customActivities.length > 0) && (
                  <button className="action-search-clear" onMouseDown={(e) => { e.preventDefault(); setCustomActivity(""); setCustomActivities([]); }} aria-label="Clear all">×</button>
                )}
              </div>

              {activityFocus && (() => {
                const pool = (selectedMoods.length ? selectedMoods : ["romantic", "adventurous", "culinary"])
                  .flatMap(id => (moodActivitySuggestions[id] || []).map(a => ({ activity: a, mood: moodVibes.find(v => v.id === id)?.title || "" })));
                const q = customActivity.trim().toLowerCase();
                const filtered = pool.filter(p => !q || p.activity.toLowerCase().includes(q)).slice(0, 8);
                if (!filtered.length) return null;
                return (
                  <div className="action-search-panel">
                    <p className="action-search-panel-label">{selectedMoods.length ? "Based on your moods" : "Popular right now"}</p>
                    {filtered.map((p, i) => {
                      const picked = customActivities.includes(p.activity);
                      return (
                        <button
                          key={p.activity + i}
                          type="button"
                          className={`action-search-item${picked ? " asi-picked" : ""}`}
                          style={{ animationDelay: `${i * 35}ms` }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCustomActivities(list => picked ? list.filter(x => x !== p.activity) : [...list, p.activity]);
                            setCustomActivity("");
                          }}
                        >
                          <span className="asi-spark">{picked ? "✓" : "✦"}</span>
                          <span className="asi-name">{p.activity}</span>
                          <span className="asi-mood">{p.mood}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          <section className="build-cta-row">
            <button className="btn-accent" onClick={generatePlan}>Generate the plan</button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="loading-screen on">
          <div className="loader-head">
            <h2 className="loader-headline">Building around <span className="gem">today's version of you</span></h2>
            <p className="loader-sub">{destination} · {selectedMoodObjects.map(m => m.title).join(", ")}</p>
          </div>
          <div className="loader-stage">
            <div className={`ls${loadingLine === 0 ? " ls-active" : " ls-done"}`}>
              <div className="ls-profile">
                <div className="profile-ring-wrap">
                  <svg className="profile-ring-svg" viewBox="0 0 120 120">
                    <circle className="ring-bg" cx="60" cy="60" r="54" />
                    <circle className="ring-fill" cx="60" cy="60" r="54" />
                  </svg>
                  {user?.picture
                    ? <img className="profile-pic" src={user.picture} alt={user.name} />
                    : <div className="profile-pic profile-pic-fallback">
                      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="19" cy="14" r="7" fill="var(--ink-3)" opacity="0.6" />
                        <path d="M4 34c0-8.284 6.716-13 15-13s15 4.716 15 13" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
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
                    <path d="M 0 95 Q 60 88 110 98 Q 160 108 200 100 Q 260 90 300 96 Q 360 104 420 98" fill="none" stroke="rgba(51,153,137,.18)" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="50" cy="60" r="10" fill="rgba(51,153,137,.12)" />
                    <circle cx="62" cy="54" r="8" fill="rgba(51,153,137,.1)" />
                    <circle cx="150" cy="130" r="9" fill="rgba(51,153,137,.1)" />
                    <circle cx="163" cy="136" r="7" fill="rgba(51,153,137,.08)" />
                    <circle cx="360" cy="110" r="11" fill="rgba(51,153,137,.1)" />
                    <circle cx="374" cy="116" r="8" fill="rgba(51,153,137,.08)" />
                    <line x1="0" y1="50" x2="420" y2="50" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
                    <line x1="0" y1="100" x2="420" y2="100" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
                    <line x1="105" y1="0" x2="105" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
                    <line x1="210" y1="0" x2="210" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
                    <line x1="315" y1="0" x2="315" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
                    <line className="map-line ml1" x1="80" y1="118" x2="185" y2="62" />
                    <line className="map-line ml2" x1="185" y1="62" x2="275" y2="85" />
                    <line className="map-line ml3" x1="275" y1="85" x2="345" y2="42" />
                    <circle className="map-dot md1" cx="80" cy="118" r="6" />
                    <circle className="map-dot md2" cx="185" cy="62" r="6" />
                    <circle className="map-dot md3" cx="275" cy="85" r="6" />
                    <circle className="map-dot md4" cx="345" cy="42" r="6" />
                    <circle className="map-traveller" cx="80" cy="118" r="9" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" />
                    <circle className="map-traveller-dot" cx="80" cy="118" r="4" fill="var(--accent)" />
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
                  <div className="wire-tag" />
                  <div className="wire-title" />
                </div>
                <div className="wire-stops">
                  {[0, 1].map(i => (
                    <div className="wire-stop" key={i}>
                      <div className="wire-dot" />
                      <div className="wire-lines">
                        <div className="wire-line wl-a" style={{ animationDelay: `${i * 0.2}s` }} />
                        <div className="wire-line wl-b" style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
                      </div>
                      <div className="wire-img" style={{ animationDelay: `${i * 0.15}s` }} />
                    </div>
                  ))}
                </div>
                <div className="wire-gemini-badge">
                  <span className="gorb-core-sm">✦</span>
                  <span>AI is crafting your itinerary…</span>
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
              <button className="btn-accent" onClick={generatePlan}>Try again ✦</button>
            </div>
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="rec-screen on">
          {/* ── HEADER ROW ── */}
          <header className="rec-head">
            <div className="rec-head-left">
              <p className="rec-head-eyebrow">{itinerary?.dates || prettyDate(date)} · {savedCards.size > 0 ? `${savedCards.size} saved` : "Your picks"}</p>
              <h2 className="rec-head-dest">{itinerary?.destination || destination}</h2>
            </div>
            <div className="rec-head-actions">
              <button className="icon-btn-sm" onClick={() => goTo("mood")} title="Edit mood">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                className="icon-btn-sm"
                title="Start over"
                onClick={startOver}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 3v3M9 3a6 6 0 106 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M6.5 1.5L9 3 6.5 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button className="icon-btn-sm" onClick={generatePlan} title="Regenerate">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 9a6 6 0 0110.5-4M15 9a6 6 0 01-10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M13 5h2.5V2.5M5 13H2.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                className={`icon-btn-sm${shareCopied ? " icon-btn-sm-active" : ""}`}
                disabled={shareLoading}
                onClick={shareItinerary}
                title="Share"
              >
                {shareCopied
                  ? <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="13" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="13" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" /><line x1="11.1" y1="4.6" x2="6.9" y2="7.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="6.9" y1="10.1" x2="11.1" y2="13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </button>
              <button className={`icon-btn-sm cal-icon-btn-${calendarState}`} onClick={addToCalendar} disabled={calendarState === "loading"} title={user ? "Add to Google Calendar" : "Download .ics"}>
                {calendarState === "loading" ? <svg className="cal-spin" width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" /></svg>
                  : calendarState === "done" ? <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="3.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 8h14" stroke="currentColor" strokeWidth="1.5" /><path d="M6 1.5v3M12 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              </button>
              {tripMapsUrl && (
                <a className="rec-maps-cta" href={tripMapsUrl} target="_blank" rel="noreferrer">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                  Maps
                </a>
              )}
            </div>
          </header>

          {/* ── SPLIT: image left/backdrop, card stack right/floating ── */}
          <div className="rec-split">
            {(() => {
              const stops = itinerary?.stops || [];
              const stop = stops[cardIndex] || {};
              const imgOf = (s, i) => s.imageUrl || s.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img;
              const photoTitle = itinerary?.destination || destination || stop.googlePlaceName || stop.name;
              return (
                <>
                  {/* LEFT: photo pane (desktop) / full-bleed backdrop (mobile) — changes with the active card */}
                  <div className="rec-photo">
                    <img key={cardIndex} src={imgOf(stop, cardIndex)} alt={stop.name || ""} className="rec-photo-img" />
                    <div className="rec-photo-ov" />
                    <div className="rec-photo-meta">
                      <span className="rec-photo-count">{String(cardIndex + 1).padStart(2, "0")} / {String(stops.length).padStart(2, "0")}</span>
                      <span className="rec-photo-name">{photoTitle}</span>
                    </div>
                  </div>

                  {/* RIGHT: card stack */}
                  <div
                    className="rec-stack"
                    onTouchStart={e => { window._recX = e.touches[0].clientX; }}
                    onTouchEnd={e => {
                      const dx = e.changedTouches[0].clientX - (window._recX ?? e.changedTouches[0].clientX);
                      if (dx < -48) { setSwipeDir(1); setCardIndex(i => Math.min(stops.length - 1, i + 1)); }
                      if (dx > 48) { setSwipeDir(-1); setCardIndex(i => Math.max(0, i - 1)); }
                    }}
                  >
                    {stops.map((s, i) => {
                      const off = i - cardIndex;
                      if (off < -1 || off > 2) return null;
                      const isSaved = savedCards.has(i);
                      const price = priceLabel(s.priceLevel);
                      return (
                        <article
                          key={`${s.name}-${i}`}
                          className={`rec-card${off === 0 ? " rec-card-front" : ""}${off < 0 ? " rec-card-gone" : ""}`}
                          onClick={() => { if (off === 0) handleCardFrontClick(stops); }}
                          style={off > 0 ? {
                            transform: `translateX(${off * 26}px) scale(${1 - off * .055}) rotate(${off * 1.4}deg)`,
                            zIndex: 10 - off,
                            opacity: 1 - off * .25,
                          } : off === 0 ? { zIndex: 12, cursor: "pointer" } : {
                            transform: `translateX(${swipeDir < 0 ? "" : "-"}115%) rotate(${swipeDir < 0 ? 8 : -8}deg)`,
                            opacity: 0,
                            zIndex: 14,
                          }}
                        >
                          {/* In-card image (hidden — photo backdrop handles mobile now) */}
                          <div className="rec-card-img">
                            <img src={imgOf(s, i)} alt="" loading="lazy" />
                            <div className="rec-card-img-ov" />
                          </div>

                          <button
                            className={`rec-heart${isSaved ? " rec-heart-on" : ""}`}
                            onClick={(e) => { e.stopPropagation(); setSavedCards(prev => { const n = new Set(prev); isSaved ? n.delete(i) : n.add(i); return n; }); }}
                            aria-label={isSaved ? "Unsave" : "Save"}
                          >
                            <svg width="19" height="19" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                          </button>

                          <div className="rec-card-inner">
                            <p className="rec-card-cat">{s.category}</p>
                            <div className="rec-card-timerow">
                              {s.rating && <span className="rec-card-pill rec-pill-rating">★ {s.rating}</span>}
                              {price && <span className="rec-card-pill rec-pill-price">{price}{priceRange(s.priceLevel) ? ` · ${priceRange(s.priceLevel)}` : ""}</span>}
                              {s.openNow !== undefined && <span className="rec-card-pill">{s.openNow ? "Open" : "Check hours"}</span>}
                            </div>
                            <h3 className="rec-card-name">{s.name}</h3>
                            {s.routeFromPrevious && <small className="rec-card-route rec-card-route-top">{s.routeFromPrevious}</small>}
                            {s.address && (
                              <a className="rec-card-addr" onClick={(e) => e.stopPropagation()} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer">
                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                                {s.address}
                              </a>
                            )}
                            <p className="rec-card-desc">{s.description}</p>
                            {s.bookingUrl && (
                              <a className="rec-card-book" href={s.bookingUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                Check availability & book
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </a>
                            )}
                          </div>
                          {/* Mobile: actions moved into the front card (hidden on desktop) */}
                          {off === 0 && (
                            <div className="rec-card-actions">
                              <button className="rec-mbar-btn" onClick={shareItinerary} disabled={shareLoading}>
                                {shareCopied
                                  ? <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  : <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="13" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="13" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" /><line x1="11.1" y1="4.6" x2="6.9" y2="7.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="6.9" y1="10.1" x2="11.1" y2="13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                }
                                <span>{shareCopied ? "Copied" : "Share"}</span>
                              </button>
                              {tripMapsUrl && (
                                <a className="rec-mbar-btn rec-mbar-primary" href={tripMapsUrl} target="_blank" rel="noreferrer">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                                  <span>Maps{savedCards.size > 0 ? ` · ${savedCards.size}` : ""}</span>
                                </a>
                              )}
                              <button className="rec-mbar-btn" onClick={() => setMoreOpen(true)}>
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="9" r="1.5" fill="currentColor" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="14" cy="9" r="1.5" fill="currentColor" /></svg>
                                <span>More</span>
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}

                    {/* Nav row — rendered inside the front card via absolute positioning */}
                    <div className="rec-nav" onClick={(e) => e.stopPropagation()}>
                      <button className="rec-arrow" onClick={() => { setSwipeDir(-1); setCardIndex(i => Math.max(0, i - 1)); }} disabled={cardIndex === 0}>
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <div className="rec-dots">
                        {stops.map((_, i) => (
                          <button key={i} className={`rec-dot${i === cardIndex ? " rec-dot-on" : ""}${savedCards.has(i) ? " rec-dot-heart" : ""}`} onClick={() => { setSwipeDir(i > cardIndex ? 1 : -1); setCardIndex(i); }} />
                        ))}
                      </div>
                      <button className="rec-arrow" onClick={() => { setSwipeDir(1); setCardIndex(i => Math.min(stops.length - 1, i + 1)); }} disabled={cardIndex === stops.length - 1}>
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>

                    {/* Mobile: one-time gesture hint */}
                    {showTapHint && (
                      <div className="rec-hint" onClick={() => setShowTapHint(false)}>
                        <div className="rec-hint-pill">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                          <span>Tap for next · Double tap to save</span>
                        </div>
                      </div>
                    )}

                    {/* Mobile: heart burst on double-tap save */}
                    {heartBurst && (
                      <div className="rec-heart-burst">
                        <svg width="88" height="88" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* ── MOBILE BOTTOM BAR: Share · Maps · More ── */}
          <div className="rec-mbar">
            <button className="rec-mbar-btn" onClick={shareItinerary} disabled={shareLoading}>
              {shareCopied
                ? <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 9l4 4L14 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="13" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="13" cy="14.5" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" /><line x1="11.1" y1="4.6" x2="6.9" y2="7.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><line x1="6.9" y1="10.1" x2="11.1" y2="13.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
              <span>{shareCopied ? "Copied" : "Share"}</span>
            </button>
            {tripMapsUrl && (
              <a className="rec-mbar-btn rec-mbar-primary" href={tripMapsUrl} target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                <span>Maps{savedCards.size > 0 ? ` · ${savedCards.size}` : ""}</span>
              </a>
            )}
            <button className="rec-mbar-btn" onClick={() => setMoreOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="4" cy="9" r="1.5" fill="currentColor" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="14" cy="9" r="1.5" fill="currentColor" /></svg>
              <span>More</span>
            </button>
          </div>

          {/* ── MOBILE MORE SHEET ── */}
          {moreOpen && (
            <div className="rec-more-backdrop" onClick={() => setMoreOpen(false)}>
              <div className="rec-more-sheet" onClick={e => e.stopPropagation()}>
                <div className="rec-more-grab" />
                <button className="rec-more-item" onClick={() => { setMoreOpen(false); goTo("mood"); }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M12.5 2.5l3 3L5 16H2v-3L12.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Edit mood
                </button>
                <button className="rec-more-item" onClick={() => { setMoreOpen(false); generatePlan(); }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 9a6 6 0 0110.5-4M15 9a6 6 0 01-10.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M13 5h2.5V2.5M5 13H2.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Regenerate plan
                </button>
                <button className="rec-more-item" onClick={() => { setMoreOpen(false); addToCalendar(); }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="3.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 8h14" stroke="currentColor" strokeWidth="1.5" /><path d="M6 1.5v3M12 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  {user ? "Add to Google Calendar" : "Download calendar (.ics)"}
                </button>
                <button className="rec-more-item rec-more-danger" onClick={() => { setMoreOpen(false); startOver(); }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 3v3M9 3a6 6 0 106 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M6.5 1.5L9 3 6.5 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Start over
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {showSubscribe && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="subscribe-modal glass-panel">
            <button className="modal-close" type="button" onClick={() => { setShowSubscribe(false); setSubscribeSaved(false); }}>×</button>
            <div className="spark">✦</div>
            <p className="label">Early access</p>
            <h2>Like this idea?</h2>
            <p>Travel DNA is running in demo mode right now. AI credits are limited, so fallback plans keep the experience alive while the product evolves.</p>
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
.btn-accent:disabled { opacity: .35; cursor: not-allowed; transform: none; }
.btn-accent, .btn-outline { text-decoration: none !important; }
.nav-subscribe { min-height: 44px !important; padding: 0 24px !important; font-size: 13px; background: var(--ink) !important; border: none !important; color: #fff !important; font-weight: 700 !important; border-radius: 12px !important; }
.nav-subscribe:hover { opacity: .85 !important; }

/* Result screen (itinerary) — make the subscribe control outlined white over the photo backdrop */
.result-active .nav-subscribe { background: transparent !important; border: 1.5px solid rgba(255,255,255,.95) !important; color: #fff !important; box-shadow: 0 8px 24px rgba(0,0,0,.16); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.result-active .nav-subscribe:hover { background: rgba(255,255,255,.12) !important; border-color: #fff !important; }
/* Make navbar transparent only on the result screen so buttons float on the image */
.result-active .navbar { background: transparent !important; box-shadow: none !important; }

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
.custom-activity-wrap { margin-top: 48px; width: 100%; max-width: none; }
.custom-activity-card { max-width: 100%; }
.setup-card {
  background: #fff; border-radius: 20px; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.08); position: relative;
}
.setup-card-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
.setup-card-optional { font-size: 10px; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--ink-3); opacity: .65; }
.setup-card-divider { height: 1px; background: var(--line); margin: 4px 0; }
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
.lp-google-wrap { min-height: 36px; display: flex; align-items: center; position: relative; width: 100%; }
/* Desktop: hide fake, show real */
.lp-google-fake { display: none; }
.lp-google-real { width: 100%; }
.lp-ghost-btn { display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding: 0 14px; background: transparent; border: 1.5px solid var(--line-strong); border-radius: 11px; font-size: 12px; font-weight: 600; color: var(--ink); cursor: pointer; transition: all .18s; gap: 8px; }
/* Mobile Google button — plain styled, no iframe */
.lp-google-btn-mobile {
  display: none;
  width: 100%; align-items: center; justify-content: center; gap: 10px;
  background: #fff; color: #3c4043;
  border: 1px solid #d8d8d8; border-radius: 13px;
  padding: 13px; font-size: 14px; font-weight: 500;
  cursor: pointer; font-family: inherit; letter-spacing: .25px;
}
.lp-google-btn-mobile:hover { background: #f7f7f7; }
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

/* Tablet + Mobile: stack to single column */
@media(max-width: 1024px) {
  .lp-shell {
    padding: 16px;
    align-items: stretch;
  }
  .lp-card {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
    width: 100%;
    height: 100dvh;
    border-width: 4px;
    border-radius: 32px 32px 0 0;
  }
  .lp-card-right {
    order: 1;
    min-height: 0;
    flex: 1;
  }
  .lp-card-left {
    order: 2;
    padding: 28px 32px max(28px, env(safe-area-inset-bottom)) 32px;
    gap: 16px;
  }
  .lp-google-wrap {
    min-height: 52px;
    background: transparent;
    border: none;
    overflow: visible;
    position: relative;
  }
  .lp-ghost-btn {
    min-height: 50px;
    border-radius: 14px;
  }
}

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
.tile-check { position: absolute; right: 16px; top: 16px; z-index: 3; width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.75); background: rgba(0,0,0,.08); display: flex; align-items: center; justify-content: center; transition: background .15s, border-color .15s; }
.tile-check.active { border-color: var(--gold-bright); background: var(--gold-bright); }
.image-tile-content { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 2; }
.image-tile-content strong { display: block; font-size: clamp(18px,1.8vw,24px); font-weight: 900; line-height: 1; letter-spacing: -.03em; color: #fff; }
.image-tile-content p { margin: 6px 0 0; color: rgba(255,255,255,.6); font-size: 12px; font-weight: 600; line-height: 1.3; }

.custom-activity-wrap { margin-top: 40px; width: 100%; max-width: none; display: grid; gap: 10px; }
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

.timeline { max-width: 100% !important; margin: 0 auto; padding: 48px 0 32px !important; }
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
  .timeline { padding: 36px 20px 32px !important; }
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

/* ===== PROFILE CARD: simple translucent profile note ===== */
.setup-stack .partnership-box {
  max-width: 100% !important;
  margin: 6px 0 0 !important;
  padding: 20px 22px !important;
  border-radius: 24px !important;
  background: rgba(255,255,255,.52) !important;
  border: 1px solid rgba(0,0,0,.08) !important;
  box-shadow: 0 18px 44px rgba(0,0,0,.035) !important;
  backdrop-filter: blur(18px) !important;
  -webkit-backdrop-filter: blur(18px) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  gap: 16px !important;
}

.setup-stack .profile-chip {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  flex-shrink: 0 !important;
}

.setup-stack .profile-chip img {
  width: 38px !important;
  height: 38px !important;
  border-radius: 12px !important;
  object-fit: cover !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,.8), 0 6px 18px rgba(0,0,0,.08) !important;
}

.setup-stack .profile-chip-name {
  font-size: 15px !important;
  font-weight: 800 !important;
  letter-spacing: -.03em !important;
  color: var(--ink) !important;
  white-space: nowrap !important;
}

.setup-stack .partnership-copy {
  margin: 0 !important;
  max-width: 540px !important;
  font-size: 15px !important;
  line-height: 1.55 !important;
  color: var(--ink-2) !important;
  font-weight: 500 !important;
  letter-spacing: -.015em !important;
}

.setup-stack .partnership-copy em {
  font-family: 'DM Serif Display', Georgia, serif !important;
  font-style: italic !important;
  color: var(--ink) !important;
  font-weight: 400 !important;
}

@media (max-width: 760px) {
  .setup-stack .partnership-box {
    padding: 18px 18px !important;
    border-radius: 20px !important;
    gap: 14px !important;
  }
  .setup-stack .profile-chip img {
    width: 34px !important;
    height: 34px !important;
    border-radius: 11px !important;
  }
  .setup-stack .profile-chip-name {
    font-size: 14px !important;
  }
  .setup-stack .partnership-copy {
    font-size: 13.5px !important;
    line-height: 1.5 !important;
  }
}

/* ═══════════════════════════════════════════
   RECOMMENDATION SCREEN — one viewport, no scroll
   Anime.js-inspired springs: cubic-bezier(.34,1.56,.64,1)
═══════════════════════════════════════════ */
.result-active {
  height: 100dvh !important;
  overflow: hidden !important;
  padding-bottom: 0 !important;
}

.rec-screen {
  width: 100%;
  max-width: 1440px;
  height: calc(100dvh - 68px);
  display: flex;
  flex-direction: column;
  padding: 8px clamp(20px,4vw,56px) 20px;
  overflow: hidden;
  animation: scIn .3s var(--ease) both;
}

/* Header */
.rec-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  flex-shrink: 0;
}
.rec-head-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--ink-3); margin: 0 0 4px;
}
.rec-head-dest {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(26px, 3.2vw, 44px);
  font-weight: 400; line-height: 1; letter-spacing: -.02em;
  color: var(--ink); margin: 0;
}
.rec-head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.icon-btn-sm {
  width: 38px; height: 38px; border-radius: 12px;
  border: 1.5px solid var(--line-strong); background: transparent;
  color: var(--ink-2); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s;
}
.icon-btn-sm:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); background: var(--surface); }
.icon-btn-sm:disabled { opacity: .4; cursor: wait; }
.icon-btn-sm-active { border-color: var(--accent) !important; color: var(--accent) !important; }
.cal-icon-btn-done { border-color: var(--accent) !important; color: var(--accent) !important; }
.rec-maps-cta {
  display: inline-flex; align-items: center; gap: 6px;
  height: 38px; padding: 0 16px; border-radius: 12px;
  background: var(--ink); color: #fff; font-size: 13px; font-weight: 700;
  text-decoration: none; transition: opacity .15s;
}
.rec-maps-cta:hover { opacity: .85; }

/* Split layout */
.rec-split {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 1fr);
  gap: clamp(20px, 3vw, 40px);
  align-items: stretch;
}

/* LEFT photo pane */
.rec-photo {
  position: relative;
  border-radius: 26px;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
}
.rec-photo-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  animation: photoIn .7s cubic-bezier(.2,.8,.2,1) both, photoKen 9s ease-in-out 0.6s both;
}
@keyframes photoIn {
  from { opacity: 0; transform: scale(1.06); filter: blur(6px); }
  to   { opacity: 1; transform: scale(1); filter: blur(0); }
}
@keyframes photoKen {
  from { transform: scale(1); }
  to   { transform: scale(1.06); }
}
.rec-photo-ov {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 42%);
}
.rec-photo-meta {
  position: absolute; left: 22px; right: 22px; bottom: 20px;
  display: flex; flex-direction: column; gap: 4px;
}
.rec-photo-count {
  font-size: 11px; font-weight: 800; letter-spacing: .12em;
  color: rgba(255,255,255,.65); font-variant-numeric: tabular-nums;
}
.rec-photo-name {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(20px, 2vw, 30px); color: #fff; letter-spacing: -.02em;
  animation: nameSlide .55s cubic-bezier(.34,1.56,.64,1) .15s both;
}
@keyframes nameSlide {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* RIGHT card stack */
.rec-stack {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
}
.rec-card {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: #fff;
  border: 1px solid var(--line-strong);
  box-shadow: 0 10px 34px rgba(0,0,0,.10);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform .55s cubic-bezier(.34,1.56,.64,1), opacity .4s ease;
  will-change: transform, opacity;
}
.rec-card-front {
  animation: cardPop .55s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes cardPop {
  from { transform: translateX(30px) scale(.96) rotate(1.5deg); opacity: .6; }
  to   { transform: translateX(0) scale(1) rotate(0); opacity: 1; }
}
.rec-card-gone { pointer-events: none; }

/* In-card image — hidden everywhere now that the photo pane doubles as the mobile backdrop */
.rec-card-img { display: none; position: relative; height: 200px; flex-shrink: 0; }
.rec-card-img img { width: 100%; height: 100%; object-fit: cover; }
.rec-card-img-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.35), transparent 55%); }

/* Heart */
.rec-heart {
  position: absolute; top: 16px; right: 16px; z-index: 5;
  width: 46px; height: 46px; border-radius: 50%;
  border: 1.5px solid var(--line-strong);
  background: #fff; color: var(--ink-3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: transform .35s cubic-bezier(.34,1.9,.64,1), color .2s, border-color .2s, background .2s;
}
.rec-heart:hover { transform: scale(1.12); color: var(--accent); border-color: var(--accent); }
.rec-heart-on {
  background: var(--accent); border-color: var(--accent); color: #fff;
  animation: heartPop .45s cubic-bezier(.34,2.2,.64,1);
}
@keyframes heartPop {
  0% { transform: scale(.7); }
  55% { transform: scale(1.22); }
  100% { transform: scale(1); }
}

/* Card inner content */
.rec-card-inner {
  flex: 1;
  min-height: 0;
  padding: clamp(22px,3vw,34px) clamp(22px,3vw,34px) 74px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}
.rec-card-cat {
  font-size: 10px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; color: var(--ink-3); margin: 0;
}
.rec-card-timerow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.rec-card-time {
  font-size: 13px; font-weight: 800; color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.rec-card-suggested {
  font-size: 12px; font-weight: 600; color: var(--ink-3);
  margin: 10px 0 0; font-variant-numeric: tabular-nums;
}
.rec-card-pill {
  font-size: 11px; font-weight: 700; color: var(--ink-2);
  padding: 3px 10px; border-radius: 999px;
  background: var(--surface); border: 1px solid var(--line);
}
.rec-pill-rating { color: var(--accent); background: rgba(51,153,137,.08); border-color: rgba(51,153,137,.25); }
.rec-pill-price { color: #b8860b; background: rgba(184,134,11,.08); border-color: rgba(184,134,11,.25); font-variant-numeric: tabular-nums; letter-spacing: .05em; }
.rec-card-name {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(24px, 2.6vw, 38px);
  font-weight: 400; line-height: 1.05; letter-spacing: -.02em;
  color: var(--ink); margin: 2px 0 0;
}
.rec-card-desc {
  font-size: 14px; line-height: 1.65; color: var(--ink-2); margin: 6px 0 0;
}
.rec-card-addr {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--ink-3);
  text-decoration: none; margin-top: 2px;
}
.rec-card-addr:hover { color: var(--accent); }
.rec-card-book {
  display: inline-flex; align-items: center; gap: 7px;
  margin-top: 6px; padding: 9px 16px; width: fit-content;
  border-radius: 11px; background: var(--ink); color: #fff;
  font-size: 12.5px; font-weight: 700; text-decoration: none;
  transition: opacity .15s, transform .2s cubic-bezier(.34,1.56,.64,1);
}
.rec-card-book:hover { opacity: .88; transform: translateY(-1px); }
.rec-card-route { color: var(--ink-3); font-size: 11.5px; line-height: 1.5; margin-top: 4px; display: block; }

/* Nav — sits INSIDE the front card, bottom center */
.rec-nav {
  position: absolute;
  left: 0; right: 0; bottom: 16px;
  z-index: 20;
  display: flex; align-items: center; justify-content: center; gap: 14px;
  pointer-events: none;
}
.rec-nav > * { pointer-events: auto; }
.rec-arrow {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1.5px solid var(--line-strong); background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
  color: var(--ink-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s;
}
.rec-arrow:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); transform: scale(1.06); }
.rec-arrow:disabled { opacity: .25; cursor: not-allowed; }
.rec-dots { display: flex; gap: 7px; align-items: center; }
.rec-dot {
  width: 7px; height: 7px; border-radius: 999px;
  border: none; background: var(--surface-3);
  cursor: pointer; padding: 0;
  transition: all .35s cubic-bezier(.34,1.56,.64,1);
}
.rec-dot-on { background: var(--ink); width: 22px; }
.rec-dot-heart { background: var(--accent); }
.rec-dot-heart.rec-dot-on { background: var(--accent); width: 22px; }

/* ── MOBILE BOTTOM BAR + GESTURE UI (hidden on desktop) ── */
.rec-mbar {
  display: none;
  grid-template-columns: 1fr 1.35fr 1fr;
  gap: 10px;
  padding-top: 12px;
  flex-shrink: 0;
}
.rec-mbar-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 54px; border-radius: 18px;
  border: 1.5px solid var(--line-strong); background: #fff;
  font-size: 14px; font-weight: 700; color: var(--ink);
  text-decoration: none; cursor: pointer;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
  transition: transform .15s, opacity .15s;
}
.rec-mbar-btn:active { transform: scale(.97); }
.rec-mbar-btn:disabled { opacity: .5; cursor: wait; }
.rec-mbar-primary { background: var(--ink); color: #fff; border-color: var(--ink); }

.rec-hint {
  display: none;
  position: absolute; inset: 0; z-index: 30;
  align-items: center; justify-content: center;
  background: rgba(0,0,0,.22);
  border-radius: 24px;
  animation: hintFade .35s ease both;
  cursor: pointer;
}
@keyframes hintFade { from { opacity: 0; } to { opacity: 1; } }
.rec-hint-pill {
  display: flex; align-items: center; gap: 9px;
  padding: 13px 20px; border-radius: 999px;
  background: rgba(8,8,8,.78);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  color: #fff; font-size: 13px; font-weight: 700;
  animation: hintPillIn .5s cubic-bezier(.34,1.56,.64,1) both;
}
.rec-hint-pill svg { color: var(--accent); flex-shrink: 0; }
@keyframes hintPillIn {
  from { opacity: 0; transform: translateY(12px) scale(.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.rec-heart-burst {
  position: absolute; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.rec-heart-burst svg {
  color: #fff;
  filter: drop-shadow(0 10px 28px rgba(0,0,0,.35));
  animation: burstPop .75s cubic-bezier(.34,1.8,.64,1) both;
}
@keyframes burstPop {
  0%   { transform: scale(.25); opacity: 0; }
  30%  { transform: scale(1.25); opacity: 1; }
  60%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.05); opacity: 0; }
}

.rec-more-backdrop {
  position: fixed; inset: 0; z-index: 700;
  background: rgba(10,10,10,.45);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
  animation: drawerBgIn .2s ease both;
}
.rec-more-sheet {
  width: 100%;
  background: var(--bg);
  border-radius: 26px 26px 0 0;
  padding: 12px 16px max(22px, env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 2px;
  animation: sheetUp .32s var(--ease) both;
}
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.rec-more-grab {
  width: 40px; height: 4px; border-radius: 999px;
  background: var(--surface-3); margin: 0 auto 12px;
}
.rec-more-item {
  display: flex; align-items: center; gap: 12px;
  width: 100%; min-height: 54px; padding: 0 14px;
  border: none; border-radius: 14px;
  background: transparent;
  font-size: 15px; font-weight: 700; color: var(--ink);
  text-align: left; cursor: pointer;
  transition: background .12s;
}
.rec-more-item:active { background: var(--surface-2); }
.rec-more-item svg { flex-shrink: 0; color: var(--ink-2); }
.rec-more-danger { color: #c0392b; }
.rec-more-danger svg { color: #c0392b; }

/* ── Mobile result: image backdrop + floating swipe card + bottom bar ── */
@media (max-width: 900px) {
  .rec-screen {
    height: calc(100dvh - 68px);
    padding: 0; /* remove off-white gutters so photo can be full-bleed */
    background: transparent;
  }
  .rec-head { padding-bottom: 10px; align-items: center; }
  .rec-head-dest { display: none; }
  .rec-head-actions { display: none; }

  /* Photo becomes the full backdrop; it changes with the active card */
  .rec-split { position: relative; display: block; }
  .rec-photo {
    display: block;
    position: fixed; inset: 0; /* full-bleed background */
    z-index: 0;
    border-radius: 0;
  }
  .rec-photo-ov { background: linear-gradient(to bottom, rgba(0,0,0,.62) 0%, rgba(0,0,0,.04) 46%); }
  .rec-photo { border-radius: 0; border: none; }
  .rec-photo-meta { top: 16px; bottom: auto; left: 18px; right: 18px; }
  .rec-photo-name { font-size: 20px; }

  /* Card floats lower and shorter so the image keeps the full-screen feel */
  .rec-stack {
    position: absolute;
    left: 14px; right: 14px;
    bottom: 14px; top: auto;
    height: 50vh;
    display: block;
    z-index: 2;
  }
  .rec-card { cursor: pointer; }
  .rec-card-img { display: none; }
  .rec-card-inner { padding: 18px 18px 56px; gap: 8px; overflow: hidden; }
  .rec-card-name { font-size: 24px; }
  .rec-card-desc { font-size: 13.5px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .rec-heart { top: 12px; right: 12px; width: 42px; height: 42px; }

  /* Tap/swipe drives navigation — arrows off, dots stay */
  .rec-arrow { display: none; }
  .rec-nav { bottom: 84px; }

  .rec-mbar { display: none; }
  .rec-card-actions { display: none; }
  .rec-card-actions .rec-mbar-btn { width: 100%; min-height: 46px; justify-content: center; }
  .rec-card-actions { display: flex; flex-direction: column; gap: 12px; padding: 12px 18px calc(20px + env(safe-area-inset-bottom)); background: transparent; }
  .rec-card { overflow: visible; }
  .rec-hint { display: flex; }
  .rec-hint { display: flex; }
}

/* ── ACTION SEARCH BAR (mood page) — kokonutui style ── */
.action-search { position: relative; width: 100%; display: flex; flex-direction: column; gap: 10px; }
.action-search-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
.action-search-bar {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 18px;
  min-height: 60px; padding: 0 20px;
  box-shadow: 0 1px 6px rgba(0,0,0,.08);
  border: 1.5px solid transparent;
  transition: border-color .2s, box-shadow .25s cubic-bezier(.34,1.56,.64,1);
}
.action-search-open { border-color: var(--accent); box-shadow: 0 6px 24px rgba(51,153,137,.14); }
.action-search-icon { color: var(--ink-3); flex-shrink: 0; }
.action-search-open .action-search-icon { color: var(--accent); }
.action-search-bar input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 15px; font-weight: 500; color: var(--ink); min-width: 0;
}
.action-search-bar input::placeholder { color: var(--ink-3); font-weight: 400; }
.action-search-field { flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 7px; min-width: 0; padding: 10px 0; }
.action-search-field input { flex: 1; min-width: 140px; border: none; background: transparent; outline: none; font-size: 15px; font-weight: 500; color: var(--ink); }
.action-search-has-chips { min-height: 60px; height: auto; }
.activity-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 8px 6px 13px; border-radius: 999px;
  background: rgba(51,153,137,.1); border: 1px solid rgba(51,153,137,.3);
  color: var(--accent-strong, #237a6d); font-size: 13px; font-weight: 700;
  animation: chipIn .3s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes chipIn { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: scale(1); } }
.activity-chip-x {
  width: 18px; height: 18px; border-radius: 50%; border: none;
  background: rgba(51,153,137,.18); color: var(--accent-strong, #237a6d);
  font-size: 13px; line-height: 1; display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
}
.activity-chip-x:hover { background: var(--accent); color: #fff; }
.asi-picked .asi-spark { color: var(--accent); font-weight: 800; }
.asi-picked { background: rgba(51,153,137,.07); }
.action-search-clear {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: var(--surface-2); color: var(--ink-2); font-size: 16px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.action-search-panel {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 300;
  background: #fff; border-radius: 18px; padding: 10px;
  box-shadow: 0 16px 48px rgba(0,0,0,.14);
  border: 1px solid var(--line);
  animation: panelIn .3s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes panelIn { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.action-search-panel-label {
  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-3); margin: 4px 0 8px; padding: 0 10px;
}
.action-search-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 11px 12px; border: none; border-radius: 12px;
  background: transparent; text-align: left; cursor: pointer;
  transition: background .12s;
  animation: itemIn .35s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes itemIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
.action-search-item:hover { background: var(--surface); }
.asi-spark { color: var(--accent); font-size: 12px; flex-shrink: 0; }
.asi-name { font-size: 14px; font-weight: 600; color: var(--ink); flex: 1; }
.asi-mood { font-size: 11px; font-weight: 600; color: var(--ink-3); padding: 2px 9px; border-radius: 999px; background: var(--surface); }

/* ═══════════════════════════════════════════
   LANDING MOTION — cinematic mood cycle
   wallpaper zooms out → gets "captured" into the
   itinerary window → plan lines drop in, staggered
═══════════════════════════════════════════ */

/* Stacked crossfading backgrounds */
.lp-bg-outer .lp-bg-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.4s ease;
  will-change: opacity, transform;
}
.lp-bg-outer .lp-bg-live {
  opacity: 1;
  animation: lpZoomOut 5.2s cubic-bezier(.22,.61,.36,1) both;
}
@keyframes lpZoomOut {
  from { transform: scale(1.14); }
  to   { transform: scale(1.0); }
}

/* The captured wallpaper inside the itinerary window:
   starts huge + blurred (same as wallpaper), condenses into the frame */
.lp-window-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  animation: lpCapture 1.35s cubic-bezier(.22,.9,.32,1) both;
}
@keyframes lpCapture {
  0%   { transform: scale(1.55); filter: blur(14px) saturate(1.25); opacity: 0; }
  35%  { opacity: 1; }
  100% { transform: scale(1); filter: blur(0) saturate(1); opacity: 1; }
}

/* Keep overlay + content above the captured image */
.lp-panel-overlay { z-index: 1; }
.lp-panel-itin { z-index: 2; }

/* Mood tag — glass pill, slides in after the capture settles */
.lp-window-mood {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(0,0,0,.32);
  border: 1px solid rgba(255,255,255,.22);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .03em;
  animation: lpTagIn .6s cubic-bezier(.34,1.56,.64,1) .55s both;
}
.lp-window-mood-icon { font-size: 13px; opacity: .9; }
@keyframes lpTagIn {
  from { opacity: 0; transform: translateY(-10px) scale(.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Itinerary lines drop in from above, staggered, springy */
.lp-itin-drop {
  animation: lpLineDrop .65s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes lpLineDrop {
  from { opacity: 0; transform: translateY(-22px) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .lp-bg-outer .lp-bg-live,
  .lp-window-img,
  .lp-window-mood,
  .lp-itin-drop { animation: none !important; }
  .lp-bg-outer .lp-bg-slide { transition: opacity .6s ease; }
}

/* ═══════════════════════════════════════════
   MOBILE LANDING — consolidated, full-bleed
   Replaces the stacked emergency override blocks.
   The image window fills edge-to-edge (no outer gap),
   and the white sign-in sheet rises over it.
═══════════════════════════════════════════ */
@media (max-width: 760px) {
  .app-shell.login-active,
  .login-active {
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    overflow: hidden !important;
    padding: 0 !important;
    background: #050807 !important;
  }
  .login-active .navbar { display: none !important; }

  /* Full bleed — no padding, no frame, no gap */
  .lp-shell {
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    padding: 0 !important;
    display: flex !important;
    align-items: stretch !important;
    overflow: hidden !important;
    background: #050807 !important;
  }

  .lp-bg-outer { display: none !important; }

  .lp-card {
    position: relative !important;
    z-index: 2 !important;
    width: 100vw !important;
    height: 100dvh !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #050807 !important;
    box-shadow: none !important;
    overflow: hidden !important;
  }

  /* Image window: fills all the space above the sheet, edge to edge */
  .lp-card-right {
    order: 1 !important;
    position: relative !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    background: #050807 !important;
  }

  .lp-window-img {
    object-position: center !important;
    filter: saturate(1.12) contrast(1.02) !important;
  }

  .lp-panel-overlay {
    display: block !important;
    position: absolute !important;
    inset: 0 !important;
    background: linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.02) 34%, rgba(0,0,0,.34) 100%) !important;
    pointer-events: none !important;
  }

  .lp-window-mood {
    top: max(16px, env(safe-area-inset-top)) !important;
    left: 18px !important;
  }

  .lp-panel-itin {
    position: absolute !important;
    left: 18px !important;
    right: 18px !important;
    bottom: 46px !important; /* clears the sheet's rounded overlap */
    display: grid !important;
    gap: 11px !important;
    z-index: 2 !important;
  }

  .lp-itin-line {
    min-height: 56px !important;
    display: grid !important;
    grid-template-columns: 78px 1fr !important;
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
    font-size: 15px !important;
    font-weight: 900 !important;
    letter-spacing: -.02em !important;
  }

  .lp-itin-label {
    color: #FFFFFF !important;
    font-size: 15px !important;
    font-weight: 800 !important;
    letter-spacing: -.02em !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  /* White sign-in sheet rises over the image */
  .lp-card-left {
    order: 2 !important;
    position: relative !important;
    z-index: 5 !important;
    flex: 0 0 auto !important;
    width: 100% !important;
    margin: -28px 0 0 !important;
    padding: 26px 26px max(28px, env(safe-area-inset-bottom)) !important;
    background: #FFFFFF !important;
    border: 0 !important;
    border-radius: 28px 28px 0 0 !important;
    box-shadow: 0 -12px 34px rgba(0,0,0,.16) !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
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
    font-size: clamp(46px, 13vw, 62px) !important;
    line-height: .88 !important;
    letter-spacing: -.045em !important;
    color: #080808 !important;
  }

  .lp-accent { color: #3CA394 !important; -webkit-text-fill-color: #3CA394 !important; }

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
    margin-top: 20px !important;
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 11px !important;
  }

  /* Google iframe stays desktop-only; mobile uses the styled prompt() button */
  .lp-google-wrap { display: none !important; }
  .lp-google-btn-mobile {
    display: flex !important;
    height: 56px !important;
    border-radius: 18px !important;
    border: 1px solid #D9D4CA !important;
    font-size: 15px !important;
    font-weight: 600 !important;
  }

  .lp-ghost-btn {
    width: 100% !important;
    height: 56px !important;
    min-height: 56px !important;
    border-radius: 18px !important;
    border: 1px solid #D9D4CA !important;
    background: #FFFFFF !important;
    color: #080808 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    font-size: 15px !important;
    font-weight: 750 !important;
    box-shadow: none !important;
  }
  .lp-ghost-btn:hover { background: #F8F5EF !important; border-color: #D9D4CA !important; color: #080808 !important; }

  .lp-fine { display: none !important; }

  .drawer-close { display: none !important; }
}

/* Shorter phones: keep CTAs visible */
@media (max-width: 760px) and (max-height: 760px) {
  .lp-card-left { padding: 20px 22px max(22px, env(safe-area-inset-bottom)) !important; }
  .lp-h1 { font-size: clamp(42px, 12vw, 54px) !important; }
  .lp-sub { margin-top: 10px !important; font-size: 13px !important; }
  .lp-actions { margin-top: 15px !important; gap: 9px !important; }
  .lp-google-btn-mobile, .lp-ghost-btn { height: 50px !important; min-height: 50px !important; }
  .lp-panel-itin { bottom: 40px !important; gap: 9px !important; }
  .lp-itin-line { min-height: 50px !important; }
}
`;

createRoot(document.getElementById("root")).render(<App />);
