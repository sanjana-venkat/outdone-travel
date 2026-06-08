import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate(value) {
  if (!value) return "Today";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

const vibeImages = [
  {
    id: "lantern",
    title: "Lantern alleys",
    tag: "Romantic · local",
    signal: "intimate evening walks, old streets, quiet discovery",
    img: "https://images.pexels.com/photos/1510595/pexels-photo-1510595.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "nature",
    title: "Slow nature",
    tag: "Quiet · scenic",
    signal: "soft mornings, gardens, rivers, open air",
    img: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "food",
    title: "Local food",
    tag: "Taste · discovery",
    signal: "markets, vegetarian-friendly food, local cafés",
    img: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "luxury",
    title: "Soft luxury",
    tag: "Beautiful · calm",
    signal: "slow hotels, elevated experiences, intentional pacing",
    img: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "hidden",
    title: "Hidden gems",
    tag: "Unexpected · intimate",
    signal: "less obvious places, charming detours, local texture",
    img: "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "creative",
    title: "Creative spark",
    tag: "Design · art · inspiration",
    signal: "galleries, architecture, design stores, creative cafés",
    img: "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=1400"
  }
];

const fallbackItinerary = (destination, date, story, dna) => ({
  destination,
  dates: prettyDate(date),
  selectedMood: story,
  travelDNA: dna,
  summary:
    "A mood-first day plan shaped around your current energy, visual preferences, dietary needs, and lightweight Google profile.",
  stops: [
    {
      time: "8:30",
      period: "AM",
      category: "Dawn · reset",
      name: `${destination} slow morning`,
      description:
        "Start with a scenic, low-friction moment that gives the day an intentional beginning.",
      photoQuery: `${destination} morning aesthetic`,
      routeFromPrevious: "Start of plan"
    },
    {
      time: "12:30",
      period: "PM",
      category: "Local · flavor",
      name: "Mood-matched lunch",
      description:
        "A thoughtful food stop chosen around your dietary preferences and the vibe you selected.",
      photoQuery: `${destination} local lunch`,
      routeFromPrevious: "Easy route from previous stop"
    },
    {
      time: "4:30",
      period: "PM",
      category: "Signature · moment",
      name: "Golden-hour experience",
      description:
        "A memorable moment designed around the story you want this day to tell.",
      photoQuery: `${destination} golden hour`,
      routeFromPrevious: "Short afternoon transit"
    },
    {
      time: "7:00",
      period: "PM",
      category: "Evening · glow",
      name: "Atmospheric evening walk",
      description:
        "End with a softer, cinematic stop that matches your emotional direction for the day.",
      photoQuery: `${destination} night lights`,
      routeFromPrevious: "Easy evening walk"
    }
  ]
});

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("Kyoto, Japan");
  const [date, setDate] = useState(getToday());
  const [diet, setDiet] = useState("Vegetarian");
  const [planFor, setPlanFor] = useState("Date");
  const [story, setStory] = useState("A slow romantic day");
  const [selectedVibes, setSelectedVibes] = useState(["lantern", "nature"]);
  const [dna, setDna] = useState({
    pacing: 35,
    socialEnergy: 25,
    adventure: 48,
    structure: 62,
    discovery: 72
  });
  const [loadingLine, setLoadingLine] = useState(0);
  const [itinerary, setItinerary] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState("");
  const shellRef = useRef(null);

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
    return () => {
      window.removeEventListener("pointermove", moveGlow);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== "login") return;

    let attempts = 0;
    let cancelled = false;

    const loadGoogleButton = () => {
      const buttonContainer = document.getElementById("googleSignIn");

      if (cancelled || !buttonContainer) {
        attempts += 1;
        if (!cancelled && attempts < 30) setTimeout(loadGoogleButton, 200);
        return;
      }

      if (!window.google?.accounts?.id) {
        attempts += 1;
        if (attempts < 40) setTimeout(loadGoogleButton, 200);
        return;
      }

      setGoogleReady(true);

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          setUser({
            name: payload.name,
            email: payload.email,
            picture: payload.picture
          });
          setStep("setup");
        }
      });

      buttonContainer.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320
      });
    };

    loadGoogleButton();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const selectedVibeObjects = selectedVibes
    .map((id) => vibeImages.find((v) => v.id === id))
    .filter(Boolean);

  const loadingItems = useMemo(
    () => [
      user?.name ? `${user.name}'s lightweight profile` : "Quick feeler profile",
      "Occasion and destination",
      "Mood today",
      "Visual vibe selection",
      "Dietary preferences",
      "Local place curation",
      "Gemini plan generation"
    ],
    [user]
  );

  function toggleVibe(id) {
    setSelectedVibes((current) => {
      if (current.includes(id)) return current.filter((v) => v !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function updateDna(key, value) {
    setDna({ ...dna, [key]: Number(value) });
  }

  async function generatePlan() {
    setStep("loading");
    setError("");
    setLoadingLine(0);

    const start = Date.now();
    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, loadingItems.length - 2));
    }, 480);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          destination,
          dates: prettyDate(date),
          date,
          diet,
          travelWith: planFor,
          story,
          selectedVibes: selectedVibeObjects,
          dna,
          instruction:
            "Create a mood-first day plan, not only a travel itinerary. Return JSON with destination, dates, summary and stops."
        })
      });

      if (!res.ok) throw new Error("Gemini API route failed");

      const data = await res.json();
      setItinerary(data);
    } catch (err) {
      console.error(err);
      setError("Gemini took too long, so this is a local preview.");
      setItinerary(fallbackItinerary(destination, date, story, dna));
    } finally {
      clearInterval(interval);
      setLoadingLine(loadingItems.length - 1);
      const elapsed = Date.now() - start;
      const minDelay = Math.max(0, 1300 - elapsed);
      setTimeout(() => setStep("result"), minDelay + 400);
    }
  }

  return (
    <div className="app-shell" ref={shellRef}>
      <style>{css}</style>
      <Starfield />
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />

      <nav className="navbar">
        <button className="brand" onClick={() => setStep("login")}>
          <span className="brand-logo">✦</span>
          <span>Travel DNA</span>
        </button>

        <div className="nav-steps">
          {["Setup", "Vibe", "Result"].map((label, i) => {
            const order = ["setup", "vibes", "result"];
            const active = step === order[i];
            const done = order.indexOf(step) > i || step === "loading";
            return (
              <span className={active ? "active" : done ? "done" : ""} key={label}>
                <i /> {label}
              </span>
            );
          })}
        </div>

        {step !== "login" && (
          <button className="btn-outline" onClick={() => setStep("setup")}>
            ↩ Start over
          </button>
        )}
      </nav>

      {step === "login" && (
        <main className="screen hero-screen on">
          <section className="hero-inner">
            <div className="hero-left">
              <div className="hero-pill">
                <div className="pulse" />
                <span>Powered by Gemini</span>
              </div>

              <h1>
                Plan anything built for <span>right now.</span>
              </h1>
              <p>
                A single evening. A full day. A whole trip. Every moment shaped
                around who you want to be today — not just where you're going.
              </p>

              <div className="hero-cta">
                <div className="google-wrap">
                  <div id="googleSignIn" />
                  {!googleReady && GOOGLE_CLIENT_ID && (
                    <div className="google-loading">Loading Google sign in...</div>
                  )}
                </div>
                <button className="btn-accent" onClick={() => setStep("setup")}>
                  Continue without sign in →
                </button>
              </div>
            </div>

            <div className="hero-cards">
              {vibeImages.slice(0, 3).map((vibe, i) => (
                <div className={`hcard hcard-${i + 1}`} key={vibe.id}>
                  <img src={vibe.img} alt="" />
                  <div>{vibe.title}</div>
                </div>
              ))}
              <div className="hero-stat hs1">
                <b>320</b>
                <span>unique day shapes</span>
              </div>
              <div className="hero-stat hs2">
                <b className="gem">AI</b>
                <span>personalized</span>
              </div>
            </div>
          </section>
        </main>
      )}

      {step === "setup" && (
        <main className="screen on">
          <section className="setup-header">
            <p className="label">Step 1 / 2</p>
            <h2>Where and when?</h2>
            <p>Tell us the basics. Gemini will handle the mood-matching.</p>
          </section>

          <section className="setup-grid">
            <div className="form-panel">
              <label>
                <span>Destination</span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City, neighborhood, or place"
                />
              </label>

              <label>
                <span>When</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label>
                <span>Occasion or mood</span>
                <input
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="A slow romantic day..."
                />
              </label>

              <Select
                label="Dietary preference"
                value={diet}
                setValue={setDiet}
                options={["Vegetarian", "Vegan", "No restrictions", "Gluten-free"]}
              />

              <Select
                label="Going with"
                value={planFor}
                setValue={setPlanFor}
                options={["Solo", "Date", "Friends", "Family", "Workday"]}
              />

              <div className="pi-card">
                <div className="spark">✦</div>
                <p className="label">Personal Intelligence Preview</p>
                <h3>We don't have full access to your Google Personal Intelligence yet.</h3>
                <p>
                  We're working on it. Soon, we’ll skip these questions with your
                  Google data. For now, give us a quick feeler.
                </p>
                {user ? (
                  <div className="profile-chip">
                    <img src={user.picture} alt="" />
                    Signed in as {user.name}
                  </div>
                ) : (
                  <div className="profile-chip">Quick feeler mode</div>
                )}
              </div>

              <button className="btn-accent" onClick={() => setStep("vibes")}>
                Choose your vibe →
              </button>
            </div>

            <aside className="preview-card">
              <img src={selectedVibeObjects[0]?.img || vibeImages[0].img} alt="" />
              <div>
                <h3>{destination || "Your destination"}</h3>
                <p>{prettyDate(date)}</p>
                <div className="preview-tags">
                  <span>Powered by Gemini</span>
                  <span>{diet}</span>
                  <span>{planFor}</span>
                </div>
              </div>
            </aside>
          </section>
        </main>
      )}

      {step === "vibes" && (
        <main className="screen vibe-screen on">
          <section className="vibe-header">
            <p className="label">Step 2 / 2 · Choose up to 3</p>
            <h2>
              What's your <span className="gem">vibe today?</span>
            </h2>
            <p>Images give Gemini a faster read on the emotional texture you want.</p>
          </section>

          <section className="vibe-mosaic">
            {vibeImages.map((vibe, i) => (
              <button
                key={vibe.id}
                className={`vm vm-${i + 1} ${
                  selectedVibes.includes(vibe.id) ? "selected" : ""
                }`}
                onClick={() => toggleVibe(vibe.id)}
              >
                <img src={vibe.img} alt={vibe.title} loading="lazy" />
                <div className="vm-overlay" />
                <div className="vm-check">✓</div>
                <div className="vm-content">
                  <span>0{i + 1}</span>
                  <strong>{vibe.title}</strong>
                  <p>{vibe.tag}</p>
                </div>
              </button>
            ))}
          </section>

          <section className="vibe-footer">
            <div>
              {selectedVibeObjects.length ? (
                selectedVibeObjects.map((v) => <span key={v.id}>{v.title}</span>)
              ) : (
                <p>No vibes selected yet — choose up to 3</p>
              )}
            </div>
            <button className="btn-accent" onClick={generatePlan}>
              Build with Gemini ✦
            </button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="screen loading-screen on">
          <div className="loader-ring">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="label">Gemini is thinking</p>
          <h2>
            Decoding your <span className="gem">day DNA</span>
          </h2>

          <div className="load-strands">
            {loadingItems.map((item, i) => (
              <div className={i <= loadingLine ? "on" : ""} key={item}>
                <b />
                <span>{item}</span>
                <em>Done</em>
              </div>
            ))}
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="result-screen on">
          <section className="res-hero">
            <img src={selectedVibeObjects[0]?.img || vibeImages[0].img} alt="" />
            <div className="res-gradient" />
            <div className="res-content">
              <span className="res-tag">{story}</span>
              <h2>{itinerary?.destination || destination}</h2>
              <p>{itinerary?.dates || prettyDate(date)} · {selectedVibeObjects.map(v => v.title).join(", ")}</p>
              {error && <p className="error">{error}</p>}
            </div>
          </section>

          <section className="action-bar">
            <button className="btn-outline" onClick={() => setStep("setup")}>
              Edit plan
            </button>
            <button className="btn-outline" onClick={() => setStep("vibes")}>
              Change vibe
            </button>
            <button className="btn-accent" onClick={generatePlan}>
              Regenerate ✦
            </button>
          </section>

          <section className="timeline">
            <p className="label">Today's flow</p>
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={`${stop.name}-${i}`}>
                <div className={i === 0 ? "s-pin featured" : "s-pin"}>⌖</div>
                <div className="s-body">
                  <p className="s-cat">{stop.category}</p>
                  <h3>
                    {stop.time} <span>{stop.period}</span>
                  </h3>
                  <h4>{stop.name}</h4>
                  <p>{stop.description}</p>
                  <div
                    className="s-photo"
                    style={{ background: gradientFor(i) }}
                  >
                    <span>{stop.photoQuery || stop.name}</span>
                  </div>
                  <small>{stop.routeFromPrevious}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="dna-panel">
            <p className="label">Fine tune after seeing the plan</p>
            <h3>Adjust the mood knobs</h3>
            <Slider label="Pacing" left="Relaxed" right="Structured" value={dna.pacing} onChange={(v) => updateDna("pacing", v)} />
            <Slider label="Social Energy" left="Private" right="Social" value={dna.socialEnergy} onChange={(v) => updateDna("socialEnergy", v)} />
            <Slider label="Adventure" left="Comfort" right="Exploratory" value={dna.adventure} onChange={(v) => updateDna("adventure", v)} />
            <Slider label="Planning" left="Spontaneous" right="Planned" value={dna.structure} onChange={(v) => updateDna("structure", v)} />
            <Slider label="Discovery" left="Familiar" right="Novel" value={dna.discovery} onChange={(v) => updateDna("discovery", v)} />
          </section>
        </main>
      )}
    </div>
  );
}

