export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" })

  const { systemPrompt, userPrompt, stream } = req.body
  if (!systemPrompt || !userPrompt) return res.status(400).json({ error: "systemPrompt and userPrompt are required" })

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  })

  // ── Non-streaming (unchanged) ──
  if (!stream) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body })
      if (!response.ok) {
        const errText = await response.text().catch(() => "")
        console.error("Gemini error:", response.status, errText.slice(0, 300))
        return res.status(502).json({ error: `Gemini returned ${response.status}` })
      }
      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!content) return res.status(502).json({ error: "Gemini returned empty response" })
      return res.status(200).json({ content, provider: "gemini" })
    } catch (err) {
      console.error("Gemini request failed:", err)
      return res.status(502).json({ error: "Failed to reach Gemini API" })
    }
  }

  // ── Streaming ──
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`
    const geminiRes = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "")
      console.error("Gemini stream error:", geminiRes.status, errText.slice(0, 300))
      return res.status(502).json({ error: `Gemini returned ${geminiRes.status}` })
    }

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("X-Accel-Buffering", "no")

    const reader = geminiRes.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr || jsonStr === "[DONE]") continue
        try {
          const parsed = JSON.parse(jsonStr)
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (chunk) res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
        } catch {}
      }
    }

    res.write("data: [DONE]\n\n")
    res.end()
  } catch (err) {
    console.error("Gemini stream failed:", err)
    if (!res.headersSent) res.status(502).json({ error: "Streaming failed" })
    else res.end()
  }
}
