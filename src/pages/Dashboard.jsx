import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { LayoutDashboard, Bug, Search, Scale, KeyRound, Rocket, FlaskConical, Clock, Shield, Zap, TrendingUp, Activity } from "lucide-react"
import { getScanHistory } from "../services/supabaseService"
import { useAuth } from "../hooks/useAuth"
import { MOCK_SCANS, SCAN_COLORS } from "../data/mockResults"

/* ═══════════════════════════════════════════════════════════
   DASHBOARD — ShipSafe Home

   Shows: quick stats, recent scan history, quick action cards,
   and a pipeline overview. When logged in, fetches real scan
   history from Supabase. Falls back to MOCK_SCANS when not.
   ═══════════════════════════════════════════════════════════ */

const TOOLS = [
  { name: "AI Debugger", desc: "Scan code for bugs & vibe-code smells", icon: Bug, color: "#ef4444", path: "/debugger" },
  { name: "Loophole Finder", desc: "Find regulatory grey areas", icon: KeyRound, color: "#a855f7", path: "/loopholes" },
  { name: "Vibe-Code Audit", desc: "Full project health report", icon: Search, color: "#f97316", path: "/audit" },
  { name: "Regulations", desc: "Browse 14+ global AI laws", icon: Scale, color: "#0ea5e9", path: "/regulations" },
  { name: "Deploy Check", desc: "Validate deployment config", icon: Rocket, color: "#22c55e", path: "/deploy-check" },
  { name: "Stress Test", desc: "Simulate concurrent users", icon: FlaskConical, color: "#eab308", path: "/stress-test" },
]

const PIPELINE_STEPS = [
  { num: "01", label: "CODE", question: "Is my code safe?", color: "#0ea5e9", tools: ["Debugger", "Audit"] },
  { num: "02", label: "LEGAL", question: "Is my project legal?", color: "#f59e0b", tools: ["Regulations", "Loopholes"] },
  { num: "03", label: "DEPLOY", question: "Am I ready to ship?", color: "#22c55e", tools: ["Deploy Check", "Stress Test"] },
]

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function issueCount(result, scanType) {
  if (!result) return 0
  if (scanType === "debugger") return result.stats?.totalIssues ?? 0
  if (scanType === "audit") return result.issues?.length ?? 0
  if (scanType === "loopholes") return result.greyAreas?.length ?? 0
  if (scanType === "deploy-check") return result.checks?.filter(c => c.status === "fail" || c.status === "warn").length ?? 0
  if (scanType === "stress-test") return result.tiers?.filter(t => t.status === "red").length ?? 0
  return 0
}

function mapDbScan(row) {
  return {
    id: row.id,
    type: row.scan_type,
    title: row.input_snippet?.slice(0, 40).replace(/\n/g, " ").trim() || row.scan_type,
    score: row.score,
    issues: issueCount(row.result, row.scan_type),
    time: timeAgo(row.created_at),
    color: SCAN_COLORS[row.scan_type] ?? "#38bdf8",
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [scans, setScans] = useState(null)   // null = not yet loaded
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!user) { setScans(null); return }
    setLoading(true)
    setFetchError(null)

    const fetchScans = async () => {
      try {
        const { data, error } = await getScanHistory(user.id)
        if (error) {
          setFetchError("Couldn't load scan history")
          setScans([])
        } else {
          setScans(data.map(mapDbScan))
        }
      } catch (err) {
        console.error("Supabase fetch error:", err)
        setFetchError("Couldn't connect to database")
        setScans([])
      } finally {
        setLoading(false)
      }
    }

    fetchScans()
  }, [user])

  const displayScans = scans ?? MOCK_SCANS
  const isReal = !!scans

  // Stats derived from whichever dataset is active
  const totalScans = displayScans.length
  const issuesFound = displayScans.reduce((sum, s) => sum + (s.issues ?? 0), 0)
  const scoredScans = displayScans.filter(s => s.score !== null)
  const avgScore = scoredScans.length
    ? Math.round(scoredScans.reduce((sum, s) => sum + s.score, 0) / scoredScans.length)
    : 0
  const toolsUsed = new Set(displayScans.map(s => s.type)).size

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LayoutDashboard size={18} color="#38bdf8" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Dashboard</h1>
            <p style={{ fontSize: 11, color: "#475569" }}>
              {user ? `Welcome back, ${user.email}` : "Welcome back. Here's your ShipSafe overview."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Scans", value: String(totalScans), icon: Activity, color: "#38bdf8" },
          { label: "Issues Found", value: String(issuesFound), icon: Bug, color: "#ef4444" },
          { label: "Avg Score", value: scoredScans.length ? String(avgScore) : "—", icon: TrendingUp, color: "#f59e0b" },
          { label: "Tools Used", value: `${toolsUsed}/6`, icon: Zap, color: "#22c55e" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)",
            borderRadius: 14, padding: "20px 18px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${stat.color}12`, border: `1px solid ${stat.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.06em" }}>{stat.label.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Quick Actions */}
        <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", marginBottom: 14 }}>QUICK ACTIONS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {TOOLS.map((tool, i) => (
              <Link key={i} to={tool.path} style={{
                background: `${tool.color}08`, border: `1px solid ${tool.color}18`,
                borderRadius: 10, padding: "14px 14px", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 10,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${tool.color}40`; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${tool.color}18`; e.currentTarget.style.transform = "translateY(0)" }}>
                <tool.icon size={16} color={tool.color} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{tool.name}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{tool.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Scans */}
        <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>RECENT SCANS</span>
            <span style={{ fontSize: 10, color: isReal ? "#34d399" : "#334155" }}>
              {isReal ? "Live data" : "Demo data"}
            </span>
          </div>

          {/* ✅ TASK 2: Error toast for failed Supabase fetch */}
          {fetchError && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 11, color: "#ef4444" }}>
              {fetchError}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: "#475569" }}>
              Loading...
            </div>
          )}

          {!loading && displayScans.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 12, color: "#475569" }}>
              No scans yet — run a tool to get started.
            </div>
          )}

          {!loading && displayScans.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {displayScans.map((scan) => (
                <div key={scan.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 8,
                  background: "rgba(8,12,22,0.4)", border: "1px solid rgba(26,37,64,0.4)",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: scan.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scan.title}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{scan.type} • {scan.issues} issues</div>
                  </div>
                  {scan.score !== null && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: scan.score >= 60 ? "#22c55e" : scan.score >= 40 ? "#f59e0b" : "#ef4444", flexShrink: 0 }}>
                      {scan.score}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "#334155", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <Clock size={10} /> {scan.time}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isReal && (
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#334155" }}>
              Sign in to save and track your scan history
            </div>
          )}
        </div>
      </div>

      {/* Pipeline overview */}
      <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "20px" }}>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", marginBottom: 16 }}>THE SHIPSAFE PIPELINE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={i} style={{
              background: `${step.color}08`, border: `1px solid ${step.color}18`,
              borderRadius: 12, padding: "18px 16px", position: "relative",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: step.color, letterSpacing: "0.12em", marginBottom: 8 }}>
                STAGE {step.num}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>{step.label}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 10 }}>"{step.question}"</div>
              <div style={{ display: "flex", gap: 6 }}>
                {step.tools.map((tool, j) => (
                  <span key={j} style={{ fontSize: 9, fontWeight: 600, color: step.color, background: `${step.color}15`, padding: "3px 8px", borderRadius: 4 }}>{tool}</span>
                ))}
              </div>
              {i < 2 && (
                <div style={{ position: "absolute", right: -14, top: "50%", transform: "translateY(-50%)", color: "#253352", fontSize: 18 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
