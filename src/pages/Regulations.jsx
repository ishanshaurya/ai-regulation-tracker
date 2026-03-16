import { useState, useMemo } from "react"
import { Scale, Search, ChevronRight, X, Globe, BarChart3, Filter, ExternalLink } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

/* ═══════════════════════════════════════════════════════════
   REGULATION TRACKER — Migrated into ShipSafe

   Previously: standalone 1800-line artifact "RegAI"
   Now: one feature page inside ShipSafe, matching the
   glassmorphism theme. Data stays in-component for now,
   will move to Supabase in a later phase.
   ═══════════════════════════════════════════════════════════ */

const REGULATIONS = [
  { id:1, name:"EU AI Act", country:"European Union", year:2024, type:"Comprehensive", status:"Enacted", sector:"Cross-sector", impact:"critical", flag:"🇪🇺", summary:"World's first comprehensive AI law with risk-tier classification. Strict rules for high-risk systems including biometrics and critical infrastructure.", penalties:"€35M or 7% global turnover", requirements:["Risk classification mandatory","High-risk AI conformity assessment","Transparency for GPAI models","Prohibited: social scoring, real-time biometrics"], source:"https://artificialintelligenceact.eu/" },
  { id:2, name:"US Executive Order on AI Safety", country:"United States", year:2023, type:"Safety", status:"Active", sector:"Cross-sector", impact:"high", flag:"🇺🇸", summary:"Mandates safety testing for powerful AI models before deployment, watermarking of AI-generated content, and federal agency guidelines.", penalties:"Federal contract restrictions", requirements:["Dual-use foundation model reporting","Red-team testing required","NIST AI RMF alignment","Watermarking standards"], source:"https://whitehouse.gov/ai/" },
  { id:3, name:"NIST AI Risk Management Framework", country:"United States", year:2023, type:"Framework", status:"Active", sector:"Cross-sector", impact:"medium", flag:"🇺🇸", summary:"Voluntary framework for managing AI risks across the lifecycle. De facto standard for federal AI procurement.", penalties:"Voluntary — no penalties", requirements:["GOVERN: policies & accountability","MAP: risk identification","MEASURE: risk analysis","MANAGE: risk treatment"], source:"https://nist.gov/artificial-intelligence" },
  { id:4, name:"China Generative AI Regulations", country:"China", year:2023, type:"Generative AI", status:"Enacted", sector:"Technology", impact:"critical", flag:"🇨🇳", summary:"Requires AIGC services to register with CAC, conduct security assessments, and ensure content aligns with socialist values.", penalties:"Service suspension, fines up to ¥100K", requirements:["CAC registration mandatory","Algorithm filing required","Content filtering for harmful outputs","Real-name verification for users"], source:"" },
  { id:5, name:"UK AI Regulatory Framework", country:"United Kingdom", year:2023, type:"Principles-based", status:"Active", sector:"Cross-sector", impact:"medium", flag:"🇬🇧", summary:"Pro-innovation, sector-led approach. Existing regulators apply AI principles rather than a single AI law.", penalties:"Varies by sector regulator", requirements:["Safety & security","Transparency & explainability","Accountability & governance","Contestability & redress"], source:"" },
  { id:6, name:"AIDA (Bill C-27)", country:"Canada", year:2023, type:"Comprehensive", status:"Proposed", sector:"Cross-sector", impact:"high", flag:"🇨🇦", summary:"Artificial Intelligence and Data Act would regulate high-impact AI systems. Requires risk mitigation, transparency, and reporting.", penalties:"Up to CA$25M or 3% global revenue", requirements:["High-impact system designation","Risk mitigation measures","Incident reporting obligations","Plain language descriptions"], source:"" },
  { id:7, name:"Brazil AI Bill (PL 2338/2023)", country:"Brazil", year:2024, type:"Comprehensive", status:"Proposed", sector:"Cross-sector", impact:"high", flag:"🇧🇷", summary:"Risk-based framework similar to EU AI Act. Prohibits certain AI uses, mandates human oversight, creates national AI authority.", penalties:"Up to 2% annual revenue", requirements:["Risk classification system","Prohibition on social scoring","Transparency for automated decisions","LGPD alignment"], source:"" },
  { id:8, name:"Japan AI Guidelines", country:"Japan", year:2023, type:"Guidelines", status:"Active", sector:"Cross-sector", impact:"low", flag:"🇯🇵", summary:"Non-binding, human-centric AI principles. Agile governance approach with focus on innovation.", penalties:"Voluntary — no penalties", requirements:["Human-centric design","Privacy protection","Security","Accountability & transparency"], source:"" },
  { id:9, name:"Singapore Model AI Governance", country:"Singapore", year:2023, type:"Framework", status:"Active", sector:"Cross-sector", impact:"low", flag:"🇸🇬", summary:"Detailed, practical guidance for deploying AI responsibly. Includes AI Verify testing toolkit.", penalties:"Voluntary — no penalties", requirements:["Internal governance structures","Risk operations management","Customer communication","AI Verify toolkit testing"], source:"" },
  { id:10, name:"MeitY AI Advisory & Deepfake Rules", country:"India", year:2024, type:"Advisory", status:"Active", sector:"Technology", impact:"high", flag:"🇮🇳", summary:"Mandates labelling of AI-generated content, explicit approval before deploying untested AI, deepfake watermarking.", penalties:"Loss of safe-harbour; platform shutdown; criminal liability", requirements:["Label all AI-generated media","Bias testing mandatory","Deepfakes must carry AI-origin labels","Government pre-approval for untested models"], source:"https://meity.gov.in/" },
  { id:11, name:"DPDP Act 2023", country:"India", year:2023, type:"Data Privacy", status:"Enacted", sector:"Cross-sector", impact:"critical", flag:"🇮🇳", summary:"India's Digital Personal Data Protection Act governs how AI systems collect, process, and store personal data of Indian citizens.", penalties:"Up to ₹250 crore (~$30M) per violation", requirements:["Consent-first data collection","Purpose limitation for AI data use","Data localisation for sensitive data","Children's data: parental consent mandatory"], source:"https://meity.gov.in/data-protection-framework" },
  { id:12, name:"IndiaAI Mission", country:"India", year:2023, type:"Framework", status:"Active", sector:"Cross-sector", impact:"medium", flag:"🇮🇳", summary:"NITI Aayog's National AI Strategy guides responsible AI development through public investment and ethical guardrails.", penalties:"Voluntary — ineligibility for IndiaAI funding", requirements:["Responsible AI: fairness, accountability, transparency","IndiaAI compute access requires ethical declaration","Sector-specific guidelines for health, agri, edtech"], source:"https://indiaai.gov.in/" },
  { id:13, name:"Australia AI Ethics Framework", country:"Australia", year:2023, type:"Framework", status:"Active", sector:"Cross-sector", impact:"low", flag:"🇦🇺", summary:"Voluntary ethics framework covering 8 principles for responsible AI.", penalties:"Voluntary — no penalties", requirements:["Human, societal & environmental wellbeing","Human-centered values","Fairness","Privacy protection & security"], source:"" },
  { id:14, name:"Korea AI Act", country:"South Korea", year:2024, type:"Comprehensive", status:"Proposed", sector:"Cross-sector", impact:"high", flag:"🇰🇷", summary:"Proposed legislation for high-impact AI with risk-based classification. Strong focus on deepfakes and facial recognition.", penalties:"TBD", requirements:["High-impact AI notification","Disclosure requirements","Human oversight for autonomous decisions","Penalties for deepfake misuse"], source:"" },
]

