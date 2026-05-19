# ShipSafe — Project Diagnosis Report
> Generated: 2026-05-19 | Branch: `main` | Commit: `1ef1352` | Status: ✅ All changes pushed to GitHub

---

## 🧭 What Is ShipSafe?

ShipSafe is a **developer toolkit for shipping AI responsibly**. The core idea: before you deploy an AI product, you should check three things — *Is my code safe? Is my project legal? Am I ready to deploy?*

ShipSafe gives you **six tools** to answer those questions, all powered by Gemini 2.5 Flash (via a serverless proxy), with results saved to Supabase so users can track progress over time.

**The pipeline:**
```
01 CODE  → AI Debugger + Vibe-Code Audit
02 LEGAL → Regulation Tracker + Loophole Finder
03 DEPLOY → Deploy Checker + Stress Tester
```

---

## 🏗️ Architecture

```
BROWSER (React SPA — Vite + React 19 + React Router 7)
    |
    | fetch("/api/...")
    ↓
VERCEL SERVERLESS FUNCTIONS (/api)
  /api/claude  — AI proxy (Gemini 2.5 Flash)
  /api/github  — GitHub repo fetcher
  /api/embed   — Vector embedding generator
    |                     |
    ↓                     ↓
 Google Gemini         SUPABASE
 2.5 Flash API         Auth + scan_history + reports + regulations
```

**Deploy target:** Vercel | **Auth:** Supabase (email + GitHub OAuth)
**Database:** Supabase Postgres (4 tables: scan_history, reports, regulations, users)

---

## 📂 Git / GitHub Status

| Check | Result |
|-------|--------|
| Branch | `main` |
| Last commit | `1ef1352` — fix: polish frontend UX |
| Remote | `https://github.com/ishanshaurya/Shipsafe.git` |
| Untracked files | **None** |
| Working tree | **Clean** |
| Unpushed commits | **None — fully synced** |

✅ **Everything is on GitHub. Nothing is missing.**

Correctly excluded by `.gitignore` (intentionally NOT on GitHub):
- `node_modules/` — regenerated via `npm install`
- `dist/`, `build/` — regenerated via `npm run build`
- `.env.local` — secrets (API keys) — **never commit these**
- `backend/venv/` — Python virtual environment

---

## 📁 ROOT FOLDER

| File | Purpose | Health |
|------|---------|--------|
| `package.json` | Deps: React 19, Vite 8, Supabase, Lucide, React Router 7, Recharts | ✅ |
| `vite.config.js` | Build config | ✅ |
| `vercel.json` | SPA routing + 4 security headers | ✅ |
| `eslint.config.js` | Linting | ✅ |
| `index.html` | SPA entry point | ✅ |
| `.gitignore` | Covers node_modules, dist, .env.local, venv | ✅ |
| `README.md` | Project readme | ✅ |
| `shipsafe-deep-dive.docx` | Project docs | ✅ |
| `.env.example` | Template showing required env vars | ✅ |

> ⚠️ Missing: `LICENSE` and `CONTRIBUTING.md` — add before going public.

---

## 📁 /api — SERVERLESS BACKEND

These 3 files ARE the backend. Each is one HTTP endpoint deployed on Vercel.

### `api/claude.js` (11.5 KB)
- Proxies requests to Google Gemini 2.5 Flash
- Keeps the API key server-side (never in the browser)
- Supports both streaming (`stream: true`) and standard responses
- Selects system prompts by tool name server-side
- **Health: ✅ Well-structured**

### `api/github.js` (9.9 KB)
- Fetches code from GitHub repos for scanning
- Two modes: `list` (file tree for picker UI) and standard (auto-select + fetch content)
- Auto-selects relevant files, filters binaries/lockfiles, truncates to token limits
- **Health: ✅ Well-structured**

### `api/embed.js` (5.1 KB)
- Generates vector embeddings for "Similar Past Scans" feature
- Actions: `generate` (text → embedding), `save` (to Supabase), `similar` (nearest-neighbor)
- **Health: ⚠️ Only wired in Debugger — other 4 tools don't use it (see Issues)**

---

## 📁 /src — FRONTEND

### /src/components — Shared UI

| File | What it does | Health |
|------|-------------|--------|
| `Layout.jsx` | Sidebar nav + topbar + mobile hamburger | ✅ |
| `Logo.jsx` | Custom SVG lock/shield logo | ✅ |
| `ProtectedRoute.jsx` | Auth guard → redirect to /login | ✅ |
| `NextSteps.jsx` | "Recommended Next Steps" after scans | ✅ |
| `ReportButton.jsx` | "Generate Public Report" + copy link | ✅ |