function Starfield() {
  return (
    <div className="stars">
      {Array.from({ length: 90 }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 4 + 2}s`
          }}
        />
      ))}
    </div>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <div className="field-block">
      <p className="field-label">{label}</p>
      <div className="chips">
        {options.map((option) => (
          <button
            type="button"
            className={value === option ? "chip active" : "chip"}
            onClick={() => setValue(option)}
            key={option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, left, right, value, onChange }) {
  return (
    <div className="slider-card">
      <div>
        <b>{label}</b>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        style={{ "--p": `${value}%` }}
        onChange={(e) => onChange(e.target.value)}
      />
      <p>
        <span>{left}</span>
        <span>{right}</span>
      </p>
    </div>
  );
}

function gradientFor(index) {
  const gradients = [
    "linear-gradient(155deg,#0D2010,#1A3A1A 30%,#2D5A27 55%,#8B6000 80%)",
    "linear-gradient(155deg,#1A0800,#8B5014 40%,#C47C20 70%)",
    "linear-gradient(155deg,#0A1220,#1A2E55 35%,#2D4A8B 60%,#8B2500 85%)",
    "linear-gradient(155deg,#0A0515,#1A1035 35%,#2D1A55 60%,#8B3A6B 85%)"
  ];
  return gradients[index % gradients.length];
}

const css = `
html,
body,
#root {
  width: 100%;
  min-height: 100%;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

:root {
  --bg: #080a0e;
  --s1: #0d1117;
  --s2: #131920;
  --s3: #1a2230;
  --bdr: rgba(255, 255, 255, 0.07);
  --bdr2: rgba(255, 255, 255, 0.12);
  --ink: #f0f2f5;
  --ink2: #8892a0;
  --ink3: #4a5260;
  --blue: #1a73e8;
  --blue2: #4d9eff;
  --accent: #00d4aa;
  --accent2: rgba(0, 212, 170, 0.12);
  --gold: #f5a623;
  --ease: cubic-bezier(.16, 1, .3, 1);
  --spring: cubic-bezier(.34, 1.56, .64, 1);
}

body {
  font-family: 'Google Sans', Inter, system-ui, sans-serif;
  background: var(--bg);
  color: var(--ink);
  overflow-x: hidden;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 80px;
  overflow-x: hidden;
}

.stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.stars i {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: .25;
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: .08; }
  50% { opacity: .62; }
}

.aurora {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  animation: aurdrift 22s ease-in-out infinite;
}

.a1 {
  width: 800px;
  height: 400px;
  top: -100px;
  left: -200px;
  background: radial-gradient(ellipse, rgba(26, 115, 232, .15), transparent 65%);
}

.a2 {
  width: 700px;
  height: 350px;
  bottom: -80px;
  right: -180px;
  background: radial-gradient(ellipse, rgba(0, 212, 170, .12), transparent 65%);
  animation-delay: -10s;
}

.a3 {
  width: 500px;
  height: 300px;
  top: 40%;
  left: 25%;
  background: radial-gradient(ellipse, rgba(245, 166, 35, .06), transparent 65%);
  animation-delay: -15s;
}

@keyframes aurdrift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  30% { transform: translate(40px, -30px) scale(1.06); }
  60% { transform: translate(-30px, 40px) scale(.94); }
}

.navbar {
  width: 100%;
  height: 64px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--bdr);
  background: rgba(8, 10, 14, .72);
  backdrop-filter: blur(24px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: 0;
  color: var(--ink);
  font-weight: 700;
}

.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: linear-gradient(135deg, var(--blue), var(--accent));
  display: grid;
  place-items: center;
  color: #fff;
}

