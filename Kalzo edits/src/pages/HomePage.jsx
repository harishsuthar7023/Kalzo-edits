import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Circle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clapperboard,
  User,
  Home as HomeIcon,
  Film,
} from "lucide-react";
import reelsData from "./Reels.json";

/* Instagram brand icon SVG */
function Instagram({ size = 17, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/* WhatsApp brand icon SVG */
function WhatsApp({ size = 17, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/**
 * KALZO EDITS — Animated Portfolio with modern glassmorphism & instant playback.
 *
 * ── ADDING VIDEOS ─────────────────────────────────────────────────────
 * Every video lives in reels.json (same folder as this file). Add as many
 * entries as you want — no limit — each with: id, title, code, time, src
 * (the video's direct URL). The Home page automatically shows only the
 * first HOME_LIMIT of them; the "All Videos" page shows every single one
 * from the file. No backend, no database, no code changes here needed —
 * just edit reels.json.
 */
const HOME_LIMIT = 5;
const ALL_REELS = reelsData;

/**
 * Automatically optimize any Cloudinary video link for universal playback.
 * - Converts .mov / .mkv / .webm / .avi to universal .mp4
 * - Injects f_auto,q_auto for optimal codec delivery and instant mobile streaming.
 */
export function optimizeCloudinaryVideoUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  let clean = url.replace(/\.(mov|MOV|mkv|webm|avi|m4v)$/i, ".mp4");
  if (clean.includes("/video/upload/") && !clean.includes("/f_auto")) {
    clean = clean.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
  }
  return clean;
}

/**
 * Automatically derive a high-quality 5-second poster frame directly from Cloudinary.
 * Works even if no separate thumbnail image was provided!
 */
export function getCloudinaryThumbnail(url) {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;
  let jpgUrl = url.replace(/\.(mp4|mov|MOV|webm|mkv|avi|m4v)$/i, ".jpg");
  if (jpgUrl.includes("/video/upload/")) {
    if (jpgUrl.includes("/video/upload/f_auto")) {
      return jpgUrl.replace("/video/upload/f_auto,q_auto/", "/video/upload/so_5,q_auto,f_auto/");
    }
    return jpgUrl.replace("/video/upload/", "/video/upload/so_5,q_auto,f_auto/");
  }
  return jpgUrl;
}

/**
 * Resolves the video streaming URL.
 * Prioritizes direct Cloudinary CDN URLs and standard HTTPS video links.
 */
export function resolveVideoUrl(reel) {
  if (!reel) return "";
  const raw = reel.src || reel.videoSrc || reel.url || "";
  if (!raw) return "";
  if (raw.includes("cloudinary.com")) {
    return optimizeCloudinaryVideoUrl(raw);
  }
  if (raw.startsWith("/videos/")) {
    return ""; // Ignore legacy deleted local paths
  }
  return raw;
}

/**
 * Resolves the poster thumbnail.
 * 1. Cloudinary auto 5s poster
 * 2. Explicit remote thumbnail
 * 3. Local fallback thumbnail
 */
export function resolveThumbnailUrl(reel) {
  if (!reel) return "";
  const vUrl = reel.src || reel.videoSrc || reel.url || "";
  if (vUrl.includes("cloudinary.com")) {
    return getCloudinaryThumbnail(vUrl);
  }
  if (reel.thumbnail && !reel.thumbnail.includes("drive.google")) {
    return reel.thumbnail;
  }
  return "";
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ---------------- Home: zigzag autoplay reel card (Smart Viewport Autoplay) ---------------- */
function ReelCard({ reel, side, index }) {
  const [ref, visible] = useReveal();
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);

  const videoSrc = resolveVideoUrl(reel);
  const posterSrc = resolveThumbnailUrl(reel);

  // Performance: only play the video currently visible in the viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`reel-row ${side} ${visible ? "in-view" : ""}`}
      style={{ transitionDelay: `${(index % 5) * 60}ms` }}
    >
      <div className="reel-connector" aria-hidden="true" />
      <div className="reel-card">
        <div className="reel-topbar">
          <span className="rec-dot" style={inView ? { animationDuration: "0.8s" } : { animationPlayState: "paused" }} />
          <span className="reel-code">{reel.code}</span>
          <span className="reel-time">{reel.time}</span>
        </div>
        <div className="reel-frame">
          {!error ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc || undefined}
              muted
              loop
              playsInline
              preload="none"
              className="reel-video"
              onError={() => setError(true)}
            />
          ) : (
            <div className="reel-fallback">Video Loading...</div>
          )}
          <div className="reel-shine" aria-hidden="true" />
          <div className="reel-vignette" aria-hidden="true" />
        </div>
        <div className="reel-caption">
          <span className="reel-title">{reel.title}</span>
          <span className="reel-tag">KALZO EDITS</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- All Videos / Work: Lag-Free On-Demand Player ---------------- */
function ClickPlayCard({ reel, index, isPlaying, onTogglePlay }) {
  const [ref, visible] = useReveal();
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);

  const videoSrc = resolveVideoUrl(reel);
  const posterSrc = resolveThumbnailUrl(reel);
  const hasPlayableVideo = Boolean(videoSrc);

  // When active video changes, autoplay immediately
  useEffect(() => {
    if (!isPlaying || !hasPlayableVideo || error) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p !== undefined) {
      p.catch(() => {
        v.muted = true;
        setMuted(true);
        v.play().catch(() => setError(true));
      });
    }
  }, [isPlaying, hasPlayableVideo, error]);

  const toggle = (e) => {
    e.stopPropagation();
    onTogglePlay(isPlaying ? null : reel.id);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div
      ref={ref}
      className={`vlist-row ${visible ? "in-view" : ""}`}
      style={{ transitionDelay: `${(index % 8) * 40}ms` }}
    >
      <div className={`vlist-card ${isPlaying ? "is-active" : ""}`}>
        <div className="reel-topbar">
          <span className="rec-dot" style={isPlaying ? { animationDuration: "0.8s" } : { animationPlayState: "paused" }} />
          <span className="reel-code">{reel.code}</span>
          <span className="reel-time">{reel.time}</span>
        </div>
        <div
          className="reel-frame vlist-frame"
          onClick={toggle}
          role="button"
          tabIndex={0}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {/* STATE 1: Not Playing -> 5-Second High-Res Thumbnail + Glow Play Overlay */}
          {!isPlaying && (
            <div className="reel-poster-wrap">
              <img
                src={posterSrc}
                alt={reel.title}
                loading="lazy"
                decoding="async"
                className="reel-poster"
                onError={(e) => {
                  e.target.style.opacity = "0.5";
                }}
              />
              <div className="reel-vignette" aria-hidden="true" />
              <div className="play-overlay">
                <span className="play-btn">
                  <Play size={20} fill="#08080b" color="#08080b" />
                </span>
              </div>
            </div>
          )}

          {/* STATE 2: Playing -> Local Smooth Video OR Google Drive Cloud Stream */}
          {isPlaying && (
            <div className="reel-active-wrap" style={{ width: "100%", height: "100%", position: "relative" }}>
              {hasPlayableVideo && !error ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={posterSrc || undefined}
                    muted={muted}
                    loop
                    playsInline
                    preload="auto"
                    className="reel-video"
                    onError={() => setError(true)}
                  />
                  <div className="reel-vignette" aria-hidden="true" />
                  <button
                    type="button"
                    className="mute-btn"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <div className="pause-hint" title="Click to pause">
                    <Pause size={11} />
                  </div>
                </>
              ) : (
                <div className="reel-fallback">Video not available</div>
              )}

              {/* Close Button: Stop video and return to 5s thumbnail */}
              <button
                type="button"
                className="close-player-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay(null);
                }}
                title="Close video"
                aria-label="Close video"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <div className="reel-caption">
          <span className="reel-title" title={reel.title}>
            {reel.title}
          </span>
          <span className="reel-tag">KALZO EDITS</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Floating pill nav ---------------- */
function NavPill({ page, setPage }) {
  const items = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "videos", label: "Work", icon: Film },
    { id: "about", label: "About", icon: User },
  ];
  return (
    <nav className="nav-pill" aria-label="Page navigation">
      {items.map((it) => {
        const Icon = it.icon;
        const active = page === it.id;
        return (
          <button
            key={it.id}
            className={`nav-item ${active ? "active" : ""}`}
            onClick={() => setPage(it.id)}
          >
            <Icon size={15} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------- Home page ---------------- */
function HomePage({ setPage, reels }) {
  const timelineRef = useRef(null);
  const fillRef = useRef(null);
  const headRef = useRef(null);
  const [heroRef, heroVisible] = useReveal();
  const [statsRef, statsVisible] = useReveal();
  const [contactRef, contactVisible] = useReveal();
  const [moreRef, moreVisible] = useReveal();

  const homeReels = reels.slice(0, HOME_LIMIT);

  const onScroll = useCallback(() => {
    const el = timelineRef.current;
    const fill = fillRef.current;
    const head = headRef.current;
    if (!el || !fill || !head) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height + vh * 0.5;
    const passed = Math.min(Math.max(vh * 0.7 - rect.top, 0), total);
    const pct = total > 0 ? Math.min(passed / total, 1) : 0;
    fill.style.height = `${pct * 100}%`;
    head.style.top = `${pct * 100}%`;
    head.style.opacity = pct > 0.01 ? "1" : "0";
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onScroll]);

  return (
    <>
      <section ref={heroRef} className={`hero ${heroVisible ? "in-view" : ""}`}>
        <div className="eyebrow">
          <span className="rec-dot" />
          <span>PORTFOLIO · 2026</span>
        </div>
        <h1 className="brand">
          KALZO<br />EDITS
        </h1>
        <p className="tagline">
          Cinematic cuts, sharp pacing, sound that hits on beat —
          <b> reels built to stop the scroll.</b>
        </p>
        <div className="hero-stats">
          <span className="chip">Mobile <span>&amp;</span> PC Editing</span>
          <span className="chip">Turnaround <span>24–48h</span></span>
          <span className="chip">4K <span>·</span> 60 FPS</span>
        </div>
        <div className="scroll-cue"><span>Scroll to watch</span><ArrowDown size={16} /></div>
      </section>

      <section>
        <div className="section-head">
          <div className="section-eyebrow">Timeline · Recent Work</div>
          <h2 className="section-title">Recent Cuts</h2>
          <p className="section-sub">A running edit of the latest reels</p>
        </div>

        <div className="timeline" ref={timelineRef}>
          <div className="timeline-track" />
          <div className="timeline-fill" ref={fillRef} />
          <div className="timeline-head" ref={headRef} />
          {homeReels.map((reel, i) => (
            <ReelCard key={reel.id} reel={reel} side={i % 2 === 0 ? "left" : "right"} index={i} />
          ))}
        </div>

        <div ref={moreRef} className={`more-wrap ${moreVisible ? "in-view" : ""}`}>
          <button className="more-btn" onClick={() => setPage("videos")}>
            <Clapperboard size={16} />
            View All Work ({reels.length} Videos)
          </button>
        </div>
      </section>

      <section ref={statsRef} className={`stats-band ${statsVisible ? "in-view" : ""}`}>
        <div className="stat-card"><span className="stat-num">150+</span><span className="stat-label">Reels Edited</span></div>
        <div className="stat-card"><span className="stat-num">3+</span><span className="stat-label">Yrs Editing</span></div>
        <div className="stat-card"><span className="stat-num">40+</span><span className="stat-label">Happy Clients</span></div>
      </section>

      <section ref={contactRef} className={`contact ${contactVisible ? "in-view" : ""}`}>
        <div className="contact-card">
          <h2 className="contact-title">Let's Cut Something Great</h2>
          <p className="contact-sub">
            Open for reels, YouTube edits &amp; brand content.
            <br />
            Send your raw footage — get a scroll-stopping edit back.
          </p>
          <div className="contact-actions">
            <a
              className="contact-btn whatsapp"
              href="https://wa.me/916375751817?text=Hi%20Kalzo%20Edits,%20I%20have%20a%20video%20editing%20project!"
              target="_blank"
              rel="noreferrer"
            >
              <WhatsApp size={18} /> Chat on WhatsApp (+91 6375751817)
            </a>
            <a
              className="contact-btn primary"
              href="https://instagram.com/kalzo_edits"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={18} /> DM @kalzo_edits on Instagram
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------- All Videos / Work page (2 per row with instant loading) ---------------- */
function VideosPage({ setPage, reels }) {
  const [headRef, headVisible] = useReveal();
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [displayCount, setDisplayCount] = useState(16);

  const handleTogglePlay = (id) => {
    setActiveVideoId((prevId) => (prevId === id ? null : id));
  };

  const displayedReels = reels.slice(0, displayCount);

  return (
    <>
      <div className={`page-head ${headVisible ? "in-view" : ""}`} ref={headRef}>
        <button className="back-btn" onClick={() => setPage("home")}>
          <ArrowLeft size={15} /> Back to Home
        </button>
        <div className="section-eyebrow" style={{ marginTop: 18 }}>Portfolio · Work</div>
        <h2 className="section-title">All Work ({reels.length})</h2>
        <p className="section-sub">Tap any video to play &middot; Smooth instant streaming &middot; 2 per row</p>
      </div>

      <div className="vlist">
        {displayedReels.map((reel, i) => (
          <ClickPlayCard
            key={reel.id}
            reel={reel}
            index={i}
            isPlaying={activeVideoId === reel.id}
            onTogglePlay={handleTogglePlay}
          />
        ))}
      </div>

      {displayCount < reels.length ? (
        <div className="work-pagination" style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", padding: "16px 0 24px 0" }}>
          <button className="more-btn" onClick={() => setDisplayCount((c) => Math.min(c + 14, reels.length))}>
            <Clapperboard size={15} />
            Load More Work (+14)
          </button>
          <button className="more-btn ghost" onClick={() => setDisplayCount(reels.length)}>
            Show All ({reels.length})
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "16px 0 24px 0", fontFamily: "'JetBrains Mono', monospace" }}>
          ✓ Showing all {reels.length} reels
        </div>
      )}

      <div className="more-wrap">
        <button className="more-btn" onClick={() => setPage("home")}>
          <HomeIcon size={16} /> Back to Home
        </button>
      </div>
    </>
  );
}

/* ---------------- About page ---------------- */
function AboutPage({ setPage }) {
  const [headRef, headVisible] = useReveal();
  const [bodyRef, bodyVisible] = useReveal();
  const [toolsRef, toolsVisible] = useReveal();
  const [contactRef, contactVisible] = useReveal();

  const capabilities = [
    "Mobile & PC Workflow",
    "Cinematic Color Grading",
    "Beat Sync & Sound Design",
    "Visual Hooks & Retention",
    "High-Paced Short Form",
    "4K 60FPS Final Master",
  ];
  const steps = [
    { t: "Raw Footage In", d: "Share your clips, brief and reference reels." },
    { t: "Story & Sync", d: "Rough cut built around pacing, beats and hooks." },
    { t: "Polish Pass", d: "Color, sound design, captions, and visual dynamics." },
    { t: "Final Export", d: "Delivered in platform-ready 4K 60fps spec." },
  ];

  return (
    <>
      <div className={`page-head ${headVisible ? "in-view" : ""}`} ref={headRef}>
        <button className="back-btn" onClick={() => setPage("home")}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="section-eyebrow" style={{ marginTop: 18 }}>About Studio</div>
        <h2 className="section-title">KALZO EDITS</h2>
      </div>

      <div ref={bodyRef} className={`about-card ${bodyVisible ? "in-view" : ""}`}>
        <div className="avatar-ring">
          <img src="/favicon.svg" alt="Kalzo Edits" style={{ width: 44, height: 44, borderRadius: 12, display: "block" }} />
        </div>
        <p className="about-text">
          <b>Kalzo Edits</b> is a dedicated video editing studio focused on high-retention short-form content — Instagram Reels, YouTube Shorts, and brand storytelling.
          <br /><br />
          I edit seamlessly on <b>both Mobile and PC</b> platforms, delivering punchy pacing, beat synchronization, color grading, and dynamic visual hooks tailored for creators and businesses.
        </p>
      </div>

      <div ref={toolsRef} className={`tools-wrap ${toolsVisible ? "in-view" : ""}`}>
        <div className="section-eyebrow" style={{ textAlign: "center" }}>Workflow &amp; Capabilities</div>
        <div className="tools-row">
          {capabilities.map((t) => (
            <span className="chip" key={t}>{t}</span>
          ))}
        </div>
      </div>

      <div className="process">
        {steps.map((s, i) => (
          <div className="process-row" key={s.t}>
            <span className="process-code">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="process-title">{s.t}</div>
              <div className="process-desc">{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div ref={contactRef} className={`contact ${contactVisible ? "in-view" : ""}`} style={{ paddingTop: 40 }}>
        <div className="contact-card">
          <h2 className="contact-title">Got Footage?</h2>
          <p className="contact-sub">Let's turn it into something worth watching.</p>
          <div className="contact-actions">
            <a
              className="contact-btn whatsapp"
              href="https://wa.me/916375751817?text=Hi%20Kalzo%20Edits,%20I%20have%20a%20video%20editing%20project!"
              target="_blank"
              rel="noreferrer"
            >
              <WhatsApp size={18} /> Chat on WhatsApp (+91 6375751817)
            </a>
            <a
              className="contact-btn primary"
              href="https://instagram.com/kalzo_edits"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={18} /> DM @kalzo_edits on Instagram
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Root ---------------- */
export default function KalzoEditsPortfolio() {
  const [page, setPage] = useState("home");
  const reels = ALL_REELS;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [page]);

  return (
    <div className="bse-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

        .bse-root {
          --bg: #08080b;
          --glass: rgba(255,255,255,0.045);
          --border: rgba(255,255,255,0.10);
          --ink: #f4f4f7;
          --muted: #96969f;
          --violet: #8b6bff;
          --cyan: #34d5ff;
          --rec: #ff4438;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow-x: hidden;
        }
        .bse-root * { box-sizing: border-box; }

        .bse-grid {
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 26px 26px;
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%);
          z-index: 0;
        }
        .bse-glow-a {
          position: fixed; top: -10%; left: 50%; transform: translateX(-50%);
          width: 120vw; height: 60vh;
          background: radial-gradient(closest-side, rgba(139,107,255,0.16), transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .bse-glow-b {
          position: fixed; bottom: -15%; left: 50%; transform: translateX(-50%);
          width: 120vw; height: 50vh;
          background: radial-gradient(closest-side, rgba(52,213,255,0.10), transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .bse-container {
          position: relative;
          z-index: 1;
          max-width: 480px;
          margin: 0 auto;
          padding: 0 20px 100px 20px;
          transition: max-width 0.35s ease;
        }
        .bse-container.bse-container-wide {
          max-width: 820px;
        }

        /* Floating nav */
        .nav-pill {
          position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
          display: flex; gap: 2px;
          background: rgba(14,14,18,0.72);
          border: 1px solid var(--border);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-radius: 999px;
          padding: 5px;
          z-index: 50;
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        }
        .nav-item {
          display: flex; align-items: center; gap: 6px;
          background: transparent; border: none; cursor: pointer;
          color: var(--muted);
          font-size: 12px; font-weight: 600;
          padding: 9px 14px;
          border-radius: 999px;
          transition: color 0.25s ease, background 0.25s ease;
        }
        .nav-item span { display: none; }
        .nav-item.active span { display: inline; }
        .nav-item.active {
          color: #08080b;
          background: linear-gradient(135deg, var(--violet), var(--cyan));
        }

        /* Hero */
        .hero {
          min-height: 100svh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          padding-top: 64px; padding-bottom: 40px;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .hero.in-view { opacity: 1; transform: translateY(0); }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--muted); background: var(--glass); border: 1px solid var(--border);
          padding: 7px 14px 7px 10px; border-radius: 999px; margin-bottom: 28px;
          backdrop-filter: blur(12px);
        }
        .rec-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--rec);
          box-shadow: 0 0 8px 2px rgba(255,68,56,0.7);
          animation: pulse-rec 1.6s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes pulse-rec { 0%,100% { opacity:1; transform:scale(1);} 50% { opacity:.35; transform:scale(.82);} }

        .brand {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(64px, 19vw, 96px); line-height: 0.92; letter-spacing: 0.01em;
          background: linear-gradient(135deg, #ffffff 20%, var(--violet) 65%, var(--cyan) 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          margin: 0 0 18px 0; text-shadow: 0 0 60px rgba(139,107,255,0.25);
        }
        .tagline { font-size: 15.5px; line-height: 1.6; color: var(--muted); max-width: 320px; margin: 0 0 36px 0; }
        .tagline b { color: var(--ink); font-weight: 600; }
        .hero-stats { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 46px; }
        .chip {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.03em;
          color: var(--ink); background: var(--glass); border: 1px solid var(--border);
          padding: 8px 12px; border-radius: 10px; backdrop-filter: blur(12px);
        }
        .chip span { color: var(--muted); }
        .scroll-cue {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: var(--muted); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          animation: float-cue 2.2s ease-in-out infinite;
        }
        @keyframes float-cue { 0%,100% { transform:translateY(0); opacity:.65;} 50% { transform:translateY(6px); opacity:1;} }

        .section-head { text-align: center; padding: 90px 0 46px 0; }
        .section-eyebrow {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--violet); margin-bottom: 10px;
        }
        .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 40px; letter-spacing: 0.01em; color: var(--ink); margin: 0; }
        .section-sub { color: var(--muted); font-size: 14px; margin-top: 10px; }

        /* Timeline zigzag (home) */
        .timeline { position: relative; padding: 10px 0 20px 0; }
        .timeline-track {
          position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-50%);
          background: linear-gradient(to bottom, rgba(255,255,255,0.09), rgba(255,255,255,0.02)); z-index: 0;
        }
        .timeline-fill {
          position: absolute; left: 50%; top: 0; width: 2px; transform: translateX(-50%); height: 0%;
          background: linear-gradient(to bottom, var(--violet), var(--cyan));
          box-shadow: 0 0 12px rgba(139,107,255,0.6); z-index: 1; transition: height 0.05s linear;
        }
        .timeline-head {
          position: absolute; left: 50%; top: 0%; width: 12px; height: 12px; transform: translate(-50%,-50%);
          border-radius: 50%; background: var(--cyan);
          box-shadow: 0 0 0 4px rgba(52,213,255,0.18), 0 0 16px 2px rgba(52,213,255,0.7);
          z-index: 2; opacity: 0; transition: opacity 0.3s ease, top 0.05s linear;
        }
        .reel-row {
          position: relative; display: flex; width: 100%; margin-bottom: 46px; z-index: 1;
          opacity: 0; transition: opacity 0.7s ease, transform 0.7s cubic-bezier(.2,.7,.2,1);
        }
        .reel-row.left { justify-content: flex-start; transform: translateX(-26px) translateY(10px); }
        .reel-row.right { justify-content: flex-end; transform: translateX(26px) translateY(10px); }
        .reel-row.in-view { opacity: 1; transform: translateX(0) translateY(0); }
        .reel-connector {
          position: absolute; top: 46px; width: calc(50% - 78px); height: 2px;
          background: linear-gradient(to right, rgba(255,255,255,0.22), rgba(255,255,255,0));
        }
        .reel-row.left .reel-connector { right: 50%; margin-right: 78px; background: linear-gradient(to left, rgba(255,255,255,0.22), rgba(255,255,255,0)); }
        .reel-row.right .reel-connector { left: 50%; margin-left: 78px; }

        .reel-card {
          width: 168px; border-radius: 20px; padding: 10px;
          background: var(--glass); border: 1px solid var(--border);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 10px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .reel-card:hover {
          transform: translateY(-4px) scale(1.015); border-color: rgba(255,255,255,0.22);
          box-shadow: 0 18px 46px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,107,255,0.25), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .reel-topbar {
          display: flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.04em;
          color: var(--muted); padding: 2px 4px 8px 4px;
        }
        .reel-code { color: var(--ink); font-weight: 600; }
        .reel-time { margin-left: auto; }
        .reel-frame { position: relative; width: 100%; aspect-ratio: 9/16; border-radius: 14px; overflow: hidden; background: #050507; }
        .reel-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .reel-shine { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 30%); pointer-events: none; }
        .reel-vignette { position: absolute; inset: 0; box-shadow: inset 0 -30px 30px -20px rgba(0,0,0,0.6); pointer-events: none; }
        .reel-caption { display: flex; justify-content: space-between; align-items: baseline; padding: 9px 4px 2px 4px; }
        .reel-title { font-size: 12px; font-weight: 600; color: var(--ink); }
        .reel-tag { font-size: 9px; color: var(--muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }

        .more-wrap { display: flex; justify-content: center; padding: 10px 0 20px 0; opacity: 0; transform: translateY(12px); transition: opacity .7s ease, transform .7s ease; }
        .more-wrap.in-view { opacity: 1; transform: translateY(0); }
        .more-btn {
          display: flex; align-items: center; gap: 9px;
          background: var(--glass); border: 1px solid var(--border); color: var(--ink);
          font-size: 13px; font-weight: 600; padding: 13px 22px; border-radius: 999px;
          cursor: pointer; backdrop-filter: blur(14px);
          transition: transform .25s ease, border-color .25s ease, background .25s ease;
        }
        .more-btn:hover { transform: translateY(-2px); border-color: rgba(139,107,255,0.5); background: rgba(139,107,255,0.08); }

        /* Stats */
        .stats-band {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; padding: 8px 0 20px 0;
          opacity: 0; transform: translateY(16px); transition: opacity .8s ease, transform .8s ease;
        }
        .stats-band.in-view { opacity: 1; transform: translateY(0); }
        .stat-card { background: var(--glass); border: 1px solid var(--border); border-radius: 16px; padding: 16px 10px; text-align: center; backdrop-filter: blur(14px); }
        .stat-num {
          font-family: 'Bebas Neue', sans-serif; font-size: 26px;
          background: linear-gradient(135deg, #fff, var(--cyan));
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; display: block;
        }
        .stat-label { font-size: 10px; color: var(--muted); letter-spacing: 0.03em; margin-top: 2px; display: block; }

        /* Contact */
        .contact { padding: 70px 0 20px 0; opacity: 0; transform: translateY(20px); transition: opacity .9s ease, transform .9s ease; }
        .contact.in-view { opacity: 1; transform: translateY(0); }
        .contact-card {
          position: relative; border-radius: 26px; padding: 34px 24px; text-align: center;
          background: linear-gradient(180deg, rgba(139,107,255,0.10), rgba(52,213,255,0.05) 60%, transparent), var(--glass);
          border: 1px solid var(--border); backdrop-filter: blur(20px); overflow: hidden;
        }
        .contact-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; margin: 0 0 10px 0; }
        .contact-sub { font-size: 13.5px; color: var(--muted); margin: 0 0 26px 0; line-height: 1.6; }
        .contact-actions { display: flex; flex-direction: column; gap: 10px; }
        .contact-btn {
          display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%;
          padding: 14px 16px; border-radius: 14px; font-size: 13.5px; font-weight: 600;
          text-decoration: none; border: 1px solid var(--border);
          transition: transform .25s ease, border-color .25s ease, background .25s ease;
        }
        .contact-btn:hover { transform: translateY(-2px); }
        .contact-btn.primary { background: linear-gradient(135deg, var(--violet), var(--cyan)); color: #08080b; border: none; font-weight: 700; box-shadow: 0 8px 24px rgba(139,107,255,0.35); }
        .contact-btn.primary:hover { box-shadow: 0 12px 30px rgba(139,107,255,0.5); }
        .contact-btn.whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); color: #ffffff; border: none; font-weight: 700; box-shadow: 0 8px 24px rgba(37,211,102,0.35); }
        .contact-btn.whatsapp:hover { box-shadow: 0 12px 30px rgba(37,211,102,0.5); }
        .contact-btn.ghost { background: rgba(255,255,255,0.03); color: var(--ink); }
        .contact-btn.ghost:hover { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.06); }

        .top-corner-brand {
          position: absolute;
          top: 22px;
          left: 20px;
          z-index: 40;
          display: flex;
          align-items: center;
        }
        .corner-brand-btn {
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .corner-brand-btn:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .corner-logo-img {
          height: 32px;
          width: auto;
          display: block;
          filter: drop-shadow(0 2px 10px rgba(0,0,0,0.6));
        }
        @media (max-width: 480px) {
          .top-corner-brand {
            top: 14px;
            left: 14px;
          }
          .corner-logo-img {
            height: 28px;
          }
        }

        /* Sub-page header */
        .page-head { padding: 56px 0 30px 0; text-align: center; opacity: 0; transform: translateY(14px); transition: opacity .7s ease, transform .7s ease; }
        .page-head.in-view { opacity: 1; transform: translateY(0); }
        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--glass); border: 1px solid var(--border); color: var(--ink);
          font-size: 12px; font-weight: 600; padding: 9px 14px; border-radius: 999px;
          cursor: pointer; backdrop-filter: blur(12px);
        }

        /* All Videos list (2 per row in Work) */
        .vlist {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding-bottom: 24px;
        }
        .vlist-row {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s ease, transform .6s ease;
          width: 100%;
        }
        .vlist-row.in-view { opacity: 1; transform: translateY(0); }
        .vlist-card {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 8px;
          backdrop-filter: blur(18px);
          box-shadow: 0 10px 34px rgba(0,0,0,0.4);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .vlist-card:hover {
          transform: translateY(-4px);
          border-color: rgba(139,107,255,0.4);
          box-shadow: 0 16px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,107,255,0.25);
        }
        .vlist-card.is-active {
          border-color: rgba(52,213,255,0.65);
          box-shadow: 0 14px 40px rgba(0,0,0,0.6), 0 0 24px rgba(52,213,255,0.28);
        }
        .vlist-card .reel-topbar {
          padding: 2px 2px 6px 2px;
          font-size: 8.5px;
        }
        .vlist-card .reel-frame {
          cursor: pointer;
          position: relative;
          width: 100%;
          aspect-ratio: 9/16;
          border-radius: 12px;
          overflow: hidden;
          background: #050507;
        }
        .vlist-card .reel-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vlist-card .reel-caption {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 2px 2px 2px;
          gap: 4px;
        }
        .vlist-card .reel-title {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 68%;
        }
        .vlist-card .reel-tag {
          font-size: 8px;
          color: var(--muted);
          font-family: 'JetBrains Mono', monospace;
          flex-shrink: 0;
        }
        .reel-iframe {
          border: none;
          width: 100%;
          height: 100%;
          display: block;
        }
        .reel-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--muted);
          background: #0b0b10;
        }
        .reel-poster-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #060609;
        }
        .reel-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
        }
        .vlist-card:hover .reel-poster {
          transform: scale(1.045);
          filter: brightness(1.06);
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: var(--cyan);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .play-overlay {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(5,5,7,0.32);
        }
        .play-btn {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, var(--violet), var(--cyan));
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 22px rgba(139,107,255,0.5);
          transition: transform 0.2s ease;
        }
        .vlist-card:hover .play-btn {
          transform: scale(1.08);
        }
        .mute-btn {
          position: absolute; top: 8px; left: 8px; z-index: 3;
          width: 26px; height: 26px; border-radius: 50%; border: none;
          background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(6px);
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .mute-btn:hover {
          transform: scale(1.1);
          background: rgba(0,0,0,0.8);
        }
        .pause-hint {
          position: absolute; bottom: 8px; left: 8px; z-index: 3;
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center;
        }
        .close-player-btn {
          position: absolute; top: 8px; right: 8px; z-index: 10;
          width: 26px; height: 26px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(14, 14, 18, 0.85); color: #fff;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(8px);
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .close-player-btn:hover {
          transform: scale(1.15);
          background: rgba(255, 68, 56, 0.9);
          border-color: rgba(255, 68, 56, 1);
        }

        @media (max-width: 460px) {
          .vlist {
            gap: 10px;
          }
          .bse-container.bse-container-wide {
            padding: 0 10px 100px 10px;
          }
          .vlist-card {
            padding: 6px;
            border-radius: 14px;
          }
          .vlist-card .reel-topbar {
            font-size: 7.5px;
            padding-bottom: 4px;
          }
          .vlist-card .reel-title {
            font-size: 10px;
          }
          .play-btn {
            width: 36px;
            height: 36px;
          }
        }

        /* About */
        .about-card {
          text-align: center; padding: 0 6px 30px 6px;
          opacity: 0; transform: translateY(16px); transition: opacity .8s ease, transform .8s ease;
        }
        .about-card.in-view { opacity: 1; transform: translateY(0); }
        .avatar-ring {
          width: 78px; height: 78px; border-radius: 50%; margin: 0 auto 20px auto;
          padding: 3px; background: linear-gradient(135deg, var(--violet), var(--cyan));
          display: flex; align-items: center; justify-content: center;
        }
        .avatar-inner {
          width: 100%; height: 100%; border-radius: 50%; background: #0c0c11;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.05em;
        }
        .about-text { font-size: 14px; line-height: 1.75; color: var(--muted); max-width: 360px; margin: 0 auto; }

        .tools-wrap { padding: 20px 0 40px 0; opacity: 0; transform: translateY(14px); transition: opacity .8s ease, transform .8s ease; }
        .tools-wrap.in-view { opacity: 1; transform: translateY(0); }
        .tools-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 14px; }

        .process { display: flex; flex-direction: column; gap: 22px; padding: 10px 0 10px 0; }
        .process-row { display: flex; gap: 16px; align-items: flex-start; }
        .process-code {
          font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--violet);
          background: var(--glass); border: 1px solid var(--border); border-radius: 8px;
          padding: 5px 8px; flex-shrink: 0;
        }
        .process-title { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
        .process-desc { font-size: 12.5px; color: var(--muted); line-height: 1.55; }

        @media (min-width: 480px) { .reel-card { width: 180px; } }
        @media (prefers-reduced-motion: reduce) { .bse-root * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className="bse-grid" />
      <div className="bse-glow-a" />
      <div className="bse-glow-b" />

      <div className={`bse-container ${page === "videos" ? "bse-container-wide" : ""}`}>
        <div className="top-corner-brand">
          <button
            onClick={() => setPage("home")}
            className="corner-brand-btn"
            title="Kalzo Edits"
            aria-label="Kalzo Edits Home"
          >
            <img src="/logo.svg" alt="Kalzo Edits" className="corner-logo-img" />
          </button>
        </div>

        {page === "home" && <HomePage setPage={setPage} reels={reels} />}
        {page === "videos" && <VideosPage setPage={setPage} reels={reels} />}
        {page === "about" && <AboutPage setPage={setPage} />}

        <div className="footer-note" style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.06em", color: "#55555f", paddingTop: 20 }}>
          <Circle size={6} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          KALZO EDITS — EST. {new Date().getFullYear()}
        </div>
      </div>

      <NavPill page={page} setPage={setPage} />
    </div>
  );
}