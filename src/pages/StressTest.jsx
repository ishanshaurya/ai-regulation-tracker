import { useState, useRef, useCallback } from "react"
import { Zap, AlertTriangle, Activity, TrendingUp, ChevronDown } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { callAI } from "../services/scanService"
import { saveScan } from "../utils/saveScan"
import { useAuth } from "../hooks/useAuth"
import ReportButton from "../components/ReportButton"

const ALL_TIERS = [10, 100, 500, 1000, 5000]
const BATCH_SIZE = 25

const STATUS = {
  green:  { dot: "#22c55e", label: "Healthy",  bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  yellow: { dot: "#eab308", label: "Degraded", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)" },
  red:    { dot: "#ef4444", label: "Critical", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)" },
}

function tierStatus(t) {
  if (t.errorRate > 10 || t.avgMs > 2000) return "red"
  if (t.errorRate > 3  || t.avgMs > 800)  return "yellow"
  return "green"
}

function scoreColor(score) {
  if (score >= 75) return "#eab308"
  if (score >= 50) return "#f97316"
  return "#ef4444"
}

function ScoreRing({ score }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = scoreColor(score)
  return (
    <svg width={128} height={128} style={{ display:"block" }}>
      <circle cx={64} cy={64} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={64} cy={64} r={r} fill="none"
        stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition:"stroke-dashoffset 0.6s ease" }}
      />
      <text x={64} y={60} textAnchor="middle" fill={color} fontSize={26} fontWeight={700}>{score}</text>
      <text x={64} y={78} textAnchor="middle" fill="#64748b" fontSize={11}>/100</text>
    </svg>
  )
}

function p99(sorted) {
  if (!sorted.length) return 0
  return sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1]
}

async function probeTier(fullUrl, method, count, onProgress) {
  const latencies = []
  let errors = 0
  let done = 0

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batch = Math.min(BATCH_SIZE, count - i)
    const results = await Promise.allSettled(
      Array.from({ length: batch }, () => {
        const t0 = performance.now()
        return fetch(fullUrl, {
          method,
          signal: AbortSignal.timeout(8000),
          headers: { "Content-Type": "application/json" },
        }).then(r => {
          const ms = performance.now() - t0
          if (!r.ok) errors++
          return ms
        }).catch(() => {
          errors++
          return 8000
        })
      })
    )
    for (const r of results) {
      if (r.status === "fulfilled") latencies.push(r.value)
      else errors++
    }
    done += batch
    onProgress(done / count)
  }

  const sorted = [...latencies].sort((a, b) => a - b)
  const avgMs   = sorted.length ? Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length) : 0
  const p99Ms   = Math.round(p99(sorted))
  const maxMs   = sorted.length ? Math.round(sorted[sorted.length - 1]) : 0
  const errorRate = Math.round((errors / count) * 100 * 10) / 10

  return { avgMs, p99Ms, maxMs, errorRate }
}

function buildFallback(tierResults) {
  const last = tierResults[tierResults.length - 1]
  const score = Math.max(0, Math.min(100,
    100 - last.errorRate * 3 - Math.max(0, (last.avgMs - 300) / 30)
  ))
  const bp = tierResults.find(t => t.errorRate > 10 || t.avgMs > 2000)
  return {
    overallScore: Math.round(score),
    verdict: last.errorRate > 10 ? "Service struggling under load" : last.avgMs > 1000 ? "Latency degradation detected" : "Handling load well",
    breakingPoint: bp ? `~${bp.count} concurrent users` : "Not reached",
    bottleneck: last.avgMs > 1000 ? "Slow response times suggest DB or compute bottleneck" : "No obvious bottleneck",
    tiers: tierResults.map(t => ({ count: t.count, status: tierStatus(t), note: `${t.avgMs}ms avg, ${t.errorRate}% errors` })),
    recommendations: [
      { text: "Add response caching for repeated requests" },
      { text: "Review database query performance under concurrent load" },
      { text: "Consider horizontal scaling if p99 exceeds 1s" },
    ],
  }
}

