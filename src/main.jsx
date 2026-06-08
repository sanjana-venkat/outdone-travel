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
`;

createRoot(document.getElementById("root")).render(<App />);