> ⚠️ No shared `ErrorBoundary` component — a page crash blanks the whole app.

---

### /src/pages — 10 Pages

| Page | Route | AI? | Saves to DB? | Health |
|------|-------|-----|-------------|--------|
| `Landing.jsx` | `/` | ❌ | — | ✅ |
| `Login.jsx` | `/login` | ❌ | — | ✅ |
| `Dashboard.jsx` | `/dashboard` | ❌ | reads | ✅ |
| `Debugger.jsx` | `/debugger` | ✅ streaming | ✅ | ✅ Best page |
| `Audit.jsx` | `/audit` | ⚠️ **MOCK** | ✅ | ❌ Critical issue |
| `Regulations.jsx` | `/regulations` | ✅ | ❌ | ✅ |
| `Loopholes.jsx` | `/loopholes` | ✅ | ✅ | ✅ |
| `DeployCheck.jsx` | `/deploy-check` | ✅ | ✅ | ✅ |
| `StressTest.jsx` | `/stress-test` | ✅ | ✅ | ✅ |
| `Report.jsx` | `/report/:slug` | ❌ | reads | ✅ |

**Key notes:**

**Debugger** — Most feature-rich: GitHub file picker (2-step), code editor with line numbers, streaming AI, expandable issue cards, similarity search. ✅ Best page.

**Audit** — ❌ CRITICAL: Uses `getMockAudit()` (local regex) instead of the real AI. Every other tool calls `callAIStream`. Audit is faking results. The `callAI("audit", ...)` pathway exists in scanService.js but is never called.

**Dashboard** — Ship-Readiness ring score, 4 stat cards, quick actions, recent scans, pipeline overview. Uses mock data for logged-out users. ✅ Solid.

**Landing** — Hero with mouse parallax, pipeline section, features grid, CTA, footer. ⚠️ Nav not responsive on mobile (no hamburger on landing).

---

### /src/services

| File | Purpose | Health |
|------|---------|--------|
| `scanService.js` | Single source for all AI calls — `callAI`, `callAIStream`, `fetchRegulations`, `extractScore` | ✅ Excellent |
| `supabaseService.js` | Single source for all Supabase ops — saveScan, getScanHistory, saveReport, getReportBySlug, etc. | ✅ Excellent |

Both follow single-responsibility: if the AI provider or DB changes, only one file needs updating each.

### /src/hooks

| File | Purpose | Health |
|------|---------|--------|
| `useAuth.jsx` | Auth context — provides user, signOut, loading | ✅ |
| `useIsMobile.js` | Returns true if viewport < 768px | ✅ |
| `useReport.js` | Public report generation logic | ✅ |

### /src/utils

| File | Purpose | Health |
|------|---------|--------|
| `crossToolSuggestions.js` | `getSuggestions()` — next-step recommendations after each scan | ✅ |
| `shipReadiness.js` | `computeShipReadiness()` — composite score for Dashboard | ✅ |

### /src/data

| File | Purpose | Health |
|------|---------|--------|
| `mockResults.js` | Mock scans for logged-out Dashboard + regulations fallback | ✅ |

---

## 📁 /backend — Python Backend

| Item | Status |
|------|--------|
| Python source files | ❌ **None found** |
| `venv/` | Python 3.13 venv exists (100+ packages installed) |
| `.env` | Has env vars (correctly not on GitHub) |

> ❌ Critical gap: The `/backend` directory has a full Python venv set up but **zero Python source files**. The real backend is the `/api` serverless JS functions. Either the Python backend was abandoned or scripts were never committed. Action required — see Issues below.

---

## 📁 /frontend — Stale Duplicate

| Item | Status |
|------|--------|
| `/frontend/src/App.jsx` | Old version — NOT the active app |
| `/frontend/src/components/` | Old ProtectedRoute, ReportButton |
| `/frontend/src/hooks/` | Old useReport |
| `/frontend/src/pages/` | Old Report.jsx |

> ❌ Structural issue: There are TWO frontends. The real app is in `/src`. The `/frontend/src` is an older iteration superseded during restructuring. Vite reads from `/src`. The `/frontend` files are stale, unused, and confusing.

---

## 🐛 ALL ISSUES — PRIORITIZED

### 🔴 Critical

| # | File | Issue | Reason | Fix |
|---|------|-------|--------|-----|
| 1 | `src/pages/Audit.jsx` | **Audit uses fake local regex instead of AI** | `getMockAudit()` returns deterministic fake results. Users think they're getting AI analysis but aren't. | Replace `getMockAudit()` + delay with `callAIStream("audit", { projectDescription: "Vibe-Code Audit", files: code })` — scanService already has the audit prompt and validator |
| 2 | `/backend/` | **Empty Python backend** | Venv exists, no source code. Unclear intent. | Decision: if JS serverless is the final approach, delete this directory. If Python was planned, add the scripts. |
| 3 | `/frontend/src/` | **Stale duplicate frontend** | Creates confusion about which files are authoritative. Could lead to editing the wrong files. | Delete `/frontend/src/` entirely |

