import { useState } from "react"
import { KeyRound, Search, Loader2, AlertTriangle, ChevronDown, ChevronRight, Globe, Shield, Scale, FileWarning, Lightbulb, TrendingUp } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"

/* ═══════════════════════════════════════════════════════════
   LOOPHOLE FINDER — ShipSafe's #2 Feature

   How it works:
   1. Developer describes their AI system
   2. Selects target deployment countries
   3. Mock engine returns grey areas, exploitation risks,
      defensive recommendations, and upcoming changes

   Same mock pattern as Debugger — flip USE_MOCK to false
   when you have API credits for real Claude analysis.
   ═══════════════════════════════════════════════════════════ */

const COUNTRIES = [
  { id: "eu", name: "European Union", flag: "🇪🇺" },
  { id: "us", name: "United States", flag: "🇺🇸" },
  { id: "in", name: "India", flag: "🇮🇳" },
  { id: "cn", name: "China", flag: "🇨🇳" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { id: "ca", name: "Canada", flag: "🇨🇦" },
  { id: "br", name: "Brazil", flag: "🇧🇷" },
  { id: "au", name: "Australia", flag: "🇦🇺" },
  { id: "jp", name: "Japan", flag: "🇯🇵" },
  { id: "kr", name: "South Korea", flag: "🇰🇷" },
  { id: "sg", name: "Singapore", flag: "🇸🇬" },
]

const RISK_COLOR = {
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", label: "HIGH RISK" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "MEDIUM RISK" },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", label: "LOW RISK" },
}

const SAMPLE_DESCRIPTIONS = [
  { label: "Facial Recognition Attendance", text: "An AI-powered facial recognition system for school/office attendance tracking. Uses camera feeds to identify individuals and mark attendance automatically. Stores facial biometric data in a cloud database." },
  { label: "AI Content Moderator", text: "An automated content moderation system that uses LLMs to detect and remove harmful content on a social media platform. Makes autonomous decisions to remove posts without human review." },
  { label: "AI Hiring Screener", text: "An AI system that screens job applications, ranks candidates, and automatically rejects applicants below a certain score threshold. Uses resume parsing and NLP to evaluate qualifications." },
]