.nav-steps {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-steps span {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink3);
}

.nav-steps span.active {
  color: var(--ink);
  background: var(--s2);
  border: 1px solid var(--bdr2);
}

.nav-steps span.done {
  color: var(--accent);
}

.nav-steps i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid var(--bdr2);
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink2);
  transition: all .2s;
}

.btn-outline:hover {
  border-color: rgba(255,255,255,.25);
  color: var(--ink);
  background: var(--s2);
}

.btn-accent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  color: #080a0e;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  transition: all .2s var(--spring);
}

.btn-accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 212, 170, .3);
}

.screen {
  display: block;
  width: 100%;
  max-width: 1100px;
  padding: 60px 40px;
  animation: scIn .55s var(--ease) both;
  position: relative;
  z-index: 1;
}

@keyframes scIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* TYPE */
.label,
.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink3);
}

h1,
h2 {
  font-family: 'Google Sans Display', 'Google Sans', system-ui, sans-serif;
  color: var(--ink);
}

h1 {
  font-size: clamp(52px, 7vw, 88px);
  font-weight: 800;
  line-height: .95;
  letter-spacing: -.04em;
  margin: 0;
}

h2 {
  font-size: clamp(36px, 5vw, 60px);
  font-weight: 800;
  line-height: .97;
  letter-spacing: -.035em;
  margin: 10px 0 8px;
}

