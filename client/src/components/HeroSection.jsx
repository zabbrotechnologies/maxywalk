import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";

/* ─── Brand palette ────────────────────────────────────────── */
const PRIMARY   = "#000000";
const ORANGE    = "#ff632d";
const WHITE     = "#ffffff";

/* ─── Product catalogue ─────────────────────────────────────── */
const SLIDES = [
  {
    id: "slippers", num: "01", label: "Slippers",
    tagline: "WALK IN COMFORT",
    desc: "Handcrafted full-grain leather slippers built for all-day ease. Supple, breathable, and built to last.",
    image: "/products/slipper.png",
  },
  {
    id: "belts", num: "02", label: "Belts",
    tagline: "CRAFTED PRECISION",
    desc: "Full-grain leather belts with stainless hardware. Every stitch placed with purpose.",
    image: "/products/belt.png",
  },
  {
    id: "wallets", num: "03", label: "Wallets",
    tagline: "SLIM SOPHISTICATION",
    desc: "Slim minimalist wallets in premium leather. Carry less, carry better.",
    image: "/products/wallet.png",
  },
  {
    id: "sandals", num: "04", label: "Sandals",
    tagline: "STRUCTURED FREEDOM",
    desc: "Structured outdoor sandals that move with you. Rugged craftsmanship meets modern design.",
    image: "/products/sandal.png",
  },
];

const INTERVAL = 6000; // ms per slide