### 🟠 High

| # | File | Issue | Reason | Fix |
|---|------|-------|--------|-----|
| 4 | All tool pages except Debugger | **`attachEmbedding` not called** | Similarity search only works for Debugger scans. 4 other tools generate scans but never create embeddings. | Add `attachEmbedding(scanId, scanType, result)` call after `saveScan` in Audit, Loopholes, DeployCheck, StressTest |
| 5 | `src/pages/Landing.jsx` | **No mobile navigation** | 6 nav links overflow on small screens with no hamburger. Landing page has separate layout from the app, so Layout.jsx's mobile menu doesn't apply. | Add responsive nav with hamburger on landing |
| 6 | `vercel.json` | **Missing Content-Security-Policy** | 4 security headers exist but CSP (the most important one, preventing XSS) is absent. | Add `Content-Security-Policy` restricting script and style sources |

### 🟡 Medium

| # | File | Issue | Reason | Fix |
|---|------|-------|--------|-----|
| 7 | `src/App.jsx` | **No ErrorBoundary** | Runtime JS errors in any page crash the whole app with a blank screen. | Wrap routes in a React ErrorBoundary component |
| 8 | `src/index.css` | **TailwindCSS imported but unused** | `@import "tailwindcss"` adds to bundle size but no page uses Tailwind classes — all styling is inline. | Remove `@import "tailwindcss"` from index.css and `tailwindcss` from package.json devDependencies |
| 9 | `src/pages/Regulations.jsx` | **Not saved to scan history** | Regulation searches aren't recorded, so Dashboard scan count and Ship-Readiness don't reflect regulation usage. | Call `saveScan` after each regulation fetch |
| 10 | `src/pages/Dashboard.jsx` | **Plain "Loading..." text** | The recent scans loading state is plain unstyled text, inconsistent with the polished spinner elsewhere. | Replace with skeleton loader rows |
| 11 | `postman/` | **Empty collections** | Postman directories exist but no request examples. Makes API testing harder for new contributors. | Add request examples for /api/claude, /api/github, /api/embed |

### 🟢 Low / Cleanup

| # | File | Issue | Fix |
|---|------|-------|-----|
| 12 | Root | No `LICENSE` file | Add MIT or Apache-2.0 |
| 13 | Root | No `CONTRIBUTING.md` | Add basic contribution guide |
| 14 | `src/pages/Login.jsx` | No "Forgot password" link | Add `supabase.auth.resetPasswordForEmail()` flow |
| 15 | `sprint-dashboard/` | Separate internal tool inside the repo | Move outside repo or properly document its purpose |

---

## ✅ What's Working Well

- **Service layer** — `scanService.js` + `supabaseService.js` are single-responsibility and well-documented. Professional pattern.
- **Auth flow** — Supabase Auth + ProtectedRoute + useAuth hook is complete and clean.
- **Streaming AI** — `callAIStream` with SSE parsing and live preview is a premium UX touch.
- **GitHub file picker** — 2-step file selection with auto-recommend is genuinely useful.
- **Ship-Readiness score** — Cross-tool composite scoring on the Dashboard is a unique, smart feature.
- **Public report sharing** — Full slug-based shareable reports are production-ready.
- **Security headers** — vercel.json has 4 security headers configured.
- **Mobile responsiveness** — useIsMobile + Layout mobile sidebar is correctly implemented.
- **Error handling** — All API calls have try/catch, all UI states have error display.

---

## 🚀 Next Steps — Priority Order

```
1. [CRITICAL] Fix Audit.jsx — replace getMockAudit() with real callAIStream("audit", ...)
2. [CRITICAL] Delete /frontend/src/ — stale duplicate causes confusion
3. [HIGH]     Wire attachEmbedding into Audit, Loopholes, DeployCheck, StressTest
4. [HIGH]     Fix Landing page mobile nav responsiveness
5. [MEDIUM]   Remove unused Tailwind import from index.css
6. [MEDIUM]   Add ErrorBoundary to App.jsx
7. [MEDIUM]   Add Content-Security-Policy to vercel.json
8. [LOW]      Add LICENSE and CONTRIBUTING.md to root
9. [CLEANUP]  Decide on /backend/ — populate with Python or delete the directory
10.[CLEANUP]  Populate Postman collection with API examples
```
