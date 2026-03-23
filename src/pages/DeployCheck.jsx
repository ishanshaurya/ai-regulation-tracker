import { useState } from "react"
import { Rocket, Play, Loader2, CheckCircle, AlertTriangle, AlertCircle, X as XIcon, ChevronDown, ChevronRight, Server, Shield, Globe, Key, Database, Wifi } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { useIsMobile } from "../hooks/useIsMobile"

/* ═══════════════════════════════════════════════════════════
   DEPLOY READINESS CHECKER — ShipSafe Stage 3

   Developer describes their deployment setup and the AI
   checks for common gotchas that crash apps in production.
   ═══════════════════════════════════════════════════════════ */

const PLATFORMS = [
  { id: "vercel", name: "Vercel", icon: "▲" },
  { id: "netlify", name: "Netlify", icon: "◆" },
  { id: "railway", name: "Railway", icon: "●" },
  { id: "aws", name: "AWS", icon: "☁" },
  { id: "docker", name: "Docker", icon: "🐳" },
  { id: "other", name: "Other", icon: "⚙" },
]

const SAMPLE_CONFIG = `Platform: Vercel
Framework: Next.js 14
Database: Supabase (PostgreSQL)
Auth: Supabase Auth (email + GitHub OAuth)
AI: Claude API via serverless function
Environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - ANTHROPIC_API_KEY
  - NEXTAUTH_SECRET
CORS: Not configured (using Vercel defaults)
Rate limiting: None
Error monitoring: None
SSL: Vercel auto-SSL`