export default function StressTest() {
  const { user } = useAuth()

  const [phase, setPhase]           = useState("idle")     // idle | probing | analyzing | done
  const [deployUrl, setDeployUrl]   = useState("")
  const [endpoint, setEndpoint]     = useState("/")
  const [method, setMethod]         = useState("GET")
  const [maxLoad, setMaxLoad]       = useState(1000)
  const [architecture, setArchitecture] = useState("")
  const [error, setError]           = useState(null)

  const [tierResults, setTierResults]   = useState([])
  const [activeTier, setActiveTier]     = useState(null)
  const [tierProgress, setTierProgress] = useState(0)
  const [analysis, setAnalysis]         = useState(null)

  const abortRef = useRef(false)

  const activeTiers = ALL_TIERS.filter(t => t <= maxLoad)

  const run = useCallback(async () => {
    if (!deployUrl.trim()) { setError("Enter deployment URL"); return }
    try { new URL(deployUrl) } catch { setError("Invalid URL — include https://"); return }

    abortRef.current = false
    setError(null)
    setTierResults([])
    setAnalysis(null)
    setPhase("probing")

    const base = deployUrl.replace(/\/$/, "")
    const path = endpoint.startsWith("/") ? endpoint : "/" + endpoint
    const fullUrl = base + path

    const collected = []

    for (const count of activeTiers) {
      if (abortRef.current) break
      setActiveTier(count)
      setTierProgress(0)

      const metrics = await probeTier(fullUrl, method, count, p => setTierProgress(p))
      const row = { count, ...metrics }
      collected.push(row)
      setTierResults([...collected])
    }

    setActiveTier(null)
    setPhase("analyzing")

    const metricsSummary = collected
      .map(t => `${t.count} users: avg ${t.avgMs}ms, p99 ${t.p99Ms}ms, max ${t.maxMs}ms, errors ${t.errorRate}%`)
      .join("\n")

    const prompt = `You are a performance engineering expert. Analyze these load test results and return JSON only.

URL: ${fullUrl}
Architecture: ${architecture || "Not provided"}

Results:
${metricsSummary}

Return exactly this JSON shape (no markdown, no extra text):
{
  "overallScore": <0-100 integer>,
  "verdict": "<one sentence>",
  "breakingPoint": "<e.g. ~500 concurrent users or Not reached>",
  "bottleneck": "<primary bottleneck identified>",
  "tiers": [{ "count": <number>, "status": "green|yellow|red", "note": "<short note>" }],
  "recommendations": [{ "text": "<actionable recommendation>" }]
}`

    let result
    try {
      const raw = await callAI("stress-test", prompt)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : buildFallback(collected)
    } catch {
      result = buildFallback(collected)
    }

    setAnalysis(result)
    setPhase("done")

    const reportPayload = { url: fullUrl, tiers: collected, analysis: result }
    saveScan(user, "stress-test", deployUrl, reportPayload, result.overallScore)
  }, [deployUrl, endpoint, method, activeTiers, architecture, user])

  const reset = () => {
    abortRef.current = true
    setPhase("idle")
    setTierResults([])
    setAnalysis(null)
    setError(null)
    setActiveTier(null)
  }

  const chartData = tierResults.map(t => ({
    name: `${t.count}`,
    avg: t.avgMs,
    p99: t.p99Ms,
  }))

  const S = {
    page:    { minHeight:"100vh", background:"#080c14", color:"#f1f5f9", padding:"32px 24px", fontFamily:"inherit" },
    card:    { background:"rgba(15,23,42,0.6)", border:"1px solid rgba(30,41,59,0.8)", borderRadius:12, padding:"24px" },
    label:   { display:"block", fontSize:12, fontWeight:600, color:"#94a3b8", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" },
    input:   { width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(30,41,59,0.9)", borderRadius:8, padding:"10px 12px", color:"#f1f5f9", fontSize:13, outline:"none", boxSizing:"border-box" },
    select:  { width:"100%", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(30,41,59,0.9)", borderRadius:8, padding:"10px 12px", color:"#f1f5f9", fontSize:13, outline:"none", boxSizing:"border-box", cursor:"pointer" },
    btn:     { width:"100%", background:"#eab308", border:"none", borderRadius:8, padding:"12px", color:"#0a0a0a", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
    btnGhost:{ background:"rgba(30,41,59,0.6)", border:"1px solid rgba(30,41,59,0.8)", borderRadius:8, padding:"10px 16px", color:"#94a3b8", fontWeight:600, fontSize:13, cursor:"pointer" },
    h2:      { fontSize:18, fontWeight:700, color:"#f1f5f9", margin:"0 0 16px" },
    muted:   { color:"#64748b", fontSize:12 },
  }

  return (
    <div style={S.page}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ background:"rgba(234,179,8,0.1)", border:"1px solid rgba(234,179,8,0.2)", borderRadius:10, padding:10 }}>
            <Zap size={20} color="#eab308" />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:"#f1f5f9" }}>Stress Tester</h1>
            <p style={{ margin:0, fontSize:13, color:"#64748b" }}>Fire real HTTP requests at increasing load tiers · measure latency · get AI analysis</p>
          </div>
        </div>

        {/* IDLE: input form */}
        {phase === "idle" && (
          <div style={{ ...S.card, display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={{ gridColumn:"1 / -1" }}>
                <label style={S.label}>Deployment URL</label>
                <input style={S.input} placeholder="https://myapp.vercel.app" value={deployUrl} onChange={e => setDeployUrl(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Endpoint Path</label>
                <input style={S.input} placeholder="/api/health" value={endpoint} onChange={e => setEndpoint(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>HTTP Method</label>
                <select style={S.select} value={method} onChange={e => setMethod(e.target.value)}>
                  <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                </select>
              </div>
            </div>

            <div>
              <label style={S.label}>
                Max Load — <span style={{ color:"#eab308" }}>{maxLoad.toLocaleString()} users</span>
                <span style={{ ...S.muted, marginLeft:8 }}>
                  Tiers: {activeTiers.map(t => t >= 1000 ? t/1000+"k" : t).join(" → ")}
                </span>
              </label>
              <input
                type="range" min={100} max={5000} step={100} value={maxLoad}
                onChange={e => setMaxLoad(+e.target.value)}
                style={{ width:"100%", accentColor:"#eab308" }}
              />
            </div>

            <div>
              <label style={S.label}>Architecture <span style={{ ...S.muted, textTransform:"none" }}>(optional — improves AI analysis)</span></label>
              <textarea
                style={{ ...S.input, resize:"vertical", minHeight:72, lineHeight:1.5 }}
                placeholder="e.g. Vercel edge functions + Supabase Postgres + Redis cache"
                value={architecture}
                onChange={e => setArchitecture(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"10px 14px", color:"#fca5a5", fontSize:13, display:"flex", gap:8 }}>
                <AlertTriangle size={15} style={{ flexShrink:0, marginTop:1 }} /> {error}
              </div>
            )}

            <button style={S.btn} onClick={run}>
              <Zap size={15} /> Run Stress Test
            </button>
          </div>
        )}

        {/* PROBING: live tier results */}
        {(phase === "probing" || phase === "analyzing") && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ ...S.card, display:"flex", alignItems:"center", gap:14 }}>
              <Activity size={18} color="#eab308" style={{ animation:"spin 1.2s linear infinite", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:"#f1f5f9", fontSize:14, marginBottom:6 }}>
                  {phase === "analyzing" ? "Running AI analysis…" : activeTier ? `Probing ${activeTier.toLocaleString()} concurrent users…` : "Starting…"}
                </div>
                {phase === "probing" && activeTier && (
                  <div style={{ background:"rgba(30,41,59,0.6)", borderRadius:4, height:4, overflow:"hidden" }}>
                    <div style={{ background:"#eab308", height:"100%", width:`${Math.round(tierProgress*100)}%`, transition:"width 0.15s" }} />
                  </div>
                )}
              </div>
            </div>

            {tierResults.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {tierResults.map(t => {
                  const st = tierStatus(t)
                  const s = STATUS[st]
                  return (
                    <div key={t.count} style={{ ...S.card, padding:"14px 20px", display:"flex", alignItems:"center", gap:16, background:s.bg, border:`1px solid ${s.border}` }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
                      <span style={{ fontWeight:600, color:"#f1f5f9", minWidth:90 }}>{t.count.toLocaleString()} users</span>
                      <span style={{ color:"#94a3b8", fontSize:13 }}>avg <b style={{ color:"#f1f5f9" }}>{t.avgMs}ms</b></span>
                      <span style={{ color:"#94a3b8", fontSize:13 }}>p99 <b style={{ color:"#f1f5f9" }}>{t.p99Ms}ms</b></span>
                      <span style={{ color:"#94a3b8", fontSize:13 }}>errors <b style={{ color: t.errorRate > 5 ? "#f87171" : "#f1f5f9" }}>{t.errorRate}%</b></span>
                      <span style={{ marginLeft:"auto", fontSize:11, color:s.dot, fontWeight:600 }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* DONE: full results */}
        {phase === "done" && analysis && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Score + verdict */}
            <div style={{ ...S.card, display:"flex", alignItems:"center", gap:28 }}>
              <ScoreRing score={analysis.overallScore} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>{analysis.verdict}</div>
                <div style={{ fontSize:13, color:"#94a3b8", marginBottom:4 }}>
                  <span style={{ color:"#64748b" }}>Breaking point:</span> {analysis.breakingPoint}
                </div>
                <div style={{ fontSize:13, color:"#94a3b8" }}>
                  <span style={{ color:"#64748b" }}>Bottleneck:</span> {analysis.bottleneck}
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <ReportButton analysis={analysis} type="stress-test" />
                <button style={S.btnGhost} onClick={reset}>New Test</button>
              </div>
            </div>

            {/* Chart */}
            <div style={S.card}>
              <h2 style={S.h2}>Latency by Load</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top:4, right:8, bottom:0, left:0 }}>
                  <defs>
                    <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#eab308" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.8)" />
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill:"#64748b", fontSize:11 }} label={{ value:"concurrent users", position:"insideBottom", offset:-2, fill:"#475569", fontSize:11 }} />
                  <YAxis stroke="#475569" tick={{ fill:"#64748b", fontSize:11 }} unit="ms" />
                  <Tooltip
                    contentStyle={{ background:"rgba(15,23,42,0.95)", border:"1px solid rgba(30,41,59,0.8)", borderRadius:8, fontSize:12 }}
                    labelStyle={{ color:"#94a3b8" }}
                    formatter={(v, n) => [`${v}ms`, n === "avg" ? "Avg latency" : "p99 latency"]}
                  />
                  <Area type="monotone" dataKey="avg" stroke="#eab308" fill="url(#ga)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="p99" stroke="#f97316" fill="url(#gp)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:16, marginTop:12 }}>
                <span style={{ fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:16, height:2, background:"#eab308", display:"inline-block" }} /> Avg
                </span>
                <span style={{ fontSize:11, color:"#94a3b8", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:16, height:2, background:"#f97316", display:"inline-block" }} /> p99
                </span>
              </div>
            </div>

            {/* Per-tier cards */}
            <div style={S.card}>
              <h2 style={S.h2}>Tier Breakdown</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(analysis.tiers || []).map((t, i) => {
                  const raw = tierResults.find(r => r.count === t.count) || {}
                  const st = t.status in STATUS ? t.status : "green"
                  const s = STATUS[st]
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:s.bg, border:`1px solid ${s.border}`, borderRadius:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
                      <span style={{ fontWeight:600, color:"#f1f5f9", minWidth:100 }}>{(t.count||"").toLocaleString()} users</span>
                      <span style={{ flex:1, fontSize:13, color:"#94a3b8" }}>{t.note}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:s.dot }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div style={S.card}>
                <h2 style={S.h2}>Recommendations</h2>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"12px 14px", background:"rgba(234,179,8,0.04)", border:"1px solid rgba(234,179,8,0.12)", borderRadius:8 }}>
                      <TrendingUp size={15} color="#eab308" style={{ flexShrink:0, marginTop:1 }} />
                      <span style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.5 }}>{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
