import { useState } from "react"
import { FlaskConical, Play, Loader2, AlertTriangle, CheckCircle, Users, Server, Database, Wifi, Zap, Clock } from "lucide-react"

/* ═══════════════════════════════════════════════════════════
   STRESS TESTER — ShipSafe Stage 3

   AI-powered predictive load analysis. Developer describes
   their stack, and we simulate what happens at 10, 100,
   1000, and 10000 concurrent users.

   Honest note in UI: this is simulated/predictive, not
   real load testing.
   ═══════════════════════════════════════════════════════════ */

const SAMPLE_STACK = `Frontend: Vercel (React/Next.js)
Backend: Vercel Serverless Functions
Database: Supabase PostgreSQL (free tier)
  - Connection limit: 60
  - Pool size: 15
AI API: Claude API via serverless proxy
  - ~2 seconds per request
  - No caching
Auth: Supabase Auth
  - Session-based
Storage: Supabase Storage (1GB free)
CDN: Vercel Edge Network`

const TIERS = [
  { users: 10, label: "10 users", desc: "Small team / Demo" },
  { users: 100, label: "100 users", desc: "Beta launch" },
  { users: 1000, label: "1K users", desc: "Product launch" },
  { users: 10000, label: "10K users", desc: "Viral growth" },
]

function getMockStressTest(stack) {
  const stackLower = stack.toLowerCase()
  const hasSupabase = stackLower.includes("supabase")
  const hasVercel = stackLower.includes("vercel")
  const hasAI = stackLower.includes("claude") || stackLower.includes("openai") || stackLower.includes("ai api")
  const hasCache = stackLower.includes("cache") || stackLower.includes("redis")
  const hasCDN = stackLower.includes("cdn") || stackLower.includes("edge")

  const tiers = [
    {
      users: 10, status: "green", responseTime: "120ms", label: "SAFE",
      components: [
        { name: "Frontend", status: "green", detail: hasCDN ? "CDN serving static assets — no issues" : "Static files served directly, fine at this scale" },
        { name: "API", status: "green", detail: hasVercel ? "Serverless cold starts ~200ms, warm ~50ms. No issues." : "Server handles 10 concurrent requests easily." },
        { name: "Database", status: "green", detail: hasSupabase ? "Supabase: 10 connections of 60 limit (17% utilization)" : "Database connections well within limits." },
        ...(hasAI ? [{ name: "AI API", status: "green", detail: "10 concurrent AI calls — ~2s response each. No rate limit issues." }] : []),
      ],
      bottleneck: null,
    },
    {
      users: 100, status: "yellow", responseTime: "450ms", label: "CAUTION",
      components: [
        { name: "Frontend", status: "green", detail: hasCDN ? "CDN handles static assets perfectly at this scale." : "May need CDN — 100 concurrent asset requests adds latency." },
        { name: "API", status: "yellow", detail: hasVercel ? "Vercel free tier: 100 concurrent serverless functions possible but cold starts increase. Avg response 400ms." : "Server may need horizontal scaling. Queue forming." },
        { name: "Database", status: "yellow", detail: hasSupabase ? "Supabase free tier: connection pool (15) starts queuing. 100 users hitting DB simultaneously = waiting." : "Connection pool pressure starting. Queries may queue." },
        ...(hasAI ? [{ name: "AI API", status: "red", detail: "100 concurrent AI calls = $$ per minute. Claude rate limits may throttle. Need request queuing and caching." }] : []),
      ],
      bottleneck: hasAI ? "AI API rate limits and cost" : "Database connection pooling",
    },
    {
      users: 1000, status: "red", responseTime: "2.8s", label: "BREAKING",
      components: [
        { name: "Frontend", status: "green", detail: hasCDN ? "CDN scales horizontally. No frontend issues." : "Without CDN, origin server overwhelmed. Add Cloudflare or Vercel Edge." },
        { name: "API", status: "red", detail: hasVercel ? "Vercel free tier: 100K invocations/month = exhausted in ~4 days at this rate. Need Pro plan ($20/mo)." : "Server needs load balancer + multiple instances." },
        { name: "Database", status: "red", detail: hasSupabase ? "Supabase free tier collapses: 60 connection limit hit, queries timeout, data inconsistency risk. Need Pro plan or PgBouncer." : "Database is the bottleneck. Connection pool exhausted. Queries failing." },
        ...(hasAI ? [{ name: "AI API", status: "red", detail: "1000 AI calls/min = ~$15/hour with Claude. Rate limits hit. Need aggressive caching, request batching, and queue system." }] : []),
      ],
      bottleneck: hasSupabase ? "Supabase free tier connection limit (60)" : "Database connections",
    },
    {
      users: 10000, status: "red", responseTime: "Timeout", label: "FAILURE",
      components: [
        { name: "Frontend", status: hasCDN ? "green" : "red", detail: hasCDN ? "CDN handles 10K static requests fine." : "Origin server completely overwhelmed. Pages fail to load." },
        { name: "API", status: "red", detail: "Any free tier is exhausted. Need dedicated infrastructure: load balancer, auto-scaling, queue system (BullMQ/SQS)." },
        { name: "Database", status: "red", detail: hasSupabase ? "Supabase needs Pro + connection pooler + read replicas. Free tier handles ~50 concurrent queries max." : "Need read replicas, connection pooler, and query optimization." },
        ...(hasAI ? [{ name: "AI API", status: "red", detail: "Unsustainable without caching. Cache common queries (90% hit rate can reduce AI calls 10x). Budget: ~$150/hour without caching." }] : []),
      ],
      bottleneck: "Everything — need full architecture review for this scale",
    },
  ]

  const recommendations = [
    ...(hasAI && !hasCache ? ["Add Redis caching for AI responses — most queries are similar. 90% cache hit rate reduces AI costs 10x."] : []),
    ...(hasSupabase ? ["Switch to Supabase connection pooler (port 6543) to handle more concurrent connections."] : []),
    ...(hasVercel ? ["Add Vercel Edge Middleware for rate limiting before requests hit serverless functions."] : []),
    ...(!hasCDN ? ["Add CDN (Cloudflare free tier) for static assets to reduce origin server load."] : []),
    "Implement request queuing for AI calls — process in order instead of all at once.",
    "Add database query caching with a short TTL (60s) for read-heavy endpoints.",
    "Set up auto-scaling triggers: CPU > 70%, memory > 80%, response time > 2s.",
  ]

  return { tiers, recommendations, stack: stackLower }
}

