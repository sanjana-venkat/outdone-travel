/* eslint-disable no-unused-vars, no-empty, react-refresh/only-export-components, react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

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
  if (moods.length) return { name: "The Vibe-Led Traveler", line: "You know what you want today — and you're building a day around exactly that feeling." };
  return { name: "The Vibe-Led Traveler", line: "You know what you want today — and you're building a day around exactly that feeling." };
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
  if (/(sunrise|breakfast|coffee|morning)/.test(text)) return 8 * 60;
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

function orderStopsMorningFirst(plan) {
  const stops = Array.isArray(plan?.stops) ? [...plan.stops] : [];
  return { ...plan, stops: orderStopsByTime(stops) };
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function prettyDate(value) {
  if (!value) return "Today";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

const fallbackDestinationSuggestions = [
  { label: "France", aliases: ["france"] },
  { label: "Nigeria", aliases: ["nigeria"] },
  { label: "Sunnyvale, California", aliases: ["sunnyvale", "sunnyvale california", "sunnyvale ca"] },
  { label: "Delhi, India", aliases: ["delhi", "new delhi", "india"] },
  { label: "Tokyo, Japan", aliases: ["tokyo", "japan"] },
  { label: "Kyoto, Japan", aliases: ["kyoto"] },
  { label: "Oaxaca, Mexico", aliases: ["oaxaca"] },
  { label: "Big Island, Hawaii", aliases: ["big island", "hawaii"] },
  { label: "Kauai, Hawaii", aliases: ["kauai"] },
  { label: "San Francisco, CA", aliases: ["san francisco", "sf", "frisco", "bay area"] },
  { label: "New York City", aliases: ["new york", "nyc"] },
  { label: "Paris, France", aliases: ["paris"] }
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
  const [selectedStops, setSelectedStops] = useState([]);
  const [itineraryBuilt, setItineraryBuilt] = useState(false);
  const [mobileTrayOpen, setMobileTrayOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [manualStopOrder, setManualStopOrder] = useState(false);
  const [addedStopName, setAddedStopName] = useState("");
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState(1);
  const [activityFocus, setActivityFocus] = useState(false);
  const [customActivities, setCustomActivities] = useState([]);
  const [loginSlide, setLoginSlide] = useState(0);
  const [showTapHint, setShowTapHint] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const tapTimerRef = useRef(null);
  const swipeStartXRef = useRef(null);
  const timelineRefs = useRef([]);
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
    document.title = "Travel DNA - Vibe-first travel planning";
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
    const showTimer = setTimeout(() => setShowTapHint(true), 0);
    const hideTimer = setTimeout(() => setShowTapHint(false), 3600);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [step]);

  useEffect(() => {
    const query = destination.trim();
    if (query.length < 2) {
      const clearTimer = setTimeout(() => setPlacePredictions([]), 0);
      return () => clearTimeout(clearTimer);
    }
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
    : fallbackFilteredDestinations.slice(0, 5).map((item) => ({ label: item.label, source: "fallback" }));

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
  const suggestionStops = itinerary?.stops || [];
  const activeStop = suggestionStops[Math.min(cardIndex, Math.max(suggestionStops.length - 1, 0))] || {};
  const itineraryStops = orderStopsByTime(selectedStops.length ? selectedStops : suggestionStops);
  const mapsStops = itineraryStops;
  const tripMapsUrl = mapsStops.length ? buildGoogleMapsTripUrl(mapsStops, googleTravelMode) : "";

  const stopImage = (stop, i = 0) => stop?.imageUrl || stop?.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img;

  function addStopToItinerary(stop = activeStop) {
    if (!stop?.name) return;
    setSelectedStops((items) => items.some((s) => s.name === stop.name) ? items : [...items, stop]);
    setAddedStopName(stop.name);
    setTimeout(() => {
      setAddedStopName("");
      setCardIndex((i) => Math.min(i + 1, Math.max(suggestionStops.length - 1, 0)));
    }, 520);
  }

  function discardCurrentStop() {
    setCardIndex((i) => Math.min(i + 1, Math.max(suggestionStops.length - 1, 0)));
  }

  function removeSelectedStop(index) {
    setSelectedStops((items) => items.filter((_, i) => i !== index));
  }

  function moveSelectedStop(from, to) {
    if (from == null || to == null || from === to) return;
    setManualStopOrder(true);
    setSelectedStops((items) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function beginMobileSort(index, event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragIndex(index);
  }

  function moveMobileSort(event) {
    if (dragIndex == null) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-mobile-sort-index]");
    if (!target) return;
    const nextIndex = Number(target.dataset.mobileSortIndex);
    if (!Number.isNaN(nextIndex) && nextIndex !== dragIndex) {
      moveSelectedStop(dragIndex, nextIndex);
      setDragIndex(nextIndex);
    }
  }

  function endMobileSort() {
    setDragIndex(null);
  }

  function createItineraryFromSelected() {
    if (!selectedStops.length) return;
    if (!manualStopOrder) setSelectedStops((items) => orderStopsByTime(items));
    setItineraryBuilt(true);
    setMobileTrayOpen(false);
  }

  useEffect(() => {
    if (!itineraryBuilt) return;
    const observer = new IntersectionObserver((entries) => {
      const center = window.innerHeight * 0.42;
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - center) - Math.abs(b.boundingClientRect.top - center))[0];
      if (visible?.target?.dataset?.index) setActiveTimelineIndex(Number(visible.target.dataset.index));
    }, { threshold: [0.12, 0.28, 0.5], rootMargin: "-18% 0px -58% 0px" });
    timelineRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [itineraryBuilt, itineraryStops.length]);

  const loadingPhases = useMemo(() => [
    {
      id: "profile",
      title: "Quick feeler profile",
      line: user?.name ? `${user.name}'s travel signal is ready` : "Reading your day-of travel signal",
    },
    {
      id: "vibe",
      title: "Vibe and constraints",
      line: `${selectedMoodObjects.map(m => m.title).join(", ") || "Your vibe"} · ${diet} · ${planFor}`,
    },
    {
      id: "places",
      title: "Place reviews",
      line: `Scanning real matches around ${destination || "your destination"}`,
    },
    {
      id: "photos",
      title: "Photos and ratings",
      line: "Matching each stop with visual context",
    },
    {
      id: "gemini",
      title: "AI generating itinerary",
      line: "Asking AI to think like today's version of you",
    }
  ], [destination, diet, planFor, selectedMoodObjects, user]);
  const activeLoadingPhase = Math.min(loadingLine, loadingPhases.length - 1);
  const loadingPct = Math.round((Math.min(loadingLine + 1, loadingPhases.length) / loadingPhases.length) * 100);

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
    setSelectedStops([]);
    setItineraryBuilt(false);
    setMobileTrayOpen(false);
    setManualStopOrder(false);

    const CLAMP_AT = 3;
    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, CLAMP_AT));
    }, 2400);

    const fetchPlaces = async () => {
      try {
        const res = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(destination)}`);
        const data = await res.json();
        const photos = await Promise.all(
          [destination, ...selectedMoodObjects.map(m => `${destination} ${m.title}`)].slice(0, 8).map(async (q) => {
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
      body: JSON.stringify({ user, destination, dates: prettyDate(date), date, diet, travelWith: planFor, transportMode, timeRange, recommendationCount: 12, numStops: 12, minStops: 12, maxStops: 12, requiredFoodStops: 5, selectedMoods: selectedMoodObjects, customActivity: [...customActivities, customActivity.trim()].filter(Boolean).join("; ") || null, instruction: "Create a pool of exactly 12 real, specific suggestions that the user can add to their own itinerary. The returned stops array must contain exactly 12 concrete places, no fewer and no more. Do not use placeholder or generic names like Breakfast pick, Lunch spot, Dinner pick, Scenic detour, or activity in destination. Every stop name must be the actual name of a real venue, restaurant, attraction, neighborhood, park, market, tour, or activity provider. Start the suggestions with morning-first options, then midday, afternoon, evening, and night. Include at least 5 food or drink places across breakfast, lunch, dinner, coffee, snacks, dessert, or drinks when timing and opening hours make sense. Include the remaining 7 suggestions as activities, sights, nature, culture, shopping, nightlife, or experiences that match the selected vibe. Each item should still be a stop object with name, category, time, period, description, routeFromPrevious, address when known, and open/timing guidance. For food, say whether it is best for breakfast, lunch, dinner, snack, coffee, dessert, or drinks, and respect dietary preference strictly. For each stop that is bookable (tours, tickets, activities like ziplining, theme parks, cabins, classes), include a bookingUrl field pointing to the official booking or ticketing page. For restaurants and paid venues, include priceLevel (1-4) when known. Infer longer-term travel style lightly from Google profile if available, but do not ask the user to select it. Use selectedMoods as today's short-term intent - the signal field for each vibe is the critical instruction that defines what kinds of activities to include or exclude. If customActivity is provided, treat it as a must-include experience and build at least one suggestion around it. GEOGRAPHIC SCOPE: match the scope of the destination exactly as the user typed it. If the destination is a broad region, state, or country (for example 'Tamil Nadu', 'Tuscany', 'Portugal'), spread the suggestions across the ENTIRE region. Only keep suggestions close together and walkable when the destination is a specific city or neighborhood. The server will enrich stops with Google Places photos, ratings, addresses, and map links." })
    });

    fetchPlaces();

    try {
      const res = await geminiPromise;
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "The planning service is unavailable right now.");
      const completePlan = orderStopsMorningFirst(data);
      clearInterval(interval);
      setLoadingLine(5);
      setItinerary(completePlan);
      setTimeout(() => goTo("result"), 1800);
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
    setSelectedStops([]); setItineraryBuilt(false); setMobileTrayOpen(false); setManualStopOrder(false);
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
    <div className={`app-shell${step === "login" ? " login-active" : ""}${step === "loading" ? " loading-active" : ""}${step === "result" ? " result-active" : ""}${step === "result" && itineraryBuilt ? " itinerary-final-active" : ""}`} ref={shellRef}>
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
            {[{ label: "Setup", value: "setup" }, { label: "Vibe", value: "mood" }, { label: "Result", value: "result" }].map((item, i) => {
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
              {[{ label: "Setup", value: "setup" }, { label: "Vibe", value: "mood" }, { label: "Result", value: "result" }].map((item, i) => {
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
                  setShowDestinationSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 140)}
                placeholder={showDestinationSuggestions ? "" : "City, neighborhood or even country"}
                autoComplete="off"
                className="setup-card-input"
              />
              {showDestinationSuggestions && destinationOptions.length > 0 && !destinationOptions.find(o => o.label === destination) && (
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
            <p className="label">Step 2 of 2 - Vibe</p>
            <h2>What's the <span className="gem">vibe today?</span></h2>
            <p>
              Maybe yesterday you wanted museums. Today you want beach sunsets.
              That's why we're asking. Pick up to three vibes and we'll do the magic.
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
                    <p className="action-search-panel-label">{selectedMoods.length ? "Based on your vibe" : "Popular right now"}</p>
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
          <svg className="motion-loader-svg" viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path className="motion-path-shadow" d="M78 516 C190 385 260 588 374 412 C475 258 554 356 626 238 C724 78 830 190 878 322 C922 444 1014 428 1122 218" />
            <path className="motion-path-base" d="M78 516 C190 385 260 588 374 412 C475 258 554 356 626 238 C724 78 830 190 878 322 C922 444 1014 428 1122 218" />
            <path className="motion-path-draw" d="M78 516 C190 385 260 588 374 412 C475 258 554 356 626 238 C724 78 830 190 878 322 C922 444 1014 428 1122 218" />
            {[
              [78, 516],
              [374, 412],
              [626, 238],
              [878, 322],
              [1122, 218],
            ].map(([x, y], i) => (
              <g className={"motion-node" + (i <= activeLoadingPhase ? " motion-node-on" : "")} key={String(x) + "-" + String(y)}>
                <circle cx={x} cy={y} r="7" />
                <circle cx={x} cy={y} r="17" />
              </g>
            ))}
            <g className="motion-svg-pointer">
              <animateMotion
                dur="12s"
                repeatCount="1"
                fill="freeze"
                rotate="auto"
                calcMode="linear"
                keyPoints="0;0;.26;.26;.48;.48;.68;.68;.86;.86;1"
                keyTimes="0;.10;.20;.28;.40;.48;.60;.68;.80;.88;1"
                path="M78 516 C190 385 260 588 374 412 C475 258 554 356 626 238 C724 78 830 190 878 322 C922 444 1014 428 1122 218"
              />
              <path d="M18 0l-30 12 6-12-6-12L18 0z" />
            </g>
          </svg>

          <div className="motion-loader-title">
            <p>{destination || "Your trip"}</p>
            <h2>Building your itinerary</h2>
          </div>

          <div className="motion-callouts">
            {loadingPhases.map((phase, i) => (
              <section key={phase.id} className={"motion-callout motion-callout-" + i + (i === activeLoadingPhase ? " motion-callout-active" : "") + (i < activeLoadingPhase ? " motion-callout-done" : "")}>
                <div className="motion-visual">
                  {phase.id === "profile" && (
                    <div className="motion-profile">
                      <div className="motion-profile-ring" />
                      {user?.picture
                        ? <img src={user.picture} alt="" />
                        : <svg viewBox="0 0 42 42" width="42" height="42" fill="none"><circle cx="21" cy="16" r="8" fill="currentColor" opacity=".35" /><path d="M7 37c0-8 6.2-13 14-13s14 5 14 13" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity=".35" /></svg>}
                    </div>
                  )}
                  {phase.id === "vibe" && (
                    <div className="motion-vibes">
                      {selectedMoodObjects.slice(0, 3).map((mood) => <span key={mood.id}>{mood.title}</span>)}
                    </div>
                  )}
                  {phase.id === "places" && (
                    <div className="motion-reviews">
                      {[4.8, 4.6, 4.5].map((rating, idx) => <span key={idx}>★ {rating}</span>)}
                    </div>
                  )}
                  {phase.id === "photos" && (
                    <div className="motion-photo-stack">
                      {selectedMoodObjects.slice(0, 3).map((mood, idx) => <img key={mood.id} src={mood.img} alt="" style={{ "--i": idx }} />)}
                    </div>
                  )}
                  {phase.id === "gemini" && (
                    <div className="motion-gemini">
                      <span>✦</span>
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                </div>
                <div>
                  <p>{phase.title}{i < activeLoadingPhase ? " - done" : ""}</p>
                  <span>{phase.line}</span>
                </div>
              </section>
            ))}
          </div>

          <div className="motion-loader-bottom">
            <div className="loader-bar-track">
              <div className="loader-bar-fill" style={{ width: String(loadingPct) + "%" }} />
            </div>
            <p className="loader-pct">{loadingPct}%</p>
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
        <main className={`rec-screen builder-screen on${itineraryBuilt ? " itinerary-built" : ""}`}>
          <div className="builder-layout">
            <section className="builder-photo-pane">
              <img key={cardIndex} className="builder-photo-img" src={stopImage(activeStop, cardIndex)} alt="" />
              <div className="builder-photo-ov" />
              <div className="builder-photo-meta">
                <p>{itinerary?.dates || prettyDate(date)}</p>
                <h2>{itinerary?.destination || destination}</h2>
              </div>

              <button className="mobile-selected-pill" type="button" onClick={() => setMobileTrayOpen(true)}>
                <span>{selectedStops.length}</span>
                Selected
              </button>

              <div className="selected-tray">
                <div className="selected-tray-row">
                  {selectedStops.map((stop, i) => (
                    <article
                      key={`${stop.name}-${i}`}
                      className="selected-mini-card"
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { moveSelectedStop(dragIndex, i); setDragIndex(null); }}
                    >
                      <img src={stopImage(stop, i)} alt="" />
                      <button type="button" onClick={() => removeSelectedStop(i)} aria-label="Remove from itinerary">×</button>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <p>{stop.name}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="builder-panel">
              {!itineraryBuilt ? (
                <>
                  <header className="builder-panel-head">
                    <p className="rec-head-eyebrow">Suggestions · {String(cardIndex + 1).padStart(2, "0")} / {String(suggestionStops.length || 1).padStart(2, "0")}</p>
                    <h2 className="rec-head-dest">Choose your stops</h2>
                  </header>

                  <article
                    className={`suggestion-card${addedStopName === activeStop.name ? " suggestion-card-added" : ""}`}
                    onTouchStart={(e) => { swipeStartXRef.current = e.touches[0].clientX; }}
                    onTouchEnd={(e) => {
                      const dx = e.changedTouches[0].clientX - (swipeStartXRef.current ?? e.changedTouches[0].clientX);
                      if (dx > 64) addStopToItinerary(activeStop);
                      if (dx < -64) setCardIndex((i) => Math.min(i + 1, Math.max(suggestionStops.length - 1, 0)));
                      swipeStartXRef.current = null;
                    }}
                  >
                    <button className={`rec-heart suggestion-save${addedStopName === activeStop.name ? " suggestion-save-done" : ""}`} onClick={() => addStopToItinerary(activeStop)} aria-label="Add to plan">
                      {addedStopName === activeStop.name ? (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                      ) : (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                      )}
                    </button>

                    <div className="rec-card-inner suggestion-inner">
                      <p className="rec-card-cat">{activeStop.category || "Suggestion"}</p>
                      <div className="rec-card-timerow">
                        {activeStop.rating && <span className="rec-card-pill rec-pill-rating">★ {activeStop.rating}</span>}
                        {activeStop.openNow !== undefined && <span className="rec-card-pill">{activeStop.openNow ? "Open" : "Check hours"}</span>}
                        {activeStop.time && <span className="rec-card-pill">{activeStop.time}</span>}
                      </div>
                      <h3 className="rec-card-name">{activeStop.name || "More suggestions are loading"}</h3>
                      {activeStop.routeFromPrevious && <small className="rec-card-route rec-card-route-top">{activeStop.routeFromPrevious}</small>}
                      {activeStop.address && (
                        <a className="rec-card-addr" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeStop.address)}`} target="_blank" rel="noreferrer">
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5S12.5 9.375 12.5 6c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                          {activeStop.address}
                        </a>
                      )}
                      <p className="rec-card-desc">{activeStop.description}</p>
                      {activeStop.bookingUrl && (
                        <a className="rec-card-book" href={activeStop.bookingUrl} target="_blank" rel="noreferrer">
                          Check availability and book
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                      )}
                    </div>

                    <div className="suggestion-actions">
                      <button type="button" onClick={() => addStopToItinerary(activeStop)}>Add to plan</button>
                      <button type="button" onClick={() => setCardIndex((i) => Math.min(i + 1, Math.max(suggestionStops.length - 1, 0)))}>Skip</button>
                    </div>
                  </article>
                  {selectedStops.length > 0 && (
                    <button type="button" className="builder-create-plan" onClick={createItineraryFromSelected}>Create plan</button>
                  )}
                </>
              ) : (
                <section className="builder-timeline">
                  <header className="builder-panel-head">
                    <p className="rec-head-eyebrow">{selectedStops.length} stops · {itinerary?.dates || prettyDate(date)}</p>
                    <h2 className="rec-head-dest">Your itinerary</h2>
                    <div className="builder-final-actions">
                      {tripMapsUrl && <a className="rec-card-book builder-maps-link" href={tripMapsUrl} target="_blank" rel="noreferrer">Google Maps</a>}
                      <div className="builder-icon-stack">
                        <button className={`builder-icon-btn${calendarState === "done" ? " icon-btn-active" : ""}`} type="button" onClick={addToCalendar} aria-label="Add to calendar" data-label={calendarState === "done" ? "Added" : "Add to calendar"}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button className="builder-icon-btn" type="button" onClick={shareItinerary} aria-label="Share" data-label={shareCopied ? "Copied" : "Share"}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 12l8-5M8 12l8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                        </button>
                        <button className="builder-icon-btn" type="button" onClick={() => goTo("mood")} aria-label="Edit vibe" data-label="Edit vibe">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M13 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button className="builder-icon-btn" type="button" onClick={generatePlan} aria-label="Regenerate" data-label="Regenerate">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6v5h-5M4 18v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 10a7 7 0 0 0-12-3M5.5 14a7 7 0 0 0 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </header>
                  <div className="timeline compact-timeline">
                    {itineraryStops.map((stop, i) => (
                      <article className={`stop${i === activeTimelineIndex ? " stop-active" : ""}`} key={`${stop.name}-${i}`} ref={(node) => { timelineRefs.current[i] = node; }} data-index={i}>
                        <div className="s-pin"><span className="s-pin-index">{String(i + 1).padStart(2, "0")}</span></div>
                        <div className="s-body">
                          <p className="s-cat">{stop.category}</p>
                          <h3>{stop.time || "Flexible"} <span>{stop.period}</span></h3>
                          <h4>{stop.name}</h4>
                          <div className="place-meta prominent">
                            {stop.rating && <a className="rating-pill" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.googlePlaceName || stop.name)}`} target="_blank" rel="noreferrer">★ {stop.rating}</a>}
                            {stop.openNow !== undefined && <span>{stop.openNow ? "Open now" : "Hours vary"}</span>}
                            {stop.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`} target="_blank" rel="noreferrer">{stop.address}</a>}
                          </div>
                          <p>{stop.description}</p>
                          <small>{stop.routeFromPrevious}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </section>
          </div>

        </main>
      )}

      {mobileTrayOpen && step === "result" && (
        <div className="mobile-tray-sheet" onClick={() => setMobileTrayOpen(false)}>
          <div className="mobile-tray-inner" onClick={(e) => e.stopPropagation()}>
            <div className="rec-more-grab" />
            <div className="mobile-tray-title"><strong>Selected stops</strong><span>Sort and remove</span></div>
            {selectedStops.map((stop, i) => (
              <article
                className={`mobile-sort-row${dragIndex === i ? " mobile-sort-row-dragging" : ""}`}
                key={`${stop.name}-${i}`}
                data-mobile-sort-index={i}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { moveSelectedStop(dragIndex, i); setDragIndex(null); }}
              >
                <button
                  className="sort-icon"
                  type="button"
                  aria-label="Drag to reorder"
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => setDragIndex(null)}
                  onPointerDown={(event) => beginMobileSort(i, event)}
                  onPointerMove={moveMobileSort}
                  onPointerUp={endMobileSort}
                  onPointerCancel={endMobileSort}
                >
                  ☰
                </button>
                <img src={stopImage(stop, i)} alt="" />
                <p>{stop.name}</p>
                <button type="button" onClick={() => removeSelectedStop(i)}>×</button>
              </article>
            ))}
            <button className="rec-mbar-btn rec-mbar-primary" disabled={!selectedStops.length} onClick={createItineraryFromSelected}>Create plan</button>
          </div>
        </div>
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

const css =
  "\n" +
  "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');\n" +
  "\n" +
  "html, body, #root {\n" +
  "  width: 100%; min-height: 100%;\n" +
  "  max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important;\n" +
  "}\n" +
  "*, *::before, *::after { box-sizing: border-box; }\n" +
  "\n" +
  ":root {\n" +
  "  --bg: #F5F4F0;\n" +
  "  --surface: #EDECEA;\n" +
  "  --surface-2: #E4E2DE;\n" +
  "  --surface-3: #D8D6D2;\n" +
  "  --panel: #EDECEA;\n" +
  "  --panel-2: #E4E2DE;\n" +
  "  --panel-3: #FFFFFF;\n" +
  "  --line: rgba(0,0,0,.08);\n" +
  "  --line-strong: rgba(0,0,0,.14);\n" +
  "  --ink: #080808;\n" +
  "  --ink-2: #3A3A38;\n" +
  "  --ink-3: #8A897F;\n" +
  "  --accent: #339989;\n" +
  "  --gold: #339989;\n" +
  "  --gold-bright: #339989;\n" +
  "  --gold-line: rgba(51,153,137,.35);\n" +
  "  --ease: cubic-bezier(.2,.8,.2,1);\n" +
  "}\n" +
  "\n" +
  "body {\n" +
  "  font-family: 'DM Sans', system-ui, sans-serif;\n" +
  "  background: var(--bg); color: var(--ink);\n" +
  "  overflow-x: hidden; -webkit-font-smoothing: antialiased;\n" +
  "}\n" +
  "button, input { font: inherit; }\n" +
  "button { cursor: pointer; }\n" +
  "\n" +
  ".app-shell {\n" +
  "  min-height: 100vh; display: flex; flex-direction: column; align-items: center;\n" +
  "  padding: 0 0 80px; background: var(--bg); overflow-x: hidden;\n" +
  "}\n" +
  ".stars, .aurora { display: none !important; }\n" +
  "\n" +
  "/* ── NAVBAR ── */\n" +
  ".navbar {\n" +
  "  position: sticky; top: 0; z-index: 999;\n" +
  "  width: 100%; height: 68px;\n" +
  "  padding: 0 clamp(24px, 4vw, 56px);\n" +
  "  display: flex; align-items: center; justify-content: space-between;\n" +
  "  background: var(--bg);\n" +
  "}\n" +
  ".login-active .navbar { display: none; }\n" +
  ".loading-active .navbar { display: none; }\n" +
  ".login-active { overflow: hidden; height: 100vh; }\n" +
  ".navbar::before { display: none; }\n" +
  ".nav-steps, .nav-actions, .error-actions { display: flex; align-items: center; gap: 6px; }\n" +
  "\n" +
  ".nav-desktop { display: flex; align-items: center; gap: 6px; }\n" +
  ".nav-left-group { display: flex; align-items: center; gap: 12px; }\n" +
  ".nav-mark { display: block; flex-shrink: 0; }\n" +
  ".nav-steps { display: flex; align-items: center; gap: 4px; }\n" +
  ".nav-steps i { display: none; }\n" +
  ".nav-steps button {\n" +
  "  display: inline-flex; align-items: center;\n" +
  "  padding: 6px 14px; border: none;\n" +
  "  border-radius: 999px; background: transparent;\n" +
  "  font-size: 13px; font-weight: 500; color: var(--ink-3);\n" +
  "  letter-spacing: -.01em; transition: background .15s, color .15s;\n" +
  "}\n" +
  ".nav-steps button::before { display: none; }\n" +
  ".nav-steps button:hover:not(:disabled) { background: rgba(0,0,0,.06); color: var(--ink-2); }\n" +
  ".nav-steps button.active { background: rgba(0,0,0,.09); color: var(--ink); font-weight: 700; }\n" +
  ".nav-steps button.done { color: var(--ink-2); }\n" +
  ".nav-steps button:disabled { opacity: .3; cursor: not-allowed; }\n" +
  "\n" +
  ".nav-mobile { display: none; width: 100%; align-items: center; justify-content: space-between; }\n" +
  ".nav-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; font-weight: 400; color: var(--ink); letter-spacing: -.02em; }\n" +
  "\n" +
  ".hamburger {\n" +
  "  display: flex; flex-direction: column; justify-content: center; align-items: center;\n" +
  "  gap: 5px; width: 40px; height: 40px;\n" +
  "  background: transparent; border: none; border-radius: 0;\n" +
  "  padding: 0; cursor: pointer; transition: opacity .15s;\n" +
  "}\n" +
  ".hamburger:hover { background: transparent; opacity: .7; }\n" +
  ".hamburger span {\n" +
  "  display: block; width: 18px; height: 1.5px;\n" +
  "  background: var(--ink); border-radius: 2px;\n" +
  "  transition: transform .25s var(--ease), opacity .2s;\n" +
  "  transform-origin: center;\n" +
  "}\n" +
  ".hamburger-open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }\n" +
  ".hamburger-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }\n" +
  ".hamburger-open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }\n" +
  "\n" +
  ".mobile-drawer {\n" +
  "  position: fixed; inset: 0; z-index: 998;\n" +
  "  background: rgba(0,0,0,.45); backdrop-filter: blur(4px);\n" +
  "  animation: drawerBgIn .2s ease both;\n" +
  "}\n" +
  "@keyframes drawerBgIn { from { opacity: 0; } to { opacity: 1; } }\n" +
  ".mobile-drawer-inner {\n" +
  "  position: absolute; top: 0; left: 0; bottom: 0;\n" +
  "  width: min(280px, 80vw);\n" +
  "  background: var(--bg); border-right: 1px solid var(--line-strong);\n" +
  "  display: flex; flex-direction: column;\n" +
  "  animation: sidebarSlideIn .28s var(--ease) both;\n" +
  "  overflow-y: auto;\n" +
  "}\n" +
  "@keyframes sidebarSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }\n" +
  ".drawer-header {\n" +
  "  display: flex; align-items: center; gap: 10px;\n" +
  "  padding: 18px 20px 16px;\n" +
  "  border-bottom: 1px solid var(--line);\n" +
  "}\n" +
  ".drawer-title {\n" +
  "  font-family: 'DM Serif Display', Georgia, serif;\n" +
  "  font-size: 17px; font-weight: 400; color: var(--ink);\n" +
  "  letter-spacing: -.02em; flex: 1;\n" +
  "}\n" +
  ".drawer-close {\n" +
  "  width: 32px; height: 32px; border-radius: 8px;\n" +
  "  border: 1px solid var(--line-strong); background: var(--surface-2);\n" +
  "  color: var(--ink); font-size: 18px; display: flex; align-items: center; justify-content: center;\n" +
  "  cursor: pointer; flex-shrink: 0;\n" +
  "}\n" +
  ".mobile-drawer-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); padding: 20px 20px 8px; margin: 0; }\n" +
  ".drawer-item {\n" +
  "  display: flex; align-items: center; gap: 12px;\n" +
  "  width: 100%; padding: 14px 20px;\n" +
  "  background: transparent; border: none;\n" +
  "  font-size: 15px; font-weight: 600; color: var(--ink-2);\n" +
  "  text-align: left; transition: background .15s, color .15s; cursor: pointer;\n" +
  "}\n" +
  ".drawer-item:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }\n" +
  ".drawer-item-active { color: var(--accent) !important; background: rgba(51,153,137,.07) !important; }\n" +
  ".drawer-item-done { color: var(--ink); }\n" +
  ".drawer-item-disabled { opacity: .35; cursor: not-allowed; }\n" +
  ".drawer-dot {\n" +
  "  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;\n" +
  "  background: var(--surface-3); border: 1.5px solid var(--line-strong);\n" +
  "}\n" +
  ".drawer-item-active .drawer-dot { background: var(--accent); border-color: var(--accent); }\n" +
  ".drawer-item-done .drawer-dot { background: var(--ink); border-color: var(--ink); }\n" +
  ".drawer-check { margin-left: auto; font-size: 11px; font-weight: 800; color: var(--accent); }\n" +
  ".drawer-footer { margin-top: auto; padding: 20px; border-top: 1px solid var(--line); }\n" +
  ".drawer-subscribe { width: 100%; justify-content: center; min-height: 48px !important; font-size: 14px !important; }\n" +
  "\n" +
  "/* ── BUTTONS ── */\n" +
  ".btn-outline, .btn-accent { border-radius: 14px; font-weight: 700; font-size: 14px; transition: opacity .15s, background .15s; }\n" +
  ".btn-outline {\n" +
  "  display: inline-flex; align-items: center; justify-content: center; gap: 7px;\n" +
  "  min-height: 52px; padding: 0 24px;\n" +
  "  background: transparent; border: 1.5px solid var(--line-strong); color: var(--ink); text-decoration: none;\n" +
  "}\n" +
  ".btn-outline:hover { background: var(--ink); color: #fff; border-color: var(--ink); }\n" +
  ".btn-accent {\n" +
  "  display: inline-flex; align-items: center; justify-content: center; gap: 8px;\n" +
  "  min-height: 52px; padding: 0 26px;\n" +
  "  background: var(--ink); color: #fff; border: none; font-weight: 700;\n" +
  "}\n" +
  ".btn-accent:hover { opacity: .88; }\n" +
  ".btn-accent:active { transform: scale(.98); }\n" +
  ".btn-accent:disabled { opacity: .35; cursor: not-allowed; transform: none; }\n" +
  ".btn-accent, .btn-outline { text-decoration: none !important; }\n" +
  ".nav-subscribe { min-height: 44px !important; padding: 0 24px !important; font-size: 13px; background: var(--ink) !important; border: none !important; color: #fff !important; font-weight: 700 !important; border-radius: 12px !important; }\n" +
  ".nav-subscribe:hover { opacity: .85 !important; }\n" +
  "\n" +
  "/* Result screen (itinerary) — make the subscribe control outlined white over the photo backdrop */\n" +
  ".result-active .nav-subscribe { background: transparent !important; border: 1.5px solid rgba(255,255,255,.95) !important; color: #fff !important; box-shadow: 0 8px 24px rgba(0,0,0,.16); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }\n" +
  ".result-active .nav-subscribe:hover { background: rgba(255,255,255,.12) !important; border-color: #fff !important; }\n" +
  "/* Make navbar transparent only on the result screen so buttons float on the image */\n" +
  ".result-active .navbar { background: transparent !important; box-shadow: none !important; }\n" +
  "/* Make the shell background transparent on result so the fixed photo shows full-bleed */\n" +
  ".app-shell.result-active { background: transparent !important; }\n" +
  "\n" +
  "/* ── CHIPS (global) ── */\n" +
  ".chips { display: flex; flex-wrap: wrap; gap: 8px; }\n" +
  ".chip {\n" +
  "  padding: 8px 16px; border-radius: 999px;\n" +
  "  border: 1.5px solid var(--line-strong);\n" +
  "  background: transparent; font-size: 13px; font-weight: 600;\n" +
  "  color: var(--ink-3); cursor: pointer; transition: all .15s;\n" +
  "}\n" +
  ".chip:hover { border-color: var(--ink); color: var(--ink); }\n" +
  ".chip.active { border-color: var(--accent); color: var(--accent); background: rgba(51,153,137,.08); font-weight: 700; }\n" +
  "\n" +
  "/* ── SETUP ── */\n" +
  ".setup-screen { max-width: 680px; }\n" +
  ".partnership-box {\n" +
  "  max-width: 600px; background: var(--surface);\n" +
  "  border: 1px solid var(--line-strong); border-radius: 16px;\n" +
  "  padding: 14px 18px; margin-bottom: 4px;\n" +
  "}\n" +
  ".partnership-box-inner {\n" +
  "  display: flex; align-items: flex-start; gap: 9px;\n" +
  "  font-size: 13px; line-height: 1.6; color: var(--ink-3);\n" +
  "}\n" +
  ".partnership-box-inner strong { color: var(--ink-2); font-weight: 700; }\n" +
  ".setup-header { margin-bottom: 32px; }\n" +
  ".setup-stack { display: flex; flex-direction: column; gap: 28px; max-width: 600px; }\n" +
  ".custom-activity-wrap { margin-top: 48px; width: 100%; max-width: none; }\n" +
  ".custom-activity-card { max-width: 100%; }\n" +
  ".setup-card {\n" +
  "  background: #fff; border-radius: 20px; padding: 20px 24px;\n" +
  "  display: flex; flex-direction: column; gap: 12px;\n" +
  "  box-shadow: 0 1px 6px rgba(0,0,0,.08); position: relative;\n" +
  "}\n" +
  ".setup-card-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }\n" +
  ".setup-card-optional { font-size: 10px; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--ink-3); opacity: .65; }\n" +
  ".setup-card-divider { height: 1px; background: var(--line); margin: 4px 0; }\n" +
  ".setup-card-input {\n" +
  "  background: transparent !important; border: none !important; box-shadow: none !important;\n" +
  "  border-radius: 0 !important; min-height: 0 !important; padding: 0 !important;\n" +
  "  font-size: 16px !important; font-weight: 600 !important; color: var(--ink) !important; width: 100%;\n" +
  "}\n" +
  ".setup-card-input:focus { outline: none !important; box-shadow: none !important; }\n" +
  ".setup-card-input::placeholder { color: var(--ink-3); font-weight: 400; }\n" +
  "input[type=\"date\"].setup-card-input { font-size: 15px !important; }\n" +
  ".setup-suggestions {\n" +
  "  position: absolute; top: calc(100% + 6px); left: 0; right: 0;\n" +
  "  background: #fff; border-radius: 16px; box-shadow: 0 8px 28px rgba(0,0,0,.13);\n" +
  "  z-index: 200; padding: 6px; display: flex; flex-direction: column; gap: 2px;\n" +
  "}\n" +
  ".setup-sug {\n" +
  "  display: block; width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px;\n" +
  "  border: none; background: transparent; font-size: 14px; font-weight: 500; color: var(--ink);\n" +
  "  cursor: pointer; transition: background .1s;\n" +
  "}\n" +
  ".setup-sug:hover, .setup-sug.active { background: var(--surface); }\n" +
  "\n" +
  "@media(max-width: 760px) {\n" +
  "  .setup-stack { max-width: 100%; }\n" +
  "  .setup-card { padding: 16px 18px; }\n" +
  "}\n" +
  "\n" +
  "/* ── SCREENS ── */\n" +
  ".screen { display: block; width: 100%; max-width: 1160px; padding: clamp(40px,6vw,82px) clamp(20px,4vw,56px); animation: scIn .3s var(--ease) both; }\n" +
  "@keyframes scIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\n" +
  "\n" +
  "/* ── TYPE ── */\n" +
  ".label, .field-label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }\n" +
  "h1, h2 { font-family: 'DM Serif Display', Georgia, serif; color: var(--ink); }\n" +
  "h1 { font-size: clamp(46px,6.2vw,82px) !important; font-weight: 400; line-height: 1.05; letter-spacing: -.02em !important; margin: 0; max-width: 840px; }\n" +
  "h2 { font-size: clamp(36px,4.5vw,60px); font-weight: 400; line-height: 1.1; letter-spacing: -.015em; margin: 10px 0 10px; }\n" +
  "p { font-size: 16px; line-height: 1.72; color: var(--ink-2); }\n" +
  ".gem, h1 span { color: var(--accent) !important; background: none !important; -webkit-text-fill-color: currentColor !important; }\n" +
  ".glass-panel { background: var(--surface); border: 1px solid var(--line-strong); box-shadow: none; }\n" +
  "\n" +
  "/* ══════════════════════════════════════════\n" +
  "   LOGIN PAGE\n" +
  "══════════════════════════════════════════ */\n" +
  ".lp-shell {\n" +
  "  width: 100%; height: 100vh;\n" +
  "  display: flex; align-items: center; justify-content: center;\n" +
  "  padding: 16px; position: relative; overflow: hidden;\n" +
  "}\n" +
  ".lp-bg-outer { position: fixed; inset: 0; z-index: 0; }\n" +
  ".lp-bg-outer-img {\n" +
  "  width: 100%; height: 100%; object-fit: cover;\n" +
  "  filter: brightness(.92) saturate(1.2); transform: scale(1.02);\n" +
  "}\n" +
  ".lp-bg-outer-dim { position: absolute; inset: 0; background: rgba(0,0,0,.05); }\n" +
  "\n" +
  ".lp-card {\n" +
  "  position: relative; z-index: 1;\n" +
  "  display: grid; grid-template-columns: 1fr 1.3fr;\n" +
  "  width: min(880px, 100%);\n" +
  "  height: min(480px, calc(100vh - 32px));\n" +
  "  border-radius: 22px; overflow: hidden;\n" +
  "  border: 5px solid #fff; box-shadow: none;\n" +
  "  animation: lpCardIn .9s var(--ease) both;\n" +
  "}\n" +
  "@keyframes lpCardIn {\n" +
  "  from { opacity: 0; transform: translateY(16px) scale(.98); }\n" +
  "  to   { opacity: 1; transform: translateY(0) scale(1); }\n" +
  "}\n" +
  "\n" +
  ".lp-card-left {\n" +
  "  background: #fff; padding: 24px 26px 20px;\n" +
  "  display: flex; flex-direction: column; gap: 12px; overflow: hidden;\n" +
  "}\n" +
  ".lp-panel-logo { display: none; }\n" +
  ".lp-right-text { display: flex; flex-direction: column; }\n" +
  ".lp-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); margin: 0 0 5px; }\n" +
  ".lp-h1 { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(26px, 3vw, 40px); font-weight: 400; line-height: .97; letter-spacing: -.03em; color: var(--ink); margin: 0 0 7px; }\n" +
  ".lp-accent { color: var(--accent) !important; }\n" +
  ".lp-sub { font-size: 12px; line-height: 1.5; color: var(--ink-3); margin: 0; }\n" +
  ".lp-actions { display: flex; flex-direction: column; gap: 6px; }\n" +
  ".lp-google-wrap { min-height: 36px; display: flex; align-items: center; position: relative; width: 100%; }\n" +
  "/* Desktop: hide fake, show real */\n" +
  ".lp-google-fake { display: none; }\n" +
  ".lp-google-real { width: 100%; }\n" +
  ".lp-ghost-btn { display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding: 0 14px; background: transparent; border: 1.5px solid var(--line-strong); border-radius: 11px; font-size: 12px; font-weight: 600; color: var(--ink); cursor: pointer; transition: all .18s; gap: 8px; }\n" +
  "/* Mobile Google button — plain styled, no iframe */\n" +
  ".lp-google-btn-mobile {\n" +
  "  display: none;\n" +
  "  width: 100%; align-items: center; justify-content: center; gap: 10px;\n" +
  "  background: #fff; color: #3c4043;\n" +
  "  border: 1px solid #d8d8d8; border-radius: 13px;\n" +
  "  padding: 13px; font-size: 14px; font-weight: 500;\n" +
  "  cursor: pointer; font-family: inherit; letter-spacing: .25px;\n" +
  "}\n" +
  ".lp-google-btn-mobile:hover { background: #f7f7f7; }\n" +
  ".lp-ghost-btn:hover { border-color: var(--ink); background: var(--surface); }\n" +
  ".lp-fine { font-size: 10px; color: var(--ink-3); line-height: 1.4; }\n" +
  "\n" +
  ".lp-card-right { position: relative; overflow: hidden; background: transparent; }\n" +
  ".lp-panel-img { display: none; }\n" +
  ".lp-panel-overlay {\n" +
  "  position: absolute; inset: 0;\n" +
  "  background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 50%);\n" +
  "}\n" +
  ".lp-panel-itin { position: absolute; bottom: 28px; left: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; }\n" +
  ".lp-itin-line {\n" +
  "  display: flex; align-items: center; gap: 18px; padding: 12px 18px;\n" +
  "  background: rgba(8,8,8,.42);\n" +
  "  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);\n" +
  "  border: 1px solid rgba(255,255,255,.13); border-radius: 14px;\n" +
  "  opacity: 0; animation: lpLineIn .5s var(--ease) forwards;\n" +
  "}\n" +
  ".lp-itin-1 { animation-delay: .8s; }\n" +
  ".lp-itin-2 { animation-delay: 1.05s; }\n" +
  ".lp-itin-3 { animation-delay: 1.3s; }\n" +
  "@keyframes lpLineIn {\n" +
  "  from { opacity: 0; transform: translateY(8px); }\n" +
  "  to   { opacity: 1; transform: translateY(0); }\n" +
  "}\n" +
  ".lp-itin-time { font-size: 12px; font-weight: 800; color: var(--accent); min-width: 40px; font-variant-numeric: tabular-nums; }\n" +
  ".lp-itin-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.92); }\n" +
  "\n" +
  "/* Tablet + Mobile: stack to single column */\n" +
  "@media(max-width: 1024px) {\n" +
  "  .lp-shell {\n" +
  "    padding: 16px;\n" +
  "    align-items: stretch;\n" +
  "  }\n" +
  "  .lp-card {\n" +
  "    grid-template-columns: 1fr;\n" +
  "    grid-template-rows: 1fr auto;\n" +
  "    width: 100%;\n" +
  "    height: 100dvh;\n" +
  "    border-width: 4px;\n" +
  "    border-radius: 32px 32px 0 0;\n" +
  "  }\n" +
  "  .lp-card-right {\n" +
  "    order: 1;\n" +
  "    min-height: 0;\n" +
  "    flex: 1;\n" +
  "  }\n" +
  "  .lp-card-left {\n" +
  "    order: 2;\n" +
  "    padding: 28px 32px max(28px, env(safe-area-inset-bottom)) 32px;\n" +
  "    gap: 16px;\n" +
  "  }\n" +
  "  .lp-google-wrap {\n" +
  "    min-height: 52px;\n" +
  "    background: transparent;\n" +
  "    border: none;\n" +
  "    overflow: visible;\n" +
  "    position: relative;\n" +
  "  }\n" +
  "  .lp-ghost-btn {\n" +
  "    min-height: 50px;\n" +
  "    border-radius: 14px;\n" +
  "  }\n" +
  "}\n" +
  "\n" +
  "/* Mobile */\n" +
  "@media(max-width: 700px) {\n" +
  "  .lp-shell { padding: 20px 16px; }\n" +
  "  .lp-card { grid-template-columns: 1fr; grid-template-rows: auto 260px; border-width: 4px; }\n" +
  "  .lp-card-left { padding: 32px 24px 28px; gap: 20px; }\n" +
  "}\n" +
  "\n" +
  "/* ── MOOD GRID ── */\n" +
  ".mood-screen { max-width: 1240px; }\n" +
  ".mood-grid.image-grid { display: grid !important; grid-template-columns: repeat(3,minmax(0,1fr)) !important; gap: 14px !important; width: 100% !important; }\n" +
  ".image-mood-tile { position: relative; overflow: hidden; border: 4px solid transparent !important; border-radius: 28px !important; padding: 0; text-align: left; background: var(--surface); height: 220px !important; min-height: 220px !important; transition: border-color .15s; box-shadow: none; }\n" +
  ".image-mood-tile:hover { border-color: var(--line-strong) !important; }\n" +
  ".image-mood-tile.active { border-color: var(--gold-bright) !important; box-shadow: 0 0 0 1px var(--gold-bright) !important; }\n" +
  ".image-mood-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.86) saturate(1.08); transition: transform .4s var(--ease); }\n" +
  ".image-mood-tile:hover img, .image-mood-tile.active img { transform: scale(1.03); }\n" +
  ".image-tile-overlay { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.48),rgba(0,0,0,.04) 68%); }\n" +
  ".tile-number { position: absolute; left: 16px; top: 16px; z-index: 2; font-size: 11px; letter-spacing: .1em; font-weight: 800; color: rgba(255,255,255,.45); }\n" +
  ".tile-check { position: absolute; right: 16px; top: 16px; z-index: 3; width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.75); background: rgba(0,0,0,.08); display: flex; align-items: center; justify-content: center; transition: background .15s, border-color .15s; }\n" +
  ".tile-check.active { border-color: var(--gold-bright); background: var(--gold-bright); }\n" +
  ".image-tile-content { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 2; }\n" +
  ".image-tile-content strong { display: block; font-size: clamp(18px,1.8vw,24px); font-weight: 900; line-height: 1; letter-spacing: -.03em; color: #fff; }\n" +
  ".image-tile-content p { margin: 6px 0 0; color: rgba(255,255,255,.6); font-size: 12px; font-weight: 600; line-height: 1.3; }\n" +
  "\n" +
  ".custom-activity-wrap { margin-top: 40px; width: 100%; max-width: none; display: grid; gap: 10px; }\n" +
  ".custom-activity-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }\n" +
  ".custom-activity-input {\n" +
  "  width: 100%; background: #fff; border: none; border-radius: 20px;\n" +
  "  min-height: 64px; padding: 0 24px; font-size: 15px; font-weight: 500;\n" +
  "  color: var(--ink); outline: none; box-shadow: 0 1px 6px rgba(0,0,0,.08);\n" +
  "  transition: box-shadow .2s; min-width: 0;\n" +
  "}\n" +
  ".custom-activity-input:focus { box-shadow: 0 2px 12px rgba(0,0,0,.12); }\n" +
  ".custom-activity-input::placeholder { color: var(--ink-3); font-weight: 400; }\n" +
  ".build-cta-row { margin: 34px 0 0; display: flex; justify-content: flex-end; }\n" +
  "\n" +
  "/* ── LOADING SCREEN ── */\n" +
  ".loading-screen {\n" +
  "  width: 100%; min-height: calc(100vh - 68px);\n" +
  "  display: flex; flex-direction: column; align-items: center; justify-content: center;\n" +
  "  gap: 20px; padding: 24px clamp(20px,4vw,56px) 32px;\n" +
  "  animation: scIn .3s var(--ease) both; overflow: hidden;\n" +
  "}\n" +
  ".loader-stage { position: relative; width: min(460px, 100%); height: 200px; flex-shrink: 0; overflow: hidden; }\n" +
  ".ls {\n" +
  "  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;\n" +
  "  opacity: 0; pointer-events: none; transition: opacity .6s var(--ease); overflow: hidden;\n" +
  "}\n" +
  ".ls.ls-active { opacity: 1; pointer-events: auto; }\n" +
  ".ls.ls-done { opacity: 0; }\n" +
  "\n" +
  ".ls-profile { display: flex; flex-direction: column; align-items: center; gap: 18px; }\n" +
  ".profile-ring-wrap { position: relative; width: 110px; height: 110px; }\n" +
  ".profile-ring-svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }\n" +
  ".ring-bg { fill: none; stroke: var(--surface-2); stroke-width: 4; }\n" +
  ".ring-fill { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 339; stroke-dashoffset: 339; animation: ringFill 2.2s var(--ease) forwards; }\n" +
  "@keyframes ringFill { to { stroke-dashoffset: 50; } }\n" +
  ".profile-pic { position: absolute; inset: 8px; border-radius: 50%; object-fit: cover; width: calc(100% - 16px); height: calc(100% - 16px); }\n" +
  ".profile-pic-fallback { position: absolute; inset: 8px; border-radius: 50%; background: var(--surface-2); display: flex; align-items: center; justify-content: center; }\n" +
  ".profile-pic-fallback span { font-size: 32px; font-weight: 800; color: var(--ink-3); }\n" +
  ".share-btn { gap: 7px; min-width: 100px; }\n" +
  ".share-btn svg { flex-shrink: 0; }\n" +
  ".share-btn-copied { border-color: var(--accent) !important; color: var(--accent) !important; }\n" +
  ".share-btn-loading { opacity: .7; cursor: wait; }\n" +
  ".cal-btn { gap: 7px; min-width: 148px; }\n" +
  ".cal-btn svg { flex-shrink: 0; }\n" +
  ".cal-btn-done  { border-color: var(--accent) !important; color: var(--accent) !important; }\n" +
  ".cal-btn-error { border-color: #c0392b !important; color: #c0392b !important; }\n" +
  ".cal-btn-loading { opacity: .7; cursor: wait; }\n" +
  "@keyframes calSpin { to { transform: rotate(360deg); } }\n" +
  ".cal-spin { animation: calSpin .8s linear infinite; }\n" +
  ".profile-meta { text-align: center; }\n" +
  ".profile-name { font-size: 16px; font-weight: 700; color: var(--ink); margin: 0; line-height: 1.3; }\n" +
  ".profile-email { font-size: 12px; color: var(--ink-3); margin: 3px 0 0; }\n" +
  "\n" +
  ".ls-moods { position: relative; width: 100%; height: 100%; overflow: hidden; }\n" +
  ".lcard { position: absolute; border-radius: 18px; overflow: hidden; border: 1px solid var(--line-strong); }\n" +
  ".lcard img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.58) saturate(.8); }\n" +
  ".lcard-ov { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.65),transparent 55%); }\n" +
  ".lcard-lbl { position: absolute; bottom: 10px; left: 12px; font-size: 12px; font-weight: 800; color: #fff; }\n" +
  ".lcard-0 { width: 138px; height: 100px; left: 10px; top: 28px; animation: lc0 3.6s ease-in-out infinite; z-index: 1; opacity: 1; }\n" +
  ".lcard-1 { width: 172px; height: 130px; left: 50%; top: 10px; animation: lc1 3.6s ease-in-out infinite; transform: translateX(-50%); z-index: 3; opacity: 1; }\n" +
  ".lcard-2 { width: 132px; height: 98px; right: 10px; top: 32px; animation: lc2 3.6s ease-in-out infinite; z-index: 1; opacity: 1; }\n" +
  "@keyframes lc0 { 0% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; z-index:3; } 15% { transform: translate(-90px,-20px) rotate(-18deg) scale(.88); opacity:1; z-index:1; } 40% { transform: translate(-90px,-20px) rotate(-18deg) scale(.88); opacity:1; z-index:1; } 70% { transform: translate(0,0) rotate(-3deg) scale(1); opacity:1; z-index:1; } 100% { transform: translate(0,0) rotate(-3deg) scale(1); opacity:1; z-index:1; } }\n" +
  "@keyframes lc1 { 0% { transform: translateX(-50%) translateY(0) scale(1.05); opacity:1; z-index:2; } 25% { transform: translateX(-50%) translateY(-12px) scale(1.08); opacity:1; z-index:4; } 60% { transform: translateX(-50%) translateY(0) scale(1); opacity:1; z-index:3; } 100% { transform: translateX(-50%) translateY(0) scale(1); opacity:1; z-index:3; } }\n" +
  "@keyframes lc2 { 0% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; z-index:3; } 20% { transform: translate(90px,-20px) rotate(18deg) scale(.88); opacity:1; z-index:1; } 50% { transform: translate(90px,-20px) rotate(18deg) scale(.88); opacity:1; z-index:1; } 80% { transform: translate(0,0) rotate(3deg) scale(1); opacity:1; z-index:1; } 100% { transform: translate(0,0) rotate(3deg) scale(1); opacity:1; z-index:1; } }\n" +
  ".lspills { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; flex-wrap: nowrap; }\n" +
  ".lspill { padding: 6px 13px; border-radius: 999px; background: var(--bg); border: 1px solid var(--line-strong); font-size: 11px; font-weight: 700; color: var(--ink-2); white-space: nowrap; opacity: 0; transform: translateY(10px); animation: spillIn 2.2s var(--ease) forwards; }\n" +
  ".lspill-0 { animation-delay: .4s; }\n" +
  ".lspill-1 { animation-delay: .65s; background: var(--ink); color: var(--bg); border-color: var(--ink); }\n" +
  ".lspill-2 { animation-delay: .9s; background: var(--ink); color: var(--bg); border-color: var(--ink); }\n" +
  ".lspill-3 { animation-delay: 1.1s; }\n" +
  ".lspill-4 { animation-delay: 1.3s; }\n" +
  "@keyframes spillIn { 0% { opacity:0; transform:translateY(10px); } 60%,100% { opacity:1; transform:translateY(0); } }\n" +
  "\n" +
  ".ls-map { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }\n" +
  ".map-dest-label { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; }\n" +
  ".map-sketch { width: 100%; border-radius: 14px; background: var(--surface); border: 1px solid var(--line-strong); padding: 8px; overflow: hidden; }\n" +
  ".map-svg { width: 100%; height: 155px; }\n" +
  ".map-line { stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 300; stroke-dashoffset: 300; animation: drawLine 0.7s var(--ease) forwards; opacity: 0.7; }\n" +
  ".ml1 { animation-delay: 0.3s; } .ml2 { animation-delay: 1.1s; } .ml3 { animation-delay: 1.9s; }\n" +
  "@keyframes drawLine { to { stroke-dashoffset: 0; } }\n" +
  ".map-dot { fill: var(--accent); opacity: 0; animation: dotPop .35s var(--ease) forwards; }\n" +
  ".md1 { animation-delay: 0.1s; } .md2 { animation-delay: 0.9s; } .md3 { animation-delay: 1.7s; } .md4 { animation-delay: 2.5s; }\n" +
  "@keyframes dotPop { 0% { opacity:0; transform:scale(0); } 70% { opacity:1; transform:scale(1.3); } 100% { opacity:1; transform:scale(1); } }\n" +
  ".map-traveller { animation: travelPulse 1s ease-in-out infinite, travelRoute 3.2s var(--ease) forwards; }\n" +
  ".map-traveller-dot { animation: travelRoute 3.2s var(--ease) forwards; }\n" +
  "@keyframes travelPulse { 0%,100% { r: 9; opacity: .6; } 50% { r: 13; opacity: .2; } }\n" +
  "@keyframes travelRoute { 0% { cx: 80; cy: 118; } 28% { cx: 185; cy: 62; } 56% { cx: 275; cy: 85; } 84%,100% { cx: 345; cy: 42; } }\n" +
  "\n" +
  ".ls-places-chips { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; padding: 0 8px; }\n" +
  ".places-chips-label { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; margin: 0; }\n" +
  ".places-chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }\n" +
  ".place-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line-strong); opacity: 0; transform: translateY(10px); animation: chipFadeIn .4s var(--ease) forwards; }\n" +
  ".pc-anim-0 { animation-delay: .1s; } .pc-anim-1 { animation-delay: .3s; } .pc-anim-2 { animation-delay: .5s; } .pc-anim-3 { animation-delay: .7s; } .pc-anim-4 { animation-delay: .9s; }\n" +
  "@keyframes chipFadeIn { to { opacity: 1; transform: translateY(0); } }\n" +
  ".place-chip-name { font-size: 13px; font-weight: 600; color: var(--ink); }\n" +
  ".place-chip-rating { font-size: 11px; font-weight: 800; color: var(--accent); }\n" +
  "\n" +
  ".places-carousel { position: relative; width: min(340px, 100%); height: 220px; overflow: hidden; border-radius: 18px; }\n" +
  ".pc-slide { position: absolute; inset: 0; border-radius: 18px; overflow: hidden; border: 1px solid var(--line-strong); opacity: 0; transition: opacity .5s var(--ease); }\n" +
  ".pc-slide.pc-active { opacity: 1; z-index: 2; } .pc-slide.pc-prev { opacity: 0; z-index: 1; }\n" +
  ".pc-slide img { width:100%; height:100%; object-fit:cover; filter:brightness(.6) saturate(.8); }\n" +
  ".pc-ov { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.7),transparent 50%); }\n" +
  ".pc-meta { position: absolute; bottom: 14px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; }\n" +
  ".pc-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -.02em; line-height: 1.1; }\n" +
  ".pc-chips { display: flex; gap: 6px; flex-wrap: wrap; }\n" +
  ".pc-rating-chip { padding: 4px 10px; border-radius: 999px; background: var(--accent); color: var(--ink); font-size: 11px; font-weight: 800; white-space: nowrap; }\n" +
  ".pc-type-chip { padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.2); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; }\n" +
  ".pc-dots { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; }\n" +
  ".pc-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--surface-3); transition: background .3s; }\n" +
  ".pc-dot.pc-dot-active { background: var(--ink); }\n" +
  "\n" +
  ".wire-frame { width: min(400px,100%); border-radius: 12px; border: 1px solid var(--line-strong); background: var(--surface); padding: 9px; display: flex; flex-direction: column; gap: 5px; }\n" +
  ".wire-meta { display: flex; flex-direction: column; gap: 5px; }\n" +
  ".wire-tag { height: 9px; width: 55px; border-radius: 999px; }\n" +
  ".wire-title { height: 16px; width: 68%; border-radius: 6px; }\n" +
  ".wire-stops { display: flex; flex-direction: column; gap: 5px; }\n" +
  ".wire-stop { display: flex; align-items: center; gap: 7px; }\n" +
  ".wire-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }\n" +
  ".wire-lines { flex: 1; display: flex; flex-direction: column; gap: 3px; }\n" +
  ".wire-line { height: 6px; border-radius: 3px; }\n" +
  ".wl-a { width: 78%; } .wl-b { width: 52%; }\n" +
  ".wire-img { width: 36px; height: 28px; border-radius: 6px; flex-shrink: 0; }\n" +
  ".wire-tag, .wire-title, .wire-line, .wire-img {\n" +
  "  background-image: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);\n" +
  "  background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite;\n" +
  "}\n" +
  "@keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }\n" +
  ".wire-gemini-badge { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: rgba(51,153,137,.08); border: 1px solid rgba(51,153,137,.2); font-size: 12px; font-weight: 600; color: var(--accent); }\n" +
  ".gorb-core-sm { font-size: 12px; animation: coreGlow 2s ease-in-out infinite; }\n" +
  "@keyframes coreGlow { 0%,100%{opacity:.5;} 50%{opacity:1;} }\n" +
  "\n" +
  ".loader-bottom { display: flex; flex-direction: column; align-items: center; gap: 16px; width: min(460px, 100%); text-align: center; }\n" +
  ".loader-head { display: flex; flex-direction: column; align-items: center; gap: 6px; width: min(460px,100%); text-align: center; }\n" +
  ".loader-headline { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(26px,3vw,36px) !important; font-weight: 400 !important; letter-spacing: -.02em !important; line-height: 1.05 !important; margin: 0 !important; color: var(--ink) !important; }\n" +
  ".loader-sub { font-size: 12px; font-weight: 500; color: var(--ink-3); margin: 0; line-height: 1.4; }\n" +
  ".loader-list { display: flex; flex-direction: column; width: 100%; }\n" +
  ".loader-item { display: flex; align-items: center; gap: 14px; padding: 9px 0; border-bottom: 1px solid var(--line); opacity: .3; transition: opacity .35s var(--ease); }\n" +
  ".loader-item:last-child { border-bottom: none; }\n" +
  ".loader-item.li-done { opacity: 1; }\n" +
  ".loader-item.li-active { opacity: 1; }\n" +
  ".li-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--surface-3); border: 1px solid var(--line-strong); transition: background .3s, border-color .3s; }\n" +
  ".li-done .li-dot { background: var(--accent); border-color: var(--accent); }\n" +
  ".li-active .li-dot { background: var(--accent); border-color: var(--accent); animation: lpulse 1s ease-in-out infinite; }\n" +
  ".li-text { font-size: 14px; font-weight: 600; color: var(--ink-3); flex: 1; text-align: left; transition: color .3s; }\n" +
  ".li-done .li-text { color: var(--ink-2); }\n" +
  ".li-active .li-text { color: var(--ink); font-weight: 700; }\n" +
  ".li-badge { font-size: 10px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .07em; flex-shrink: 0; }\n" +
  ".loader-bar-track { width: 100%; height: 2px; background: var(--surface-2); border-radius: 1px; overflow: hidden; }\n" +
  ".loader-bar-fill { height: 2px; background: var(--ink); border-radius: 1px; transition: width .6s var(--ease); }\n" +
  ".loader-pct { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; margin: 0; }\n" +
  "\n" +
  "/* ── ERROR ── */\n" +
  ".api-error-card { width: min(620px,100%); background: var(--surface); border: 1px solid var(--line-strong); border-radius: 20px; padding: 34px; text-align: left; }\n" +
  "\n" +
  "/* ══════════════════════════════════════════\n" +
  "   RESULT SCREEN\n" +
  "══════════════════════════════════════════ */\n" +
  ".result-screen { max-width: 1280px !important; width: 100% !important; padding: 48px clamp(28px,6vw,80px) 80px !important; margin: 0 auto; }\n" +
  ".res-hero { width: 100%; min-height: 480px; border-radius: 28px; overflow: hidden; position: relative; background: #0a120e; display: flex; align-items: flex-end; }\n" +
  ".res-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; filter: brightness(.75) saturate(1.15); animation: heroBgZoom 18s ease-in-out infinite alternate; will-change: transform; }\n" +
  "@keyframes heroBgZoom { from { transform: scale(1); } to { transform: scale(1.06); } }\n" +
  ".res-glass-panel { position: relative; z-index: 2; width: 100%; padding: clamp(28px,4vw,52px); background: rgba(8, 8, 8, 0.38); backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); border-top: 1px solid rgba(255,255,255,0.10); animation: glassPanelIn .9s cubic-bezier(.2,.8,.2,1) .15s both; }\n" +
  "@keyframes glassPanelIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }\n" +
  ".res-glass-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; }\n" +
  ".archetype-line { font-size: 14px !important; font-weight: 600 !important; color: #5EC4B5 !important; line-height: 1.5 !important; margin: 0 !important; max-width: 520px; opacity: 0; animation: textSlideUp .6s cubic-bezier(.2,.8,.2,1) .35s forwards; }\n" +
  ".res-date-tag { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); white-space: nowrap; letter-spacing: .03em; padding-top: 2px; flex-shrink: 0; opacity: 0; animation: textFadeIn .5s ease .5s forwards; }\n" +
  ".res-dest { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(36px, 5.5vw, 72px); font-weight: 400; line-height: 1.0; letter-spacing: -0.03em; color: #ffffff; margin: 0 0 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-shadow: 0 2px 12px rgba(0,0,0,0.28); opacity: 0; animation: textSlideUp .7s cubic-bezier(.2,.8,.2,1) .55s forwards; }\n" +
  ".res-summary { font-size: 15px !important; line-height: 1.65 !important; color: rgba(255,255,255,0.78) !important; max-width: 680px; margin: 0 !important; opacity: 0; animation: textSlideUp .6s cubic-bezier(.2,.8,.2,1) .75s forwards; }\n" +
  "@keyframes textSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }\n" +
  "@keyframes textFadeIn { from { opacity: 0; } to { opacity: 1; } }\n" +
  "\n" +
  ".action-bar { display: flex; flex-direction: column; gap: 12px; margin: 24px 0 52px; }\n" +
  ".action-icons-row { display: flex; align-items: center; gap: 10px; }\n" +
  ".icon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 72px; min-height: 72px; background: transparent; border: 1.5px solid var(--line-strong); border-radius: 20px; cursor: pointer; color: var(--ink-2); font-size: 11px; font-weight: 700; letter-spacing: .02em; transition: background .15s, border-color .15s, color .15s; }\n" +
  ".icon-btn:hover { background: var(--surface-2); border-color: var(--ink); color: var(--ink); }\n" +
  ".icon-btn:disabled { opacity: .5; cursor: not-allowed; }\n" +
  ".icon-btn svg { flex-shrink: 0; }\n" +
  ".icon-btn-active { border-color: var(--accent) !important; color: var(--accent) !important; }\n" +
  ".icon-btn-loading { opacity: .7; cursor: wait; }\n" +
  ".cal-icon-btn-done  { border-color: var(--accent) !important; color: var(--accent) !important; }\n" +
  ".cal-icon-btn-error { border-color: #c0392b !important; color: #c0392b !important; }\n" +
  ".action-primary-cta { width: fit-content; padding: 0 28px; gap: 8px; }\n" +
  "\n" +
  ".timeline { max-width: 100% !important; margin: 0 auto; padding: 48px 0 32px !important; }\n" +
  ".timeline > .label { margin-bottom: 40px; }\n" +
  ".stop { display: flex; position: relative; margin-bottom: 44px; }\n" +
  ".stop:not(:last-child)::after { content: \"\"; position: absolute; left: 4px; top: 22px; bottom: -44px; width: 1px; background: var(--line-strong); }\n" +
  ".s-pin { width: 10px; height: 10px; border-radius: 50%; background: var(--surface-3); border: 2px solid var(--line-strong); flex-shrink: 0; margin-right: 28px; margin-top: 10px; position: sticky; top: 80px; align-self: flex-start; transition: background .3s, border-color .3s; }\n" +
  ".s-pin-featured { background: var(--accent) !important; border-color: var(--accent) !important; }\n" +
  ".stop:hover .s-pin, .stop:focus-within .s-pin { background: var(--accent); border-color: var(--accent); }\n" +
  ".s-pin-index { display: none; }\n" +
  ".s-body { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0,1fr) minmax(300px,440px); column-gap: 40px; align-items: start; }\n" +
  ".s-body > .s-cat, .s-body > h3, .s-body > h4, .s-body > p, .s-body > small, .s-body > .place-meta { grid-column: 1; }\n" +
  ".s-body > .s-photo { grid-column: 2; grid-row: 1 / span 7; }\n" +
  ".s-cat { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 5px; }\n" +
  ".s-body h3 { font-size: 13px; font-weight: 500; letter-spacing: .04em; color: var(--ink-3); margin: 0 0 6px; text-transform: uppercase; }\n" +
  ".s-body h3 span { font-size: 12px; font-weight: 600; color: var(--ink-3); margin-left: 4px; }\n" +
  ".s-body h4 { font-size: 22px; font-weight: 800; color: var(--ink); margin: 0 0 10px; letter-spacing: -.03em; }\n" +
  ".s-body p { font-size: 14px; line-height: 1.68; color: var(--ink-2); margin-bottom: 14px; }\n" +
  ".s-body small { display: block; color: var(--ink-3); font-size: 12px; line-height: 1.5; }\n" +
  ".s-photo { border-radius: 16px; height: 220px; position: relative; overflow: hidden; margin-bottom: 8px; display: flex; align-items: end; padding: 14px; background: var(--surface-2); border: 1px solid var(--line-strong); }\n" +
  ".s-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .4s var(--ease); }\n" +
  ".s-photo:hover img { transform: scale(1.025); }\n" +
  ".s-photo-ov { position: absolute; inset: 0; background: linear-gradient(to top,rgba(10,10,10,.72),transparent 56%); }\n" +
  ".s-photo span { position: relative; z-index: 1; font-size: 11px; font-weight: 800; color: rgba(255,255,255,.9); background: rgba(10,10,10,.55); padding: 5px 10px; border-radius: 7px; }\n" +
  ".place-meta { display: flex; flex-wrap: wrap; gap: 7px; margin: 8px 0 14px; }\n" +
  ".place-meta span, .place-meta a { display: inline-flex; align-items: center; min-height: 28px; padding: 5px 10px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-2); font-size: 12px; font-weight: 600; text-decoration: none; }\n" +
  ".place-meta a { color: var(--ink); font-weight: 700; }\n" +
  ".place-meta .rating-pill { color: var(--accent); border-color: rgba(51,153,137,.3); background: rgba(51,153,137,.1); font-weight: 800; }\n" +
  ".place-meta .demo-pill { color: var(--ink-3); }\n" +
  ".fallback-banner { margin-top: 18px; width: min(760px,100%); border: 1px solid rgba(51,153,137,.25); background: rgba(51,153,137,.07); border-radius: 16px; padding: 16px 18px; }\n" +
  ".fallback-banner span { display: inline-flex; color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }\n" +
  ".fallback-banner p { margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: var(--ink-2); }\n" +
  ".fallback-banner button { border: none; border-radius: 8px; padding: 8px 14px; background: var(--ink); color: var(--accent); font-size: 12px; font-weight: 800; }\n" +
  "\n" +
  ".modal-backdrop { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 24px; background: rgba(10,10,10,.55); backdrop-filter: blur(8px); }\n" +
  ".subscribe-modal { width: min(620px,100%); border-radius: 22px; padding: 34px; position: relative; background: var(--bg); border: 1px solid var(--line-strong); }\n" +
  ".subscribe-modal h2 { margin-top: 6px; font-size: clamp(36px,5vw,56px); }\n" +
  ".modal-close { position: absolute; right: 20px; top: 18px; width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); font-size: 20px; display: flex; align-items: center; justify-content: center; }\n" +
  ".subscribe-form { display: flex; gap: 8px; margin-top: 22px; }\n" +
  ".subscribe-form input { flex: 1; }\n" +
  ".subscribe-success { margin-top: 14px; border-radius: 12px; padding: 12px 14px; background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-2); font-size: 13px; font-weight: 700; }\n" +
  "\n" +
  "/* ── RESPONSIVE ── */\n" +
  "@media(max-width: 760px) {\n" +
  "  .nav-desktop { display: none !important; }\n" +
  "  .nav-mobile { display: flex !important; }\n" +
  "  .navbar { height: 68px !important; padding: 0 20px !important; }\n" +
  "  .screen { padding: 32px 20px; }\n" +
  "  .action-bar { width: 100% !important; padding: 0 20px !important; margin: 20px 0 0 !important; gap: 12px; box-sizing: border-box; flex-direction: column; }\n" +
  "  .action-icons-row { display: flex !important; gap: 10px; width: 100%; }\n" +
  "  .icon-btn { flex: 1; min-width: 0; max-width: none; }\n" +
  "  .action-primary-cta { width: 100% !important; justify-content: center !important; min-height: 52px !important; padding: 0 24px !important; }\n" +
  "  .build-cta-row { justify-content: stretch; }\n" +
  "  .build-cta-row .btn-accent { width: 100%; justify-content: center; }\n" +
  "  .result-screen { padding: 0 0 60px !important; }\n" +
  "  .res-hero { min-height: calc(100svh - 68px); border-radius: 0; align-items: flex-end; }\n" +
  "  .res-glass-panel { padding: 24px 20px 32px; }\n" +
  "  .res-glass-top { flex-direction: column; gap: 6px; }\n" +
  "  .res-date-tag { align-self: flex-start; }\n" +
  "  .res-dest { font-size: clamp(28px, 8vw, 52px); }\n" +
  "  .timeline { padding: 36px 20px 32px !important; }\n" +
  "}\n" +
  "\n" +
  "@media(max-width: 980px) {\n" +
  "  .hero-inner { grid-template-columns: 1fr !important; gap: 42px; }\n" +
  "  .hero-cards { max-width: 620px; }\n" +
  "  .s-body { display: block; }\n" +
  "  .s-photo { margin-top: 18px; }\n" +
  "  .hero-cards.itinerary-showreel { max-width: 560px; height: auto !important; }\n" +
  "  .showreel-frame { height: 380px; }\n" +
  "}\n" +
  "\n" +
  "@media(max-width: 900px) { .mood-grid.image-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } }\n" +
  "\n" +
  "@media(max-width: 620px) {\n" +
  "  .mood-grid.image-grid { grid-template-columns: 1fr !important; }\n" +
  "  .image-mood-tile { height: 200px !important; min-height: 200px !important; }\n" +
  "  .s-photo { height: 200px; }\n" +
  "  h1 { font-size: 48px !important; }\n" +
  "  .showreel-frame { height: 320px; border-radius: 20px; }\n" +
  "  input[type=\"date\"] { font-size: 13px; padding: 0 16px; min-height: 54px; }\n" +
  "}\n" +
  "\n" +
  "/* ===== PROFILE CARD: simple translucent profile note ===== */\n" +
  ".setup-stack .partnership-box {\n" +
  "  max-width: 100% !important;\n" +
  "  margin: 6px 0 0 !important;\n" +
  "  padding: 20px 22px !important;\n" +
  "  border-radius: 24px !important;\n" +
  "  background: rgba(255,255,255,.52) !important;\n" +
  "  border: 1px solid rgba(0,0,0,.08) !important;\n" +
  "  box-shadow: 0 18px 44px rgba(0,0,0,.035) !important;\n" +
  "  backdrop-filter: blur(18px) !important;\n" +
  "  -webkit-backdrop-filter: blur(18px) !important;\n" +
  "  display: flex !important;\n" +
  "  flex-direction: column !important;\n" +
  "  align-items: flex-start !important;\n" +
  "  gap: 16px !important;\n" +
  "}\n" +
  "\n" +
  ".setup-stack .profile-chip {\n" +
  "  display: flex !important;\n" +
  "  align-items: center !important;\n" +
  "  gap: 10px !important;\n" +
  "  flex-shrink: 0 !important;\n" +
  "}\n" +
  "\n" +
  ".setup-stack .profile-chip img {\n" +
  "  width: 38px !important;\n" +
  "  height: 38px !important;\n" +
  "  border-radius: 12px !important;\n" +
  "  object-fit: cover !important;\n" +
  "  box-shadow: 0 0 0 1px rgba(255,255,255,.8), 0 6px 18px rgba(0,0,0,.08) !important;\n" +
  "}\n" +
  "\n" +
  ".setup-stack .profile-chip-name {\n" +
  "  font-size: 15px !important;\n" +
  "  font-weight: 800 !important;\n" +
  "  letter-spacing: -.03em !important;\n" +
  "  color: var(--ink) !important;\n" +
  "  white-space: nowrap !important;\n" +
  "}\n" +
  "\n" +
  ".setup-stack .partnership-copy {\n" +
  "  margin: 0 !important;\n" +
  "  max-width: 540px !important;\n" +
  "  font-size: 15px !important;\n" +
  "  line-height: 1.55 !important;\n" +
  "  color: var(--ink-2) !important;\n" +
  "  font-weight: 500 !important;\n" +
  "  letter-spacing: -.015em !important;\n" +
  "}\n" +
  "\n" +
  ".setup-stack .partnership-copy em {\n" +
  "  font-family: 'DM Serif Display', Georgia, serif !important;\n" +
  "  font-style: italic !important;\n" +
  "  color: var(--ink) !important;\n" +
  "  font-weight: 400 !important;\n" +
  "}\n" +
  "\n" +
  "@media (max-width: 760px) {\n" +
  "  .setup-stack .partnership-box {\n" +
  "    padding: 18px 18px !important;\n" +
  "    border-radius: 20px !important;\n" +
  "    gap: 14px !important;\n" +
  "  }\n" +
  "  .setup-stack .profile-chip img {\n" +
  "    width: 34px !important;\n" +
  "    height: 34px !important;\n" +
  "    border-radius: 11px !important;\n" +
  "  }\n" +
  "  .setup-stack .profile-chip-name {\n" +
  "    font-size: 14px !important;\n" +
  "  }\n" +
  "  .setup-stack .partnership-copy {\n" +
  "    font-size: 13.5px !important;\n" +
  "    line-height: 1.5 !important;\n" +
  "  }\n" +
  "}\n" +
  "\n" +
  "/* ═══════════════════════════════════════════\n" +
  "   RECOMMENDATION SCREEN — one viewport, no scroll\n" +
  "   Anime.js-inspired springs: cubic-bezier(.34,1.56,.64,1)\n" +
  "═══════════════════════════════════════════ */\n" +
  ".result-active {\n" +
  "  height: 100dvh !important;\n" +
  "  overflow: hidden !important;\n" +
  "  padding-bottom: 0 !important;\n" +
  "}\n" +
  "\n" +
  ".rec-screen {\n" +
  "  width: 100%;\n" +
  "  max-width: 1440px;\n" +
  "  height: calc(100dvh - 68px);\n" +
  "  display: flex;\n" +
  "  flex-direction: column;\n" +
  "  padding: 8px clamp(20px,4vw,56px) 20px;\n" +
  "  overflow: hidden;\n" +
  "  animation: scIn .3s var(--ease) both;\n" +
  "}\n" +
  "\n" +
  "/* Header */\n" +
  ".rec-head {\n" +
  "  display: flex;\n" +
  "  align-items: flex-end;\n" +
  "  justify-content: space-between;\n" +
  "  gap: 16px;\n" +
  "  padding-bottom: 14px;\n" +
  "  flex-shrink: 0;\n" +
  "}\n" +
  ".rec-head-eyebrow {\n" +
  "  font-size: 11px; font-weight: 700; letter-spacing: .08em;\n" +
  "  text-transform: uppercase; color: var(--ink-3); margin: 0 0 4px;\n" +
  "}\n" +
  ".rec-head-dest {\n" +
  "  font-family: 'DM Serif Display', Georgia, serif;\n" +
  "  font-size: clamp(26px, 3.2vw, 44px);\n" +
  "  font-weight: 400; line-height: 1; letter-spacing: -.02em;\n" +
  "  color: var(--ink); margin: 0;\n" +
  "}\n" +
  ".rec-head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }\n" +
  ".icon-btn-sm {\n" +
  "  width: 38px; height: 38px; border-radius: 12px;\n" +
  "  border: 1.5px solid var(--line-strong); background: transparent;\n" +
  "  color: var(--ink-2); display: flex; align-items: center; justify-content: center;\n" +
  "  cursor: pointer; transition: all .15s;\n" +
  "}\n" +
  ".icon-btn-sm:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); background: var(--surface); }\n" +
  ".icon-btn-sm:disabled { opacity: .4; cursor: wait; }\n" +
  ".icon-btn-sm-active { border-color: var(--accent) !important; color: var(--accent) !important; }\n" +
  ".cal-icon-btn-done { border-color: var(--accent) !important; color: var(--accent) !important; }\n" +
  ".rec-maps-cta {\n" +
  "  display: inline-flex; align-items: center; gap: 6px;\n" +
  "  height: 38px; padding: 0 16px; border-radius: 12px;\n" +
  "  background: var(--ink); color: #fff; font-size: 13px; font-weight: 700;\n" +
  "  text-decoration: none; transition: opacity .15s;\n" +
  "}\n" +
  ".rec-maps-cta:hover { opacity: .85; }\n" +
  "\n" +
  "/* Split layout */\n" +
  ".rec-split {\n" +
  "  flex: 1;\n" +
  "  min-height: 0;\n" +
  "  display: grid;\n" +
  "  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 1fr);\n" +
  "  gap: clamp(20px, 3vw, 40px);\n" +
  "  align-items: stretch;\n" +
  "}\n" +
  "\n" +
  "/* LEFT photo pane */\n" +
  ".rec-photo {\n" +
  "  position: relative;\n" +
  "  border-radius: 26px;\n" +
  "  overflow: hidden;\n" +
  "  background: var(--surface-2);\n" +
  "  border: 1px solid var(--line-strong);\n" +
  "}\n" +
  ".rec-photo-img {\n" +
  "  position: absolute; inset: 0;\n" +
  "  width: 100%; height: 100%; object-fit: cover;\n" +
  "  animation: photoIn .7s cubic-bezier(.2,.8,.2,1) both, photoKen 9s ease-in-out 0.6s both;\n" +
  "}\n" +
  "@keyframes photoIn {\n" +
  "  from { opacity: 0; transform: scale(1.06); filter: blur(6px); }\n" +
  "  to   { opacity: 1; transform: scale(1); filter: blur(0); }\n" +
  "}\n" +
  "@keyframes photoKen {\n" +
  "  from { transform: scale(1); }\n" +
  "  to   { transform: scale(1.06); }\n" +
  "}\n" +
  ".rec-photo-ov {\n" +
  "  position: absolute; inset: 0;\n" +
  "  background: linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 42%);\n" +
  "}\n" +
  ".rec-photo-meta {\n" +
  "  position: absolute; left: 22px; right: 22px; bottom: 20px;\n" +
  "  display: flex; flex-direction: column; gap: 4px;\n" +
  "}\n" +
  ".rec-photo-count {\n" +
  "  font-size: 11px; font-weight: 800; letter-spacing: .12em;\n" +
  "  color: rgba(255,255,255,.65); font-variant-numeric: tabular-nums;\n" +
  "}\n" +
  ".rec-photo-name {\n" +
  "  font-family: 'DM Serif Display', Georgia, serif;\n" +
  "  font-size: clamp(20px, 2vw, 30px); color: #fff; letter-spacing: -.02em;\n" +
  "  animation: nameSlide .55s cubic-bezier(.34,1.56,.64,1) .15s both;\n" +
  "}\n" +
  "@keyframes nameSlide {\n" +
  "  from { opacity: 0; transform: translateY(14px); }\n" +
  "  to   { opacity: 1; transform: translateY(0); }\n" +
  "}\n" +
  "\n" +
  "/* RIGHT card stack */\n" +
  ".rec-stack {\n" +
  "  position: relative;\n" +
  "  min-height: 0;\n" +
  "  display: flex;\n" +
  "  flex-direction: column;\n" +
  "  touch-action: pan-y;\n" +
  "}\n" +
  ".rec-card {\n" +
  "  position: absolute;\n" +
  "  inset: 0;\n" +
  "  border-radius: 24px;\n" +
  "  background: #fff;\n" +
  "  border: 1px solid var(--line-strong);\n" +
  "  box-shadow: 0 10px 34px rgba(0,0,0,.10);\n" +
  "  overflow: hidden;\n" +
  "  display: flex;\n" +
  "  flex-direction: column;\n" +
  "  transition: transform .55s cubic-bezier(.34,1.56,.64,1), opacity .4s ease;\n" +
  "  will-change: transform, opacity;\n" +
  "}\n" +
  ".rec-card-front {\n" +
  "  animation: cardPop .55s cubic-bezier(.34,1.56,.64,1) both;\n" +
  "}\n" +
  "@keyframes cardPop {\n" +
  "  from { transform: translateX(30px) scale(.96) rotate(1.5deg); opacity: .6; }\n" +
  "  to   { transform: translateX(0) scale(1) rotate(0); opacity: 1; }\n" +
  "}\n" +
  ".rec-card-gone { pointer-events: none; }\n" +
  "\n" +
  "/* In-card image — hidden everywhere now that the photo pane doubles as the mobile backdrop */\n" +
  ".rec-card-img { display: none; position: relative; height: 200px; flex-shrink: 0; }\n" +
  ".rec-card-img img { width: 100%; height: 100%; object-fit: cover; }\n" +
  ".rec-card-img-ov { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.35), transparent 55%); }\n" +
  "\n" +
  "/* Heart */\n" +
  ".rec-heart {\n" +
  "  position: absolute; top: 16px; right: 16px; z-index: 5;\n" +
  "  width: 46px; height: 46px; border-radius: 50%;\n" +
  "  border: 1.5px solid var(--line-strong);\n" +
  "  background: #fff; color: var(--ink-3);\n" +
  "  display: flex; align-items: center; justify-content: center;\n" +
  "  cursor: pointer;\n" +
  "  transition: transform .35s cubic-bezier(.34,1.9,.64,1), color .2s, border-color .2s, background .2s;\n" +
  "}\n" +
  ".rec-heart:hover { transform: scale(1.12); color: var(--accent); border-color: var(--accent); }\n" +
  ".rec-heart-on {\n" +
  "  background: var(--accent); border-color: var(--accent); color: #fff;\n" +
  "  animation: heartPop .45s cubic-bezier(.34,2.2,.64,1);\n" +
  "}\n" +
  "@keyframes heartPop {\n" +
  "  0% { transform: scale(.7); }\n" +
  "  55% { transform: scale(1.22); }\n" +
  "  100% { transform: scale(1); }\n" +
  "}\n" +
  "\n" +
  "/* Card inner content */\n" +
  ".rec-card-inner {\n" +
  "  flex: 1;\n" +
  "  min-height: 0;\n" +
  "  padding: clamp(22px,3vw,34px) clamp(22px,3vw,34px) 74px;\n" +
  "  display: flex;\n" +
  "  flex-direction: column;\n" +
  "  gap: 10px;\n" +
  "  overflow-y: auto;\n" +
  "}\n" +
  ".rec-card-cat {\n" +
  "  font-size: 10px; font-weight: 800; letter-spacing: .12em;\n" +
  "  text-transform: uppercase; color: var(--ink-3); margin: 0;\n" +
  "}\n" +
  ".rec-card-timerow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n" +
  ".rec-card-time {\n" +
  "  font-size: 13px; font-weight: 800; color: var(--accent);\n" +
  "  font-variant-numeric: tabular-nums;\n" +
  "}\n" +
  ".rec-card-suggested {\n" +
  "  font-size: 12px; font-weight: 600; color: var(--ink-3);\n" +
  "  margin: 10px 0 0; font-variant-numeric: tabular-nums;\n" +
  "}\n" +
  ".rec-card-pill {\n" +
  "  font-size: 11px; font-weight: 700; color: var(--ink-2);\n" +
  "  padding: 3px 10px; border-radius: 999px;\n" +
  "  background: var(--surface); border: 1px solid var(--line);\n" +
  "}\n" +
  ".rec-pill-rating { color: var(--accent); background: rgba(51,153,137,.08); border-color: rgba(51,153,137,.25); }\n" +
  ".rec-pill-price { color: #b8860b; background: rgba(184,134,11,.08); border-color: rgba(184,134,11,.25); font-variant-numeric: tabular-nums; letter-spacing: .05em; }\n" +
  ".rec-card-name {\n" +
  "  font-family: 'DM Serif Display', Georgia, serif;\n" +
  "  font-size: clamp(24px, 2.6vw, 38px);\n" +
  "  font-weight: 400; line-height: 1.05; letter-spacing: -.02em;\n" +
  "  color: var(--ink); margin: 2px 0 0;\n" +
  "}\n" +
  ".rec-card-desc {\n" +
  "  font-size: 14px; line-height: 1.65; color: var(--ink-2); margin: 6px 0 0;\n" +
  "}\n" +
  ".rec-card-addr {\n" +
  "  display: inline-flex; align-items: center; gap: 6px;\n" +
  "  font-size: 12px; font-weight: 600; color: var(--ink-3);\n" +
  "  text-decoration: none; margin-top: 2px;\n" +
  "}\n" +
  ".rec-card-addr:hover { color: var(--accent); }\n" +
  ".rec-card-book {\n" +
  "  display: inline-flex; align-items: center; gap: 7px;\n" +
  "  margin-top: 6px; padding: 9px 16px; width: fit-content;\n" +
  "  border-radius: 11px; background: var(--ink); color: #fff;\n" +
  "  font-size: 12.5px; font-weight: 700; text-decoration: none;\n" +
  "  transition: opacity .15s, transform .2s cubic-bezier(.34,1.56,.64,1);\n" +
  "}\n" +
  ".rec-card-book:hover { opacity: .88; transform: translateY(-1px); }\n" +
  ".rec-card-route { color: var(--ink-3); font-size: 11.5px; line-height: 1.5; margin-top: 4px; display: block; }\n" +
  "\n" +
  "/* Nav — sits INSIDE the front card, bottom center */\n" +
  ".rec-nav {\n" +
  "  position: absolute;\n" +
  "  left: 0; right: 0; bottom: 16px;\n" +
  "  z-index: 20;\n" +
  "  display: flex; align-items: center; justify-content: center; gap: 14px;\n" +
  "  pointer-events: none;\n" +
  "}\n" +
  ".rec-nav > * { pointer-events: auto; }\n" +
  ".rec-arrow {\n" +
  "  width: 38px; height: 38px; border-radius: 50%;\n" +
  "  border: 1.5px solid var(--line-strong); background: #fff;\n" +
  "  box-shadow: 0 2px 10px rgba(0,0,0,.08);\n" +
  "  color: var(--ink-2);\n" +
  "  display: flex; align-items: center; justify-content: center;\n" +
  "  cursor: pointer; transition: all .15s;\n" +
  "}\n" +
  ".rec-arrow:hover:not(:disabled) { border-color: var(--ink); color: var(--ink); transform: scale(1.06); }\n" +
  ".rec-arrow:disabled { opacity: .25; cursor: not-allowed; }\n" +
  ".rec-dots { display: flex; gap: 7px; align-items: center; }\n" +
  ".rec-dot {\n" +
  "  width: 7px; height: 7px; border-radius: 999px;\n" +
  "  border: none; background: var(--surface-3);\n" +
  "  cursor: pointer; padding: 0;\n" +
  "  transition: all .35s cubic-bezier(.34,1.56,.64,1);\n" +
  "}\n" +
  ".rec-dot-on { background: var(--ink); width: 22px; }\n" +
  ".rec-dot-heart { background: var(--accent); }\n" +
  ".rec-dot-heart.rec-dot-on { background: var(--accent); width: 22px; }\n" +
  "\n" +
  "/* ── MOBILE BOTTOM BAR + GESTURE UI (hidden on desktop) ── */\n" +
  ".rec-mbar {\n" +
  "  display: none;\n" +
  "  grid-template-columns: 1fr 1.35fr 1fr;\n" +
  "  gap: 10px;\n" +
  "  padding-top: 12px;\n" +
  "  flex-shrink: 0;\n" +
  "}\n" +
  ".rec-mbar-btn {\n" +
  "  display: flex; align-items: center; justify-content: center; gap: 8px;\n" +
  "  min-height: 54px; border-radius: 18px;\n" +
  "  border: 1.5px solid var(--line-strong); background: #fff;\n" +
  "  font-size: 14px; font-weight: 700; color: var(--ink);\n" +
  "  text-decoration: none; cursor: pointer;\n" +
  "  box-shadow: 0 1px 6px rgba(0,0,0,.06);\n" +
  "  transition: transform .15s, opacity .15s;\n" +
  "}\n" +
  ".rec-mbar-btn:active { transform: scale(.97); }\n" +
  ".rec-mbar-btn:disabled { opacity: .5; cursor: wait; }\n" +
  ".rec-mbar-primary { background: var(--ink); color: #fff; border-color: var(--ink); }\n" +
  "\n" +
  ".rec-hint {\n" +
  "  display: none;\n" +
  "  position: absolute; inset: 0; z-index: 30;\n" +
  "  align-items: center; justify-content: center;\n" +
  "  background: rgba(0,0,0,.22);\n" +
  "  border-radius: 24px;\n" +
  "  animation: hintFade .35s ease both;\n" +
  "  cursor: pointer;\n" +
  "}\n" +
  "@keyframes hintFade { from { opacity: 0; } to { opacity: 1; } }\n" +
  ".rec-hint-pill {\n" +
  "  display: flex; align-items: center; gap: 9px;\n" +
  "  padding: 13px 20px; border-radius: 999px;\n" +
  "  background: rgba(8,8,8,.78);\n" +
  "  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);\n" +
  "  color: #fff; font-size: 13px; font-weight: 700;\n" +
  "  animation: hintPillIn .5s cubic-bezier(.34,1.56,.64,1) both;\n" +
  "}\n" +
  ".rec-hint-pill svg { color: var(--accent); flex-shrink: 0; }\n" +
  "@keyframes hintPillIn {\n" +
  "  from { opacity: 0; transform: translateY(12px) scale(.92); }\n" +
  "  to   { opacity: 1; transform: translateY(0) scale(1); }\n" +
  "}\n" +
  "\n" +
  ".rec-heart-burst {\n" +
  "  position: absolute; inset: 0; z-index: 40;\n" +
  "  display: flex; align-items: center; justify-content: center;\n" +
  "  pointer-events: none;\n" +
  "}\n" +
  ".rec-heart-burst svg {\n" +
  "  color: #fff;\n" +
  "  filter: drop-shadow(0 10px 28px rgba(0,0,0,.35));\n" +
  "  animation: burstPop .75s cubic-bezier(.34,1.8,.64,1) both;\n" +
  "}\n" +
  "@keyframes burstPop {\n" +
  "  0%   { transform: scale(.25); opacity: 0; }\n" +
  "  30%  { transform: scale(1.25); opacity: 1; }\n" +
  "  60%  { transform: scale(1); opacity: 1; }\n" +
  "  100% { transform: scale(1.05); opacity: 0; }\n" +
  "}\n" +
  "\n" +
  ".rec-more-backdrop {\n" +
  "  position: fixed; inset: 0; z-index: 700;\n" +
  "  background: rgba(10,10,10,.45);\n" +
  "  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);\n" +
  "  display: flex; align-items: flex-end;\n" +
  "  animation: drawerBgIn .2s ease both;\n" +
  "}\n" +
  ".rec-more-sheet {\n" +
  "  width: 100%;\n" +
  "  background: var(--bg);\n" +
  "  border-radius: 26px 26px 0 0;\n" +
  "  padding: 12px 16px max(22px, env(safe-area-inset-bottom));\n" +
  "  display: flex; flex-direction: column; gap: 2px;\n" +
  "  animation: sheetUp .32s var(--ease) both;\n" +
  "}\n" +
  "@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }\n" +
  ".rec-more-grab {\n" +
  "  width: 40px; height: 4px; border-radius: 999px;\n" +
  "  background: var(--surface-3); margin: 0 auto 12px;\n" +
  "}\n" +
  ".rec-more-item {\n" +
  "  display: flex; align-items: center; gap: 12px;\n" +
  "  width: 100%; min-height: 54px; padding: 0 14px;\n" +
  "  border: none; border-radius: 14px;\n" +
  "  background: transparent;\n" +
  "  font-size: 15px; font-weight: 700; color: var(--ink);\n" +
  "  text-align: left; cursor: pointer;\n" +
  "  transition: background .12s;\n" +
  "}\n" +
  ".rec-more-item:active { background: var(--surface-2); }\n" +
  ".rec-more-item svg { flex-shrink: 0; color: var(--ink-2); }\n" +
  ".rec-more-danger { color: #c0392b; }\n" +
  ".rec-more-danger svg { color: #c0392b; }\n" +
  "\n" +
  "/* ── Mobile result: image backdrop + floating swipe card + bottom bar ── */\n" +
  "@media (max-width: 900px) {\n" +
  "  .rec-screen {\n" +
  "    height: calc(100dvh - 68px);\n" +
  "    padding: 0; /* remove off-white gutters so photo can be full-bleed */\n" +
  "    background: transparent;\n" +
  "  }\n" +
  "  .rec-head { padding-bottom: 10px; align-items: center; }\n" +
  "  .rec-head-dest { display: none; }\n" +
  "  .rec-head-actions { display: none; }\n" +
  "\n" +
  "  /* Photo becomes the full backdrop; it changes with the active card */\n" +
  "  .rec-split { position: relative; display: block; }\n" +
  "  .rec-photo {\n" +
  "    display: block;\n" +
  "    position: fixed; inset: 0; /* full-bleed background */\n" +
  "    z-index: 0;\n" +
  "    border-radius: 0;\n" +
  "  }\n" +
  "  .rec-photo-ov { background: linear-gradient(to bottom, rgba(0,0,0,.62) 0%, rgba(0,0,0,.04) 46%); }\n" +
  "  .rec-photo { border-radius: 0; border: none; }\n" +
  "  .rec-photo-meta { top: 16px; bottom: auto; left: 18px; right: 18px; }\n" +
  "  .rec-photo-name { font-size: 20px; }\n" +
  "\n" +
  "  /* Card floats lower and shorter so the image keeps the full-screen feel */\n" +
  "  .rec-stack {\n" +
  "    position: absolute;\n" +
  "    left: 14px; right: 14px;\n" +
  "    bottom: 14px; top: auto;\n" +
  "    height: 50vh;\n" +
  "    display: block;\n" +
  "    z-index: 2;\n" +
  "  }\n" +
  "  .rec-card { cursor: pointer; }\n" +
  "  .rec-card-img { display: none; }\n" +
  "  .rec-card-inner { padding: 18px 18px 56px; gap: 8px; overflow: hidden; }\n" +
  "  .rec-card-name { font-size: 24px; }\n" +
  "  .rec-card-desc { font-size: 13.5px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }\n" +
  "  .rec-heart { top: 12px; right: 12px; width: 42px; height: 42px; }\n" +
  "\n" +
  "  /* Tap/swipe drives navigation — arrows off, dots stay */\n" +
  "  .rec-arrow { display: none; }\n" +
  "  .rec-nav { bottom: 84px; }\n" +
  "\n" +
  "  .rec-mbar { display: none; }\n" +
  "  .rec-card-actions { display: none; }\n" +
  "  .rec-card-actions .rec-mbar-btn { width: 100%; min-height: 46px; justify-content: center; }\n" +
  "  .rec-card-actions { display: flex; flex-direction: column; gap: 12px; padding: 12px 18px calc(20px + env(safe-area-inset-bottom)); background: transparent; }\n" +
  "  .rec-card { overflow: visible; }\n" +
  "  .rec-hint { display: flex; }\n" +
  "  .rec-hint { display: flex; }\n" +
  "}\n" +
  "\n" +
  "/* ── ACTION SEARCH BAR (mood page) — kokonutui style ── */\n" +
  ".action-search { position: relative; width: 100%; display: flex; flex-direction: column; gap: 10px; }\n" +
  ".action-search-label { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }\n" +
  ".action-search-bar {\n" +
  "  display: flex; align-items: center; gap: 12px;\n" +
  "  background: #fff; border-radius: 18px;\n" +
  "  min-height: 60px; padding: 0 20px;\n" +
  "  box-shadow: 0 1px 6px rgba(0,0,0,.08);\n" +
  "  border: 1.5px solid transparent;\n" +
  "  transition: border-color .2s, box-shadow .25s cubic-bezier(.34,1.56,.64,1);\n" +
  "}\n" +
  ".action-search-open { border-color: var(--accent); box-shadow: 0 6px 24px rgba(51,153,137,.14); }\n" +
  ".action-search-icon { color: var(--ink-3); flex-shrink: 0; }\n" +
  ".action-search-open .action-search-icon { color: var(--accent); }\n" +
  ".action-search-bar input {\n" +
  "  flex: 1; border: none; background: transparent; outline: none;\n" +
  "  font-size: 15px; font-weight: 500; color: var(--ink); min-width: 0;\n" +
  "}\n" +
  ".action-search-bar input::placeholder { color: var(--ink-3); font-weight: 400; }\n" +
  ".action-search-field { flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 7px; min-width: 0; padding: 10px 0; }\n" +
  ".action-search-field input { flex: 1; min-width: 140px; border: none; background: transparent; outline: none; font-size: 15px; font-weight: 500; color: var(--ink); }\n" +
  ".action-search-has-chips { min-height: 60px; height: auto; }\n" +
  ".activity-chip {\n" +
  "  display: inline-flex; align-items: center; gap: 6px;\n" +
  "  padding: 6px 8px 6px 13px; border-radius: 999px;\n" +
  "  background: rgba(51,153,137,.1); border: 1px solid rgba(51,153,137,.3);\n" +
  "  color: var(--accent-strong, #237a6d); font-size: 13px; font-weight: 700;\n" +
  "  animation: chipIn .3s cubic-bezier(.34,1.56,.64,1) both;\n" +
  "}\n" +
  "@keyframes chipIn { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: scale(1); } }\n" +
  ".activity-chip-x {\n" +
  "  width: 18px; height: 18px; border-radius: 50%; border: none;\n" +
  "  background: rgba(51,153,137,.18); color: var(--accent-strong, #237a6d);\n" +
  "  font-size: 13px; line-height: 1; display: flex; align-items: center; justify-content: center;\n" +
  "  cursor: pointer; padding: 0;\n" +
  "}\n" +
  ".activity-chip-x:hover { background: var(--accent); color: #fff; }\n" +
  ".asi-picked .asi-spark { color: var(--accent); font-weight: 800; }\n" +
  ".asi-picked { background: rgba(51,153,137,.07); }\n" +
  ".action-search-clear {\n" +
  "  width: 28px; height: 28px; border-radius: 50%; border: none;\n" +
  "  background: var(--surface-2); color: var(--ink-2); font-size: 16px;\n" +
  "  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;\n" +
  "}\n" +
  ".action-search-panel {\n" +
  "  position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 300;\n" +
  "  background: #fff; border-radius: 18px; padding: 10px;\n" +
  "  box-shadow: 0 16px 48px rgba(0,0,0,.14);\n" +
  "  border: 1px solid var(--line);\n" +
  "  animation: panelIn .3s cubic-bezier(.34,1.56,.64,1) both;\n" +
  "}\n" +
  "@keyframes panelIn { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }\n" +
  ".action-search-panel-label {\n" +
  "  font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;\n" +
  "  color: var(--ink-3); margin: 4px 0 8px; padding: 0 10px;\n" +
  "}\n" +
  ".action-search-item {\n" +
  "  display: flex; align-items: center; gap: 10px;\n" +
  "  width: 100%; padding: 11px 12px; border: none; border-radius: 12px;\n" +
  "  background: transparent; text-align: left; cursor: pointer;\n" +
  "  transition: background .12s;\n" +
  "  animation: itemIn .35s cubic-bezier(.34,1.56,.64,1) both;\n" +
  "}\n" +
  "@keyframes itemIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }\n" +
  ".action-search-item:hover { background: var(--surface); }\n" +
  ".asi-spark { color: var(--accent); font-size: 12px; flex-shrink: 0; }\n" +
  ".asi-name { font-size: 14px; font-weight: 600; color: var(--ink); flex: 1; }\n" +
  ".asi-mood { font-size: 11px; font-weight: 600; color: var(--ink-3); padding: 2px 9px; border-radius: 999px; background: var(--surface); }\n" +
  "\n" +
  "/* ═══════════════════════════════════════════\n" +
  "   LANDING MOTION — cinematic mood cycle\n" +
  "   wallpaper zooms out → gets \"captured\" into the\n" +
  "   itinerary window → plan lines drop in, staggered\n" +
  "═══════════════════════════════════════════ */\n" +
  "\n" +
  "/* Stacked crossfading backgrounds */\n" +
  ".lp-bg-outer .lp-bg-slide {\n" +
  "  position: absolute;\n" +
  "  inset: 0;\n" +
  "  width: 100%;\n" +
  "  height: 100%;\n" +
  "  object-fit: cover;\n" +
  "  opacity: 0;\n" +
  "  transition: opacity 1.4s ease;\n" +
  "  will-change: opacity, transform;\n" +
  "}\n" +
  ".lp-bg-outer .lp-bg-live {\n" +
  "  opacity: 1;\n" +
  "  animation: lpZoomOut 5.2s cubic-bezier(.22,.61,.36,1) both;\n" +
  "}\n" +
  "@keyframes lpZoomOut {\n" +
  "  from { transform: scale(1.14); }\n" +
  "  to   { transform: scale(1.0); }\n" +
  "}\n" +
  "\n" +
  "/* The captured wallpaper inside the itinerary window:\n" +
  "   starts huge + blurred (same as wallpaper), condenses into the frame */\n" +
  ".lp-window-img {\n" +
  "  position: absolute;\n" +
  "  inset: 0;\n" +
  "  width: 100%;\n" +
  "  height: 100%;\n" +
  "  object-fit: cover;\n" +
  "  z-index: 0;\n" +
  "  animation: lpCapture 1.35s cubic-bezier(.22,.9,.32,1) both;\n" +
  "}\n" +
  "@keyframes lpCapture {\n" +
  "  0%   { transform: scale(1.55); filter: blur(14px) saturate(1.25); opacity: 0; }\n" +
  "  35%  { opacity: 1; }\n" +
  "  100% { transform: scale(1); filter: blur(0) saturate(1); opacity: 1; }\n" +
  "}\n" +
  "\n" +
  "/* Keep overlay + content above the captured image */\n" +
  ".lp-panel-overlay { z-index: 1; }\n" +
  ".lp-panel-itin { z-index: 2; }\n" +
  "\n" +
  "/* Mood tag — glass pill, slides in after the capture settles */\n" +
  ".lp-window-mood {\n" +
  "  position: absolute;\n" +
  "  top: 18px;\n" +
  "  left: 18px;\n" +
  "  z-index: 2;\n" +
  "  display: inline-flex;\n" +
  "  align-items: center;\n" +
  "  gap: 7px;\n" +
  "  padding: 7px 14px;\n" +
  "  border-radius: 999px;\n" +
  "  background: rgba(0,0,0,.32);\n" +
  "  border: 1px solid rgba(255,255,255,.22);\n" +
  "  backdrop-filter: blur(14px);\n" +
  "  -webkit-backdrop-filter: blur(14px);\n" +
  "  color: #fff;\n" +
  "  font-size: 12px;\n" +
  "  font-weight: 700;\n" +
  "  letter-spacing: .03em;\n" +
  "  animation: lpTagIn .6s cubic-bezier(.34,1.56,.64,1) .55s both;\n" +
  "}\n" +
  ".lp-window-mood-icon { font-size: 13px; opacity: .9; }\n" +
  "@keyframes lpTagIn {\n" +
  "  from { opacity: 0; transform: translateY(-10px) scale(.92); }\n" +
  "  to   { opacity: 1; transform: translateY(0) scale(1); }\n" +
  "}\n" +
  "\n" +
  "/* Itinerary lines drop in from above, staggered, springy */\n" +
  ".lp-itin-drop {\n" +
  "  animation: lpLineDrop .65s cubic-bezier(.34,1.56,.64,1) both;\n" +
  "}\n" +
  "@keyframes lpLineDrop {\n" +
  "  from { opacity: 0; transform: translateY(-22px) scale(.96); }\n" +
  "  to   { opacity: 1; transform: translateY(0) scale(1); }\n" +
  "}\n" +
  "\n" +
  "/* Respect reduced-motion */\n" +
  "@media (prefers-reduced-motion: reduce) {\n" +
  "  .lp-bg-outer .lp-bg-live,\n" +
  "  .lp-window-img,\n" +
  "  .lp-window-mood,\n" +
  "  .lp-itin-drop { animation: none !important; }\n" +
  "  .lp-bg-outer .lp-bg-slide { transition: opacity .6s ease; }\n" +
  "}\n" +
  "\n" +
  "/* ═══════════════════════════════════════════\n" +
  "   MOBILE LANDING — consolidated, full-bleed\n" +
  "   Replaces the stacked emergency override blocks.\n" +
  "   The image window fills edge-to-edge (no outer gap),\n" +
  "   and the white sign-in sheet rises over it.\n" +
  "═══════════════════════════════════════════ */\n" +
  "@media (max-width: 760px) {\n" +
  "  .app-shell.login-active,\n" +
  "  .login-active {\n" +
  "    width: 100vw !important;\n" +
  "    height: 100dvh !important;\n" +
  "    min-height: 100dvh !important;\n" +
  "    overflow: hidden !important;\n" +
  "    padding: 0 !important;\n" +
  "    background: #050807 !important;\n" +
  "  }\n" +
  "  .login-active .navbar { display: none !important; }\n" +
  "\n" +
  "  /* Full bleed — no padding, no frame, no gap */\n" +
  "  .lp-shell {\n" +
  "    width: 100vw !important;\n" +
  "    height: 100dvh !important;\n" +
  "    min-height: 100dvh !important;\n" +
  "    padding: 0 !important;\n" +
  "    display: flex !important;\n" +
  "    align-items: stretch !important;\n" +
  "    overflow: hidden !important;\n" +
  "    background: #050807 !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-bg-outer { display: none !important; }\n" +
  "\n" +
  "  .lp-card {\n" +
  "    position: relative !important;\n" +
  "    z-index: 2 !important;\n" +
  "    width: 100vw !important;\n" +
  "    height: 100dvh !important;\n" +
  "    margin: 0 !important;\n" +
  "    display: flex !important;\n" +
  "    flex-direction: column !important;\n" +
  "    border: 0 !important;\n" +
  "    border-radius: 0 !important;\n" +
  "    background: #050807 !important;\n" +
  "    box-shadow: none !important;\n" +
  "    overflow: hidden !important;\n" +
  "  }\n" +
  "\n" +
  "  /* Image window: fills all the space above the sheet, edge to edge */\n" +
  "  .lp-card-right {\n" +
  "    order: 1 !important;\n" +
  "    position: relative !important;\n" +
  "    flex: 1 1 auto !important;\n" +
  "    min-height: 0 !important;\n" +
  "    width: 100% !important;\n" +
  "    margin: 0 !important;\n" +
  "    border: 0 !important;\n" +
  "    border-radius: 0 !important;\n" +
  "    overflow: hidden !important;\n" +
  "    background: #050807 !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-window-img {\n" +
  "    object-position: center !important;\n" +
  "    filter: saturate(1.12) contrast(1.02) !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-panel-overlay {\n" +
  "    display: block !important;\n" +
  "    position: absolute !important;\n" +
  "    inset: 0 !important;\n" +
  "    background: linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.02) 34%, rgba(0,0,0,.34) 100%) !important;\n" +
  "    pointer-events: none !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-window-mood {\n" +
  "    top: max(16px, env(safe-area-inset-top)) !important;\n" +
  "    left: 18px !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-panel-itin {\n" +
  "    position: absolute !important;\n" +
  "    left: 18px !important;\n" +
  "    right: 18px !important;\n" +
  "    bottom: 46px !important; /* clears the sheet's rounded overlap */\n" +
  "    display: grid !important;\n" +
  "    gap: 11px !important;\n" +
  "    z-index: 2 !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-itin-line {\n" +
  "    min-height: 56px !important;\n" +
  "    display: grid !important;\n" +
  "    grid-template-columns: 78px 1fr !important;\n" +
  "    align-items: center !important;\n" +
  "    padding: 0 18px !important;\n" +
  "    border-radius: 18px !important;\n" +
  "    background: rgba(255,255,255,.24) !important;\n" +
  "    border: 1px solid rgba(255,255,255,.34) !important;\n" +
  "    backdrop-filter: blur(18px) saturate(140%) !important;\n" +
  "    -webkit-backdrop-filter: blur(18px) saturate(140%) !important;\n" +
  "    box-shadow: none !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-itin-time {\n" +
  "    color: #3CA394 !important;\n" +
  "    font-size: 15px !important;\n" +
  "    font-weight: 900 !important;\n" +
  "    letter-spacing: -.02em !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-itin-label {\n" +
  "    color: #FFFFFF !important;\n" +
  "    font-size: 15px !important;\n" +
  "    font-weight: 800 !important;\n" +
  "    letter-spacing: -.02em !important;\n" +
  "    white-space: nowrap !important;\n" +
  "    overflow: hidden !important;\n" +
  "    text-overflow: ellipsis !important;\n" +
  "  }\n" +
  "\n" +
  "  /* White sign-in sheet rises over the image */\n" +
  "  .lp-card-left {\n" +
  "    order: 2 !important;\n" +
  "    position: relative !important;\n" +
  "    z-index: 5 !important;\n" +
  "    flex: 0 0 auto !important;\n" +
  "    width: 100% !important;\n" +
  "    margin: -28px 0 0 !important;\n" +
  "    padding: 26px 26px max(28px, env(safe-area-inset-bottom)) !important;\n" +
  "    background: #FFFFFF !important;\n" +
  "    border: 0 !important;\n" +
  "    border-radius: 28px 28px 0 0 !important;\n" +
  "    box-shadow: 0 -12px 34px rgba(0,0,0,.16) !important;\n" +
  "    overflow: visible !important;\n" +
  "    display: flex !important;\n" +
  "    flex-direction: column !important;\n" +
  "    gap: 0 !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-eyebrow {\n" +
  "    margin: 0 0 10px !important;\n" +
  "    color: #8A897F !important;\n" +
  "    font-size: 11px !important;\n" +
  "    font-weight: 900 !important;\n" +
  "    letter-spacing: .18em !important;\n" +
  "    text-transform: uppercase !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-h1 {\n" +
  "    margin: 0 !important;\n" +
  "    font-size: clamp(46px, 13vw, 62px) !important;\n" +
  "    line-height: .88 !important;\n" +
  "    letter-spacing: -.045em !important;\n" +
  "    color: #080808 !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-accent { color: #3CA394 !important; -webkit-text-fill-color: #3CA394 !important; }\n" +
  "\n" +
  "  .lp-sub {\n" +
  "    margin: 14px 0 0 !important;\n" +
  "    max-width: 34ch !important;\n" +
  "    color: #8A897F !important;\n" +
  "    font-size: 14px !important;\n" +
  "    line-height: 1.42 !important;\n" +
  "    letter-spacing: -.01em !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-actions {\n" +
  "    width: 100% !important;\n" +
  "    margin-top: 20px !important;\n" +
  "    display: grid !important;\n" +
  "    grid-template-columns: 1fr !important;\n" +
  "    gap: 11px !important;\n" +
  "  }\n" +
  "\n" +
  "  /* Google iframe stays desktop-only; mobile uses the styled prompt() button */\n" +
  "  .lp-google-wrap { display: none !important; }\n" +
  "  .lp-google-btn-mobile {\n" +
  "    display: flex !important;\n" +
  "    height: 56px !important;\n" +
  "    border-radius: 18px !important;\n" +
  "    border: 1px solid #D9D4CA !important;\n" +
  "    font-size: 15px !important;\n" +
  "    font-weight: 600 !important;\n" +
  "  }\n" +
  "\n" +
  "  .lp-ghost-btn {\n" +
  "    width: 100% !important;\n" +
  "    height: 56px !important;\n" +
  "    min-height: 56px !important;\n" +
  "    border-radius: 18px !important;\n" +
  "    border: 1px solid #D9D4CA !important;\n" +
  "    background: #FFFFFF !important;\n" +
  "    color: #080808 !important;\n" +
  "    display: flex !important;\n" +
  "    align-items: center !important;\n" +
  "    justify-content: center !important;\n" +
  "    gap: 8px !important;\n" +
  "    font-size: 15px !important;\n" +
  "    font-weight: 750 !important;\n" +
  "    box-shadow: none !important;\n" +
  "  }\n" +
  "  .lp-ghost-btn:hover { background: #F8F5EF !important; border-color: #D9D4CA !important; color: #080808 !important; }\n" +
  "\n" +
  "  .lp-fine { display: none !important; }\n" +
  "\n" +
  "  .drawer-close { display: none !important; }\n" +
  "}\n" +
  "\n" +
  "/* Shorter phones: keep CTAs visible */\n" +
  "@media (max-width: 760px) and (max-height: 760px) {\n" +
  "  .lp-card-left { padding: 20px 22px max(22px, env(safe-area-inset-bottom)) !important; }\n" +
  "  .lp-h1 { font-size: clamp(42px, 12vw, 54px) !important; }\n" +
  "  .lp-sub { margin-top: 10px !important; font-size: 13px !important; }\n" +
  "  .lp-actions { margin-top: 15px !important; gap: 9px !important; }\n" +
  "  .lp-google-btn-mobile, .lp-ghost-btn { height: 50px !important; min-height: 50px !important; }\n" +
  "  .lp-panel-itin { bottom: 40px !important; gap: 9px !important; }\n" +
  "  .lp-itin-line { min-height: 50px !important; }\n" +
  "}\n" +
  "\n" +
  "/* Builder result screen */\n" +
  ".result-active .navbar { display: none !important; }\n" +
  ".result-active { height: 100dvh !important; overflow: hidden !important; padding-bottom: 0 !important; }\n" +
  ".builder-screen { width: 100vw; max-width: none; height: 100dvh; padding: 0; overflow: hidden; }\n" +
  ".builder-layout { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(420px, .92fr); width: 100%; height: 100%; background: #fff; }\n" +
  ".builder-photo-pane { position: relative; min-height: 0; overflow: hidden; background: #0b1411; }\n" +
  ".builder-photo-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center bottom; animation: photoIn .65s cubic-bezier(.2,.8,.2,1) both; }\n" +
  ".builder-photo-ov { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.44), rgba(0,0,0,.03) 42%, rgba(0,0,0,.68)); }\n" +
  ".builder-photo-meta { position: absolute; left: clamp(24px,4vw,54px); top: clamp(24px,5vh,58px); right: 24px; color: #fff; z-index: 2; }\n" +
  ".builder-photo-meta p { margin: 0 0 7px; font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.72); }\n" +
  ".builder-photo-meta h2 { margin: 0; font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(36px,5vw,74px); line-height: .95; font-weight: 400; color: #fff; }\n" +
  ".selected-tray { position: absolute; left: clamp(18px,3vw,38px); right: clamp(18px,3vw,38px); bottom: clamp(18px,3vh,34px); z-index: 3; }\n" +
  ".selected-tray-row { display: flex; align-items: stretch; gap: 12px; overflow-x: auto; padding: 6px 2px; }\n" +
  ".selected-mini-card { position: relative; flex: 0 0 116px; height: 132px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,.48); background: rgba(255,255,255,.16); color: #fff; cursor: grab; box-shadow: 0 10px 28px rgba(0,0,0,.22); }\n" +
  ".selected-mini-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.72); }\n" +
  ".selected-mini-card button { position: absolute; right: 7px; top: 7px; z-index: 2; width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,.65); background: rgba(0,0,0,.42); color: #fff; display: grid; place-items: center; }\n" +
  ".selected-mini-card span { position: absolute; left: 9px; top: 9px; z-index: 2; font-size: 10px; font-weight: 900; letter-spacing: .08em; }\n" +
  ".selected-mini-card p { position: absolute; left: 9px; right: 9px; bottom: 9px; z-index: 2; margin: 0; font-size: 12px; line-height: 1.15; font-weight: 800; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\n" +
  ".selected-mini-card::after { content: \"\"; position: absolute; inset: auto 0 0 0; height: 62%; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,.74), rgba(0,0,0,0)); pointer-events: none; }\n" +
  ".selected-mini-card span, .selected-mini-card p { color: #fff !important; text-shadow: 0 2px 10px rgba(0,0,0,.8); }\n" +
  ".create-itinerary-side { flex: 0 0 150px; border: none; border-radius: 16px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 850; padding: 0 18px; }\n" +
  ".create-itinerary-side:disabled { opacity: .45; cursor: not-allowed; }\n" +
  ".builder-panel { min-width: 0; min-height: 0; overflow-y: auto; padding: clamp(22px,4vw,50px); background: var(--bg); display: flex; flex-direction: column; }\n" +
  ".builder-panel-head { margin-bottom: 18px; }\n" +
  ".builder-panel-head .rec-head-dest { display: block; color: var(--ink); font-size: clamp(30px,3.6vw,48px); }\n" +
  ".suggestion-card { position: relative; flex: 1; min-height: 0; border-radius: 24px; background: #fff; border: 1px solid var(--line-strong); box-shadow: 0 10px 34px rgba(0,0,0,.08); display: flex; flex-direction: column; overflow: hidden; }\n" +
  ".suggestion-inner { padding-bottom: 24px; overflow-y: auto; }\n" +
  ".suggestion-save { top: 18px; right: 18px; }\n" +
  ".suggestion-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px 20px 20px; border-top: 1px solid var(--line); background: #fff; }\n" +
  ".suggestion-actions button { min-height: 50px; border-radius: 14px; border: 1.5px solid var(--line-strong); background: #fff; color: var(--ink); font-size: 13px; font-weight: 850; }\n" +
  ".suggestion-actions button:first-child, .suggestion-actions .create-itinerary-mobile { background: var(--ink); border-color: var(--ink); color: #fff; }\n" +
  ".suggestion-actions button:disabled { opacity: .4; cursor: not-allowed; }\n" +
  ".builder-timeline { min-height: 0; }\n" +
  ".compact-timeline { padding: 12px 0 40px !important; }\n" +
  ".compact-timeline .s-body { display: block; }\n" +
  ".compact-timeline .s-photo { display: none; }\n" +
  ".builder-maps-link { margin-top: 14px; }\n" +
  ".mobile-selected-pill { display: none; }\n" +
  ".mobile-tray-sheet { display: none; }\n" +
  "\n" +
  "@media(max-width: 900px) {\n" +
  "  .builder-screen { height: 100dvh; background: transparent; }\n" +
  "  .builder-layout { display: block; height: 100%; background: transparent; }\n" +
  "  .builder-photo-pane { position: fixed; inset: 0; z-index: 0; }\n" +
  "  .builder-photo-ov { background: linear-gradient(to bottom, rgba(0,0,0,.62), rgba(0,0,0,.06) 45%, rgba(0,0,0,.64)); }\n" +
  "  .builder-photo-meta { left: 20px; top: calc(84px + env(safe-area-inset-top, 0px)); right: 96px; }\n" +
  "  .builder-photo-meta h2 { font-size: 28px; }\n" +
  "  .selected-tray { display: none; }\n" +
  "  .mobile-selected-pill { display: inline-flex; position: fixed; top: calc(24px + env(safe-area-inset-top, 0px)); right: 18px; z-index: 8; align-items: center; gap: 8px; min-height: 42px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.72); background: rgba(0,0,0,.28); color: #fff; font-size: 12px; font-weight: 850; backdrop-filter: blur(12px); }\n" +
  "  .mobile-selected-pill span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); }\n" +
  "  .builder-panel { position: fixed; left: 14px; right: 14px; bottom: 14px; z-index: 4; height: min(58vh, 560px); padding: 0; overflow: visible; background: transparent; }\n" +
  "  .builder-panel-head { display: none; }\n" +
  "  .suggestion-card { height: 100%; border-radius: 26px; overflow: hidden; }\n" +
  "  .suggestion-inner { padding: 24px 18px 12px; overflow-y: auto; }\n" +
  "  .suggestion-inner .rec-card-name { font-size: 25px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }\n" +
  "  .suggestion-inner .rec-card-desc { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }\n" +
  "  .suggestion-actions { grid-template-columns: 1fr; padding: 10px 18px calc(18px + env(safe-area-inset-bottom)); gap: 8px; }\n" +
  "  .suggestion-actions button { min-height: 44px; }\n" +
  "  .suggestion-actions button:nth-child(1), .suggestion-actions button:nth-child(2), .suggestion-actions button:nth-child(3) { display: none; }\n" +
  "  .create-itinerary-mobile { display: block; }\n" +
  "  .builder-timeline { height: 100%; overflow-y: auto; background: #fff; border-radius: 26px; padding: 22px 18px; }\n" +
  "  .builder-timeline .builder-panel-head { display: block; }\n" +
  "  .compact-timeline { padding: 10px 0 20px !important; }\n" +
  "  .mobile-tray-sheet { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-end; background: rgba(0,0,0,.42); backdrop-filter: blur(4px); }\n" +
  "  .mobile-tray-inner { width: 100%; max-height: 72vh; overflow-y: auto; border-radius: 26px 26px 0 0; background: var(--bg); padding: 12px 16px max(22px, env(safe-area-inset-bottom)); }\n" +
  "  .mobile-tray-title { display: flex; align-items: baseline; justify-content: space-between; margin: 10px 0 14px; }\n" +
  "  .mobile-tray-title strong { font-size: 18px; }\n" +
  "  .mobile-tray-title span { font-size: 12px; color: var(--ink-3); font-weight: 700; }\n" +
  "  .mobile-sort-row { display: grid; grid-template-columns: 28px 54px 1fr 34px; align-items: center; gap: 10px; min-height: 66px; border-bottom: 1px solid var(--line); transition: transform .16s var(--ease), background .16s; }\n" +
  "  .mobile-sort-row-dragging { background: rgba(51,153,137,.07); transform: scale(.985); }\n" +
  "  .mobile-sort-row img { width: 54px; height: 46px; border-radius: 10px; object-fit: cover; }\n" +
  "  .mobile-sort-row p { margin: 0; font-size: 14px; font-weight: 800; line-height: 1.2; }\n" +
  "  .mobile-sort-row > button:last-child { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--line-strong); background: #fff; }\n" +
  "  .sort-icon { width: 28px; height: 44px; border: none; background: transparent; color: var(--ink-3); font-size: 18px; cursor: grab; touch-action: none; display: grid; place-items: center; padding: 0; }\n" +
  "  .sort-icon:active { cursor: grabbing; color: var(--accent); }\n" +
  "}\n" +
  "\n" +
  "/* Motion path loading screen */\n" +
  ".motion-loading-screen { position: relative; width: 100vw; min-height: 100dvh; max-width: none; padding: clamp(28px,4vw,54px); overflow: hidden; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 12%, rgba(51,153,137,.12), transparent 32%), var(--bg); }\n" +
  ".motion-loader-copy { position: relative; z-index: 2; max-width: 760px; }\n" +
  ".motion-loader-copy h2 { margin: 6px 0 8px; font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(44px,6vw,82px); line-height: .95; font-weight: 400; color: var(--ink); }\n" +
  ".motion-loader-copy p:last-child { margin: 0; color: var(--ink-3); font-size: 15px; font-weight: 700; }\n" +
  ".motion-map-stage { position: relative; flex: 1; min-height: 420px; display: grid; place-items: center; }\n" +
  ".motion-route-svg { width: min(1120px, 100%); height: min(58vh, 600px); overflow: visible; }\n" +
  ".motion-route-shadow, .motion-route-path { fill: none; stroke-linecap: round; stroke-linejoin: round; }\n" +
  ".motion-route-shadow { stroke: rgba(0,0,0,.08); stroke-width: 24; filter: blur(5px); }\n" +
  ".motion-route-path { stroke: var(--accent); stroke-width: 8; stroke-dasharray: 1500; stroke-dashoffset: 1500; animation: motionPathFill 12s linear forwards; }\n" +
  "@keyframes motionPathFill { to { stroke-dashoffset: 0; } }\n" +
  ".route-stop circle:first-child { fill: #fff; stroke: rgba(51,153,137,.32); stroke-width: 4; transition: fill .25s, stroke .25s; }\n" +
  ".route-stop circle:last-child { fill: rgba(51,153,137,.08); opacity: 0; transform-origin: center; }\n" +
  ".route-stop-active circle:first-child, .route-stop-done circle:first-child { fill: var(--accent); stroke: #fff; }\n" +
  ".route-stop-active circle:last-child { opacity: 1; animation: routePulse 1.15s ease-in-out infinite; }\n" +
  "@keyframes routePulse { 50% { transform: scale(1.35); opacity: .28; } }\n" +
  ".motion-pointer { offset-path: path(\"M92 518 C168 398 282 440 338 318 C404 176 526 158 620 246 C708 328 778 420 884 334 C982 254 1022 138 1110 104\"); offset-rotate: auto; transition: offset-distance .7s var(--ease); filter: drop-shadow(0 10px 18px rgba(0,0,0,.2)); }\n" +
  ".motion-pointer path { fill: var(--ink); stroke: #fff; stroke-width: 2; }\n" +
  ".motion-visual { position: absolute; left: 50%; top: 48%; width: min(360px, 80vw); transform: translate(-50%, -50%); z-index: 4; animation: motionVisualIn .42s var(--ease) both; pointer-events: none; }\n" +
  "@keyframes motionVisualIn { from { opacity: 0; transform: translate(-50%, -42%) scale(.94); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }\n" +
  ".motion-profile-card, .motion-review-card, .motion-ai-card { border-radius: 24px; background: rgba(255,255,255,.86); border: 1px solid rgba(255,255,255,.8); box-shadow: 0 22px 70px rgba(0,0,0,.16); backdrop-filter: blur(18px); padding: 18px; }\n" +
  ".motion-profile-card { display: flex; align-items: center; gap: 14px; }\n" +
  ".motion-profile-card img, .motion-avatar { width: 58px; height: 58px; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: rgba(51,153,137,.14); color: var(--accent); font-size: 24px; }\n" +
  ".motion-profile-card strong, .motion-review-card strong, .motion-ai-card strong { display: block; color: var(--ink); font-size: 17px; font-weight: 900; }\n" +
  ".motion-profile-card p, .motion-review-card p, .motion-ai-card p { margin: 4px 0 0; color: var(--ink-3); font-size: 13px; font-weight: 700; }\n" +
  ".motion-mood-stack { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }\n" +
  ".motion-mood-stack span { min-height: 44px; display: inline-flex; align-items: center; padding: 0 16px; border-radius: 999px; background: #fff; border: 1px solid rgba(51,153,137,.28); color: var(--ink); font-size: 13px; font-weight: 900; box-shadow: 0 12px 30px rgba(0,0,0,.1); animation: motionChipIn .35s var(--ease) both; }\n" +
  "@keyframes motionChipIn { from { opacity: 0; transform: translateY(10px); } }\n" +
  ".motion-review-card p { animation: motionChipIn .35s var(--ease) both; }\n" +
  ".motion-photo-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; padding: 10px; border-radius: 26px; background: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.82); box-shadow: 0 22px 70px rgba(0,0,0,.16); backdrop-filter: blur(18px); }\n" +
  ".motion-photo-grid img { width: 100%; aspect-ratio: 1.15; object-fit: cover; border-radius: 18px; }\n" +
  ".motion-ai-card { text-align: center; }\n" +
  ".motion-ai-card span { display: grid; place-items: center; width: 46px; height: 46px; margin: 0 auto 10px; border-radius: 50%; background: var(--accent); color: #fff; }\n" +
  ".motion-loader-status { position: relative; z-index: 5; margin-top: auto; }\n" +
  ".motion-status-row { display: flex; align-items: center; gap: clamp(12px,2vw,26px); overflow: hidden; white-space: nowrap; padding-bottom: 18px; color: var(--ink-3); font-size: clamp(12px,1.55vw,25px); font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }\n" +
  ".motion-status-row span { display: inline-flex; align-items: center; gap: 8px; min-width: 0; max-width: 280px; overflow: hidden; text-overflow: ellipsis; }\n" +
  ".motion-status-row span::before { content: \"\"; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex: 0 0 auto; }\n" +
  ".motion-status-row .active { color: var(--ink); }\n" +
  ".motion-status-row .done { color: var(--ink-2); }\n" +
  ".motion-bar-track { height: 6px; border-radius: 999px; background: rgba(51,153,137,.16); overflow: hidden; }\n" +
  "\n" +
  "/* Builder refinements */\n" +
  ".suggestion-card::before, .suggestion-card::after { content: \"\"; position: absolute; left: 20px; right: 20px; bottom: -12px; height: 24px; border-radius: 0 0 24px 24px; border: 1px solid var(--line-strong); background: rgba(255,255,255,.7); z-index: -1; }\n" +
  ".suggestion-card::after { left: 38px; right: 38px; bottom: -22px; opacity: .65; }\n" +
  ".suggestion-card { overflow: visible; z-index: 1; }\n" +
  ".suggestion-inner { border-radius: 24px 24px 0 0; background: #fff; }\n" +
  ".suggestion-actions { border-radius: 0 0 24px 24px; }\n" +
  ".suggestion-card-added { animation: cardFlyToTray .58s var(--ease) both; }\n" +
  "@keyframes cardFlyToTray { 0% { transform: translateY(0) scale(1); opacity: 1; } 58% { transform: translateY(-92px) scale(.84); opacity: .92; } 100% { transform: translateY(-132px) scale(.72); opacity: 0; } }\n" +
  ".suggestion-save-done { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; animation: savePop .32s var(--ease) both; }\n" +
  "@keyframes savePop { 50% { transform: scale(1.12); } }\n" +
  ".suggestion-actions { grid-template-columns: 1fr !important; }\n" +
  ".suggestion-actions .create-plan-inline { display: none; }\n" +
  ".builder-create-plan { margin-top: 18px; width: 100%; min-height: 58px; border: none; border-radius: 18px; background: var(--accent); color: #fff; font-size: 16px; font-weight: 900; box-shadow: 0 16px 34px rgba(51,153,137,.24); }\n" +
  ".create-itinerary-side { min-height: 132px; background: var(--accent); box-shadow: 0 12px 28px rgba(0,0,0,.18); }\n" +
  ".builder-final-actions { display: flex; align-items: flex-start; gap: 12px; margin-top: 14px; }\n" +
  ".builder-maps-link { min-height: 52px; margin-top: 0 !important; flex: 0 0 auto; width: fit-content; min-width: 190px; padding-inline: 34px; justify-content: center; }\n" +
  ".builder-icon-stack { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }\n" +
  ".builder-icon-btn { position: relative; width: 52px; height: 52px; border-radius: 16px; border: 1.5px solid var(--line-strong); background: #fff; color: var(--ink); display: flex; align-items: center; justify-content: center; transition: width .22s var(--ease), background .16s, border-color .16s; overflow: hidden; }\n" +
  ".builder-icon-btn::after { content: attr(data-label); max-width: 0; overflow: hidden; white-space: nowrap; opacity: 0; margin-left: 0; font-size: 13px; font-weight: 900; transition: max-width .22s var(--ease), opacity .16s, margin-left .16s; }\n" +
  ".builder-icon-btn:hover { width: 172px; justify-content: flex-start; padding-left: 16px; background: var(--surface-2); border-color: var(--ink); }\n" +
  ".builder-icon-btn:hover::after { max-width: 116px; opacity: 1; margin-left: 10px; }\n" +
  ".stop-active .s-pin { background: var(--accent) !important; border-color: var(--accent) !important; box-shadow: 0 0 0 7px rgba(51,153,137,.16); }\n" +
  ".compact-timeline .stop:hover .s-pin { background: var(--surface-3); border-color: var(--line-strong); }\n" +
  "\n" +
  "@media(max-width: 900px) {\n" +
  "  .motion-loading-screen { padding: 24px 18px max(20px, env(safe-area-inset-bottom)); }\n" +
  "  .motion-loader-copy h2 { font-size: 42px; }\n" +
  "  .motion-map-stage { min-height: 440px; }\n" +
  "  .motion-route-svg { width: 126%; height: 430px; }\n" +
  "  .motion-visual { top: 50%; width: min(320px, 86vw); }\n" +
  "  .motion-status-row { font-size: 12px; gap: 14px; padding-bottom: 14px; }\n" +
  "  .motion-status-row span { max-width: 170px; }\n" +
  "\n" +
  "  .suggestion-card::before, .suggestion-card::after { display: block; }\n" +
  "  .suggestion-actions { grid-template-columns: 1fr !important; padding: 10px 18px max(18px, env(safe-area-inset-bottom)) !important; }\n" +
  "  .suggestion-actions button { display: flex !important; align-items: center; justify-content: center; width: 100%; }\n" +
  "  .suggestion-actions .create-plan-inline { display: flex; background: var(--accent) !important; border-color: var(--accent) !important; color: #fff !important; }\n" +
  "  .builder-create-plan { display: none; }\n" +
  "  .mobile-tray-inner { padding: 12px 22px max(24px, env(safe-area-inset-bottom)) !important; }\n" +
  "  .mobile-tray-inner .rec-mbar-btn { width: 100%; min-height: 54px; justify-content: center; }\n" +
  "  .builder-screen.itinerary-built { height: auto; min-height: 100dvh; overflow: visible; background: var(--bg); }\n" +
  "  .builder-screen.itinerary-built .builder-layout { min-height: 100dvh; height: auto; display: block; background: var(--bg); }\n" +
  "  .builder-screen.itinerary-built .builder-photo-pane { position: relative; height: 42svh; min-height: 300px; inset: auto; }\n" +
  "  .builder-screen.itinerary-built .builder-panel { position: relative; left: auto; right: auto; bottom: auto; height: auto; min-height: 0; padding: 0 16px 36px; background: var(--bg); }\n" +
  "  .builder-screen.itinerary-built .builder-timeline { height: auto; overflow: visible; border-radius: 24px 24px 0 0; margin-top: -28px; padding: 24px 18px 34px; }\n" +
  "  .builder-screen.itinerary-built .builder-panel-head { display: block; }\n" +
  "  .builder-screen.itinerary-built .builder-final-actions { align-items: stretch; }\n" +
  "  .builder-screen.itinerary-built .builder-icon-stack { flex-direction: column; }\n" +
  "  .builder-screen.itinerary-built .builder-icon-btn { width: 52px; flex: 0 0 52px; }\n" +
  "  .builder-screen.itinerary-built .builder-icon-btn:hover { width: 150px; }\n" +
  "  .builder-screen.itinerary-built .compact-timeline { padding: 18px 0 20px !important; }\n" +
  "}\n" +
  "\n" +
  "/* Restored motion-path loader */\n" +
  ".loading-screen.on { position: relative; width: 100vw; min-height: 100dvh; max-width: none; padding: 0; overflow: hidden; background: radial-gradient(circle at 50% 10%, rgba(51,153,137,.12), transparent 34%), var(--bg); }\n" +
  ".motion-loader-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 2; padding: clamp(28px,4vw,64px); overflow: visible; }\n" +
  ".motion-path-shadow, .motion-path-base, .motion-path-draw { fill: none; stroke-linecap: round; stroke-linejoin: round; }\n" +
  ".motion-path-shadow { stroke: rgba(0,0,0,.08); stroke-width: 24; filter: blur(6px); }\n" +
  ".motion-path-base { stroke: rgba(51,153,137,.15); stroke-width: 8; }\n" +
  ".motion-path-draw { stroke: var(--accent); stroke-width: 7; stroke-dasharray: 1500; stroke-dashoffset: 1500; animation: motionPathFill 12s linear forwards; }\n" +
  ".motion-node circle:first-child { fill: #fff; stroke: rgba(51,153,137,.36); stroke-width: 3; }\n" +
  ".motion-node circle:last-child { fill: rgba(51,153,137,.1); opacity: 0; transform-origin: center; }\n" +
  ".motion-node-on circle:first-child { fill: var(--accent); stroke: #fff; }\n" +
  ".motion-node-on circle:last-child { opacity: 1; animation: routePulse 1.15s ease-in-out infinite; }\n" +
  ".motion-svg-pointer { filter: drop-shadow(0 12px 18px rgba(0,0,0,.22)); }\n" +
  ".motion-svg-pointer path { fill: var(--ink); stroke: #fff; stroke-width: 2; }\n" +
  ".motion-loader-title { position: absolute; top: clamp(28px,5vh,54px); left: clamp(22px,5vw,72px); z-index: 6; max-width: min(520px, calc(100% - 44px)); }\n" +
  ".motion-loader-title p { margin: 0 0 7px; font-size: 11px; font-weight: 800; color: var(--accent); letter-spacing: .13em; text-transform: uppercase; }\n" +
  ".motion-loader-title h2 { margin: 0; font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(34px,5vw,72px); font-weight: 400; line-height: .94; color: var(--ink); }\n" +
  ".motion-callouts { position: absolute; inset: 0; z-index: 7; pointer-events: none; }\n" +
  ".motion-callout { position: absolute; width: min(330px,34vw); display: grid; grid-template-columns: 70px 1fr; gap: 14px; align-items: center; padding: 14px; border-radius: 18px; background: rgba(255,255,255,.82); border: 1px solid rgba(51,153,137,.22); box-shadow: 0 18px 48px rgba(0,0,0,.10); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); opacity: 0; transform: translateY(10px) scale(.96); transition: opacity .28s, transform .32s; }\n" +
  ".motion-callout-active, .motion-callout-done { opacity: 1; transform: translateY(0) scale(1); }\n" +
  ".motion-callout-done { opacity: .38; }\n" +
  ".motion-callout-0 { left: 7%; bottom: 20%; }\n" +
  ".motion-callout-1 { left: 25%; top: 38%; }\n" +
  ".motion-callout-2 { left: 46%; top: 18%; }\n" +
  ".motion-callout-3 { right: 16%; top: 44%; }\n" +
  ".motion-callout-4 { right: 5%; top: 20%; }\n" +
  ".motion-callout .motion-visual { position: static; width: 70px; height: 70px; border-radius: 16px; background: rgba(51,153,137,.08); color: var(--accent); display: flex; align-items: center; justify-content: center; overflow: hidden; transform: none; animation: none; pointer-events: none; }\n" +
  ".motion-callout p { margin: 0; font-size: 14px; font-weight: 850; color: var(--ink); letter-spacing: -.01em; }\n" +
  ".motion-callout span { display: block; margin-top: 4px; font-size: 12px; font-weight: 600; color: var(--ink-3); line-height: 1.35; }\n" +
  ".motion-profile { position: relative; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; }\n" +
  ".motion-profile-ring { position: absolute; inset: -8px; border-radius: 50%; border: 3px solid rgba(51,153,137,.18); border-top-color: var(--accent); animation: calSpin 1.1s linear infinite; }\n" +
  ".motion-profile img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }\n" +
  ".motion-vibes { display: flex; flex-direction: column; gap: 5px; width: 100%; padding: 8px; }\n" +
  ".motion-vibes span { margin: 0; padding: 4px 8px; border-radius: 999px; background: #fff; color: var(--accent); font-size: 10px; font-weight: 800; text-align: center; }\n" +
  ".motion-reviews { display: grid; gap: 5px; width: 100%; padding: 8px; }\n" +
  ".motion-reviews span { margin: 0; border-radius: 999px; padding: 5px 8px; background: #fff; color: var(--accent); font-size: 11px; font-weight: 850; }\n" +
  ".motion-photo-stack { position: relative; width: 58px; height: 58px; }\n" +
  ".motion-photo-stack img { position: absolute; inset: 0; width: 44px; height: 44px; border-radius: 10px; object-fit: cover; transform: translate(calc(var(--i) * 7px), calc(var(--i) * 5px)) rotate(calc((var(--i) - 1) * 8deg)); border: 2px solid #fff; }\n" +
  ".motion-gemini { width: 100%; padding: 10px; display: grid; gap: 6px; }\n" +
  ".motion-gemini span { margin: 0 auto 2px; font-size: 18px; color: var(--accent); animation: coreGlow 1.4s ease-in-out infinite; }\n" +
  ".motion-gemini i { display: block; height: 6px; border-radius: 999px; background: rgba(51,153,137,.25); animation: shimmer 1.2s ease-in-out infinite; }\n" +
  ".motion-loader-bottom { position: absolute; left: clamp(18px,5vw,70px); right: clamp(18px,5vw,70px); bottom: max(18px, env(safe-area-inset-bottom)); z-index: 9; display: flex; flex-direction: column; gap: 13px; }\n" +
  ".motion-loader-bottom .motion-status-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; padding-bottom: 0; color: inherit; font-size: inherit; letter-spacing: inherit; text-transform: none; }\n" +
  ".motion-status { min-width: 0; display: flex; align-items: center; gap: 8px; color: var(--ink-3); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }\n" +
  ".motion-status span { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--surface-3); }\n" +
  ".motion-status span::before, .motion-loader-bottom .motion-status-row span::before { display: none; }\n" +
  ".motion-status p { margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }\n" +
  ".motion-status-active, .motion-status-done { color: var(--ink); }\n" +
  ".motion-status-active span, .motion-status-done span { background: var(--accent); }\n" +
  ".motion-status-active span { animation: lpulse 1s ease-in-out infinite; }\n" +
  ".motion-loader-bottom .loader-bar-track { height: 4px; background: rgba(51,153,137,.14); }\n" +
  ".motion-loader-bottom .loader-bar-fill { height: 4px; background: var(--accent); }\n" +
  "\n" +
  ".suggestion-actions { grid-template-columns: 1fr 1fr !important; }\n" +
  ".suggestion-actions button:first-child { background: var(--ink); border-color: var(--ink); color: #fff; }\n" +
  ".suggestion-actions button:nth-child(2) { background: #fff; border-color: var(--line-strong); color: var(--ink); }\n" +
  "\n" +
  "@media(max-width: 900px) {\n" +
  "  .app-shell.result-active.itinerary-final-active { height: auto !important; min-height: 100dvh !important; overflow: visible !important; padding-bottom: 0 !important; }\n" +
  "  .app-shell.result-active.itinerary-final-active .builder-screen { height: auto !important; overflow: visible !important; }\n" +
  "  .motion-loader-svg { padding: 0; width: 145%; left: -22%; }\n" +
  "  .motion-loader-title { top: 28px; left: 20px; }\n" +
  "  .motion-loader-title h2 { font-size: 42px; }\n" +
  "  .motion-svg-pointer { transform: scale(.86); transform-origin: center; }\n" +
  "  .motion-callout { width: min(310px, calc(100vw - 36px)); grid-template-columns: 58px 1fr; padding: 12px; }\n" +
  "  .motion-callout .motion-visual { width: 58px; height: 58px; border-radius: 14px; }\n" +
  "  .motion-callout-0 { left: 18px; bottom: 31%; }\n" +
  "  .motion-callout-1 { left: 26px; top: 35%; }\n" +
