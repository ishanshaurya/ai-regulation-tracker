// src/utils/shipReadiness.js
//
// Computes a single "Ship-Readiness Score" (0-100) from the user's
// most recent scan of each tool type. This is the unified verdict
// that tells a developer: are you ready to ship?
//
// Weights reflect how critical each stage is to production readiness:
//   Code stage (45%):  debugger (25%) + audit (20%)
//   Legal stage (25%): loopholes (25%) — inverted, high risk = low readiness
//   Deploy stage (30%): deploy-check (30%)
//
// Stress test doesn't produce a single score, so it's excluded from
// the weighted average but shown as a separate indicator.

const WEIGHTS = {
  debugger: 0.25,
  audit: 0.20,
  loopholes: 0.25,    // NOTE: this score is "risk" — we invert it
  "deploy-check": 0.30,
}

// Scan types that contribute to the readiness score
const SCORED_TYPES = Object.keys(WEIGHTS)

/**
 * Compute the Ship-Readiness Score from a list of scans.
 *
 * @param {Array} scans - Array of scan objects from scan_history
 *   Each must have: { scan_type, score, created_at }
 *
 * @returns {{
 *   score: number|null,       - 0-100 aggregate score, null if no scored scans
 *   verdict: string,          - "SHIP IT" | "ALMOST" | "NEEDS WORK" | "NOT READY" | "NO DATA"
 *   verdictColor: string,     - hex color for the verdict
 *   breakdown: object,        - per-tool latest scores
 *   completeness: number,     - 0-1, how many tool types have been scanned
 *   missingTools: string[],   - tool types not yet scanned
 * }}
 */
export function computeShipReadiness(scans) {
  if (!scans || scans.length === 0) {
    return {
      score: null,
      verdict: "NO DATA",
      verdictColor: "#475569",
      breakdown: {},
      completeness: 0,
      missingTools: SCORED_TYPES,
    }
  }

  // Get the most recent scan per tool type
  const latest = {}
  for (const scan of scans) {
    const type = scan.scan_type || scan.type
    if (!SCORED_TYPES.includes(type)) continue
    if (scan.score === null || scan.score === undefined) continue

    if (!latest[type] || new Date(scan.created_at) > new Date(latest[type].created_at)) {
      latest[type] = scan
    }
  }

  const scannedTypes = Object.keys(latest)
  const missingTools = SCORED_TYPES.filter(t => !scannedTypes.includes(t))

  if (scannedTypes.length === 0) {
    return {
      score: null,
      verdict: "NO DATA",
      verdictColor: "#475569",
      breakdown: {},
      completeness: 0,
      missingTools: SCORED_TYPES,
    }
  }

  // Calculate weighted score
  // Only use weights for tools that have been scanned, then normalize
  let weightedSum = 0
  let totalWeight = 0
  const breakdown = {}

  for (const type of scannedTypes) {
    let toolScore = latest[type].score

    // Invert loopholes — it's a "risk score" where 100 = max risk
    // For readiness, we want 100 = safe, so: readiness = 100 - risk
    if (type === "loopholes") {
      toolScore = 100 - toolScore
    }

    breakdown[type] = {
      raw: latest[type].score,
      adjusted: toolScore,
      weight: WEIGHTS[type],
      scanDate: latest[type].created_at,
    }

    weightedSum += toolScore * WEIGHTS[type]
    totalWeight += WEIGHTS[type]
  }

  // Normalize by actual weight used (in case not all tools scanned)
  const score = Math.round(weightedSum / totalWeight)
  const completeness = scannedTypes.length / SCORED_TYPES.length

  // Determine verdict
  let verdict, verdictColor
  if (score >= 80) {
    verdict = "SHIP IT"
    verdictColor = "#34d399"
  } else if (score >= 60) {
    verdict = "ALMOST"
    verdictColor = "#f59e0b"
  } else if (score >= 40) {
    verdict = "NEEDS WORK"
    verdictColor = "#f97316"
  } else {
    verdict = "NOT READY"
    verdictColor = "#ef4444"
  }

  return {
    score,
    verdict,
    verdictColor,
    breakdown,
    completeness,
    missingTools,
  }
}

/**
 * Get a human-readable label for a tool type
 */
export function toolLabel(type) {
  const labels = {
    debugger: "Code Debugger",
    audit: "Vibe-Code Audit",
    loopholes: "Legal Risk",
    "deploy-check": "Deploy Readiness",
    "stress-test": "Stress Test",
  }
  return labels[type] || type
}
