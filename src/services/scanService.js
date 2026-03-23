// src/services/scanService.js
//
// THE ONLY FILE IN THE APP THAT CALLS /api/claude.
//
// Every tool calls callAI(prompt, options) — one function, one place.
// If the proxy URL changes, the request format changes, or we swap AI
// providers entirely, this is the only file that needs to change.
//
// Returns a consistent shape:
//   { content: <parsed object>, error: <string | null> }
// — content is already parsed from JSON so callers never touch JSON.parse()

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// Centralized here (not in the proxy) so the frontend
// controls what each tool asks for. The proxy just forwards.
// ─────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  debugger: `You are ShipSafe AI Debugger — an expert code reviewer that finds bugs, security vulnerabilities, and "vibe-code" smells.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

CRITICAL: Keep your response concise. Maximum 8 issues. Combine similar issues into one.

Response format:
{
  "healthScore": <number 0-100>,
  "summary": "<one sentence>",
  "stats": { "totalIssues": <n>, "critical": <n>, "high": <n>, "medium": <n>, "low": <n> },
  "issues": [
    {
      "id": <number>,
      "line": <number or null>,
      "severity": "critical" | "high" | "medium" | "low",
      "category": "security" | "bug" | "vibecode" | "style",
      "title": "<short title>",
      "description": "<1 sentence>",
      "codeSnippet": "<short problematic code or null>",
      "fix": "<short fix>"
    }
  ],
  "positives": ["<short positive>"]
}

Rules:
- MAX 8 issues. Prioritize the most important ones.
- Keep descriptions to 1 sentence. Keep fixes short.
- "vibecode" = AI-generated code smells: no error handling, hardcoded values, console.log everywhere, unused vars.
- healthScore: 90-100 excellent, 70-89 good, 40-69 needs work, 0-39 critical.
- Respond ONLY with the JSON object.`,

  audit: `You are ShipSafe Vibe-Code Auditor — you evaluate whether a project was responsibly built or hastily AI-generated.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

Response format:
{
  "overallScore": <number 0-100>,
  "summary": "<2 sentences>",
  "categories": {
    "security":        { "score": <0-100>, "label": "<Good|Needs Work|Critical>", "issues": ["<issue>"] },
    "codeQuality":     { "score": <0-100>, "label": "<Good|Needs Work|Critical>", "issues": ["<issue>"] },
    "maintainability": { "score": <0-100>, "label": "<Good|Needs Work|Critical>", "issues": ["<issue>"] },
    "testCoverage":    { "score": <0-100>, "label": "<Good|Needs Work|Critical>", "issues": ["<issue>"] },
    "deployReadiness": { "score": <0-100>, "label": "<Good|Needs Work|Critical>", "issues": ["<issue>"] }
  },
  "vibeCodePatterns": ["<detected AI-generated pattern>"],
  "actionItems": [
    { "priority": "high" | "medium" | "low", "item": "<concrete action>" }
  ]
}

Rules:
- Max 3 issues per category. Max 5 action items.
- vibeCodePatterns: look for everything-in-one-file, no types, console.log everywhere, no tests, copy-paste blocks, hallucinated imports.
- Respond ONLY with the JSON object.`,

  loopholes: `You are ShipSafe Legal Analyst — you find regulatory grey areas and legal ambiguities in AI regulations that developers should know about.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

Response format:
{
  "riskScore": <number 0-100, where 100 = maximum legal risk>,
  "summary": "<2 sentences>",
  "greyAreas": [
    {
      "id": <number>,
      "regulation": "<regulation name>",
      "country": "<country>",
      "issue": "<what is ambiguous>",
      "risk": "high" | "medium" | "low",
      "competitorExploit": "<what a less ethical competitor could do here>",
      "defensiveAction": "<what you should do proactively>"
    }
  ],
  "upcomingChanges": ["<regulation in draft/proposed stage that may close a gap>"],
  "recommendations": ["<concrete recommendation>"]
}

Rules:
- Max 6 grey areas. Max 3 upcoming changes. Max 4 recommendations.
- Be specific about which regulation and which clause is ambiguous.
- riskScore: 0-30 low, 31-60 moderate, 61-100 high.
- Respond ONLY with the JSON object.`,

  "deploy-check": `You are ShipSafe Deploy Checker — you validate deployment configurations and catch production gotchas before they cause outages.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

