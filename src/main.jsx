import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const vibeImages = [
  { id: "lantern", title: "Lantern alleys", tag: "Romantic + local", signal: "intimate evening walks, old streets, quiet discovery", img: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa508d?auto=format&fit=crop&w=1200&q=80" },
  { id: "nature", title: "Slow nature", tag: "Quiet + scenic", signal: "soft mornings, gardens, rivers, open air", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80" },
  { id: "food", title: "Local food", tag: "Taste + discovery", signal: "markets, vegetarian-friendly food, local cafés", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { id: "luxury", title: "Soft luxury", tag: "Beautiful + calm", signal: "slow hotels, elevated experiences, intentional pacing", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80" },
  { id: "hidden", title: "Hidden gems", tag: "Unexpected + intimate", signal: "less obvious places, charming detours, local texture", img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80" },
  { id: "culture", title: "Culture walks", tag: "History + depth", signal: "temples, museums, rituals, story-rich neighborhoods", img: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1200&q=80" }
];

const fallbackItinerary = (destination, dates, story, dna) => ({
  destination,
  dates,
  selectedMood: story,
  travelDNA: dna,
  summary: "A personalized trip shaped around your current mood, visual preferences, dietary needs, and lightweight Google profile.",
  stops: [
    { time: "8:30", period: "AM", category: "Quiet start", name: `${destination} morning walk`, description: "Start slow with a scenic, low-crowd experience that matches your selected travel energy.", photoQuery: `${destination} scenic morning`, routeFromPrevious: "Start of itinerary" },
    { time: "12:30", period: "PM", category: "Local flavor", name: "Vegetarian-friendly lunch", description: "A thoughtful food stop chosen around your dietary preferences and mood.", photoQuery: "vegetarian lunch travel", routeFromPrevious: "Short transit from previous stop" },
    { time: "5:30", period: "PM", category: "Signature moment", name: "Golden hour experience", description: "A memorable evening moment designed around the story you want this trip to tell.", photoQuery: "golden hour travel", routeFromPrevious: "Easy evening route" }
  ]
});

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("Kyoto");
  const [dates, setDates] = useState("June 20–22");
  const [diet, setDiet] = useState("Vegetarian");
  const [travelWith, setTravelWith] = useState("Partner");
  const [story, setStory] = useState("Celebrate");
  const [selectedVibes, setSelectedVibes] = useState(["lantern", "luxury"]);
  const [dna, setDna] = useState({ pacing: 35, socialEnergy: 25, adventure: 48, structure: 62, discovery: 72 });
  const [loadingLine, setLoadingLine] = useState(0);
  const [itinerary, setItinerary] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
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
    if (!GOOGLE_CLIENT_ID) return;
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
          setUser({ name: payload.name, email: payload.email, picture: payload.picture });
          setStep("destination");
        }
      });
      buttonContainer.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320
      });
    };

    loadGoogleButton();
    return () => { cancelled = true; };
  }, [step]);

  const loadingItems = useMemo(() => [
    user?.name ? `${user.name}'s lightweight profile` : "Google profile",
    "Destination context",
    "Dietary preferences",
    "Visual vibe signals",
    "Travel DNA sliders",
    "Local recommendations",
    "Gemini itinerary generation"
  ], [user]);

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

  async function generateTrip() {
    setStep("loading");
    setLoadingLine(0);
    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, loadingItems.length - 1));
    }, 620);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          destination,
          dates,
          diet,
          travelWith,
          story,
          selectedVibes: selectedVibes.map((id) => vibeImages.find((v) => v.id === id)),
          dna
        })
      });
      if (!res.ok) throw new Error("Gemini API route failed");
      const data = await res.json();
      setItinerary(data);
    } catch (error) {
      console.error(error);
      setItinerary(fallbackItinerary(destination, dates, story, dna));
    } finally {
      clearInterval(interval);
      setTimeout(() => setStep("result"), 900);
    }
  }

  const selectedVibeObjects = selectedVibes.map((id) => vibeImages.find((v) => v.id === id)).filter(Boolean);

  return (
    <div className="app-shell" ref={shellRef}>
      <style>{css}</style>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <div className="cursor-glow" />

      {step === "login" && (
        <main className="hero-card glass-card">
          <FloatingHeader />
          <div className="hero-grid">
            <section>
              <p className="eyebrow">Powered by Gemini</p>
              <h1>Travel built around who you want to be <span>today.</span></h1>
              <p className="hero-sub">Sign in with Google for a lightweight personal layer. For this MVP, we only use your name and profile photo.</p>
              <div className="google-wrap">
                <div id="googleSignIn" />
                {!googleReady && GOOGLE_CLIENT_ID && <div className="google-loading">Loading Google sign in...</div>}
              </div>
              <button className="text-btn" onClick={() => setStep("destination")}>Continue without sign in</button>
            </section>
            <aside className="hero-preview">
              <div className="preview-phone">
                <div className="preview-map" />
                <div className="preview-card one" />
                <div className="preview-card two" />
                <div className="preview-card three" />
              </div>
            </aside>
          </div>
        </main>
      )}

      {step === "destination" && (
        <main className="product-card glass-card">
          <TopBar label="Destination" step={1} />
          <section className="center-form">
            <p className="mini">Step 1 of 3</p>
            <h2>Where are you headed?</h2>
            <p>We'll shape the trip around who you want to be today.</p>
            <div className="field-stack">
              <label><span>Destination</span><input className="big-input" value={destination} onChange={(e) => setDestination(e.target.value)} /></label>
              <label><span>Dates</span><input className="big-input" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Dates" /></label>
            </div>

            <div className="intelligence-card fluid-card">
              <div className="spark-badge">✦</div>
              <p className="card-kicker">Personal Intelligence Preview</p>
              <h3>We don't have full access to your Google Personal Intelligence yet.</h3>
              <p>We're working on it. Soon, we'll be able to skip these questions with your Google data. For now, give us a quick feeler.</p>
              <div className="profile-row">
                {user ? (
                  <div className="profile-pill"><img src={user.picture} alt="" /><span>Signed in as {user.name}</span></div>
                ) : (
                  <div className="profile-pill ghost"><span>Using quick feeler mode</span></div>
                )}
                <span className="privacy-note">Name + profile photo only</span>
              </div>
            </div>

            <div className="quick-grid">
              <Select label="Dietary preference" value={diet} setValue={setDiet} options={["Vegetarian", "Vegan", "No restrictions", "Gluten-free"]} />
              <Select label="Traveling with" value={travelWith} setValue={setTravelWith} options={["Solo", "Partner", "Friends", "Family"]} />
              <Select label="Trip story" value={story} setValue={setStory} options={["Celebrate", "Reconnect", "Explore", "Recharge", "Learn", "Surprise me"]} />
            </div>
            <button className="primary" onClick={() => setStep("vibes")}>Continue</button>
          </section>
        </main>
      )}

      {step === "vibes" && (
        <main className="product-card glass-card">
          <TopBar label="Visual Feeler" step={2} />
          <section className="wide-section">
            <p className="mini">Choose up to 3</p>
            <h2>What feels like this trip?</h2>
            <p>Images give Gemini a faster read on the emotional texture you want.</p>
            <div className="image-grid">
              {vibeImages.map((vibe) => (
                <button key={vibe.id} className={`vibe-img ${selectedVibes.includes(vibe.id) ? "selected" : ""}`} onClick={() => toggleVibe(vibe.id)}>
                  <img src={vibe.img} alt={vibe.title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <div className="vibe-overlay"><strong>{vibe.title}</strong><span>{vibe.tag}</span></div>
                  {selectedVibes.includes(vibe.id) && <div className="selected-mark">✓</div>}
                </button>
              ))}
            </div>
            <div className="selection-summary fluid-card">
              <p className="card-kicker">Current signals</p>
              <div className="signal-row">{selectedVibeObjects.map((vibe) => <span key={vibe.id}>{vibe.title}</span>)}</div>
            </div>
            <button className="primary" onClick={() => setStep("dna")}>Fine tune Travel DNA</button>
          </section>
        </main>
      )}

      {step === "dna" && (
        <main className="product-card glass-card">
          <TopBar label="Travel DNA" step={3} />
          <section className="center-form">
            <p className="mini">Final tuning</p>
            <h2>Your Travel DNA</h2>
            <p>Fine tune how the itinerary should feel before Gemini builds it.</p>
            <Slider label="Pacing" left="Relaxed" right="Structured" value={dna.pacing} onChange={(v) => updateDna("pacing", v)} />
            <Slider label="Social Energy" left="Private" right="Social" value={dna.socialEnergy} onChange={(v) => updateDna("socialEnergy", v)} />
            <Slider label="Adventure" left="Comfort" right="Exploratory" value={dna.adventure} onChange={(v) => updateDna("adventure", v)} />
            <Slider label="Planning" left="Spontaneous" right="Planned" value={dna.structure} onChange={(v) => updateDna("structure", v)} />
            <Slider label="Discovery" left="Familiar" right="Novel" value={dna.discovery} onChange={(v) => updateDna("discovery", v)} />
            <button className="primary" onClick={generateTrip}>Build with Gemini</button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="product-card loading-card glass-card">
          <div className="gemini-loader"><span /><span /><span /></div>
          <h2>Analyzing Personal Intelligence</h2>
          <p>Creating a trip from your profile, feeler signals, and Travel DNA.</p>
          <div className="loading-list">
            {loadingItems.map((item, i) => (
              <div className={i <= loadingLine ? "done" : ""} key={item}><span>{i <= loadingLine ? "✓" : "○"}</span>{item}</div>
            ))}
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="product-card result-card glass-card">
          <section className="result-top">
            <button className="back-btn" onClick={() => setStep("destination")}>Start over</button>
            <p className="mini">Your trip in</p>
            <h2>{itinerary?.destination || destination}</h2>
            <p>{itinerary?.summary}</p>
            <div className="dna-strip">
              <DnaPill label="Pacing" value={dna.pacing} />
              <DnaPill label="Social" value={dna.socialEnergy} />
              <DnaPill label="Adventure" value={dna.adventure} />
              <DnaPill label="Planning" value={dna.structure} />
              <DnaPill label="Discovery" value={dna.discovery} />
            </div>
          </section>
          <section className="timeline">
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={`${stop.name}-${i}`}>
                <div className="pin">⌖</div>
                <div className="stop-body">
                  <p className="stop-cat">{stop.category}</p>
                  <h3>{stop.time} <span>{stop.period}</span></h3>
                  <h4>{stop.name}</h4>
                  <p>{stop.description}</p>
                  <div className="photo-card" style={{ background: gradientFor(i) }}><span>{stop.photoQuery || stop.name}</span></div>
                  <small>{stop.routeFromPrevious}</small>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}
    </div>
  );
}

function FloatingHeader() {
  return <div className="floating-header"><span className="logo-dot">✦</span><span>Travel DNA</span><b>Gemini prototype</b></div>;
}

function TopBar({ label, step }) {
  return (
    <div className="topbar">
      <div className="progress">{[1, 2, 3].map((n) => <span key={n} className={n <= step ? "on" : ""} />)}<b>{label}</b></div>
      <div className="theme-toggle"><b>Light</b><span>Dark</span></div>
    </div>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="chip-row">{options.map((option) => <button type="button" className={value === option ? "chip active" : "chip"} onClick={() => setValue(option)} key={option}>{option}</button>)}</div>
    </div>
  );
}

function Slider({ label, left, right, value, onChange }) {
  return (
    <div className="slider-card fluid-card">
      <div className="slider-head"><b>{label}</b><span>{left} ↔ {right}</span></div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="slider-scale"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function DnaPill({ label, value }) {
  return <div className="dna-pill"><b>{label}</b><div><span style={{ width: `${value}%` }} /></div></div>;
}

function gradientFor(index) {
  const gradients = [
    "linear-gradient(135deg,#2f6f44,#d16b3a)",
    "linear-gradient(135deg,#1a73e8,#53d4d0)",
    "linear-gradient(135deg,#8b5cf6,#f97316)",
    "linear-gradient(135deg,#0f766e,#facc15)",
    "linear-gradient(135deg,#1f2937,#a78bfa)",
    "linear-gradient(135deg,#0ea5e9,#ec4899)"
  ];
  return gradients[index % gradients.length];
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&display=swap');
:root{--mx:50vw;--my:50vh;--blue:#1a73e8;--blue-soft:#e8f0fe;--blue-text:#1557b0;--ink:#1f1f1f;--ink-2:#4a4d52;--ink-3:#747775;--surface:rgba(248,250,254,.82);--line:rgba(0,0,0,.08)}
*{box-sizing:border-box}body{margin:0;font-family:'Google Sans',Inter,system-ui,sans-serif;background:radial-gradient(circle at 80% 10%,#d7f8ff 0,transparent 34%),radial-gradient(circle at 10% 0%,#d7e4ff 0,transparent 34%),linear-gradient(180deg,#edf3ff 0%,#e9eef7 100%);color:var(--ink);overflow-x:hidden}button,input{font:inherit}button{-webkit-tap-highlight-color:transparent}.app-shell{min-height:100vh;padding:34px;display:grid;place-items:center;position:relative;overflow:hidden}.cursor-glow{position:fixed;width:460px;height:460px;left:calc(var(--mx) - 230px);top:calc(var(--my) - 230px);pointer-events:none;background:radial-gradient(circle,rgba(66,133,244,.18),rgba(83,212,208,.08) 38%,transparent 68%);filter:blur(4px);mix-blend-mode:multiply;transition:opacity .25s ease;z-index:0}.orb{position:fixed;border-radius:999px;filter:blur(32px);opacity:.66;pointer-events:none;z-index:0;animation:floaty 12s ease-in-out infinite}.orb-a{width:320px;height:320px;background:rgba(66,133,244,.22);top:-80px;left:8%}.orb-b{width:360px;height:360px;background:rgba(83,212,208,.22);right:-120px;top:12%;animation-delay:-4s}.orb-c{width:280px;height:280px;background:rgba(251,188,4,.16);left:24%;bottom:-110px;animation-delay:-8s}@keyframes floaty{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(28px,-22px,0) scale(1.08)}}.glass-card{position:relative;z-index:1;overflow:hidden}.glass-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 18%,rgba(66,133,244,.08),transparent 28%),radial-gradient(circle at 92% 10%,rgba(83,212,208,.12),transparent 26%),linear-gradient(135deg,rgba(255,255,255,.72),rgba(255,255,255,.34));pointer-events:none;z-index:-1}.hero-card,.product-card{width:min(1180px,calc(100vw - 72px));min-height:760px;border-radius:44px;background:rgba(248,250,254,.78);box-shadow:0 34px 90px rgba(35,48,80,.14),inset 0 0 0 1px rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.74);backdrop-filter:blur(24px)}.hero-card{padding:52px 72px 72px}.floating-header{display:inline-flex;align-items:center;gap:10px;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.66);color:var(--ink-3);font-size:13px;box-shadow:0 8px 28px rgba(35,48,80,.08)}.logo-dot{color:var(--blue)}.floating-header b{color:var(--blue-text);font-weight:700}.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:54px;align-items:center;min-height:610px}.eyebrow,.mini,.card-kicker,.field-label,.stop-cat{text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:800;color:var(--ink-3)}h1{font-size:clamp(52px,6vw,78px);max-width:850px;line-height:.94;letter-spacing:-.07em;margin:18px 0 28px}h1 span{background:linear-gradient(90deg,#1a73e8,#34a853,#53d4d0,#1a73e8);background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 6s linear infinite}@keyframes shimmer{to{background-position:300% center}}h2{font-size:clamp(40px,5vw,58px);line-height:1;letter-spacing:-.055em;margin:10px 0 14px}p{color:#6f7275;font-size:18px;line-height:1.6}.hero-sub{max-width:620px}.google-wrap{margin-top:28px;min-height:44px}.google-loading{color:var(--ink-3);font-size:13px;font-weight:700}.text-btn{border:0;background:transparent;color:var(--blue);font-weight:800;margin-top:18px;cursor:pointer;padding:10px 0}.hero-preview{display:grid;place-items:center}.preview-phone{width:310px;height:520px;border-radius:42px;background:rgba(255,255,255,.68);box-shadow:0 24px 70px rgba(35,48,80,.12);padding:24px;position:relative;overflow:hidden;transform:rotate(2deg)}.preview-map{height:180px;border-radius:30px;background:radial-gradient(circle at 25% 22%,rgba(26,115,232,.28),transparent 34%),radial-gradient(circle at 72% 70%,rgba(83,212,208,.32),transparent 32%),linear-gradient(135deg,#eef3fb,#e9fbf9);margin-bottom:18px}.preview-card{height:72px;border-radius:22px;background:rgba(255,255,255,.86);margin-bottom:12px;box-shadow:0 12px 26px rgba(35,48,80,.07)}.preview-card.two{width:84%}.preview-card.three{width:68%}.topbar{display:flex;justify-content:space-between;align-items:center;padding:34px 54px}.progress{display:flex;align-items:center;gap:8px;color:var(--ink-3);font-size:12px;letter-spacing:.1em;text-transform:uppercase}.progress span{width:8px;height:3px;background:#cfd5df;border-radius:9px;transition:width .25s ease,background .25s ease}.progress span.on{width:42px;background:var(--blue)}.theme-toggle{display:flex;gap:18px;background:rgba(255,255,255,.72);padding:10px 18px;border-radius:999px;color:var(--ink-3);box-shadow:inset 0 0 0 1px rgba(255,255,255,.88)}.theme-toggle b{color:var(--ink)}.center-form{max-width:760px;margin:52px auto 80px}.wide-section{max-width:1000px;margin:18px auto 72px}.field-stack label{display:block;color:var(--ink-3);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-top:16px}.field-stack label span{display:block;margin-bottom:8px}.big-input{width:100%;border:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.78);border-radius:28px;padding:20px 24px;font-size:20px;outline:none;box-shadow:0 10px 30px rgba(35,48,80,.04);transition:box-shadow .22s ease,transform .22s ease,border-color .22s ease}.big-input:focus{border-color:rgba(26,115,232,.34);box-shadow:0 0 0 6px rgba(26,115,232,.08),0 16px 34px rgba(35,48,80,.08);transform:translateY(-1px)}.primary{border:0;background:linear-gradient(135deg,#1a73e8,#3f83f8);color:white;padding:18px 34px;border-radius:999px;font-weight:800;box-shadow:0 18px 45px rgba(26,115,232,.22);margin-top:24px;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease}.primary:hover{transform:translateY(-2px);box-shadow:0 24px 60px rgba(26,115,232,.28)}.fluid-card{position:relative;overflow:hidden}.fluid-card::after{content:"";position:absolute;width:220px;height:220px;right:-80px;bottom:-120px;border-radius:999px;background:radial-gradient(circle,rgba(83,212,208,.20),transparent 70%);pointer-events:none}.intelligence-card{margin:28px 0;padding:26px;border:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.72);border-radius:30px;box-shadow:0 14px 42px rgba(35,48,80,.06)}.spark-badge{width:34px;height:34px;border-radius:999px;display:grid;place-items:center;background:var(--blue-soft);color:var(--blue);margin-bottom:12px}.intelligence-card h3{margin:6px 0;font-size:23px;letter-spacing:-.025em}.profile-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:18px}.profile-pill{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:var(--blue-soft);color:var(--blue-text);font-weight:800}.profile-pill.ghost{background:rgba(255,255,255,.8);color:var(--ink-2);border:1px solid var(--line)}.profile-pill img{width:26px;height:26px;border-radius:50%}.privacy-note{color:var(--ink-3);font-size:13px;font-weight:700}.quick-grid{display:grid;gap:22px}.chip-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}.chip{border:1px solid rgba(0,0,0,.09);background:rgba(255,255,255,.76);padding:11px 18px;border-radius:999px;cursor:pointer;box-shadow:0 8px 18px rgba(35,48,80,.04)}.chip.active{border-color:var(--blue);background:var(--blue-soft);color:var(--blue-text);font-weight:800}.image-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px}.vibe-img{min-height:230px;border:2px solid transparent;background:linear-gradient(135deg,#dfe9ff,#e1fbf8);padding:0;border-radius:30px;overflow:hidden;text-align:left;cursor:pointer;box-shadow:0 14px 38px rgba(35,48,80,.10);position:relative;transition:transform .24s ease,box-shadow .24s ease,border-color .24s ease}.vibe-img:hover{transform:translateY(-4px);box-shadow:0 22px 60px rgba(35,48,80,.15)}.vibe-img.selected{border-color:var(--blue);box-shadow:0 0 0 6px rgba(26,115,232,.12),0 22px 60px rgba(35,48,80,.13)}.vibe-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.vibe-img::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,.62))}.vibe-overlay{position:absolute;left:18px;right:18px;bottom:18px;z-index:1;display:grid;gap:4px;color:white}.vibe-overlay strong{font-size:20px}.vibe-overlay span{color:rgba(255,255,255,.82);font-size:14px}.selected-mark{position:absolute;top:14px;right:14px;z-index:2;width:30px;height:30px;border-radius:999px;background:var(--blue);color:white;display:grid;place-items:center;font-weight:900}.selection-summary{margin-top:22px;padding:18px;border-radius:24px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.74)}.signal-row{display:flex;flex-wrap:wrap;gap:8px}.signal-row span{padding:8px 12px;border-radius:999px;background:var(--blue-soft);color:var(--blue-text);font-weight:800;font-size:13px}.slider-card{background:rgba(255,255,255,.74);border:1px solid rgba(0,0,0,.08);border-radius:26px;padding:18px 20px;margin:14px 0;box-shadow:0 12px 32px rgba(35,48,80,.05)}.slider-head{display:flex;justify-content:space-between;gap:18px;margin-bottom:12px}.slider-head span,.slider-scale{color:var(--ink-3);font-size:13px}input[type=range]{width:100%;accent-color:var(--blue)}.slider-scale{display:flex;justify-content:space-between;margin-top:6px}.loading-card{display:grid;place-items:center;text-align:center;padding:80px}.gemini-loader{position:relative;width:88px;height:88px;margin-bottom:18px}.gemini-loader span{position:absolute;inset:0;border-radius:999px;border:2px solid transparent;animation:spin 1.8s linear infinite}.gemini-loader span:nth-child(1){border-top-color:#4285f4}.gemini-loader span:nth-child(2){inset:13px;border-right-color:#34a853;animation-direction:reverse;animation-duration:2.4s}.gemini-loader span:nth-child(3){inset:26px;border-bottom-color:#fbbc04;animation-duration:3s}@keyframes spin{to{transform:rotate(360deg)}}.loading-list{margin-top:24px;display:grid;gap:14px;text-align:left;min-width:360px}.loading-list div{color:#9aa0a6;font-weight:800;transition:color .25s ease,transform .25s ease}.loading-list .done{color:var(--ink);transform:translateX(4px)}.loading-list span{color:var(--blue);margin-right:12px}.result-card{overflow:auto;max-height:calc(100vh - 68px)}.result-top{max-width:880px;margin:54px auto 20px}.back-btn{border:0;background:rgba(255,255,255,.68);padding:10px 14px;border-radius:999px;color:var(--blue);font-weight:800;cursor:pointer;margin-bottom:18px}.dna-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:24px}.dna-pill{background:rgba(255,255,255,.74);border-radius:18px;padding:14px;border:1px solid rgba(0,0,0,.08)}.dna-pill div{height:5px;background:#e4e8ef;border-radius:10px;margin-top:10px;overflow:hidden}.dna-pill span{display:block;height:100%;background:var(--blue);border-radius:10px}.timeline{max-width:760px;margin:36px auto 90px}.stop{display:grid;grid-template-columns:42px 1fr;gap:18px;position:relative;margin-bottom:38px}.stop::after{content:"";position:absolute;left:20px;top:44px;bottom:-38px;width:1px;background:rgba(0,0,0,.1)}.stop:last-child::after{display:none}.pin{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.9);border:2px solid var(--blue);display:grid;place-items:center;color:var(--blue);z-index:1;box-shadow:0 10px 24px rgba(26,115,232,.12)}.stop h3{font-size:34px;margin:0;letter-spacing:-.04em}.stop h3 span{font-size:15px;color:var(--ink-3)}.stop h4{font-size:24px;margin:6px 0}.photo-card{height:220px;border-radius:28px;margin:18px 0 10px;display:flex;align-items:end;padding:22px;color:white;font-weight:900;box-shadow:0 18px 50px rgba(35,48,80,.12);position:relative;overflow:hidden}.photo-card::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 78% 18%,rgba(255,255,255,.24),transparent 28%)}.photo-card span{position:relative;z-index:1}small{color:var(--ink-3)}@media (max-width:900px){.app-shell{padding:12px}.hero-card,.product-card{width:100%;border-radius:30px;min-height:calc(100vh - 24px)}.hero-card{padding:32px 28px 80px}.hero-grid{grid-template-columns:1fr;min-height:auto;padding-top:60px}.hero-preview{display:none}h1{font-size:46px}h2{font-size:38px}.center-form,.wide-section,.result-top,.timeline{margin:30px 24px}.image-grid,.dna-strip{grid-template-columns:1fr}.topbar{padding:24px}.vibe-img{min-height:230px}.loading-list{min-width:0;width:100%}.cursor-glow{display:none}}
`;

createRoot(document.getElementById("root")).render(<App />);
