/* eslint-disable no-unused-vars, no-empty, react-refresh/only-export-components, react-hooks/exhaustive-deps */
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
  const [autocompleteError, setAutocompleteError] = useState("");
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
      const clearTimer = setTimeout(() => {
        setAutocompleteError("");
        setPlacePredictions([]);
      }, 0);
      return () => clearTimeout(clearTimer);
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAutocompleting(true);
      setAutocompleteError("");
      try {
        const response = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data.suggestions)) {
          setPlacePredictions(data.suggestions);
          setAutocompleteError(data.suggestions.length ? "" : data.error || "");
        }
      } catch (error) {
        console.warn("Autocomplete fallback:", error);
        if (!cancelled) {
          setPlacePredictions([]);
          setAutocompleteError("Could not load Google suggestions.");
        }
      } finally {
        if (!cancelled) setIsAutocompleting(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [destination]);

  const destinationOptions = placePredictions;

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
              {showDestinationSuggestions && destination.trim().length >= 2 && !destinationOptions.find(o => o.label === destination) && (
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
                  {isAutocompleting && destinationOptions.length === 0 && <div className="autocomplete-loading">Searching...</div>}
                  {!isAutocompleting && destinationOptions.length === 0 && autocompleteError && <div className="autocomplete-loading">{autocompleteError}</div>}
                  {!isAutocompleting && destinationOptions.length === 0 && !autocompleteError && <div className="autocomplete-loading">No suggestions yet. Keep typing or press Next.</div>}
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

createRoot(document.getElementById("root")).render(<App />);
