import { useState } from "react"
import { Bug, Play, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown, ChevronRight, Copy, Check, Zap, Lock, Code2, Sparkles } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../hooks/useAuth"
import { useIsMobile } from "../hooks/useIsMobile"

const LANGS = ["JavaScript","TypeScript","Python","Java","Go","Rust","C++","PHP","Ruby","SQL"]

const SEV = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: AlertCircle, label: "CRITICAL" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", icon: AlertTriangle, label: "HIGH" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)", icon: Info, label: "MEDIUM" },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: CheckCircle, label: "LOW" },
}

const CAT = {
  security: { icon: Lock, color: "#f97316", label: "Security" },
  bug: { icon: Bug, color: "#ef4444", label: "Bug" },
  vibecode: { icon: Sparkles, color: "#a855f7", label: "Vibe-Code" },
  style: { icon: Code2, color: "#38bdf8", label: "Style" },
}

const SAMPLE = `const express = require('express');
const app = express();
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin123',
  database: 'myapp'
});

app.get('/api/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  db.query(query, (err, results) => {
    res.json(results);
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username='" + username + "'", (err, result) => {
    if (result.length > 0) {
      const token = "sk-secret-api-key-12345";
      res.json({ token, user: result[0] });
    }
  });
});

app.delete('/api/user/:id', (req, res) => {
  db.query("DELETE FROM users WHERE id = " + req.params.id);
  res.json({ success: true });
  console.log("User deleted");
});

app.listen(3000);
console.log("Server started");`

const MOCK = {
  healthScore: 22,
  summary: "Found 9 significant issues including 3 critical SQL injection and hardcoded secret vulnerabilities. Do NOT deploy this code.",
  stats: { totalIssues: 9, critical: 3, high: 2, medium: 2, low: 2 },
  issues: [
    { id: 1, line: 9, severity: "critical", category: "security", title: "Hardcoded database password", description: "Password 'admin123' is hardcoded in source code. Anyone with access to the codebase gets your database credentials. This is one of the most common and dangerous security mistakes.", fix: "Use environment variables:\npassword: process.env.DB_PASSWORD", codeSnippet: "password: 'admin123'" },
    { id: 2, line: 16, severity: "critical", category: "security", title: "SQL injection vulnerability", description: "User input is concatenated directly into a SQL query string. An attacker could send: ' OR 1=1 -- as the userId to dump your entire users table, or worse, DROP TABLE users.", fix: "Use parameterized queries:\ndb.query('SELECT * FROM users WHERE id = ?', [userId])", codeSnippet: "\"SELECT * FROM users WHERE id = '\" + userId + \"'\"" },
    { id: 3, line: 24, severity: "critical", category: "security", title: "SQL injection in login query", description: "Username is injected directly into SQL. An attacker can bypass authentication entirely by sending: admin' -- as the username. This gives access to any account without a password.", fix: "Use parameterized queries:\ndb.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, hashedPw])", codeSnippet: "\"SELECT * FROM users WHERE username='\" + username + \"'\"" },
    { id: 4, line: 26, severity: "high", category: "security", title: "Hardcoded API key sent to clients", description: "A secret key 'sk-secret-api-key-12345' is hardcoded and sent to every user who logs in. Anyone can extract this from network traffic.", fix: "Generate unique JWT tokens per session:\nconst token = jwt.sign({ userId: result[0].id }, process.env.JWT_SECRET)", codeSnippet: "const token = \"sk-secret-api-key-12345\"" },
    { id: 5, line: 32, severity: "high", category: "bug", title: "No error handling on DELETE query", description: "The delete query has no error callback. If the query fails (e.g., foreign key constraint), the user still gets a success response. Data integrity could silently break.", fix: "Add error handling:\ndb.query(sql, (err) => {\n  if (err) return res.status(500).json({ error: 'Delete failed' })\n  res.json({ success: true })\n})", codeSnippet: "db.query(\"DELETE FROM users WHERE id = \" + req.params.id)" },
    { id: 6, line: 7, severity: "medium", category: "vibecode", title: "Hardcoded localhost URL", description: "Database host is hardcoded to 'localhost'. This will break in production, staging, or any non-local environment. Classic vibe-code pattern where AI generates code that only works on your machine.", fix: "Use environment variable:\nhost: process.env.DB_HOST || 'localhost'", codeSnippet: "host: 'localhost'" },
    { id: 7, line: 17, severity: "medium", category: "vibecode", title: "Error parameter ignored in callback", description: "The 'err' parameter is received in the callback but never checked. If the database query fails, the error is silently swallowed and undefined data is sent to the client.", fix: "Check for errors:\ndb.query(query, (err, results) => {\n  if (err) return res.status(500).json({ error: err.message })\n  res.json(results)\n})", codeSnippet: "db.query(query, (err, results) => { res.json(results) })" },
    { id: 8, line: 34, severity: "low", category: "vibecode", title: "Console.log left in production code", description: "Debug logging should be removed before deployment. Console statements can leak sensitive information and impact performance in production.", fix: "Remove or replace with a proper logging library:\nlogger.info('User deleted', { userId: req.params.id })", codeSnippet: "console.log(\"User deleted\")" },
    { id: 9, line: 37, severity: "low", category: "vibecode", title: "Console.log at server startup", description: "Another debug statement left in the code. AI-generated code commonly leaves these in.", fix: "Remove or use:\nlogger.info(`Server running on port ${PORT}`)", codeSnippet: "console.log(\"Server started\")" },
  ],
  positives: ["Uses const declarations (modern JS)", "RESTful route structure", "Express.js patterns are standard"],
}