p {
  font-size: 16px;
  line-height: 1.75;
  color: var(--ink2);
}

.gem,
h1 span {
  background: linear-gradient(90deg, #4285f4 0%, #1a73e8 20%, var(--accent) 55%, #1a73e8 80%, #4285f4 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gsh 5s linear infinite;
}

@keyframes gsh {
  to { background-position: -300% center; }
}

/* HERO */
.hero-screen {
  padding-top: 100px;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  min-height: 60vh;
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent2);
  border: 1px solid rgba(0, 212, 170, .2);
  border-radius: 100px;
  padding: 6px 14px;
  width: fit-content;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .5; transform: scale(1.4); }
}

.hero-pill span {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
}

.hero-cta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.google-wrap {
  min-height: 44px;
}

.google-loading {
  color: var(--ink3);
  font-size: 13px;
  font-weight: 700;
}

.hero-cards {
  position: relative;
  height: 420px;
}

.hcard {
  position: absolute;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--bdr2);
  box-shadow: 0 24px 64px rgba(0,0,0,.5);
  animation: hfloat 7s ease-in-out infinite;
}

.hcard-1 { width: 240px; height: 160px; top: 20px; left: 20px; transform: rotate(-3deg); }
.hcard-2 { width: 200px; height: 140px; top: 60px; right: 0; transform: rotate(4deg); animation-delay: -3s; }
.hcard-3 { width: 220px; height: 150px; bottom: 40px; left: 60px; transform: rotate(2deg); animation-delay: -5s; }