const STATUS_BG = { green: "rgba(34,197,94,0.08)", yellow: "rgba(245,158,11,0.08)", red: "rgba(239,68,68,0.08)" }
const STATUS_BORDER = { green: "rgba(34,197,94,0.2)", yellow: "rgba(245,158,11,0.2)", red: "rgba(239,68,68,0.2)" }
const STATUS_DOT = { green: "#22c55e", yellow: "#f59e0b", red: "#ef4444" }

export default function StressTest() {
  const [stack, setStack] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const runTest = async () => {
    if (!stack.trim() || loading) return
    setLoading(true); setResult(null)
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))
    setResult(getMockStressTest(stack))
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FlaskConical size={18} color="#eab308" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Stress Tester</h1>
          <p style={{ fontSize: 11, color: "#475569" }}>Describe your stack → Simulate 10 to 10K concurrent users → Find bottlenecks <span style={{ color: "#f59e0b", marginLeft: 8 }}>● Simulated</span></p>
        </div>
      </div>

      <div style={{ background: "rgba(234,179,8,0.04)", border: "1px solid rgba(234,179,8,0.1)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={13} /> This is a predictive analysis tool, not real load testing. For production, pair with k6 or Artillery.
      </div>

      {/* Input */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        <div>
          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(26,37,64,0.6)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>Describe your architecture</span>
              <button onClick={() => { setStack(SAMPLE_STACK); setResult(null) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#eab308" }}>Load Sample</button>
            </div>
            <textarea value={stack} onChange={e => setStack(e.target.value)}
              placeholder={"Describe your full stack:\n- Frontend hosting\n- Backend / API\n- Database (type, tier, limits)\n- AI APIs used\n- Caching layer\n- CDN\n- Auth system"}
              style={{ width: "100%", minHeight: 320, background: "transparent", border: "none", outline: "none", resize: "vertical", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, padding: 16 }} />
          </div>

          <button onClick={runTest} disabled={loading || !stack.trim()}
            style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: loading || !stack.trim() ? "#1a2540" : "#eab308", color: loading || !stack.trim() ? "#334155" : "#0a0e1a", fontSize: 14, fontWeight: 700, cursor: loading || !stack.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Simulating load...</> : <><FlaskConical size={16} /> Run Stress Test</>}
          </button>
        </div>

        <div>
          {!loading && !result && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "60px 40px", textAlign: "center", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <FlaskConical size={28} color="#eab308" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Describe your stack</h3>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 340 }}>Simulates 10 → 100 → 1K → 10K concurrent users and identifies which component breaks first.</p>
            </div>
          )}

          {loading && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "80px 40px", textAlign: "center", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={36} color="#eab308" style={{ animation: "spin 1.5s linear infinite", marginBottom: 20 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Simulating concurrent users</h3>
              <p style={{ fontSize: 12, color: "#475569" }}>10 → 100 → 1,000 → 10,000...</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Tier results */}
              {result.tiers.map((tier, ti) => (
                <div key={ti} style={{ background: STATUS_BG[tier.status], border: `1px solid ${STATUS_BORDER[tier.status]}`, borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Users size={16} color={STATUS_DOT[tier.status]} />
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{tier.label}</span>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{TIERS[ti].desc}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {tier.responseTime}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_DOT[tier.status], letterSpacing: "0.08em" }}>{tier.label}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {tier.components.map((comp, ci) => (
                      <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, padding: "4px 0" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_DOT[comp.status], marginTop: 4, flexShrink: 0 }} />
                        <span style={{ color: "#94a3b8", minWidth: 70, fontWeight: 600 }}>{comp.name}</span>
                        <span style={{ color: "#64748b" }}>{comp.detail}</span>
                      </div>
                    ))}
                  </div>

                  {tier.bottleneck && (
                    <div style={{ marginTop: 10, fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.06)", padding: "6px 10px", borderRadius: 6 }}>
                      <AlertTriangle size={12} /> Bottleneck: {tier.bottleneck}
                    </div>
                  )}
                </div>
              ))}

              {/* Recommendations */}
              <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#34d399", marginBottom: 12, letterSpacing: "0.08em" }}>SCALING RECOMMENDATIONS</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>
                    <span style={{ color: "#34d399", flexShrink: 0 }}>→</span> {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
