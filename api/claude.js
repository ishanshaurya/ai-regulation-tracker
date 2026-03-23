// api/claude.js — Vercel Serverless Proxy
// Forwards AI requests to Google Gemini 2.5 Flash.
// API key lives in Vercel env vars, never in the browser.
//
// UPDATED: No longer owns system prompts or prompt building.
// scanService.js (frontend) sends fully-built systemPrompt + userPrompt.
// This proxy just forwards them to Gemini and normalizes the response.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" })
  }

  const { tool, systemPrompt, userPrompt } = req.body

  // Validate — both prompts are required
  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: "systemPrompt and userPrompt are required" })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => "")
      console.error("Gemini error:", response.status, errText.slice(0, 300))
      return res.status(502).json({ error: `Gemini returned ${response.status}` })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      return res.status(502).json({ error: "Gemini returned empty response" })
    }

    // Normalized response — always { content, provider }
    // scanService.js expects this shape regardless of which AI is used
    return res.status(200).json({ content, provider: "gemini" })

  } catch (err) {
    console.error("Gemini request failed:", err)
    return res.status(502).json({ error: "Failed to reach Gemini API" })
  }
}
