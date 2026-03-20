# 🛡 ShipSafe

### Don't just ship fast. Ship safe.

ShipSafe is an AI-powered developer toolkit that catches legal, compliance, and reliability risks in your code before you deploy — so you can move fast without breaking things that matter.

**[Live Demo →](https://shipsafe.vercel.app)**

---

## Features

- **Dashboard** — Live overview of your project's compliance status and risk score at a glance
- **AI Debugger** — Paste broken code, get a root-cause explanation and fix in seconds
- **Vibe-Code Audit** — Scans AI-generated code for security holes, bad patterns, and legal red flags
- **Loophole Detector** — Finds edge cases and logic gaps that slip past tests
- **Regulations DB** — Searchable database of AI laws and compliance requirements worldwide
- **Deploy Check** — Pre-flight checklist that blocks unsafe deploys before they happen
- **Stress Test** — Simulates adversarial inputs to surface failure modes under pressure

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 + IBM Plex Mono |
| Auth | Supabase Auth (email + GitHub OAuth) |
| Database | Supabase PostgreSQL |
| AI | Anthropic Claude API |
| Hosting | Vercel |

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/ishanshaurya/shipsafe.git
cd shipsafe

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

```bash
# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

---

## The Pipeline

```
Code  ──►  Legal  ──►  Deploy
  │           │            │
  │           │            │
AI Debugger  Regulations  Deploy Check
Vibe Audit   Loopholes    Stress Test
```

Write code → check it against compliance requirements → deploy with confidence.

---

## Project Structure

```
shipsafe/
├── src/
│   ├── components/     # Layout, shared UI
│   ├── hooks/          # useAuth (Supabase session)
│   ├── lib/            # supabase.js client
│   └── pages/          # Dashboard, Debugger, Audit, Regulations, Loopholes, DeployCheck, StressTest
├── public/
└── index.html
```

---

Built by **Shaurya Ishan** · 2026