Response format:
{
  "readinessScore": <number 0-100>,
  "summary": "<2 sentences>",
  "checks": [
    {
      "id": <number>,
      "category": "env" | "security" | "performance" | "monitoring" | "database" | "cors",
      "name": "<check name>",
      "status": "pass" | "warn" | "fail",
      "detail": "<what was found>",
      "fix": "<what to do>"
    }
  ],
  "platformNotes": ["<platform-specific advice>"],
  "criticalBlockers": ["<must fix before shipping>"]
}

Rules:
- Max 10 checks. Flag both missing things AND misconfigurations.
- criticalBlockers: only items that WILL cause production failures.
- readinessScore: 90-100 ship it, 70-89 minor fixes, 40-69 needs work, 0-39 not ready.
- Respond ONLY with the JSON object.`,

  "stress-test": `You are ShipSafe Stress Tester — you predict bottlenecks and failure points in a described architecture under load.

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

Response format:
{
  "summary": "<2 sentences>",
  "tiers": [
    {
      "users": <number>,
      "label": "<e.g. '10 concurrent users'>",
      "status": "green" | "yellow" | "red",
      "responseTime": "<estimated p95 response time>",
      "bottleneck": "<which component breaks first or null>",
      "notes": "<what happens at this tier>"
    }
  ],
  "weakPoints": [
    { "component": "<name>", "issue": "<what breaks>", "fix": "<how to fix>" }
  ],
  "safeCapacity": "<estimated safe concurrent user count>",
  "recommendations": ["<scaling recommendation>"]
}

Rules:
- Always include tiers for 10, 100, 1000, and 10000 users.
- weakPoints: max 5. recommendations: max 4.
- Be honest that this is AI-predicted, not real load testing.
- Respond ONLY with the JSON object.`,
}

// ─────────────────────────────────────────────
// USER PROMPT BUILDERS
// Each tool needs a different prompt structure.
// Keeping them here means the page just passes raw input.
// ─────────────────────────────────────────────

function buildUserPrompt(tool, payload) {
  switch (tool) {
    case "debugger": {
      const { code, language = "JavaScript", context = "" } = payload
      let prompt = `Analyze this ${language} code. Return max 8 issues as JSON.\n\n`
      if (context) prompt += `Context: ${context}\n\n`
      prompt += `Code:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``
      return prompt
    }

    case "audit": {
      const { projectDescription, files = "" } = payload
      let prompt = `Audit this project for vibe-code patterns and responsible engineering.\n\n`
      prompt += `Project description: ${projectDescription}\n\n`
      if (files) prompt += `Files / code:\n${files}`
      return prompt
    }

    case "loopholes": {
      const { systemDescription, countries = [], regulation = "" } = payload
      let prompt = `Find regulatory grey areas for this AI system.\n\n`
      prompt += `System: ${systemDescription}\n`
      if (countries.length) prompt += `Target countries: ${countries.join(", ")}\n`
      if (regulation) prompt += `Specific regulation to analyze: ${regulation}\n`
      return prompt
    }

    case "deploy-check": {
      const { setupDescription, platform = "" } = payload
      let prompt = `Check this deployment setup for production readiness.\n\n`
      if (platform) prompt += `Platform: ${platform}\n\n`
      prompt += `Setup:\n${setupDescription}`
      return prompt
    }

    case "stress-test": {
      const { stackDescription } = payload
      return `Predict bottlenecks and failure points for this architecture under load.\n\nStack:\n${stackDescription}`
    }

    default:
      return JSON.stringify(payload)
  }
}

// ─────────────────────────────────────────────
// RESPONSE VALIDATORS
// Each tool has required fields — catch bad AI responses early
// before they cause confusing UI errors downstream.
// ─────────────────────────────────────────────