// Mock analysis data based on selected countries
function getMockAnalysis(description, selectedCountries) {
  const greyAreas = []
  const defenses = []
  const upcoming = []
  let riskScore = 45

  if (selectedCountries.includes("eu")) {
    greyAreas.push(
      { id: 1, regulation: "EU AI Act", country: "🇪🇺 European Union", risk: "high", title: "High-risk classification ambiguity", description: "The EU AI Act classifies biometric identification and AI systems affecting employment as 'high-risk', but the exact boundaries are unclear. Your system may fall into a grey area where classification depends on interpretation.", exploitation: "A competitor could argue their similar system is 'limited risk' by framing it as an 'assistance tool' rather than an 'automated decision system', avoiding conformity assessment requirements.", recommendation: "Proactively classify your system as high-risk and complete conformity assessment. This protects you legally and builds user trust." },
      { id: 2, regulation: "EU AI Act", country: "🇪🇺 European Union", risk: "medium", title: "GPAI model transparency obligations", description: "If your system uses a general-purpose AI model (like GPT-4 or Claude), the transparency requirements for GPAI providers vs deployers are still being clarified through implementing acts.", exploitation: "Some companies are claiming they're 'deployers' not 'providers' to avoid GPAI-specific obligations, even when they fine-tune models significantly.", recommendation: "Document your AI supply chain clearly. If you fine-tune a foundation model, you may have provider-level obligations." },
    )
    defenses.push("Register with EU AI Office before enforcement deadline (Aug 2026)", "Prepare Technical Documentation per Annex IV requirements", "Implement human oversight mechanisms for any automated decisions")
    upcoming.push({ regulation: "EU AI Act Implementing Acts", status: "In Progress", expected: "2026", impact: "Will clarify high-risk classification criteria and conformity assessment procedures" })
    riskScore += 15
  }

  if (selectedCountries.includes("in")) {
    greyAreas.push(
      { id: 3, regulation: "DPDP Act 2023", country: "🇮🇳 India", risk: "high", title: "Consent mechanism for AI training data", description: "The DPDP Act requires explicit consent for data collection, but the definition of 'consent' for AI training data derived from user interactions is undefined. If your system learns from user behavior, you may be collecting training data without proper consent.", exploitation: "Companies are using broad Terms of Service to claim 'implied consent' for AI training, which may not hold up when the Data Protection Board issues enforcement guidelines.", recommendation: "Implement granular consent — separate consent for service usage vs AI training data collection. This future-proofs against stricter interpretation." },
      { id: 4, regulation: "MeitY AI Advisory", country: "🇮🇳 India", risk: "medium", title: "Pre-approval for untested AI models", description: "MeitY's advisory requires government pre-approval before deploying 'untested' AI models, but 'untested' is not clearly defined. Every AI model could technically be considered 'untested' in a new context.", exploitation: "Some companies deploy first and claim the model was 'tested internally', avoiding the pre-approval process entirely.", recommendation: "Document your testing methodology thoroughly. Maintain an internal AI testing registry that you can present if regulators ask." },
    )
    defenses.push("Appoint a Data Protection Officer as required by DPDP Act", "Implement data localisation for Indian user data", "Add visible AI-generated content labels per MeitY advisory")
    upcoming.push({ regulation: "DPDP Act Enforcement Rules", status: "Draft", expected: "2026", impact: "Will define penalties, consent mechanisms, and cross-border data transfer rules" })
    riskScore += 12
  }

  if (selectedCountries.includes("us")) {
    greyAreas.push(
      { id: 5, regulation: "US Executive Order on AI Safety", country: "🇺🇸 United States", risk: "medium", title: "Dual-use model reporting thresholds", description: "The EO requires reporting for 'dual-use foundation models' above certain compute thresholds, but the thresholds and definitions are being revised. Systems using fine-tuned models may or may not trigger reporting.", exploitation: "Companies are structuring their training runs to stay just below reporting thresholds, or arguing that fine-tuning doesn't count as 'developing' a foundation model.", recommendation: "Monitor NIST AI RMF updates and BIS reporting requirements. If your system uses a model near the threshold, prepare reporting documentation preemptively." },
    )
    defenses.push("Align with NIST AI Risk Management Framework", "Implement AI watermarking for generated content", "Prepare dual-use reporting documentation")
    upcoming.push({ regulation: "State-level AI Laws", status: "Proposed", expected: "2025-2026", impact: "Colorado, California, and Illinois are advancing AI-specific legislation that may create a patchwork of requirements" })
    riskScore += 8
  }

  if (selectedCountries.includes("cn")) {
    greyAreas.push(
      { id: 6, regulation: "China AIGC Regulations", country: "🇨🇳 China", risk: "high", title: "Content alignment requirements", description: "AIGC regulations require AI-generated content to 'align with socialist values', but what this means in practice for international AI systems is ambiguous. Content filtering requirements may conflict with global product design.", exploitation: "International companies operating in China maintain separate, heavily filtered model versions, creating compliance complexity and potential for inconsistent user experiences.", recommendation: "If deploying in China, plan for a separate content filtering layer from day one. Do not attempt to use the same model configuration globally." },
    )
    defenses.push("Register with CAC (Cyberspace Administration of China)", "Implement content filtering for China-specific requirements", "Maintain separate model configurations per jurisdiction")
    riskScore += 18
  }

  if (selectedCountries.includes("uk")) {
    greyAreas.push(
      { id: 7, regulation: "UK AI Framework", country: "🇬🇧 United Kingdom", risk: "low", title: "Sector-led regulation gaps", description: "The UK's pro-innovation approach delegates AI regulation to existing sector regulators (FCA, ICO, CMA). This means some AI applications fall between regulators with no clear oversight body.", exploitation: "Companies operating in unregulated sectors can deploy AI with minimal oversight, as no single regulator has claimed jurisdiction.", recommendation: "Even without mandatory requirements, align with the UK's 5 AI principles (safety, transparency, fairness, accountability, contestability) as voluntary best practice." },
    )
    defenses.push("Follow ICO AI guidance for data processing", "Implement contestability mechanisms for AI decisions")
    riskScore += 3
  }

  // Default grey areas if few countries selected
  if (greyAreas.length < 2) {
    greyAreas.push(
      { id: 10, regulation: "General", country: "🌐 Global", risk: "medium", title: "Cross-border data transfer complexity", description: "Operating across multiple jurisdictions creates data transfer challenges. User data processed by AI in one country may violate data localisation rules in another.", exploitation: "Some companies route AI processing through jurisdictions with minimal regulation to avoid compliance obligations.", recommendation: "Map your data flows. Know where user data is stored, processed, and where AI inference happens. Implement data processing agreements for each jurisdiction." },
    )
  }

  riskScore = Math.min(95, Math.max(15, riskScore))

  return {
    riskScore,
    summary: riskScore > 60
      ? `High regulatory exposure across ${selectedCountries.length} jurisdiction${selectedCountries.length > 1 ? "s" : ""}. ${greyAreas.length} grey areas identified with ${greyAreas.filter(g => g.risk === "high").length} high-risk findings.`
      : riskScore > 35
      ? `Moderate regulatory exposure. ${greyAreas.length} grey areas found — most manageable with proactive compliance measures.`
      : `Low regulatory exposure. ${greyAreas.length} minor grey areas found. Your deployment jurisdictions have relatively clear frameworks.`,
    greyAreas,
    defenses: [...new Set(defenses)],
    upcoming,
  }
}