@keyframes hfloat {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -14px; }
}

.hcard img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hcard div {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 14px;
  background: linear-gradient(to top, rgba(0,0,0,.8), transparent);
  font-size: 13px;
  font-weight: 500;
}

.hero-stat {
  position: absolute;
  background: var(--s2);
  border: 1px solid var(--bdr2);
  border-radius: 12px;
  padding: 10px 14px;
}

.hero-stat b {
  display: block;
  font-size: 24px;
}

.hero-stat span {
  font-size: 11px;
  color: var(--ink3);
}

.hs1 { top: 0; right: 180px; }
.hs2 { bottom: 80px; right: 10px; }

/* SETUP */
.setup-header {
  margin-bottom: 40px;
}

.setup-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: start;
}

.form-panel {
  display: grid;
  gap: 20px;
}

label {
  display: grid;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink3);
}

input {
  width: 100%;
  background: var(--s2);
  border: 1px solid var(--bdr);
  border-radius: 10px;
  padding: 13px 18px;
  font-size: 15px;
  color: var(--ink);
  outline: none;
}

input:focus {
  border-color: rgba(0,212,170,.4);
  background: var(--s3);
}

.field-block {
  display: grid;
  gap: 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  padding: 7px 15px;
  background: var(--s2);
  border: 1px solid var(--bdr);
  border-radius: 8px;
  font-size: 13px;
  color: var(--ink2);
}