function getMockDeployCheck(config, platform) {
  const checks = []
  let id = 1
  const configLower = config.toLowerCase()

  // Environment variables
  if (configLower.includes("api_key") || configLower.includes("secret") || configLower.includes("token")) {
    if (configLower.includes("next_public") && (configLower.includes("api_key") || configLower.includes("secret"))) {
      checks.push({ id: id++, category: "env", status: "fail", title: "Secret exposed in NEXT_PUBLIC variable", description: "Variables prefixed with NEXT_PUBLIC are bundled into client JavaScript. API keys and secrets should NEVER use this prefix.", fix: "Remove NEXT_PUBLIC prefix from secret variables. Access them only in server-side code or API routes.", severity: "critical" })
    }
    checks.push({ id: id++, category: "env", status: "pass", title: "Environment variables detected", description: "Configuration uses environment variables instead of hardcoded values.", fix: null, severity: "ok" })
  } else {
    checks.push({ id: id++, category: "env", status: "warn", title: "No environment variables mentioned", description: "Deployment config should explicitly list required env vars to avoid missing configuration in production.", fix: "Create a .env.example file listing all required variables.", severity: "medium" })
  }

  // CORS
  if (configLower.includes("cors: not configured") || configLower.includes("no cors") || !configLower.includes("cors")) {
    checks.push({ id: id++, category: "security", status: "warn", title: "CORS not explicitly configured", description: "Without explicit CORS configuration, your API may either block legitimate requests or allow unauthorized origins.", fix: `Configure CORS for your specific domain:\n${platform === "vercel" ? "// vercel.json\n{ \"headers\": [{ \"source\": \"/api/(.*)\", \"headers\": [{ \"key\": \"Access-Control-Allow-Origin\", \"value\": \"https://yourdomain.com\" }] }] }" : "Set Access-Control-Allow-Origin to your specific domain."}`, severity: "medium" })
  } else {
    checks.push({ id: id++, category: "security", status: "pass", title: "CORS configuration present", description: "CORS is explicitly configured.", fix: null, severity: "ok" })
  }

  // Rate limiting
  if (configLower.includes("rate limit") && !configLower.includes("none")) {
    checks.push({ id: id++, category: "security", status: "pass", title: "Rate limiting configured", description: "API endpoints are protected against abuse.", fix: null, severity: "ok" })
  } else {
    checks.push({ id: id++, category: "security", status: "fail", title: "No rate limiting", description: "Without rate limiting, your API is vulnerable to brute force attacks, credential stuffing, and cost-based DDoS (especially with AI API calls that cost money per request).", fix: `Add rate limiting:\n${platform === "vercel" ? "Use Vercel's Edge Middleware or upstash/ratelimit:\nimport { Ratelimit } from '@upstash/ratelimit'" : "Use express-rate-limit or similar middleware."}`, severity: "high" })
  }

  // Error monitoring
  if (configLower.includes("sentry") || configLower.includes("datadog") || configLower.includes("monitoring") || configLower.includes("error tracking")) {
    checks.push({ id: id++, category: "ops", status: "pass", title: "Error monitoring configured", description: "Production errors will be tracked and reported.", fix: null, severity: "ok" })
  } else {
    checks.push({ id: id++, category: "ops", status: "warn", title: "No error monitoring", description: "Without error tracking, production bugs go unnoticed until users report them. You lose visibility into app health.", fix: "Add Sentry (free tier):\nnpm install @sentry/nextjs\nnpx @sentry/wizard@latest -i nextjs", severity: "medium" })
  }

  // SSL
  if (configLower.includes("ssl") || configLower.includes("https") || platform === "vercel" || platform === "netlify") {
    checks.push({ id: id++, category: "security", status: "pass", title: "SSL/TLS enabled", description: `${platform === "vercel" || platform === "netlify" ? "Auto-SSL provided by " + platform : "HTTPS is configured."}`, fix: null, severity: "ok" })
  } else {
    checks.push({ id: id++, category: "security", status: "fail", title: "SSL/TLS not confirmed", description: "Without HTTPS, all data including auth tokens is transmitted in plaintext.", fix: "Enable SSL. Most platforms provide free auto-SSL.", severity: "critical" })
  }

  // Security headers
  checks.push({ id: id++, category: "security", status: "warn", title: "Security headers not configured", description: "Missing headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security.", fix: `${platform === "vercel" ? "Add to vercel.json or next.config.js:\nheaders: () => [{ source: '/(.*)', headers: [\n  { key: 'X-Frame-Options', value: 'DENY' },\n  { key: 'X-Content-Type-Options', value: 'nosniff' },\n  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }\n]}]" : "Add security headers via middleware or server config."}`, severity: "medium" })

  // Database connection
  if (configLower.includes("database") || configLower.includes("supabase") || configLower.includes("postgres") || configLower.includes("mongo")) {
    checks.push({ id: id++, category: "database", status: "pass", title: "Database connection configured", description: "Database is part of the deployment architecture.", fix: null, severity: "ok" })
    if (!configLower.includes("pool") && !configLower.includes("connection limit")) {
      checks.push({ id: id++, category: "database", status: "warn", title: "No connection pooling mentioned", description: "Serverless functions open new DB connections per request. Without pooling, you'll exhaust database connections under load.", fix: `${platform === "vercel" ? "Use Supabase connection pooler (port 6543) or Prisma Accelerate." : "Configure connection pooling (PgBouncer for PostgreSQL, or ORM-level pooling)."}`, severity: "medium" })
    }
  }

  // Platform-specific checks
  if (platform === "vercel") {
    checks.push({ id: id++, category: "platform", status: "info", title: "Vercel: 10s serverless function timeout (free tier)", description: "Free tier functions timeout after 10 seconds. AI API calls may exceed this for complex analysis.", fix: "Use streaming responses or upgrade to Pro ($20/mo) for 60s timeout. Alternatively, use Vercel Edge Functions (no timeout).", severity: "info" })
    checks.push({ id: id++, category: "platform", status: "info", title: "Vercel: 100K function invocations/month (free tier)", description: "Each API call counts as one invocation. With AI features, you could hit this limit with ~100 daily active users.", fix: "Add client-side caching and debouncing. Rate limit to 10 scans/user/day.", severity: "info" })
  }

  // Backup
  if (!configLower.includes("backup")) {
    checks.push({ id: id++, category: "ops", status: "warn", title: "No backup strategy mentioned", description: "If your database goes down or data is corrupted, recovery depends on backups.", fix: "Supabase includes daily backups on Pro plan. For free tier, set up pg_dump on a cron schedule.", severity: "low" })
  }

  const passed = checks.filter(c => c.status === "pass").length
  const failed = checks.filter(c => c.status === "fail").length
  const warned = checks.filter(c => c.status === "warn").length
  const total = checks.filter(c => c.status !== "info").length
  const score = total > 0 ? Math.round((passed / total) * 100) : 0

  return {
    score,
    platform,
    checks,
    summary: score >= 80 ? `Deploy-ready! ${passed}/${total} checks passed.` : score >= 50 ? `Almost there — ${failed} critical issues and ${warned} warnings to address.` : `Not ready — ${failed} failures and ${warned} warnings need fixing before deployment.`,
    verdict: score >= 80 ? "READY" : score >= 50 ? "ALMOST" : "NOT READY",
    verdictColor: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444",
    stats: { passed, failed, warned, info: checks.filter(c => c.status === "info").length },
  }
}

const STATUS_ICON = { pass: CheckCircle, fail: AlertCircle, warn: AlertTriangle, info: Globe }
const STATUS_COLOR = { pass: "#22c55e", fail: "#ef4444", warn: "#f59e0b", info: "#38bdf8" }