const IMPACT_COLOR = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" }
const STATUS_COLOR = { Enacted: "#22c55e", Active: "#3b82f6", Proposed: "#f59e0b", Draft: "#a855f7" }
const CHART_COLORS = ["#38bdf8", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#f97316", "#06b6d4", "#84cc16"]

const ALL_TYPES = ["All", ...new Set(REGULATIONS.map(r => r.type))]
const ALL_STATUSES = ["All", "Enacted", "Active", "Proposed"]
const ALL_IMPACTS = ["All", "critical", "high", "medium", "low"]

export default function Regulations() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [impactFilter, setImpactFilter] = useState("All")
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState("database") // database | analytics

  const filtered = useMemo(() => {
    return REGULATIONS.filter(r => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.country.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "All" || r.type === typeFilter
      const matchStatus = statusFilter === "All" || r.status === statusFilter
      const matchImpact = impactFilter === "All" || r.impact === impactFilter
      return matchSearch && matchType && matchStatus && matchImpact
    })
  }, [search, typeFilter, statusFilter, impactFilter])

  // Analytics data
  const byCountry = useMemo(() => {
    const map = {}
    REGULATIONS.forEach(r => { map[r.country] = (map[r.country] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, value })).sort((a, b) => b.value - a.value)
  }, [])

  const byStatus = useMemo(() => {
    const map = {}
    REGULATIONS.forEach(r => { map[r.status] = (map[r.status] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [])

  const byType = useMemo(() => {
    const map = {}
    REGULATIONS.forEach(r => { map[r.type] = (map[r.type] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [])

  const stats = useMemo(() => ({
    total: REGULATIONS.length,
    countries: new Set(REGULATIONS.map(r => r.country)).size,
    enacted: REGULATIONS.filter(r => r.status === "Enacted").length,
    critical: REGULATIONS.filter(r => r.impact === "critical").length,
  }), [])

  const selStyle = (val, current) => ({
    background: val === current ? "rgba(56,189,248,0.15)" : "rgba(15,22,40,0.4)",
    border: `1px solid ${val === current ? "rgba(56,189,248,0.3)" : "rgba(56,189,248,0.08)"}`,
    borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer",
    color: val === current ? "#38bdf8" : "#64748b", fontWeight: val === current ? 600 : 400, transition: "all 0.15s",
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={18} color="#0ea5e9" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Regulation Tracker</h1>
            <p style={{ fontSize: 11, color: "#475569" }}>{stats.total} regulations across {stats.countries} countries • {stats.enacted} enacted • {stats.critical} critical impact</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setView("database")} style={selStyle("database", view)}>
            <Filter size={11} style={{ marginRight: 4 }} /> Database
          </button>
          <button onClick={() => setView("analytics")} style={selStyle("analytics", view)}>
            <BarChart3 size={11} style={{ marginRight: 4 }} /> Analytics
          </button>
        </div>
      </div>

      {view === "database" ? (
        <>
          {/* Search + Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={14} color="#475569" style={{ position: "absolute", left: 12, top: 10 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search regulations or countries..."
                style={{ width: "100%", background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: "9px 12px 9px 34px", outline: "none" }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 11, padding: "8px 12px", outline: "none" }}>
              {ALL_TYPES.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 11, padding: "8px 12px", outline: "none" }}>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
            </select>
            <select value={impactFilter} onChange={e => setImpactFilter(e.target.value)} style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 11, padding: "8px 12px", outline: "none", textTransform: "capitalize" }}>
              {ALL_IMPACTS.map(i => <option key={i} value={i}>{i === "All" ? "All Impacts" : i}</option>)}
            </select>
          </div>

          {/* Results count */}
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 10, letterSpacing: "0.08em" }}>
            {filtered.length} REGULATION{filtered.length !== 1 ? "S" : ""} FOUND
          </div>

          {/* Regulation cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(reg => (
              <div key={reg.id} onClick={() => setSelected(reg)}
                style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.2)"; e.currentTarget.style.transform = "translateX(4px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.08)"; e.currentTarget.style.transform = "translateX(0)" }}>
                <span style={{ fontSize: 28 }}>{reg.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{reg.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: STATUS_COLOR[reg.status], background: `${STATUS_COLOR[reg.status]}15`, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>{reg.status.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{reg.country} • {reg.year} • {reg.type}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: IMPACT_COLOR[reg.impact], background: `${IMPACT_COLOR[reg.impact]}12`, padding: "3px 10px", borderRadius: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>{reg.impact}</span>
                  <ChevronRight size={16} color="#334155" />
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#475569", fontSize: 13 }}>
              No regulations match your filters. Try broadening your search.
            </div>
          )}
        </>
      ) : (
        /* Analytics View */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Stats row */}
          <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Total Regulations", value: stats.total, color: "#38bdf8" },
              { label: "Countries", value: stats.countries, color: "#22c55e" },
              { label: "Enacted", value: stats.enacted, color: "#22c55e" },
              { label: "Critical Impact", value: stats.critical, color: "#ef4444" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", marginTop: 4 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* By Country */}
          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", marginBottom: 16 }}>REGULATIONS BY COUNTRY</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCountry} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: "#0f1623", border: "1px solid #1a2540", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="value" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Status */}
          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", marginBottom: 16 }}>BY STATUS</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={4} strokeWidth={0}>
                  {byStatus.map((_, i) => <Cell key={i} fill={Object.values(STATUS_COLOR)[i] || CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f1623", border: "1px solid #1a2540", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
              {byStatus.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: Object.values(STATUS_COLOR)[i] || CHART_COLORS[i] }} />
                  <span style={{ color: "#94a3b8" }}>{s.name}</span>
                  <span style={{ color: "#475569" }}>({s.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Type */}
          <div style={{ gridColumn: "1 / -1", background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", marginBottom: 16 }}>BY REGULATION TYPE</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f1623", border: "1px solid #1a2540", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detail Panel (slide-in) */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 199, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "#090e18", borderLeft: "1px solid rgba(56,189,248,0.08)", zIndex: 200, overflow: "auto", padding: 32 }} className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: 36, marginRight: 12 }}>{selected.flag}</span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginTop: 8 }}>{selected.name}</h2>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{selected.country} • {selected.year}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLOR[selected.status], background: `${STATUS_COLOR[selected.status]}15`, padding: "4px 12px", borderRadius: 6 }}>{selected.status}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: IMPACT_COLOR[selected.impact], background: `${IMPACT_COLOR[selected.impact]}12`, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" }}>{selected.impact} impact</span>
              <span style={{ fontSize: 10, color: "#64748b", background: "rgba(15,22,40,0.6)", padding: "4px 12px", borderRadius: 6 }}>{selected.type}</span>
              <span style={{ fontSize: 10, color: "#64748b", background: "rgba(15,22,40,0.6)", padding: "4px 12px", borderRadius: 6 }}>{selected.sector}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>SUMMARY</div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{selected.summary}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>PENALTIES</div>
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#ef4444" }}>
                {selected.penalties}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 8 }}>KEY REQUIREMENTS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selected.requirements.map((req, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                    <span style={{ color: "#38bdf8", flexShrink: 0, marginTop: 2 }}>→</span> {req}
                  </div>
                ))}
              </div>
            </div>

            {selected.source && (
              <a href={selected.source} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#38bdf8", textDecoration: "none", marginTop: 8 }}>
                <ExternalLink size={13} /> View official source
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}
