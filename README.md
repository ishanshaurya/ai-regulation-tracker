# ShipSafe

**Build, Validate & Deploy AI Responsibly**

ShipSafe is a developer toolkit for building, validating, and deploying AI projects responsibly. Every feature answers one of three questions in the deployment pipeline: Is my code safe? Is my project legal? Am I ready to ship?

Live Demo: [shipsafe-app.vercel.app](https://shipsafe-app.vercel.app)

---

## The Pipeline

| Stage 1: CODE | Stage 2: LEGAL | Stage 3: DEPLOY |
|---|---|---|
| *"Is my code safe?"* | *"Is my project legal?"* | *"Am I ready to ship?"* |
| AI Debugger + Vibe-Code Audit | Regulation Tracker + Loophole Finder | Deploy Checker + Stress Tester |

---

## Features

### AI Code Debugger
Paste any code and get an AI analysis covering bugs, security vulnerabilities, and vibe-code smells. Vibe-code smells are patterns specific to AI-generated code: hardcoded secrets, missing error handling, hallucinated imports, and scattered debug logs.

### Vibe-Code Audit
Paste your entire project structure and get a scored report card across 5 categories: Security, Code Quality, Maintainability, AI-Pattern Detection, and Deployment Readiness. Each category is scored independently with specific issues and fixes called out.

### Loophole Finder
Describe your AI system and select target deployment countries. The AI cross-references regulation databases to identify legal grey areas — where the law is ambiguous, enforcement is unclear, or competitors could exploit gaps. References real regulations: EU AI Act, India's DPDP Act, US Executive Order on AI, and more.

### Deploy Readiness Checker
Describe your deployment setup and the AI checks for common production issues: missing env vars, CORS misconfiguration, absent rate limiting, missing security headers, and platform-specific gotchas for Vercel, Netlify, AWS, and Railway. The final gate before shipping.

### Stress Tester
Describe your stack and the AI predicts bottlenecks at 10, 100, 1,000, and 10,000 concurrent users. The analysis identifies which component breaks first and includes realistic free-tier limits for Vercel, Supabase, and similar platforms.

### Dashboard
Track all your scans in one place with scan history, scores, issue counts, and quick access to every tool. Logged-in users get persistent scan history stored in Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + React Router |
| **Styling** | Tailwind CSS + custom dark theme |
| **Backend/DB** | Supabase (Auth + PostgreSQL + Row Level Security) |
| **AI Engine** | Google Gemini 2.5 Flash (primary) + Groq LLaMA 3.3 70B (fallback) |
| **Hosting** | Vercel (free tier) |
| **API Security** | Vercel Serverless Functions (API keys never reach the browser) |

---

## Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   React Frontend │──POST──▶│  /api/claude      │──────▶  │  Gemini 2.5  │
│   (Vite + React  │         │  (Vercel          │         │  Flash       │
│    Router)       │◀──JSON──│   Serverless)     │◀──────  │              │
└──────────────────┘         └──────────────────┘         └──────────────┘
        │                            │                     ┌──────────────┐
        │                            └─── fallback ──────▶ │  Groq LLaMA  │
        │                                                  │  3.3 70B     │
        │                                                  └──────────────┘
        │ if (user logged in)
        └──── save scan ────▶  Supabase (PostgreSQL + RLS)
```

**Key design decisions:**
- **Serverless proxy pattern** — React calls `/api/claude`, the serverless function adds the API key and forwards to Gemini. API keys never appear in frontend code.
- **Automatic fallback** — If Gemini fails, the proxy automatically tries Groq. No frontend changes needed.
- **Service layer** — `scanService.js` centralizes all AI calls. One function (`callAI`) handles prompt building, fetching, JSON parsing, and validation for all 5 tools.
- **Row Level Security** — Supabase RLS ensures users can only see their own scan history.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)
- Optional: A [Groq](https://console.groq.com) API key for fallback (free tier)

### Setup

```bash
# Clone the repo
git clone https://github.com/ishanshaurya/shipsafe.git
cd shipsafe

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Add your keys to `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key          # optional fallback
```

> **Note:** `GEMINI_API_KEY` and `GROQ_API_KEY` have no `VITE_` prefix — they run server-side only and are never exposed to the browser.

### Run locally

```bash
# Frontend only (AI features won't work — use deployed URL to test AI)
npm run dev

# Full stack locally (requires Vercel CLI)
npx vercel dev
```

### Deploy to Vercel

```bash
# Push to GitHub — Vercel auto-deploys
git push

# Or deploy manually
npx vercel --prod
```

Add environment variables in Vercel dashboard → Settings → Environment Variables.

---

## Project Structure

```
shipsafe/
├── api/
│   └── claude.js              # Serverless proxy → Gemini / Groq
├── src/
│   ├── components/
│   │   └── Layout.jsx         # Shared navbar + sidebar + dark theme
│   ├── pages/
│   │   ├── Dashboard.jsx      # User home (scan history, quick actions)
│   │   ├── Debugger.jsx       # AI Code Debugger
│   │   ├── Audit.jsx          # Vibe-Code Audit
│   │   ├── Loopholes.jsx      # Loophole Finder
│   │   ├── DeployCheck.jsx    # Deploy Readiness Checker
│   │   ├── StressTest.jsx     # Stress Tester
│   │   ├── Regulations.jsx    # AI Regulation Tracker
│   │   ├── Landing.jsx        # Public landing page
│   │   └── Login.jsx          # Auth page
│   ├── services/
│   │   ├── scanService.js     # AI call handler (all tools use this)
│   │   └── supabaseService.js # Database operations with error handling
│   ├── data/
│   │   └── mockResults.js     # Demo data for logged-out users
│   ├── hooks/
│   │   ├── useAuth.js         # Auth state hook
│   │   └── useIsMobile.js     # Responsive breakpoint hook
│   ├── lib/
│   │   └── supabase.js        # Supabase client init
│   └── App.jsx                # Router setup
├── vercel.json                # SPA routing rewrites
├── package.json
└── README.md
```

---

## Supabase Schema

| Table | Purpose |
|---|---|
| `scan_history` | Stores all scan results (debugger, audit, loopholes, deploy-check, stress-test) |
| `regulations` | AI regulation data (14 countries) — public read |
| `reports` | Public shareable reports (coming soon) |

All tables use **Row Level Security (RLS)** — users can only access their own data.

---

## Environment Variables

| Variable | Where it runs | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase public key (safe to expose — RLS protects data) |
| `GEMINI_API_KEY` | Server only | Google Gemini API key |
| `GROQ_API_KEY` | Server only | Groq API key (optional fallback) |

---

## Roadmap

- [x] AI Debugger with real Gemini analysis
- [x] Vibe-Code Audit with 5-category scoring
- [x] Loophole Finder with country-specific regulations
- [x] Deploy Readiness Checker
- [x] Stress Tester with tier-based predictions
- [x] Supabase Auth (email + GitHub)
- [x] Scan history dashboard
- [x] Groq fallback API
- [x] Public shareable reports (/report/:id)
- [ ] PDF export for reports
- [ ] Real regulation data API integration
- [ ] Rate limiting on AI proxy
- [ ] Mobile responsive

---

ShipSafe — built by Shaurya Ishan