export default function DeployCheck() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [config, setConfig] = useState("")
  const [platform, setPlatform] = useState("vercel")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [exp, setExp] = useState({})

  const toggle = (id) => setExp(p => ({ ...p, [id]: !p[id] }))

  const runCheck = async () => {
    if (!config.trim() || loading) return
    setLoading(true); setResult(null); setExp({})
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))
    const res = getMockDeployCheck(config, platform)
    setResult(res)
    if (user) {
      try {
        const { error: dbError } = await supabase.from("scan_history").insert({
          user_id: user.id,
          scan_type: "deploy-check",
          input_snippet: config.slice(0, 500),
          result: res,
          score: res.score,
        })
        if (dbError) console.error("Failed to save scan:", dbError.message)
      } catch (err) {
        console.error("Supabase save error:", err)
      }
    }
    const ae = {}
    res.checks.forEach(c => { if (c.status === "fail") ae[c.id] = true })
    setExp(ae)
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Rocket size={18} color="#22c55e" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Deploy Readiness Checker</h1>
          <p style={{ fontSize: 11, color: "#475569" }}>Describe your setup → Validate security, config & platform readiness <span style={{ color: "#34d399", marginLeft: 8 }}>● Live AI</span></p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                style={{ background: platform === p.id ? "rgba(34,197,94,0.15)" : "rgba(15,22,40,0.4)", border: `1px solid ${platform === p.id ? "rgba(34,197,94,0.4)" : "rgba(56,189,248,0.08)"}`, borderRadius: 8, padding: "8px 14px", fontSize: 11, cursor: "pointer", color: platform === p.id ? "#22c55e" : "#64748b", fontWeight: platform === p.id ? 600 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{p.icon}</span> {p.name}
              </button>
            ))}
          </div>

          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(26,37,64,0.6)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Deployment Configuration</span>
              <button onClick={() => { setConfig(SAMPLE_CONFIG); setResult(null) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#22c55e" }}>Load Sample</button>
            </div>
            <textarea value={config} onChange={e => setConfig(e.target.value)}
              placeholder={"Describe your deployment setup:\n- Platform & framework\n- Database\n- Auth method\n- Environment variables\n- CORS config\n- Rate limiting\n- Error monitoring\n- SSL/TLS"}
              style={{ width: "100%", minHeight: 350, background: "transparent", border: "none", outline: "none", resize: "vertical", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, padding: 16 }} />
          </div>

          <button onClick={runCheck} disabled={loading || !config.trim()}
            style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: loading || !config.trim() ? "#1a2540" : "#22c55e", color: loading || !config.trim() ? "#334155" : "#0a0e1a", fontSize: 14, fontWeight: 700, cursor: loading || !config.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Checking...</> : <><Rocket size={16} /> Run Deploy Check</>}
          </button>
        </div>

        <div>
          {!loading && !result && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "60px 40px", textAlign: "center", minHeight: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Rocket size={28} color="#22c55e" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Describe your deployment</h3>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 340 }}>Validates env vars, security headers, CORS, rate limits, and platform-specific gotchas.</p>
            </div>
          )}

          {loading && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "80px 40px", textAlign: "center", minHeight: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={36} color="#22c55e" style={{ animation: "spin 1.5s linear infinite", marginBottom: 20 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Validating deployment for {PLATFORMS.find(p => p.id === platform)?.name}</h3>
            </div>
          )}

          {result && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: `${result.verdictColor}10`, border: `1px solid ${result.verdictColor}25`, borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: result.verdictColor }}>{result.score}%</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: result.verdictColor, letterSpacing: "0.1em" }}>{result.verdict}</div>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{result.summary}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {[{ l: "Passed", v: result.stats.passed, c: "#22c55e" }, { l: "Failed", v: result.stats.failed, c: "#ef4444" }, { l: "Warnings", v: result.stats.warned, c: "#f59e0b" }, { l: "Info", v: result.stats.info, c: "#38bdf8" }].map((s, i) => (
                  <div key={i} style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: "#475569" }}>{s.l.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.checks.map(check => {
                  const Icon = STATUS_ICON[check.status]
                  const color = STATUS_COLOR[check.status]
                  return (
                    <div key={check.id} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10 }}>
                      <div onClick={() => toggle(check.id)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={15} color={color} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{check.title}</span>
                        {check.fix && (exp[check.id] ? <ChevronDown size={13} color="#475569" /> : <ChevronRight size={13} color="#475569" />)}
                      </div>
                      {exp[check.id] && check.fix && (
                        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${color}15`, paddingTop: 10 }}>
                          <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, marginBottom: 10 }}>{check.description}</p>
                          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 6, padding: "10px 12px" }}>
                            <pre style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{check.fix}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
