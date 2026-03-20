import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  Shield, Bug, Search, Scale, KeyRound, Rocket,
  FlaskConical, ArrowRight, ChevronRight, ChevronDown,
  Zap, Clock, AlertTriangle, Check, X, Code, Globe,
  Users, Lock, Terminal, FileWarning, Gauge
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

/* ═══════════════════════════════════════════════════════════
   SHIPSAFE LANDING PAGE
   Design: Deep navy glassmorphism — inspired by Puzzle.io
   Colors: Navy bg (#0a0e1a), mint green accent (#34d399),
           subtle blue arcs, glass cards with faint borders
   Typography: Clash Display (display) + DM Sans (body)
   ═══════════════════════════════════════════════════════════ */

// ─── Shared Styles ────────────────────────────────────────
const glassCard = {
  background: 'rgba(15, 22, 40, 0.6)',
  border: '1px solid rgba(56, 189, 248, 0.08)',
  borderRadius: 20,
  backdropFilter: 'blur(20px)',
}

const glassCardHover = {
  ...glassCard,
  transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
}

const mintBtn = {
  background: '#34d399',
  color: '#0a0e1a',
  padding: '14px 32px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s, transform 0.2s',
  fontFamily: "'DM Sans', sans-serif",
}

const outlineBtn = {
  background: 'transparent',
  color: '#34d399',
  padding: '14px 32px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid rgba(52, 211, 153, 0.3)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: "'DM Sans', sans-serif",
}

// ─── Background SVG with radial arcs ─────────────────────
function ArcBackground() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      {/* Radial gradient glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '140%',
        height: '80%',
        background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.04) 0%, transparent 70%)',
      }} />
      {/* Arc lines */}
      <svg
        viewBox="0 0 1200 800"
        style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120%', height: '100%', opacity: 0.12 }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="600" cy="100" rx="500" ry="300" stroke="url(#arcGrad)" strokeWidth="0.5" />
        <ellipse cx="600" cy="100" rx="400" ry="240" stroke="url(#arcGrad)" strokeWidth="0.5" />
        <ellipse cx="600" cy="100" rx="300" ry="180" stroke="url(#arcGrad)" strokeWidth="0.5" />
        <ellipse cx="600" cy="100" rx="200" ry="120" stroke="url(#arcGrad)" strokeWidth="0.5" />
        {/* Vertical dashed line */}
        <line x1="600" y1="0" x2="600" y2="800" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" strokeDasharray="6 6" />
        <defs>
          <linearGradient id="arcGrad" x1="100" y1="0" x2="1100" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
      {/* Bottom light burst */}
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(52, 211, 153, 0.03) 0%, transparent 70%)',
      }} />
    </div>
  )
}