.chip.active {
  background: var(--accent2);
  border-color: var(--accent);
  color: var(--accent);
}

.pi-card,
.preview-card,
.dna-panel {
  background: var(--s2);
  border: 1px solid var(--bdr);
  border-radius: 16px;
}

.pi-card {
  padding: 20px;
}

.spark {
  width: 28px;
  height: 28px;
  background: var(--accent2);
  color: var(--accent);
  border-radius: 8px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
}

.profile-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--accent2);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.profile-chip img {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.preview-card {
  position: sticky;
  top: 100px;
  overflow: hidden;
}

.preview-card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  filter: brightness(.7);
}

.preview-card div {
  padding: 20px;
}

.preview-card h3 {
  font-size: 26px;
  margin: 0 0 4px;
}

.preview-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 0 !important;
}

.preview-tags span {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--accent2);
  color: var(--accent);
  font-size: 11px;
}

/* VIBES */
.vibe-screen {
  max-width: none;
  padding-left: 0;
  padding-right: 0;
}

.vibe-header {
  max-width: 1100px;
  margin: 0 auto 32px;
  padding: 0 40px;
}

.vibe-mosaic {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 300px 280px;
  gap: 3px;
  width: 100%;
}

.vm {
  position: relative;
  overflow: hidden;
  border: 0;
  padding: 0;
  text-align: left;
  background: var(--s2);
  cursor: pointer;
}

