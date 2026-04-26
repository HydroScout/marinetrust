import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  bg: "#ffffff",
  bgSoft: "#f8fafc",
  bgPanel: "#ffffff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMid: "#334155",
  textMuted: "#64748b",
  accent: "#2563eb",
  accentSoft: "#dbeafe",
  cyan: "#06b6d4",
  orange: "#f97316",
  green: "#10b981",
  red: "#ef4444",
};

export default function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hoveredSignal, setHoveredSignal] = useState<number | null>(null);
  const [trust, setTrust] = useState(0);
  const trustTarget = 87;

  useEffect(() => {
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      setTrust((prev) => {
        const next = prev + (trustTarget - prev) * 0.08;
        return Math.abs(next - trustTarget) < 0.2 ? trustTarget : next;
      });
      if (frame > 200) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, []);

  const onHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };
  const onHeroLeave = () => setMouse({ x: 0, y: 0 });

  return (
    <div
      style={{
        flex: 1,
        height: "100vh",
        overflowY: "auto",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{keyframes}</style>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "72px 64px 96px",
          borderBottom: `1px solid ${COLORS.border}`,
          background:
            "radial-gradient(ellipse at 80% 0%, rgba(37,99,235,0.06), transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(6,182,212,0.05), transparent 50%), #ffffff",
          overflow: "hidden",
        }}
      >
        <DottedGrid />

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
            gap: "56px",
            alignItems: "center",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          <div>
            <Pill label="ENVIRONMENTAL RISK INTELLIGENCE" />
            <h1
              style={{
                fontSize: "clamp(2.4rem, 4.4vw, 3.6rem)",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                margin: "20px 0 18px",
                color: COLORS.text,
              }}
            >
              See pollution before it spreads.{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #2563eb 0%, #06b6d4 60%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Trust the data behind every vessel.
              </span>
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                lineHeight: 1.6,
                color: COLORS.textMid,
                maxWidth: 560,
                margin: "0 0 32px",
              }}
            >
              Aspersorium fuses satellite detection, AIS vessel tracking, and
              physics-based drift modeling into a single probabilistic engine —
              transforming raw maritime signals into evidence-grade risk
              intelligence for insurers, regulators, and operators.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/check-ship")}
                style={primaryBtn}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(37,99,235,0.28)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(37,99,235,0.22)";
                }}
              >
                Check a vessel
                <Arrow />
              </button>
              <button
                onClick={() => navigate("/flagged")}
                style={secondaryBtn}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = COLORS.bgSoft;
                  e.currentTarget.style.borderColor = COLORS.borderStrong;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                Browse flagged incidents
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 0,
                marginTop: 48,
                borderTop: `1px solid ${COLORS.border}`,
                paddingTop: 24,
              }}
            >
              <Stat value="24/7" label="Satellite revisit cadence" />
              <Stat value="< 30s" label="From signal to risk score" />
              <Stat value="∞" label="Continuous learning loop" />
            </div>
          </div>

          {/* Interactive scene */}
          <div
            ref={heroRef}
            onMouseMove={onHeroMove}
            onMouseLeave={onHeroLeave}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              maxWidth: 560,
              justifySelf: "center",
              width: "100%",
            }}
          >
            <HeroScene mx={mouse.x} my={mouse.y} />
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section style={section}>
        <SectionHeader
          eyebrow="HOW IT WORKS"
          title="Three sensing layers, one intelligence."
          sub="Aspersorium ingests heterogeneous maritime signals and aligns them in time and space, so every event is observed from multiple independent viewpoints."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 20,
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          <Pillar
            icon={<SatelliteIcon />}
            title="Satellite Detection"
            text="Multi-spectral and SAR imagery surfaces oil sheens, plumes, and chemical signatures invisible to the naked eye — at planetary scale."
            tint={COLORS.accent}
          />
          <Pillar
            icon={<RadarIcon />}
            title="AIS Vessel Tracking"
            text="Live and historic AIS feeds reconstruct vessel trajectories, dwell times, and behavior corridors with sub-minute resolution."
            tint={COLORS.cyan}
          />
          <Pillar
            icon={<DriftIcon />}
            title="Drift Modeling"
            text="Hydrodynamic and wind-driven advection models project where pollution came from — and where it's heading next."
            tint={COLORS.orange}
          />
        </div>
      </section>

      {/* RISK ENGINE */}
      <section
        style={{
          ...section,
          background:
            "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderTop: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <SectionHeader
          eyebrow="THE ENGINE"
          title="Probabilistic risk scoring, not blame."
          sub="Each vessel is evaluated against a fusion of behavioral, spatial, and historical signals. The result is a time-persistent trust profile that updates with every new observation."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
            gap: 32,
            maxWidth: 1280,
            margin: "0 auto",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: 28,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: COLORS.textMuted,
                marginBottom: 16,
              }}
            >
              SIGNAL FUSION
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {SIGNALS.map((s, i) => (
                <SignalRow
                  key={s.label}
                  signal={s}
                  active={hoveredSignal === i}
                  onEnter={() => setHoveredSignal(i)}
                  onLeave={() => setHoveredSignal(null)}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              padding: 28,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: COLORS.textMuted,
              }}
            >
              DYNAMIC TRUST INDEX
            </div>
            <TrustGauge value={trust} />
            <div
              style={{
                fontSize: 14,
                color: COLORS.textMid,
                textAlign: "center",
                maxWidth: 320,
                lineHeight: 1.55,
                marginTop: 4,
              }}
            >
              A continuously updated probability that fuses every signal into a
              single, audit-ready score — the foundation for evidence-based
              decisions.
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK LOOP */}
      <section style={section}>
        <SectionHeader
          eyebrow="THE FEEDBACK LOOP"
          title="Smaller vessels make the whole ocean smarter."
          sub="A lightweight companion app for smaller vessels delivers route optimization and pollution avoidance — and in return contributes ground-truth observations that validate satellite detections, sharpen attribution, and continuously improve risk scores."
        />
        <FeedbackLoopDiagram />
      </section>

      {/* WHO IT'S FOR */}
      <section
        style={{
          ...section,
          paddingTop: 32,
          paddingBottom: 96,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 20,
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          <Audience
            tag="INSURERS"
            text="Replace anecdotal incident reports with quantified, time-stamped likelihoods — and price risk on evidence, not assumption."
          />
          <Audience
            tag="REGULATORS"
            text="Triage incidents, prioritize inspections, and act with confidence on a transparent, auditable chain of evidence."
          />
          <Audience
            tag="OPERATORS"
            text="Demonstrate compliance proactively. Use early warnings to reroute around pollution and protect both fleet and reputation."
          />
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "56px auto 0",
            background: COLORS.text,
            color: "#fff",
            borderRadius: 20,
            padding: "44px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            flexWrap: "wrap",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 90% 50%, rgba(6,182,212,0.25), transparent 50%), radial-gradient(circle at 10% 100%, rgba(249,115,22,0.18), transparent 55%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", maxWidth: 620 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "#94a3b8",
                marginBottom: 12,
              }}
            >
              READY WHEN YOU ARE
            </div>
            <h3
              style={{
                fontSize: "1.85rem",
                lineHeight: 1.15,
                margin: 0,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Start with a single vessel. Scale to an entire fleet.
            </h3>
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("/check-ship")}
              style={{
                ...primaryBtn,
                background: "#fff",
                color: COLORS.text,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            >
              Check a vessel <Arrow />
            </button>
            <button
              onClick={() => navigate("/flagged")}
              style={{
                ...secondaryBtn,
                background: "transparent",
                borderColor: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            >
              View flagged incidents
            </button>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "32px auto 0",
            display: "flex",
            justifyContent: "space-between",
            color: COLORS.textMuted,
            fontSize: 13,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>© Aspersorium · Maritime Risk Intelligence</span>
          <span>Powered by satellites, AIS, and the people on the water.</span>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------- subviews -------------------------------- */

function HeroScene({ mx, my }: { mx: number; my: number }) {
  const tilt = `translate3d(${mx * 14}px, ${my * 14}px, 0)`;
  const tiltSlow = `translate3d(${mx * 6}px, ${my * 6}px, 0)`;
  const tiltFast = `translate3d(${mx * 22}px, ${my * 22}px, 0)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Outer rings */}
      <div
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "50%",
          border: `1px dashed ${COLORS.border}`,
          transform: tiltSlow,
          transition: "transform 0.2s ease-out",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "16%",
          borderRadius: "50%",
          border: `1px dashed ${COLORS.borderStrong}`,
          transform: tiltSlow,
          transition: "transform 0.2s ease-out",
        }}
      />

      {/* Globe */}
      <div
        style={{
          position: "relative",
          width: "62%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 32% 28%, #ffffff 0%, #eff6ff 30%, #dbeafe 60%, #bfdbfe 100%)",
          boxShadow:
            "0 24px 60px -20px rgba(37,99,235,0.35), inset -28px -28px 80px rgba(37,99,235,0.18), inset 8px 8px 32px rgba(255,255,255,0.9)",
          transform: tilt,
          transition: "transform 0.2s ease-out",
          overflow: "hidden",
        }}
      >
        {/* meridian + equator lines */}
        <svg
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.55,
          }}
        >
          <defs>
            <radialGradient id="land" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#93c5fd" />
            </radialGradient>
          </defs>
          <ellipse
            cx="50"
            cy="50"
            rx="48"
            ry="20"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.4"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="20"
            ry="48"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.4"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="48"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.3"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="48"
            ry="40"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.3"
          />
          {/* stylized continents */}
          <path
            d="M22 38 Q30 32 38 36 T54 38 Q60 44 56 50 T48 58 Q40 60 32 56 T22 50 Z"
            fill="url(#land)"
            opacity="0.85"
          />
          <path
            d="M62 28 Q70 26 76 32 T78 44 Q72 46 68 42 T62 36 Z"
            fill="url(#land)"
            opacity="0.85"
          />
          <path
            d="M58 62 Q66 60 72 66 T70 78 Q62 80 58 74 T58 62 Z"
            fill="url(#land)"
            opacity="0.85"
          />
        </svg>

        {/* spill ping */}
        <div
          style={{
            position: "absolute",
            top: "58%",
            left: "44%",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLORS.orange,
            boxShadow: "0 0 0 6px rgba(249,115,22,0.18)",
            animation: "pulse 2s ease-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "32%",
            left: "62%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: COLORS.red,
            boxShadow: "0 0 0 4px rgba(239,68,68,0.18)",
            animation: "pulse 2.6s 0.6s ease-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "44%",
            left: "26%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: COLORS.green,
            boxShadow: "0 0 0 4px rgba(16,185,129,0.18)",
            animation: "pulse 3s 1s ease-out infinite",
          }}
        />
      </div>

      {/* Orbiting satellite */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: "spin 22s linear infinite",
          transform: tiltFast,
          transition: "transform 0.2s ease-out",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "4%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SatelliteSprite />
        </div>
      </div>

      {/* Counter orbit ship */}
      <div
        style={{
          position: "absolute",
          inset: "10%",
          animation: "spin 32s linear infinite reverse",
          transform: tiltFast,
          transition: "transform 0.2s ease-out",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "92%",
            left: "10%",
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.textMid,
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: COLORS.green,
              boxShadow: "0 0 0 3px rgba(16,185,129,0.2)",
            }}
          />
          MV NORDIC · trust 92
        </div>
      </div>

      {/* floating callouts */}
      <Callout
        text="Sheen detected"
        sub="Sentinel-1 · 18m ago"
        color={COLORS.orange}
        style={{ top: "4%", right: "-2%" }}
      />
      <Callout
        text="AIS gap · 14 min"
        sub="MMSI 248***612"
        color={COLORS.red}
        style={{ bottom: "10%", left: "-4%" }}
      />
      <Callout
        text="Drift forecast"
        sub="ETA shore +6h"
        color={COLORS.cyan}
        style={{ bottom: "-2%", right: "0%" }}
      />
    </div>
  );
}

function Callout({
  text,
  sub,
  color,
  style,
}: {
  text: string;
  sub: string;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 12px 24px rgba(15,23,42,0.08)",
        animation: "floaty 6s ease-in-out infinite",
        zIndex: 2,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.text,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 0 3px ${color}33`,
          }}
        />
        {text}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

function SatelliteSprite() {
  return (
    <svg width="58" height="40" viewBox="0 0 58 40" fill="none">
      <rect x="6" y="14" width="10" height="14" rx="2" fill="#1e293b" />
      <rect x="42" y="14" width="10" height="14" rx="2" fill="#1e293b" />
      <rect x="20" y="11" width="18" height="20" rx="3" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="16" y1="21" x2="20" y2="21" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="38" y1="21" x2="42" y2="21" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="29" y1="11" x2="29" y2="3" stroke="#0f172a" strokeWidth="1.5" />
      <circle cx="29" cy="3" r="2" fill={COLORS.orange} />
      <line x1="9" y1="14" x2="13" y2="9" stroke="#0f172a" strokeWidth="0.8" />
      <line x1="13" y1="14" x2="9" y2="9" stroke="#0f172a" strokeWidth="0.8" />
      <line x1="45" y1="14" x2="49" y2="9" stroke="#0f172a" strokeWidth="0.8" />
      <line x1="49" y1="14" x2="45" y2="9" stroke="#0f172a" strokeWidth="0.8" />
    </svg>
  );
}

function DottedGrid() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "radial-gradient(rgba(15,23,42,0.06) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage:
          "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
        pointerEvents: "none",
      }}
    />
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background: COLORS.accentSoft,
        color: COLORS.accent,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.14em",
        border: `1px solid rgba(37,99,235,0.18)`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: COLORS.accent,
          boxShadow: "0 0 0 3px rgba(37,99,235,0.25)",
        }}
      />
      {label}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: COLORS.text,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto 40px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.16em",
          color: COLORS.accent,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 14px",
          color: COLORS.text,
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: "1.05rem",
          lineHeight: 1.6,
          color: COLORS.textMid,
          margin: 0,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function Pillar({
  icon,
  title,
  text,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tint: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hover ? tint + "55" : COLORS.border}`,
        borderRadius: 16,
        padding: 28,
        transition: "all 0.2s ease",
        boxShadow: hover
          ? `0 16px 36px -12px ${tint}33`
          : "0 1px 2px rgba(15,23,42,0.04)",
        transform: hover ? "translateY(-2px)" : "none",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: tint + "1a",
          color: tint,
          display: "grid",
          placeItems: "center",
          marginBottom: 18,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "1.15rem",
          fontWeight: 600,
          margin: "0 0 8px",
          color: COLORS.text,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: COLORS.textMid,
          margin: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}

type Signal = {
  label: string;
  detail: string;
  weight: number;
  color: string;
};

const SIGNALS: Signal[] = [
  {
    label: "Proximity to detected pollution",
    detail: "Spatial correlation across satellite swaths and AIS pings.",
    weight: 92,
    color: "#2563eb",
  },
  {
    label: "Trajectory alignment with drift",
    detail: "Vessel path back-projected against hydrodynamic forecasts.",
    weight: 81,
    color: "#06b6d4",
  },
  {
    label: "AIS anomalies",
    detail: "Signal loss, MMSI swaps, identity shadowing, route drift.",
    weight: 74,
    color: "#f97316",
  },
  {
    label: "Speed & maneuver behavior",
    detail: "Loitering, sudden course changes, off-lane transits.",
    weight: 66,
    color: "#a855f7",
  },
  {
    label: "Historical pattern match",
    detail: "Similarity to prior incidents involving the same actor or route.",
    weight: 58,
    color: "#10b981",
  },
];

function SignalRow({
  signal,
  active,
  onEnter,
  onLeave,
}: {
  signal: Signal;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${active ? signal.color + "55" : COLORS.border}`,
        background: active ? signal.color + "0d" : COLORS.bgSoft,
        transition: "all 0.18s ease",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
            fontSize: 14,
            color: COLORS.text,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: signal.color,
            }}
          />
          {signal.label}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: signal.color,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {signal.weight}
        </div>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 4,
          background: "#eef2f7",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${signal.weight}%`,
            background: signal.color,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      {active && (
        <div
          style={{
            fontSize: 12.5,
            color: COLORS.textMid,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          {signal.detail}
        </div>
      )}
    </div>
  );
}

function TrustGauge({ value }: { value: number }) {
  const size = 220;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circ * (1 - pct / 100);
  const tone = useMemo(() => {
    if (pct >= 80) return COLORS.green;
    if (pct >= 55) return COLORS.cyan;
    if (pct >= 30) return COLORS.orange;
    return COLORS.red;
  }, [pct]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor={tone} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gauge)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: COLORS.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(pct)}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              color: tone,
              marginTop: -2,
            }}
          >
            TRUST INDEX
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackLoopDiagram() {
  const nodes = [
    { label: "Satellites", color: COLORS.accent, icon: <SatelliteIcon /> },
    { label: "AIS network", color: COLORS.cyan, icon: <RadarIcon /> },
    { label: "Risk engine", color: COLORS.text, icon: <CpuIcon /> },
    { label: "Vessel app", color: COLORS.orange, icon: <PhoneIcon /> },
  ];
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: "40px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 1000 220"
        style={{ width: "100%", height: 220, display: "block" }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M 80 110 C 240 30, 360 190, 500 110 S 760 30, 920 110"
          stroke="url(#flow)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 920 110 C 760 190, 500 30, 80 110"
          stroke="url(#flow)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 8"
          opacity="0.7"
        />
      </svg>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginTop: -180,
          position: "relative",
          zIndex: 2,
        }}
      >
        {nodes.map((n, i) => (
          <div
            key={n.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: `bob ${3 + i * 0.4}s ease-in-out ${i * 0.2}s infinite`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "#fff",
                border: `1px solid ${COLORS.border}`,
                color: n.color,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 12px 30px -10px rgba(15,23,42,0.18)",
              }}
            >
              {n.icon}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              {n.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          fontSize: 13,
          color: COLORS.textMid,
          textAlign: "center",
        }}
      >
        <span>Detect plumes &amp; sheens from orbit.</span>
        <span>Track vessels in space and time.</span>
        <span>Fuse, score, and persist trust.</span>
        <span>Empower vessels — receive ground truth.</span>
      </div>
    </div>
  );
}

function Audience({ tag, text }: { tag: string; text: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: COLORS.accent,
          marginBottom: 10,
        }}
      >
        {tag}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          lineHeight: 1.6,
          color: COLORS.textMid,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ---------------------------------- icons --------------------------------- */

function SatelliteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19l3-3" />
      <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(-45 12 12)" />
      <path d="M3 21l3-3M18 6l3-3M6 6l3 3M15 15l3 3" />
    </svg>
  );
}
function RadarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.07 4.93A10 10 0 1 0 22 12" />
      <path d="M16.24 7.76A6 6 0 1 0 18 12" />
      <path d="M12 12L20 4" />
    </svg>
  );
}
function DriftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
      <path d="M2 7c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
    </svg>
  );
}
function CpuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

/* ---------------------------------- styles -------------------------------- */

const section: React.CSSProperties = {
  padding: "84px 64px",
  position: "relative",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: COLORS.accent,
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 14px rgba(37,99,235,0.22)",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "#fff",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  padding: "12px 20px",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const keyframes = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.18); transform: scale(1); }
  70% { box-shadow: 0 0 0 14px rgba(0,0,0,0); transform: scale(1.05); }
  100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); transform: scale(1); }
}
@keyframes floaty {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@media (max-width: 900px) {
  section[data-h] { padding: 56px 24px !important; }
}
`;