function ScoreRing({ score }) {
  const s = 120, w = 8, r = (s - w) / 2, c = 2 * Math.PI * r
  const off = c - (score / 100) * c
  const col = score >= 80 ? "#34d399" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444"
  return (
    <div style={{ position: "relative", width: s, height: s }}>
      <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="rgba(26,37,64,0.6)" strokeWidth={w} />
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={col} strokeWidth={w} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: col }}>{score}</span>
        <span style={{ fontSize: 10, color: "#475569" }}>/ 100</span>
      </div>
    </div>
  )
}

function IssueCard({ issue, open, toggle }) {
  const s = SEV[issue.severity] || SEV.medium
  const ct = CAT[issue.category] || CAT.bug
  const SI = s.icon, CI = ct.icon
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12 }}>
      <div onClick={toggle} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <SI size={16} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            {issue.line && <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", background: "rgba(15,22,40,0.5)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>L{issue.line}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, color: ct.color, display: "flex", alignItems: "center", gap: 4 }}><CI size={10} /> {ct.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: "0.08em", marginLeft: "auto" }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{issue.title}</div>
        </div>
        {open ? <ChevronDown size={14} color="#475569" /> : <ChevronRight size={14} color="#475569" />}
      </div>
      {open && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${s.border}`, paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>{issue.description}</p>
          {issue.codeSnippet && (
            <div style={{ background: "#080c16", border: "1px solid rgba(26,37,64,0.6)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontFamily: "monospace", fontSize: 11, color: "#ef4444", lineHeight: 1.6 }}>
              <span style={{ color: "#475569", marginRight: 8 }}>✕</span>{issue.codeSnippet}
            </div>
          )}
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#34d399", marginBottom: 6, letterSpacing: "0.08em" }}>FIX SUGGESTION</div>
            <pre style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{issue.fix}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Debugger() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [code, setCode] = useState("")
  const [lang, setLang] = useState("JavaScript")
  const [ctx, setCtx] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [exp, setExp] = useState({})
  const [copied, setCopied] = useState(false)

  const toggle = (id) => setExp((p) => ({ ...p, [id]: !p[id] }))

  const runScan = async () => {
    if (!code.trim() || loading) return
    setLoading(true)
    setResult(null)
    setExp({})
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
    setResult(MOCK)
    if (user) {
      supabase.from("scan_history").insert({
        user_id: user.id,
        scan_type: "debugger",
        input_snippet: code.slice(0, 500),
        result: MOCK,
        score: MOCK.healthScore,
      })
    }
    const ae = {}
    MOCK.issues.forEach((i) => { if (i.severity === "critical" || i.severity === "high") ae[i.id] = true })
    setExp(ae)
    setLoading(false)
  }

  const lc = code.split("\n").length

  return (
    <div className="animate-fade-in">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bug size={18} color="#ef4444" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>AI Code Debugger</h1>
          <p style={{ fontSize: 11, color: "#475569" }}>Paste code → Find bugs, security holes & vibe-code smells → Get fixes <span style={{ color: "#f59e0b", marginLeft: 8 }}>● Demo Mode</span></p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18, alignItems: "start" }}>
        {/* LEFT - Code Input */}
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ background: "#0f1623", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#94a3b8", fontSize: 12, padding: "8px 12px", outline: "none" }}>
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <input placeholder="Context (optional)" value={ctx} onChange={(e) => setCtx(e.target.value)} style={{ flex: 1, background: "#0f1623", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, padding: "8px 12px", outline: "none" }} />
            <button onClick={() => { setCode(SAMPLE); setLang("JavaScript"); setCtx("Express.js REST API"); setResult(null) }} style={{ background: "transparent", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 8, color: "#475569", fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>Load Sample</button>
          </div>

          <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(26,37,64,0.6)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />
              </div>
              <span style={{ fontSize: 11, color: "#334155" }}>{lang.toLowerCase()}</span>
              <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#34d399" : "#475569", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div style={{ display: "flex", minHeight: 400, maxHeight: 560, overflow: "auto" }}>
              <div style={{ padding: "16px 0", minWidth: 44, textAlign: "right", userSelect: "none", borderRight: "1px solid rgba(26,37,64,0.4)", background: "rgba(8,12,22,0.4)" }}>
                {Array.from({ length: Math.max(lc, 20) }, (_, i) => (
                  <div key={i} style={{ padding: "0 10px", fontSize: 11, lineHeight: "20px", color: "#334155", fontFamily: "monospace" }}>{i + 1}</div>
                ))}
              </div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here..." spellCheck={false} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12, lineHeight: "20px", padding: 16, minHeight: 400, width: "100%", whiteSpace: "pre", overflowX: "auto" }} />
            </div>
          </div>

          <button onClick={runScan} disabled={loading || !code.trim()} style={{ width: "100%", marginTop: 12, padding: 14, borderRadius: 10, border: "none", background: loading || !code.trim() ? "#1a2540" : "#34d399", color: loading || !code.trim() ? "#334155" : "#0a0e1a", fontSize: 14, fontWeight: 700, cursor: loading || !code.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Scanning...</> : <><Play size={16} /> Run ShipSafe Scan</>}
          </button>

          {result && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
              {[{ l: "Total", v: result.stats.totalIssues, c: "#94a3b8" }, { l: "Critical", v: result.stats.critical, c: "#ef4444" }, { l: "High", v: result.stats.high, c: "#f97316" }, { l: "Medium", v: result.stats.medium, c: "#eab308" }, { l: "Low", v: result.stats.low, c: "#22c55e" }].map((s, i) => (
                <div key={i} style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.08em", marginTop: 2 }}>{s.l.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT - Results */}
        <div>
          {!loading && !result && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "60px 40px", textAlign: "center", minHeight: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Bug size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Paste code to scan</h3>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, maxWidth: 340 }}>Finds bugs, security holes, and vibe-code smells that linters miss. Try the sample code.</p>
            </div>
          )}

          {loading && (
            <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: "80px 40px", textAlign: "center", minHeight: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={36} color="#34d399" style={{ animation: "spin 1.5s linear infinite", marginBottom: 20 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Scanning {lc} lines of {lang}</h3>
              <p style={{ fontSize: 12, color: "#475569" }}>Running pattern analysis...</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "rgba(15,22,40,0.6)", border: "1px solid rgba(56,189,248,0.08)", borderRadius: 14, padding: 24, display: "flex", gap: 24, alignItems: "center" }}>
                <ScoreRing score={result.healthScore} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.1em", marginBottom: 6 }}>CODE HEALTH SCORE</div>
                  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{result.summary}</p>
                  {result.positives.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {result.positives.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, fontSize: 11, color: "#34d399", marginTop: 4 }}>
                          <CheckCircle size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {p}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
                <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.1em" }}>{result.issues.length} ISSUES FOUND</span>
                <button onClick={() => { const a = result.issues.every((i) => exp[i.id]); setExp(a ? {} : Object.fromEntries(result.issues.map((i) => [i.id, true]))) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#34d399" }}>
                  {result.issues.every((i) => exp[i.id]) ? "Collapse All" : "Expand All"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.issues.sort((a, b) => {
                  const o = { critical: 0, high: 1, medium: 2, low: 3 }
                  return (o[a.severity] ?? 4) - (o[b.severity] ?? 4)
                }).map((issue) => (
                  <IssueCard key={issue.id} issue={issue} open={!!exp[issue.id]} toggle={() => toggle(issue.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}