.vm-1 { grid-column: 1; grid-row: 1 / 3; }
.vm-2 { grid-column: 2; grid-row: 1; }
.vm-3 { grid-column: 3; grid-row: 1; }
.vm-4 { grid-column: 2; grid-row: 2; }
.vm-5 { grid-column: 3; grid-row: 2; }
.vm-6 { grid-column: 1 / 4; grid-row: auto; display: none; }

.vm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(.65) saturate(.85);
  transition: transform .7s var(--ease), filter .4s;
}

.vm:hover img {
  transform: scale(1.08);
  filter: brightness(.8) saturate(1.1);
}

.vm-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.1) 52%, transparent);
}

.vm-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 24px;
  z-index: 2;
}

.vm-content span {
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .12em;
  color: rgba(255,255,255,.42);
  margin-bottom: 6px;
}

.vm-content strong {
  display: block;
  font-size: 22px;
  line-height: 1.1;
  color: #fff;
}

.vm-1 .vm-content strong {
  font-size: 30px;
}

.vm-content p {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255,255,255,.58);
}

.vm.selected {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.vm-check {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: #080a0e;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 3;
  font-weight: 900;
}

.vm.selected .vm-check {
  display: flex;
}

.vibe-footer {
  padding: 20px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--bdr);
  background: rgba(8,10,14,.5);
  backdrop-filter: blur(12px);
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.vibe-footer div {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.vibe-footer span {
  padding: 5px 12px;
  background: var(--accent2);
  border: 1px solid rgba(0,212,170,.2);
  border-radius: 6px;
  font-size: 12px;
  color: var(--accent);
}

/* LOADING */
.loading-screen {
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  text-align: center;
}

.loader-ring {
  position: relative;
  width: 90px;
  height: 90px;
}

.loader-ring span {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: spin 1.3s linear infinite;
}

.loader-ring span:nth-child(1) { border-top-color: #4285f4; }
.loader-ring span:nth-child(2) { inset: 12px; border-right-color: var(--accent); animation-direction: reverse; animation-duration: 2.1s; }
.loader-ring span:nth-child(3) { inset: 24px; border-bottom-color: #fbbc04; animation-duration: 2.9s; }
.loader-ring span:nth-child(4) { inset: 36px; border-left-color: #ea4335; animation-direction: reverse; animation-duration: 1.8s; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-strands {
  width: 100%;
  max-width: 480px;
  display: grid;
}

.load-strands div {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--bdr);
  font-size: 13px;
  color: var(--ink3);
  opacity: .18;
}

.load-strands div.on {
  opacity: 1;
  color: var(--ink2);
}

.load-strands b {
  width: 6px;
  height: 6px;
  background: var(--ink3);
  border-radius: 50%;
}

.load-strands div.on b {
  background: var(--accent);
}

.load-strands em {
  margin-left: auto;
  font-style: normal;
  font-size: 11px;
  color: var(--accent);
}

/* RESULT */
.result-screen {
  max-width: none;
  padding: 0 0 80px;
}

.res-hero {
  width: 100%;
  height: 480px;
  position: relative;
  overflow: hidden;
}

.res-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .35;
}

.res-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(8,10,14,0), rgba(8,10,14,.82) 74%, rgba(8,10,14,1));
}

.res-content {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: min(1100px, 100%);
  transform: translateX(-50%);
  padding: 40px 60px;
}

.res-tag {
  display: inline-flex;
  padding: 5px 12px;
  background: var(--accent2);
  border: 1px solid rgba(0,212,170,.2);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--accent);
  margin-bottom: 14px;
  text-transform: uppercase;
}

.res-content h2 {
  font-size: clamp(52px,7vw,80px);
  color: #fff;
  margin: 0 0 8px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 16px 60px;
  border-bottom: 1px solid var(--bdr);
  border-top: 1px solid var(--bdr);
  background: rgba(8,10,14,.6);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 64px;
  z-index: 10;
}

.timeline {
  max-width: 740px;
  margin: 0 auto;
  padding: 40px 60px 80px;
}