// ─── Mini UI Preview Components ───────────────────────────
function MiniCodePreview() {
  return (
    <div style={{
      background: '#080c16',
      borderRadius: 10,
      padding: '14px 16px',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      lineHeight: 1.8,
      border: '1px solid rgba(56, 189, 248, 0.08)',
    }}>
      <div style={{ color: '#475569' }}>// AI Debugger scan result</div>
      <div><span style={{ color: '#ef4444' }}>✕</span> <span style={{ color: '#94a3b8' }}>Line 12:</span> <span style={{ color: '#fbbf24' }}>SQL injection vulnerability</span></div>
      <div><span style={{ color: '#ef4444' }}>✕</span> <span style={{ color: '#94a3b8' }}>Line 34:</span> <span style={{ color: '#fbbf24' }}>Hardcoded API key</span></div>
      <div><span style={{ color: '#22c55e' }}>✓</span> <span style={{ color: '#94a3b8' }}>Line 56:</span> <span style={{ color: '#34d399' }}>Fixed: added input sanitization</span></div>
      <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
        <span style={{ color: '#0a0e1a', background: '#ef4444', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>2 CRITICAL</span>
        <span style={{ color: '#0a0e1a', background: '#34d399', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>1 FIXED</span>
      </div>
    </div>
  )
}

function MiniRegPreview() {
  return (
    <div style={{
      background: '#080c16',
      borderRadius: 10,
      padding: '14px 16px',
      fontSize: 11,
      border: '1px solid rgba(56, 189, 248, 0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Global Coverage</span>
        <span style={{ color: '#34d399', fontSize: 10, fontWeight: 600 }}>14 REGULATIONS</span>
      </div>
      {[
        { flag: '🇪🇺', name: 'EU AI Act', status: 'Enacted', color: '#22c55e' },
        { flag: '🇮🇳', name: 'DPDP Act', status: 'Enacted', color: '#22c55e' },
        { flag: '🇺🇸', name: 'US AI Safety EO', status: 'Active', color: '#3b82f6' },
        { flag: '🇧🇷', name: 'Brazil AI Bill', status: 'Proposed', color: '#f59e0b' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: i > 0 ? '1px solid rgba(26,37,64,0.6)' : 'none' }}>
          <span style={{ fontSize: 14 }}>{r.flag}</span>
          <span style={{ flex: 1, color: '#94a3b8', fontSize: 11 }}>{r.name}</span>
          <span style={{ color: r.color, fontSize: 9, fontWeight: 600, letterSpacing: '0.05em' }}>{r.status.toUpperCase()}</span>
        </div>
      ))}
    </div>
  )
}

function MiniScorePreview() {
  return (
    <div style={{
      background: '#080c16',
      borderRadius: 10,
      padding: '14px 16px',
      fontSize: 11,
      border: '1px solid rgba(56, 189, 248, 0.08)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Project Health Score</div>
      {[
        { label: 'Security', score: 72, color: '#f97316' },
        { label: 'Code Quality', score: 85, color: '#34d399' },
        { label: 'Compliance', score: 40, color: '#ef4444' },
        { label: 'Deploy Ready', score: 91, color: '#34d399' },
      ].map((item, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#64748b' }}>{item.label}</span>
            <span style={{ color: item.color, fontWeight: 600 }}>{item.score}%</span>
          </div>
          <div style={{ height: 4, background: '#1a2540', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ width: `${item.score}%`, height: '100%', background: item.color, borderRadius: 100, transition: 'width 1s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniLoopholePreview() {
  return (
    <div style={{
      background: '#080c16',
      borderRadius: 10,
      padding: '14px 16px',
      fontSize: 11,
      border: '1px solid rgba(56, 189, 248, 0.08)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>Grey Areas Detected</div>
      {[
        { text: 'EU AI Act: recommendation systems not clearly classified as high-risk', severity: 'medium' },
        { text: 'India DPDP: cross-border consent mechanism undefined for AI models', severity: 'high' },
      ].map((item, i) => (
        <div key={i} style={{
          padding: '8px 10px',
          background: item.severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
          border: `1px solid ${item.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`,
          borderRadius: 8,
          marginBottom: 6,
          color: '#94a3b8',
          lineHeight: 1.5,
        }}>
          <span style={{ color: item.severity === 'high' ? '#ef4444' : '#eab308', fontWeight: 600, marginRight: 6 }}>
            {item.severity === 'high' ? '⚠' : '◐'}
          </span>
          {item.text}
        </div>
      ))}
    </div>
  )
}

// ─── FAQ Component ────────────────────────────────────────
function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)
  const faqs = [
    { q: 'Is ShipSafe free to use?', a: 'Yes. ShipSafe runs on free tiers — Supabase for the database, Vercel for hosting, and Claude AI for analysis. No credit card required.' },
    { q: 'What does the AI Debugger actually detect?', a: 'It finds bugs, security vulnerabilities (SQL injection, XSS, hardcoded secrets), and vibe-code smells — patterns unique to AI-generated code like hallucinated imports, missing error handling, and copy-pasted blocks.' },
    { q: 'How is ShipSafe different from a regular linter?', a: 'Linters check syntax. ShipSafe checks intent. It understands that your code was likely AI-generated and looks for patterns that ESLint or Prettier will never catch — like imports for packages that don\'t exist, or API endpoints that were hallucinated.' },
    { q: 'Does the Loophole Finder give legal advice?', a: 'No. It identifies grey areas and ambiguities in AI regulations based on our database. It\'s an intelligence tool for developers, not a substitute for legal counsel.' },
    { q: 'Can I share my scan results publicly?', a: 'Yes. Every scan can generate a public report with a shareable URL. Great for showing compliance to investors, clients, or your team.' },
    { q: 'What regulations does ShipSafe track?', a: '14+ global AI regulations including the EU AI Act, India\'s DPDP Act, US Executive Order on AI Safety, China\'s AIGC regulations, and more. We add new regulations as they\'re enacted.' },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {faqs.map((faq, i) => (
        <div
          key={i}
          style={{
            borderBottom: '1px solid rgba(26, 37, 64, 0.6)',
            cursor: 'pointer',
          }}
          onClick={() => setOpenIndex(openIndex === i ? null : i)}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0',
          }}>
            <span style={{
              fontSize: 15,
              color: openIndex === i ? '#e2e8f0' : '#94a3b8',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              transition: 'color 0.2s',
            }}>
              {faq.q}
            </span>
            <ChevronRight
              size={18}
              style={{
                color: '#475569',
                transform: openIndex === i ? 'rotate(90deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
                flexShrink: 0,
                marginLeft: 16,
              }}
            />
          </div>
          {openIndex === i && (
            <div style={{
              padding: '0 0 20px',
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.7,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════
export default function Landing() {
  const isMobile = useIsMobile()
  const sp = isMobile ? '40px 20px' : '80px 48px'  // section padding shorthand
  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: '#0a0e1a',
      color: '#e2e8f0',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        padding: isMobile ? '0 16px' : '0 48px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        borderBottom: '1px solid rgba(56, 189, 248, 0.06)',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #34d399, #06b6d4)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🛡</div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em',
          }}>ShipSafe</span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Features', 'How it Works', 'Tools', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} style={{
                fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = '#e2e8f0'}
                onMouseLeave={e => e.target.style.color = '#64748b'}
              >{item}</a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" style={{
            fontSize: 13, color: '#34d399', textDecoration: 'none', fontWeight: 600,
            padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(52, 211, 153, 0.25)',
          }}>Log in</Link>
          {!isMobile && (
            <Link to="/dashboard" style={{ ...mintBtn, padding: '10px 24px', fontSize: 13 }}>
              Get started for free
            </Link>
          )}
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        position: 'relative',
        padding: isMobile ? '40px 16px' : '100px 48px 80px',
        textAlign: 'center',
      }}>
        <ArcBackground />

        <div style={{
          ...glassCard,
          maxWidth: 1100,
          margin: '0 auto',
          padding: isMobile ? '32px 20px' : '80px 60px 60px',
          position: 'relative',
          zIndex: 1,
        }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? 32 : 58,
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#f1f5f9',
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}>
            AI Developer Toolkit That
            <br />
            <span style={{ color: '#34d399' }}>Ships Responsibly</span>
          </h1>

          <p style={{
            fontSize: isMobile ? 14 : 17,
            color: '#64748b',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 12px',
          }}>
            Built for the vibe-coding era. Debug AI-generated code, check global
            regulation compliance, and validate deployment — all in one place.
          </p>

          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: isMobile ? 24 : 40 }}>
            Built with <span style={{ color: '#34d399' }}>Claude AI</span> · 100% Free
          </p>

          {isMobile && (
            <Link to="/dashboard" style={{ ...mintBtn, marginBottom: 24, justifyContent: 'center' }}>
              Get started for free
            </Link>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 10 : 14,
            marginTop: isMobile ? 0 : 40,
          }}>
            {[
              { icon: Bug, title: 'AI Debugger', desc: 'Find bugs & vibe-code smells', color: '#ef4444', preview: <MiniCodePreview /> },
              { icon: Scale, title: 'Regulations', desc: '14+ global AI laws tracked', color: '#0ea5e9', preview: <MiniRegPreview /> },
              { icon: Search, title: 'Vibe-Code Audit', desc: 'Full project health score', color: '#f97316', preview: <MiniScorePreview /> },
              { icon: KeyRound, title: 'Loophole Finder', desc: 'Legal grey area detection', color: '#a855f7', preview: <MiniLoopholePreview /> },
            ].map((card, i) => (
              <Link
                key={i}
                to={card.title === 'AI Debugger' ? '/debugger' : card.title === 'Regulations' ? '/regulations' : card.title === 'Vibe-Code Audit' ? '/audit' : '/loopholes'}
                style={{
                  ...glassCardHover,
                  padding: '20px 18px',
                  textDecoration: 'none',
                  textAlign: 'left',
                  borderRadius: 16,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = card.color + '40'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 8px 30px ${card.color}15`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <card.icon size={15} color={card.color} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{card.title}</span>
                </div>
                <p style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>{card.desc}</p>
                {card.preview}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ USER TYPE SECTION — "I'm a Developer" / "I'm a Founder" ═══ */}
      <section style={{ position: 'relative', padding: sp }}>
        <ArcBackground />
        <div style={{
          ...glassCard,
          maxWidth: 1100,
          margin: '0 auto',
          padding: isMobile ? '28px 20px' : '60px',
          position: 'relative',
          zIndex: 1,
        }}>
          {!isMobile && (
            <div style={{
              position: 'absolute', left: '50%', top: 40, bottom: 40,
              width: 1, borderLeft: '1px dashed rgba(148,163,184,0.2)',
            }} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80 }}>
            {/* Developer */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Terminal size={20} color="#64748b" />
              </div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: '#f1f5f9',
                marginBottom: 12,
              }}>
                I'm A Developer
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                I build AI features fast using ChatGPT/Cursor and need to make sure my code is clean, secure, and compliant before shipping.
              </p>
              <Link to="/debugger" style={{ color: '#34d399', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                Explore developer tools <ChevronRight size={16} />
              </Link>
            </div>

            {/* Founder */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '1px solid rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                marginLeft: 'auto',
              }}>
                <Users size={20} color="#64748b" />
              </div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: '#f1f5f9',
                marginBottom: 12,
              }}>
                I'm A Founder
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                I need to understand which AI laws apply to my product, what the risks are, and get shareable compliance reports for investors.
              </p>
              <Link to="/regulations" style={{ color: '#34d399', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                Explore compliance tools <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON SECTION — "With ShipSafe vs Without" ═══ */}
      <section id="how-it-works" style={{ position: 'relative', padding: sp }}>
        <ArcBackground />
        <div style={{
          ...glassCard,
          maxWidth: 1100,
          margin: '0 auto',
          padding: isMobile ? '28px 20px' : '60px',
          position: 'relative',
          zIndex: 1,
        }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? 24 : 36,
            fontWeight: 800,
            color: '#f1f5f9',
            textAlign: 'center',
            marginBottom: isMobile ? 28 : 48,
          }}>
            Results In <span style={{ color: '#34d399', textDecoration: 'underline', textUnderlineOffset: 6, textDecorationColor: 'rgba(52,211,153,0.3)' }}>5 Minutes</span>, Not 5 Sprints
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 28 : 40 }}>
            {/* With ShipSafe */}
            <div>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: '#34d399', marginBottom: 6, textAlign: 'center' }}>With ShipSafe</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
                {[
                  { icon: Clock, label: '5 Min', color: '#34d399' },
                  { icon: Zap, label: '3 Tools', color: '#34d399' },
                  { icon: Lock, label: 'Free', color: '#34d399' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#34d399', fontWeight: 500 }}>
                    <item.icon size={14} /> {item.label}
                    {i < 2 && <span style={{ color: '#1a2540', marginLeft: 8 }}>|</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  ...glassCard,
                  flex: 1,
                  padding: 16,
                  borderRadius: 14,
                }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>Auto-generated scan</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60, marginBottom: 4 }}>
                    {[35, 55, 70, 85].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(180deg, #34d399, #06b6d4)', borderRadius: 4, opacity: 0.7 + i * 0.1 }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Bugs found & fixed instantly</div>
                </div>
                <div style={{
                  ...glassCard,
                  width: 120,
                  padding: 16,
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>92%</div>
                  <div style={{ fontSize: 10, color: '#34d399' }}>↑ Compliant</div>
                </div>
              </div>
            </div>

            {/* Without ShipSafe */}
            <div>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textAlign: 'center' }}>Without ShipSafe</h4>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
                {[
                  { icon: Clock, label: '5 Days' },
                  { icon: Zap, label: '15 Steps' },
                  { icon: Lock, label: '$500+' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', fontWeight: 500 }}>
                    <item.icon size={14} /> {item.label}
                    {i < 2 && <span style={{ color: '#1a2540', marginLeft: 8 }}>|</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  ...glassCard,
                  flex: 1,
                  padding: 16,
                  borderRadius: 14,
                  opacity: 0.5,
                }}>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>Manual review</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60, marginBottom: 4 }}>
                    {[0, 0, 0, 0].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: 8, background: '#1a2540', borderRadius: 4, borderTop: '1px dashed #334155' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: '#334155' }}>Manual code review needed</div>
                </div>
                <div style={{
                  ...glassCard,
                  width: 120,
                  padding: 16,
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#475569', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>?%</div>
                  <div style={{ fontSize: 10, color: '#334155' }}>Unknown</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PIPELINE SECTION ═══ */}
      <section id="features" style={{ padding: sp, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48, position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? 24 : 36,
            fontWeight: 800,
            color: '#f1f5f9',
            marginBottom: 8,
          }}>
            Three Stages. One Pipeline.
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 15, color: '#64748b' }}>
            Every tool answers one of three questions on your way to production.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {[
            {
              num: '01', label: 'CODE', question: 'Is my code safe?', color: '#0ea5e9',
              tools: ['AI Debugger', 'Vibe-Code Audit'],
              desc: 'Paste code, get instant bug detection + AI-pattern warnings.',
            },
            {
              num: '02', label: 'LEGAL', question: 'Is my project legal?', color: '#f59e0b',
              tools: ['Regulation Tracker', 'Loophole Finder'],
              desc: '14+ global AI laws. Find what applies and where the grey areas are.',
            },
            {
              num: '03', label: 'DEPLOY', question: 'Am I ready to ship?', color: '#34d399',
              tools: ['Deploy Checker', 'Stress Tester'],
              desc: 'Validate config, security headers, and simulate load.',
            },
          ].map((stage, i) => (
            <div key={i} style={{
              ...glassCard,
              padding: '32px 28px',
              borderRadius: 18,
              position: 'relative',
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: stage.color,
                letterSpacing: '0.14em',
                marginBottom: 16,
              }}>
                STAGE {stage.num}
              </div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 24,
                fontWeight: 800,
                color: '#f1f5f9',
                marginBottom: 6,
              }}>{stage.label}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 }}>"{stage.question}"</p>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 16 }}>{stage.desc}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {stage.tools.map((tool, j) => (
                  <span key={j} style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: stage.color,
                    background: stage.color + '12',
                    padding: '4px 10px',
                    borderRadius: 6,
                    letterSpacing: '0.03em',
                  }}>{tool}</span>
                ))}
              </div>
              {/* Connector */}
              {i < 2 && (
                <div style={{
                  position: 'absolute',
                  right: -20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 20,
                  color: '#253352',
                  zIndex: 5,
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section style={{ position: 'relative', padding: sp }}>
        <ArcBackground />
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(52, 211, 153, 0.12)',
          borderRadius: 24,
          padding: isMobile ? '28px 20px' : '60px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 24 : 60,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              color: '#f1f5f9',
              marginBottom: 20,
            }}>
              Ready To Ship Safe?
            </h2>
            <div style={{ display: 'flex', gap: 14 }}>
              <Link to="/dashboard" style={mintBtn}>
                Get started for free
              </Link>
              <Link to="/debugger" style={outlineBtn}>
                Try the debugger
              </Link>
            </div>
          </div>
          {/* Mini app preview — hidden on mobile */}
          {!isMobile && <div style={{
            ...glassCard,
            padding: 16,
            borderRadius: 14,
            width: 340,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Mini sidebar */}
              <div style={{ width: 40, background: '#080c16', borderRadius: 6, padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                {[Bug, Scale, Search, Rocket].map((Icon, i) => (
                  <div key={i} style={{ width: 24, height: 24, borderRadius: 4, background: i === 0 ? 'rgba(52,211,153,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={12} color={i === 0 ? '#34d399' : '#334155'} />
                  </div>
                ))}
              </div>
              {/* Mini content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#475569', marginBottom: 6 }}>ShipSafe / Debugger</div>
                <MiniCodePreview />
              </div>
            </div>
          </div>}
        </div>
      </section>

      {/* ═══ FAQ SECTION ═══ */}
      <section id="faq" style={{ position: 'relative', padding: sp }}>
        <div style={{
          ...glassCard,
          maxWidth: 900,
          margin: '0 auto',
          padding: isMobile ? '28px 20px' : '60px',
          position: 'relative',
          zIndex: 1,
        }}>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 32,
            fontWeight: 800,
            color: '#f1f5f9',
            textAlign: 'center',
            marginBottom: 40,
          }}>FAQs</h2>
          <FAQ />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        borderTop: '1px solid rgba(26, 37, 64, 0.6)',
        padding: isMobile ? '24px 20px' : '32px 48px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 12 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 24,
            height: 24,
            background: 'linear-gradient(135deg, #34d399, #06b6d4)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
          }}>🛡</div>
          <span style={{ fontSize: 12, color: '#334155' }}>ShipSafe © 2026 — Built by Shaurya Ishan</span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>GitHub</a>
          <Link to="/dashboard" style={{ color: '#475569', textDecoration: 'none' }}>Open App</Link>
        </div>
      </footer>
    </div>
  )
}