function validate(tool, parsed) {
  switch (tool) {
    case "debugger":
      if (typeof parsed.healthScore !== "number") throw new Error("Missing healthScore")
      if (!Array.isArray(parsed.issues)) throw new Error("Missing issues array")
      // Ensure stats exist — generate if AI skipped it
      if (!parsed.stats) {
        const issues = parsed.issues
        parsed.stats = {
          totalIssues: issues.length,
          critical: issues.filter(i => i.severity === "critical").length,
          high:     issues.filter(i => i.severity === "high").length,
          medium:   issues.filter(i => i.severity === "medium").length,
          low:      issues.filter(i => i.severity === "low").length,
        }
      }
      if (!Array.isArray(parsed.positives)) parsed.positives = []
      break

    case "audit":
      if (typeof parsed.overallScore !== "number") throw new Error("Missing overallScore")
      if (!parsed.categories) throw new Error("Missing categories")
      if (!Array.isArray(parsed.actionItems)) parsed.actionItems = []
      if (!Array.isArray(parsed.vibeCodePatterns)) parsed.vibeCodePatterns = []
      break

    case "loopholes":
      if (typeof parsed.riskScore !== "number") throw new Error("Missing riskScore")
      if (!Array.isArray(parsed.greyAreas)) throw new Error("Missing greyAreas array")
      if (!Array.isArray(parsed.recommendations)) parsed.recommendations = []
      if (!Array.isArray(parsed.upcomingChanges)) parsed.upcomingChanges = []
      break

    case "deploy-check":
      if (typeof parsed.readinessScore !== "number") throw new Error("Missing readinessScore")
      if (!Array.isArray(parsed.checks)) throw new Error("Missing checks array")
      if (!Array.isArray(parsed.criticalBlockers)) parsed.criticalBlockers = []
      if (!Array.isArray(parsed.platformNotes)) parsed.platformNotes = []
      break

    case "stress-test":
      if (!Array.isArray(parsed.tiers)) throw new Error("Missing tiers array")
      if (!Array.isArray(parsed.weakPoints)) parsed.weakPoints = []
      if (!Array.isArray(parsed.recommendations)) parsed.recommendations = []
      break
  }
  return parsed
}

// ─────────────────────────────────────────────
// SCORE EXTRACTOR
// Each tool stores a different field as the "score" in scan_history.
// This pulls the right one so supabaseService.saveScan() gets a number.
// ─────────────────────────────────────────────

export function extractScore(tool, parsed) {
  switch (tool) {
    case "debugger":    return parsed.healthScore    ?? null
    case "audit":       return parsed.overallScore   ?? null
    case "loopholes":   return parsed.riskScore      ?? null
    case "deploy-check":return parsed.readinessScore ?? null
    case "stress-test": return null  // no single score — tiers tell the story
    default:            return null
  }
}

// ─────────────────────────────────────────────
// callAI — THE ONE FUNCTION ALL TOOLS USE
// ─────────────────────────────────────────────

/**
 * Send a request to the AI via the /api/claude proxy.
 *
 * The page passes raw user input (code, description, etc.) as `payload`.
 * This function handles everything else: building prompts, fetching,
 * parsing JSON, validating, and returning a clean result.
 *
 * @param {string} tool     - One of: "debugger" | "audit" | "loopholes" | "deploy-check" | "stress-test"
 * @param {object} payload  - Raw input from the page (varies by tool, see buildUserPrompt)
 *
 * @returns {{ content: object|null, error: string|null }}
 *
 * Usage in a page:
 *   const { content, error } = await callAI("debugger", { code, language, context })
 *   if (error) setError(error)
 *   else setResult(content)
 */
export async function callAI(tool, payload) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[tool]
    if (!systemPrompt) {
      return { content: null, error: `Unknown tool: "${tool}"` }
    }

    const userPrompt = buildUserPrompt(tool, payload)

    // ── Fetch ──────────────────────────────────────────────
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool,
        systemPrompt,   // proxy forwards this to Gemini's system_instruction
        userPrompt,     // proxy forwards this to Gemini's contents
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const errMsg = typeof errData.error === "string"
        ? errData.error
        : `Server error: ${response.status}`
      return { content: null, error: errMsg }
    }

    const data = await response.json()

    // ── Parse ──────────────────────────────────────────────
    // Strip markdown fences in case Gemini wraps the JSON anyway
    let raw = data.content || ""
    raw = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error("[scanService] JSON parse failed:", raw.slice(0, 300))
      return { content: null, error: "AI returned an invalid response. Please try again." }
    }

    // ── Validate & normalize ────────────────────────────────
    try {
      parsed = validate(tool, parsed)
    } catch (validationErr) {
      console.error("[scanService] Validation failed:", validationErr.message)
      return { content: null, error: "AI response was incomplete. Please try again." }
    }

    return { content: parsed, error: null }

  } catch (err) {
    console.error("[scanService] callAI threw:", err)
    return { content: null, error: err.message || "Unexpected error. Please try again." }
  }
}