function RiskRing({ score }) {
  const s = 100, w = 7, r = (s - w) / 2, c = 2 * Math.PI * r
  const off = c - (score / 100) * c
  const col = score >= 60 ? "#ef4444" : score >= 35 ? "#f59e0b" : "#22c55e"
  return (
    <div style={{ position: "relative", width: s, height: s }}>
      <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="rgba(26,37,64,0.6)" strokeWidth={w} />
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={col} strokeWidth={w} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: col }}>{score}</span>
        <span style={{ fontSize: 9, color: "#475569" }}>RISK</span>
      </div>
    </div>
  )
}

function GreyAreaCard({ area, open, toggle }) {
  const risk = RISK_COLOR[area.risk] || RISK_COLOR.medium
  return (
    <div style={{ background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 12 }}>
      <div onClick={toggle} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <AlertTriangle size={16} color={risk.color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", background: "rgba(15,22,40,0.5)", padding: "2px 8px", borderRadius: 4 }}>{area.country}</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>{area.regulation}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: risk.color, letterSpacing: "0.08em", marginLeft: "auto" }}>{risk.label}</span>
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{area.title}</div>
        </div>
        {open ? <ChevronDown size={14} color="#475569" /> : <ChevronRight size={14} color="#475569" />}
      </div>
      {open && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${risk.border}`, paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 14 }}>{area.description}</p>

          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#ef4444", marginBottom: 6, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
              <FileWarning size={11} /> EXPLOITATION RISK
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{area.exploitation}</p>
          </div>

          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#34d399", marginBottom: 6, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={11} /> DEFENSIVE RECOMMENDATION
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{area.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Loopholes() {
  const { user } = useAuth()
  const [description, setDescription] = useState("")
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [exp, setExp] = useState({})

  const toggleCountry = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const toggle = (id) => setExp((p) => ({ ...p, [id]: !p[id] }))

  const runAnalysis = async () => {
    if (!description.trim() || selected.length === 0 || loading) return
    setLoading(true)
    setResult(null)
    setExp({})
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))
    const analysis = getMockAnalysis(description, selected)
    setResult(analysis)
    if (user) {
      supabase.from("scan_history").insert({
        user_id: user.id,
        scan_type: "loopholes",
        input_snippet: description.slice(0, 500),
        result: analysis,
        score: analysis.riskScore,
      })
    }
    const ae = {}
    analysis.greyAreas.forEach((g) => { if (g.risk === "high") ae[g.id] = true })
    setExp(ae)
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <KeyRound size={18} color="#a855f7" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Loophole Finder</h1>
          <p style={{ fontSize: 11, color: "#475569" }}>Describe your AI system → Select target countries → Find regulatory grey areas <span style={{ color: "#f59e0b", marginLeft: 8 }}>● Demo Mode</span></p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        {/* LEFT — Input */}
        <div>
          {/* Quick templates */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {SAMPLE_DESCRIPTIONS.map((s, i) => (
              <button key={i} onClick={() => { setDescription(s.text); setResult(null) }}
                style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#64748b", fontSize: 10, padding: "6px 12px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.target.style.color = "#a855f7"; e.target.style.borderColor = "rgba(168,85,247,0.3)" }}
                onMouseLeave={(e) => { e.target.style.color = "#64748b"; e.target.style.borderColor = "rgba(56,189,248,0.08)" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Description input */}
          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(26,37,64,0.6)", fontSize: 11, color: "#475569" }}>
              Describe your AI system
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., 'An AI-powered facial recognition system for school attendance that stores biometric data in the cloud and makes automated decisions about student presence...'"
              style={{ width: "100%", minHeight: 160, background: "transparent", border: "none", outline: "none", resize: "vertical", color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, padding: 16 }} />
          </div>

          {/* Country selector */}
          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Globe size={13} /> Target deployment countries ({selected.length} selected)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COUNTRIES.map((c) => {
                const active = selected.includes(c.id)
                return (
                  <button key={c.id} onClick={() => toggleCountry(c.id)}
                    style={{
                      background: active ? "rgba(168,85,247,0.15)" : "rgba(15,22,40,0.4)",
                      border: `1px solid ${active ? "rgba(168,85,247,0.4)" : "rgba(56,189,248,0.08)"}`,
                      borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                      color: active ? "#a855f7" : "#64748b", fontSize: 12, fontWeight: active ? 600 : 400,
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                    }}>
                    <span style={{ fontSize: 16 }}>{c.flag}</span> {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Analyze button */}
          <button onClick={runAnalysis} disabled={loading || !description.trim() || selected.length === 0}
            style={{
              width: "100%", padding: 14, borderRadius: 10, border: "none",
              background: loading || !description.trim() || selected.length === 0 ? "#1a2540" : "#a855f7",
              color: loading || !description.trim() || selected.length === 0 ? "#334155" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: loading || !description.trim() || selected.length === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Analyzing regulations...</> : <><Search size={16} /> Find Loopholes</>}
          </button>
        </div>

        {/* RIGHT — Results */}
        <div>
          {!loading && !result && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "60px 40px", textAlign: "center", minHeight: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <KeyRound size={28} color="#a855f7" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Describe your AI system</h3>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 340 }}>Find legal grey areas, exploitation risks, and defensive strategies across global AI regulations.</p>
            </div>
          )}

          {loading && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "80px 40px", textAlign: "center", minHeight: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={36} color="#a855f7" style={{ animation: "spin 1.5s linear infinite", marginBottom: 20 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Cross-referencing {selected.length} jurisdictions</h3>
              <p style={{ fontSize: 12, color: "#475569" }}>Analyzing regulations for grey areas...</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Risk score + summary */}
              <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: 24, display: "flex", gap: 24, alignItems: "center" }}>
                <RiskRing score={result.riskScore} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 6 }}>REGULATORY RISK SCORE</div>
                  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{result.summary}</p>
                </div>
              </div>

              {/* Grey areas */}
              <div style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em", padding: "0 4px" }}>
                {result.greyAreas.length} GREY AREAS FOUND
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.greyAreas.map((area) => (
                  <GreyAreaCard key={area.id} area={area} open={!!exp[area.id]} toggle={() => toggle(area.id)} />
                ))}
              </div>

              {/* Defensive recommendations */}
              {result.defenses.length > 0 && (
                <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#34d399", marginBottom: 12, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                    <Lightbulb size={13} /> PROACTIVE DEFENSE CHECKLIST
                  </div>
                  {result.defenses.map((d, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                      <span style={{ color: "#34d399", flexShrink: 0 }}>→</span> {d}
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming changes */}
              {result.upcoming.length > 0 && (
                <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#38bdf8", marginBottom: 12, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                    <TrendingUp size={13} /> UPCOMING REGULATORY CHANGES
                  </div>
                  {result.upcoming.map((u, i) => (
                    <div key={i} style={{ background: "rgba(15,22,40,0.4)", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{u.regulation}</span>
                        <span style={{ fontSize: 10, color: u.status === "Draft" ? "#f59e0b" : "#38bdf8", fontWeight: 600 }}>{u.status} • {u.expected}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{u.impact}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}