.stop {
  display: flex;
  position: relative;
  margin-bottom: 36px;
}

.stop:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 15px;
  top: 32px;
  bottom: -36px;
  width: 1px;
  background: linear-gradient(var(--bdr), transparent);
}

.s-pin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--s2);
  border: 1.5px solid var(--bdr);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 18px;
  margin-top: 2px;
  color: var(--ink3);
  font-size: 12px;
}

.s-pin.featured {
  border-color: var(--accent);
  background: rgba(0,212,170,.1);
  color: var(--accent);
}

.s-body {
  flex: 1;
  min-width: 0;
}

.s-cat {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink3);
  margin-bottom: 2px;
}

.s-body h3 {
  font-size: 26px;
  margin: 0 0 5px;
}

.s-body h3 span {
  font-size: 12px;
  color: var(--ink3);
  margin-left: 4px;
}

.s-body h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px;
}

.s-body p {
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink3);
  margin-bottom: 14px;
}

.s-photo {
  border-radius: 14px;
  height: 190px;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
  display: flex;
  align-items: end;
  padding: 14px;
  transition: transform .5s var(--ease);
}

.s-photo:hover {
  transform: scale(1.02);
}

.s-photo span {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,.86);
  background: rgba(0,0,0,.3);
  padding: 4px 11px;
  border-radius: 6px;
}

small {
  color: var(--ink3);
}

.dna-panel {
  max-width: 740px;
  margin: 0 auto;
  padding: 28px;
}

.slider-card {
  background: var(--s3);
  border: 1px solid var(--bdr);
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 12px;
}

.slider-card > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.slider-card b {
  color: var(--ink);
  font-size: 14px;
}

.slider-card > div span {
  color: var(--accent);
  font-size: 13px;
}

.slider-card input {
  appearance: none;
  width: 100%;
  height: 3px;
  padding: 0;
  background: linear-gradient(90deg, var(--accent) var(--p,50%), var(--s2) var(--p,50%));
  border: 0;
  border-radius: 2px;
}

.slider-card input::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
  box-shadow: 0 0 0 3px rgba(0,212,170,.2);
}

.slider-card p {
  display: flex;
  justify-content: space-between;
  margin: 6px 0 0;
}

.slider-card p span {
  font-size: 11px;
  color: var(--ink3);
}

/* RESPONSIVE */
@media(max-width:900px) {
  .navbar {
    padding: 0 20px;
  }

  .nav-steps {
    display: none;
  }

  .hero-inner,
  .setup-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .hero-cards,
  .preview-card {
    display: none;
  }

  .vibe-mosaic {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 220px);
  }

  .vm-1 {
    grid-column: 1 / 3;
    grid-row: 1;
  }

  .vm-2 {
    grid-column: 1;
    grid-row: 2;
  }

  .vm-3 {
    grid-column: 2;
    grid-row: 2;
  }

  .vm-4 {
    grid-column: 1;
    grid-row: 3;
  }

  .vm-5 {
    grid-column: 2;
    grid-row: 3;
  }

  .screen,
  .vibe-header,
  .timeline,
  .res-content,
  .action-bar {
    padding-left: 28px;
    padding-right: 28px;
  }

  h1 {
    font-size: 46px;
  }

  h2 {
    font-size: 36px;
  }
}

@media(max-width:600px) {
  .screen {
    padding: 40px 20px;
  }

  .vibe-header,
  .vibe-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .vibe-mosaic {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 210px);
  }

  .vm,
  .vm-1,
  .vm-2,
  .vm-3,
  .vm-4,
  .vm-5,
  .vm-6 {
    grid-column: 1;
    grid-row: auto;
  }

  .vm-6 {
    display: block;
  }

  .res-hero {
    height: 360px;
  }

  .res-content h2 {
    font-size: 40px;
  }

  .vibe-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .action-bar {
    position: static;
  }
}

`;

createRoot(document.getElementById("root")).render(<App />);