/* ─── Decorative SVG background ─────────────────────────────── */
function HeroBgGraphic() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", overflow: "hidden",
      }}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* large arc behind product zone */}
      <circle cx="1080" cy="450" r="340" fill="none" stroke="rgba(255,99,45,0.07)" strokeWidth="1.5" />
      <circle cx="1080" cy="450" r="240" fill="none" stroke="rgba(255,99,45,0.05)" strokeWidth="1" />
      <circle cx="1080" cy="450" r="140" fill="none" stroke="rgba(255,99,45,0.08)" strokeWidth="0.75" />

      {/* subtle grid lines */}
      {[0,1,2,3,4,5,6].map(i => (
        <line key={"v"+i} x1={i*240} y1="0" x2={i*240} y2="900" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      ))}
      {[0,1,2,3].map(i => (
        <line key={"h"+i} x1="0" y1={i*300} x2="1440" y2={i*300} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      ))}

      {/* diagonal accent lines */}
      <line x1="700" y1="0" x2="1400" y2="700" stroke="rgba(255,99,45,0.06)" strokeWidth="1" />
      <line x1="600" y1="900" x2="1440" y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

      {/* dot cluster — top right */}
      {[...Array(6)].map((_,r) =>
        [...Array(6)].map((_,c) => (
          <circle
            key={"dot-"+r+"-"+c}
            cx={1280 + c*22} cy={60 + r*22} r="1.5"
            fill="rgba(255,255,255,0.12)"
          />
        ))
      )}

      {/* dot cluster — bottom left */}
      {[...Array(5)].map((_,r) =>
        [...Array(5)].map((_,c) => (
          <circle
            key={"dot2-"+r+"-"+c}
            cx={60 + c*20} cy={740 + r*20} r="1.5"
            fill="rgba(255,99,45,0.15)"
          />
        ))
      )}

      {/* large watermark text arc */}
      <text
        x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="serif" fontWeight="900" fontSize="280"
        letterSpacing="-10"
        fill="rgba(255,255,255,0.025)"
        style={{ userSelect: "none" }}
      >MAXYWALK</text>

      {/* bottom horizontal rule */}
      <line x1="0" y1="820" x2="1440" y2="820" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function HeroSection() {
  const [active, setActive]         = useState(0);
  const [animState, setAnimState]   = useState("visible"); // "visible" | "exit" | "enter"
  const [prevActive, setPrevActive] = useState(null);
  const timerRef  = useRef(null);
  const heroRef   = useRef(null);

  /* ── transition to a new slide ─────────────────────────────── */
  const goTo = useCallback((next) => {
    setAnimState("exit");
    setTimeout(() => {
      setPrevActive(active);
      setActive(next);
      setAnimState("enter");
      setTimeout(() => setAnimState("visible"), 700);
    }, 400);
  }, [active]);

  /* ── auto-slider ────────────────────────────────────────────── */
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % SLIDES.length;
        goTo(next);
        return prev; // goTo handles state update
      });
    }, INTERVAL);
  }, [goTo]);

  useEffect(() => {
    // entrance animation
    setTimeout(() => heroRef.current?.classList.add("hero-visible"), 100);
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  /* ── manual slide select ────────────────────────────────────── */
  const handleSelect = (i) => {
    if (i === active) return;
    clearInterval(timerRef.current);
    goTo(i);
    resetTimer();
  };

  const slide = SLIDES[active];

  /* ── image transition styles ───────────────────────────────── */
  const imgStyle = {
    opacity:   animState === "exit" ? 0 : animState === "enter" ? 0 : 1,
    transform: animState === "exit"
      ? "translateX(40px) scale(0.96)"
      : animState === "enter"
        ? "translateX(-30px) scale(0.97)"
        : "translateX(0) scale(1)",
    transition: "opacity 600ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)",
    willChange: "transform, opacity",
  };

  const textStyle = {
    opacity:   animState === "exit" ? 0 : animState === "enter" ? 0 : 1,
    transform: animState === "exit"
      ? "translateY(-8px)"
      : animState === "enter"
        ? "translateY(8px)"
        : "translateY(0)",
    transition: "opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 600ms cubic-bezier(0.22,1,0.36,1)",
  };

  return (
    <>
      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        .hero-root {
          position: relative;
          width: 100%;
          min-height: 100svh;
          background: #000000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* entrance */
        .hero-content-wrap {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .hero-visible .hero-content-wrap {
          opacity: 1;
          transform: none;
        }

        /* floating animation for main product */
        @keyframes mwFloat {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-12px); }
        }
        .hero-product-float {
          animation: mwFloat 5s ease-in-out infinite;
        }

        /* ── DESKTOP layout ───────────────────────────────── */
        .hero-inner {
          position: relative;
          z-index: 4;
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 5vw;
        }

        .hero-stage {
          flex: 1;
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 0;
          align-items: center;
          min-height: calc(100svh - 120px); /* leave room for cards */
          padding-top: 5rem;
        }

        /* LEFT content */
        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 420px;
          position: relative;
          z-index: 5;
        }

        /* RIGHT product zone */
        .hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 100%;
          padding-right: 2vw;
        }

        .hero-product-img {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        /* wrapper — clean transparent container, real transparent PNG */
        .hero-product-wrap {
          position: relative;
          z-index: 6;
          width: clamp(280px, 44vw, 680px);
          height: clamp(280px, 44vw, 680px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
          filter:
            drop-shadow(0 28px 56px rgba(255,99,45,0.28))
            drop-shadow(0 8px 20px rgba(0,0,0,0.75));
        }

        .hero-thumb-wrap {
          width: 3rem;
          height: 3rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }
        .hero-thumb-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
        }

        .hero-product-glow {
          position: absolute;
          right: -2vw;
          top: 50%;
          transform: translateY(-50%);
          width: clamp(280px, 44vw, 680px);
          height: clamp(280px, 44vw, 680px);
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            rgba(255,99,45,0.14) 0%,
            rgba(255,99,45,0.05) 45%,
            transparent 70%
          );
          filter: blur(18px);
          z-index: 3;
          pointer-events: none;
        }

        /* ── CARDS bar ──────────────────────────────────────── */
        .hero-cards {
          position: relative;
          z-index: 8;
          display: flex;
          border-top: 1px solid rgba(255,255,255,0.07);
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .hero-cards::-webkit-scrollbar { display: none; }

        .hero-card-btn {
          flex: 1;
          min-width: 160px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: transparent;
          border: none;
          border-top: 2px solid transparent;
          cursor: pointer;
          transition: background 0.25s ease, border-color 0.25s ease;
          text-align: left;
          position: relative;
        }
        .hero-card-btn.active {
          background: rgba(255,99,45,0.1);
          border-top-color: #ff632d;
        }
        .hero-card-btn:hover:not(.active) {
          background: rgba(255,255,255,0.04);
        }

        .hero-card-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: rgba(255,99,45,0.5);
          width: 0%;
          transition: width linear;
        }
        .hero-card-btn.active .hero-card-progress {
          width: 100%;
          transition: width ${INTERVAL}ms linear;
        }

        /* ── TABLET ─────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .hero-stage {
            grid-template-columns: 360px 1fr;
          }
          .hero-product-wrap {
            width: clamp(240px, 46vw, 500px);
            height: clamp(240px, 46vw, 500px);
          }
        }

        /* ── MOBILE ─────────────────────────────────────────── */
        @media (max-width: 767px) {
          .hero-stage {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto;
            min-height: unset;
            padding-top: 5.5rem;
            padding-bottom: 1rem;
            gap: 1.5rem;
          }
          .hero-left {
            max-width: 100%;
            gap: 1.25rem;
            order: 2;
            text-align: center;
            align-items: center;
          }
          .hero-divider, .hero-ctas, .hero-counter {
            justify-content: center;
          }
          .hero-right {
            order: 1;
            justify-content: center;
            padding-right: 0;
            height: auto;
          }
          .hero-product-wrap {
            width: clamp(200px, 72vw, 340px);
            height: clamp(200px, 72vw, 340px);
          }
          .hero-product-glow {
            width: clamp(200px, 72vw, 340px);
            height: clamp(200px, 72vw, 340px);
            right: auto;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          .hero-card-btn {
            min-width: 140px;
            padding: 0.75rem 1rem;
          }
          .hero-inner {
            padding: 0 1.25rem;
          }
        }

        /* ── SMALL MOBILE ───────────────────────────────────── */
        @media (max-width: 390px) {
          .hero-card-btn { min-width: 120px; padding: 0.5rem 0.75rem; }
          .hero-product-wrap { width: clamp(200px, 85vw, 280px); height: clamp(200px, 85vw, 280px); }
          .hero-product-img { width: 100%; }
        }
      `}</style>

      {/* ── Root ──────────────────────────────────────────────── */}
      <section className="hero-root" ref={heroRef}>

        {/* Layer 1: deep gradient */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "radial-gradient(ellipse 80% 70% at 70% 50%, rgba(20,10,5,0.9) 0%, #000000 100%)",
        }} />

        {/* Layer 2: decorative SVG graphics */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          <HeroBgGraphic />
        </div>

        {/* Layer 3: top-left orange accent gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "35%", height: "35%",
          background: "radial-gradient(ellipse at top left, rgba(255,99,45,0.06) 0%, transparent 65%)",
          zIndex: 2, pointerEvents: "none",
        }} />

        {/* ── Hero inner content ──────────────────────────────── */}
        <div className="hero-inner hero-content-wrap">
          <div className="hero-stage">

            {/* ─── LEFT — headline & CTA ─────────────────────── */}
            <div className="hero-left">

              {/* eyebrow */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "2rem", height: "2px", background: ORANGE, flexShrink: 0 }} />
                <span style={{
                  fontFamily: "var(--font-sans)", fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.55)", letterSpacing: "0.22em",
                  textTransform: "uppercase", fontWeight: 700,
                }}>Est. 2010 · Avadi, TN · MAXYWALK</span>
              </div>

              {/* headline */}
              <div style={textStyle}>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: "0.7rem",
                  color: ORANGE, letterSpacing: "0.2em",
                  textTransform: "uppercase", fontWeight: 700, margin: "0 0 0.35rem",
                }}>{slide.tagline}</p>
                <h1 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.6rem, 5vw, 5.2rem)",
                  color: WHITE, lineHeight: 1.0,
                  fontWeight: 900, letterSpacing: "-0.025em", margin: 0,
                }}>
                  WALK IN<br />
                  <span style={{ color: ORANGE }}>LEATHER.</span>
                </h1>
              </div>

              {/* divider */}
              <div className="hero-divider" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "3rem", height: "1px", background: "rgba(255,255,255,0.15)" }} />
                <div style={{ width: "1.25rem", height: "2px", background: ORANGE, borderRadius: "9999px" }} />
              </div>

              {/* description */}
              <p style={{
                ...textStyle,
                fontFamily: "var(--font-sans)", fontSize: "clamp(0.8rem, 1.1vw, 0.9rem)",
                color: "rgba(255,255,255,0.5)", lineHeight: 1.75,
                maxWidth: "22rem", margin: 0,
              }}>{slide.desc}</p>

              {/* CTAs */}
              <div className="hero-ctas" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  to="/shop"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.45rem",
                    background: ORANGE, color: WHITE,
                    fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "0.72rem",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0 1.6rem", height: "2.85rem", borderRadius: "9999px",
                    textDecoration: "none", transition: "background 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  Shop Now
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <a
                  href="https://wa.me/919444743465?text=Hi%20Prabhu%20Traders!%20I%20want%20to%20order%20custom%20footwear."
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.45rem",
                    background: "transparent", color: "rgba(255,255,255,0.75)",
                    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.72rem",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0 1.6rem", height: "2.85rem", borderRadius: "9999px",
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    textDecoration: "none", transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                >Custom Order</a>
              </div>

              {/* slide counter */}
              <div className="hero-counter" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: ORANGE, fontWeight: 900, lineHeight: 1 }}>
                  {slide.num}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "0.3rem" }}>
                  <div style={{ height: "1px", width: "2.5rem", background: "rgba(255,255,255,0.15)" }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                    of {SLIDES.length.toString().padStart(2,"0")}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── RIGHT — large floating product ────────────── */}
            <div className="hero-right">
              {/* orange glow blob */}
              <div className="hero-product-glow" />

              {/* concentric ring decoration */}
              <div style={{
                position: "absolute", right: "-1vw", top: "50%",
                transform: "translateY(-50%)",
                width: "clamp(300px, 48vw, 700px)",
                height: "clamp(300px, 48vw, 700px)",
                borderRadius: "50%",
                border: "1px solid rgba(255,99,45,0.08)",
                zIndex: 3, pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", right: "3vw", top: "50%",
                transform: "translateY(-50%)",
                width: "clamp(200px, 34vw, 500px)",
                height: "clamp(200px, 34vw, 500px)",
                borderRadius: "50%",
                border: "1px solid rgba(255,99,45,0.06)",
                zIndex: 3, pointerEvents: "none",
              }} />

              {/* main product — white-matte bg removal trick */}
              <div
                key={active}
                className="hero-product-wrap hero-product-float"
                style={imgStyle}
              >
                <img
                  src={slide.image}
                  alt={slide.label + " — MAXYWALK handcrafted leather"}
                  className="hero-product-img"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* ─── Bottom product cards ────────────────────────── */}
          <div className="hero-cards">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                className={"hero-card-btn" + (i === active ? " active" : "")}
                onClick={() => handleSelect(i)}
                aria-label={"View " + s.label}
              >
                {/* thumb — same bg-removal trick, scaled down */}
                <div className="hero-thumb-wrap" style={{
                  opacity: i === active ? 1 : 0.5,
                  transition: "opacity 0.3s ease",
                }}>
                  <img
                    src={s.image}
                    alt={s.label}
                  />
                </div>
                {/* text */}
                <div style={{ overflow: "hidden" }}>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: "0.58rem",
                    color: i === active ? "rgba(255,99,45,0.8)" : "rgba(255,255,255,0.3)",
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    fontWeight: 800, margin: "0 0 0.15rem",
                    transition: "color 0.3s ease",
                  }}>{s.num}</p>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: "0.82rem",
                    color: i === active ? WHITE : "rgba(255,255,255,0.45)",
                    fontWeight: 700, margin: "0 0 0.1rem",
                    transition: "color 0.3s ease",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{s.label}</p>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: "0.62rem",
                    color: "rgba(255,255,255,0.25)", margin: 0,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>Handcrafted Leather</p>
                </div>
                {/* progress bar */}
                <div className="hero-card-progress" key={i === active ? "active-" + active : "idle-" + i} />
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
