// api/claude.js — Vercel Serverless Proxy
// Routes AI requests to Google Gemini Flash 1.5
// API key lives in Vercel env vars, never in the browser.
//
// Flow: React frontend → POST /api/claude → this function → Gemini → normalized response
//

// ─── System Prompts ─────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  debugger: `You are ShipSafe AI Debugger — an expert code reviewer that finds bugs, security vulnerabilities, and "vibe-code" smells (patterns from AI-generated code that real developers wouldn't write).

You MUST respond with ONLY valid JSON — no markdown, no backticks, no explanation outside the JSON.

Response format:
{
  "healthScore": <number 0-100>,
  "summary": "<one sentence summarizing the scan>",
  "stats": {
    "totalIssues": <number>,
    "critical": <number>,
    "high": <number>,
    "medium": <number>,
    "low": <number>
  },
  "issues": [
    {
      "id": <number starting at 1>,
      "line": <line number or null>,
      "severity": "critical" | "high" | "medium" | "low",
      "category": "security" | "bug" | "vibecode" | "style",
      "title": "<short title>",
      "description": "<1-2 sentence explanation of why this is a problem>",
      "codeSnippet": "<the problematic code>",
      "fix": "<concrete fix with code>"
    }
  ],
  "positives": ["<thing the code does well>"]
}

Rules:
- Be specific. Reference actual line numbers and actual code from the input.
- For security issues, explain the attack vector (SQL injection, XSS, etc).
- "vibecode" category is for AI-generated code smells: hallucinated imports, no error handling, hardcoded localhost, console.log everywhere, unused variables, no input validation, everything in one file.
- healthScore: 90-100 = excellent, 70-89 = good, 40-69 = needs work, 0-39 = critical issues.
- Always find at least something — no code is perfect. But don't invent issues that aren't there.
- Return 0 issues only if the code is genuinely excellent.
- Respond ONLY with the JSON object. No other text.`,
};

// ─── Handler ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const {
    code,
    language = "JavaScript",
    context = "",
    tool = "debugger",
  } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "No code provided" });
  }

  // Build prompt
  let userPrompt = `Analyze this ${language} code for bugs, security issues, and vibe-code smells.\n\n`;
  if (context) userPrompt += `Context: ${context}\n\n`;
  userPrompt += `Code:\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``;

  const systemPrompt = SYSTEM_PROMPTS[tool] || SYSTEM_PROMPTS.debugger;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Gemini error:", response.status, errText.slice(0, 300));
      return res.status(502).json({
        error: `Gemini returned ${response.status}`,
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return res.status(502).json({ error: "Gemini returned empty response" });
    }

    // Normalize to { content: "..." } so frontend doesn't care about provider format
    return res.status(200).json({ content, provider: "gemini" });
  } catch (err) {
    console.error("Gemini request failed:", err);
    return res.status(502).json({ error: "Failed to reach Gemini API" });
  }
}
