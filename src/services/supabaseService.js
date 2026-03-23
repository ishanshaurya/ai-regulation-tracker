// src/services/supabaseService.js
//
// THE ONLY FILE IN THE APP THAT TOUCHES SUPABASE.
//
// Every page and hook imports from here — never from ../lib/supabase directly.
// If the schema changes, the table name changes, or we swap databases entirely,
// this is the only file that needs to change.
//
// All functions return a consistent shape:
//   { data, error }
// — mirroring Supabase's own pattern so callers can handle errors uniformly.

import { supabase } from "../lib/supabase"

// ─────────────────────────────────────────────
// SCAN HISTORY
// Table: scan_history
// Columns: id, user_id, scan_type, input_snippet, result (jsonb), score, created_at
// ─────────────────────────────────────────────

/**
 * Save a completed scan to the database.
 *
 * Called by useScan() after every successful AI response.
 * Only runs when a user is logged in (caller should check user first).
 *
 * @param {string} userId        - The logged-in user's UUID (from Supabase Auth)
 * @param {string} scanType      - One of: "debugger" | "audit" | "loopholes" | "deploy-check" | "stress-test"
 * @param {string} inputSnippet  - First 500 chars of the user's input (code, description, etc.)
 * @param {object} result        - The full parsed AI response object (stored as jsonb)
 * @param {number|null} score    - 0-100 health/readiness score, or null if the tool doesn't produce one
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function saveScan(userId, scanType, inputSnippet, result, score) {
  try {
    const { data, error } = await supabase
      .from("scan_history")
      .insert({
        user_id: userId,
        scan_type: scanType,
        input_snippet: inputSnippet?.slice(0, 500) ?? "",
        result: result,
        score: score ?? null,
      })
      .select()  // returns the inserted row so callers can use the id if needed

    if (error) {
      console.error("[supabaseService] saveScan failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] saveScan threw:", err)
    return { data: null, error: err }
  }
}

/**
 * Fetch the most recent scans for a user.
 *
 * Called by Dashboard to populate the "Recent Scans" panel.
 * Returns the 10 most recent rows, newest first.
 *
 * @param {string} userId  - The logged-in user's UUID
 * @param {number} limit   - How many rows to return (default: 10)
 *
 * @returns {{ data: Array|null, error: object|null }}
 */
export async function getScanHistory(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("scan_history")
      .select("id, scan_type, input_snippet, result, score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[supabaseService] getScanHistory failed:", error.message)
      return { data: null, error }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error("[supabaseService] getScanHistory threw:", err)
    return { data: null, error: err }
  }
}

/**
 * Fetch a single scan by its id.
 *
 * Used by the /report/:id page to load a specific scan result.
 *
 * @param {string} scanId  - The scan's UUID
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function getScanById(scanId) {
  try {
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .eq("id", scanId)
      .single()

    if (error) {
      console.error("[supabaseService] getScanById failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] getScanById threw:", err)
    return { data: null, error: err }
  }
}

/**
 * Delete a single scan by its id.
 *
 * Only the owner can delete (enforced by RLS policy on the table).
 *
 * @param {string} scanId  - The scan's UUID
 *
 * @returns {{ error: object|null }}
 */
export async function deleteScan(scanId) {
  try {
    const { error } = await supabase
      .from("scan_history")
      .delete()
      .eq("id", scanId)

    if (error) {
      console.error("[supabaseService] deleteScan failed:", error.message)
      return { error }
    }

    return { error: null }
  } catch (err) {
    console.error("[supabaseService] deleteScan threw:", err)
    return { error: err }
  }
}

// ─────────────────────────────────────────────
// REGULATIONS
// Table: regulations
// Columns: id, name, country, year, type, status, sector,
//          dev_impact, summary, penalties, requirements (jsonb), source_url
// Public read — no auth required.
// ─────────────────────────────────────────────

/**
 * Fetch regulations with optional filters.
 *
 * Called by the Regulations page and the Loophole Finder.
 * All filters are optional — passing {} returns all regulations.
 *
 * @param {object} filters
 * @param {string} [filters.country]   - Filter by country name (exact match)
 * @param {string} [filters.status]    - Filter by status: "enacted" | "proposed" | "draft"
 * @param {string} [filters.type]      - Filter by regulation type
 * @param {string} [filters.sector]    - Filter by sector
 * @param {string} [filters.search]    - Full-text search across name + summary
 *
 * @returns {{ data: Array|null, error: object|null }}
 */
export async function getRegulations(filters = {}) {
  try {
    let query = supabase
      .from("regulations")
      .select("id, name, country, year, type, status, sector, dev_impact, summary, penalties, source_url")
      .order("year", { ascending: false })

    if (filters.country)  query = query.eq("country", filters.country)
    if (filters.status)   query = query.eq("status", filters.status)
    if (filters.type)     query = query.eq("type", filters.type)
    if (filters.sector)   query = query.eq("sector", filters.sector)

    // ilike = case-insensitive LIKE — searches name OR summary
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("[supabaseService] getRegulations failed:", error.message)
      return { data: null, error }
    }

    return { data: data ?? [], error: null }
  } catch (err) {
    console.error("[supabaseService] getRegulations threw:", err)
    return { data: null, error: err }
  }
}

/**
 * Fetch a single regulation by its id.
 *
 * Used by the detail panel in the Regulations page
 * and by the Loophole Finder when analyzing a specific law.
 *
 * @param {string} regulationId
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function getRegulationById(regulationId) {
  try {
    const { data, error } = await supabase
      .from("regulations")
      .select("*")
      .eq("id", regulationId)
      .single()

    if (error) {
      console.error("[supabaseService] getRegulationById failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] getRegulationById threw:", err)
    return { data: null, error: err }
  }
}

// ─────────────────────────────────────────────
// USER PROFILE
// Table: users
// Columns: id, email, display_name, created_at, github_username
// ─────────────────────────────────────────────

/**
 * Fetch a user's profile row.
 *
 * Note: Supabase Auth stores email/id automatically.
 * This table stores additional profile data (display name, github, etc.)
 *
 * @param {string} userId
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, created_at, github_username")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("[supabaseService] getUserProfile failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] getUserProfile threw:", err)
    return { data: null, error: err }
  }
}

/**
 * Update a user's profile (display name, github username).
 *
 * @param {string} userId
 * @param {object} updates  - e.g. { display_name: "Shaurya", github_username: "ishanshaurya" }
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("[supabaseService] updateUserProfile failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] updateUserProfile threw:", err)
    return { data: null, error: err }
  }
}

// ─────────────────────────────────────────────
// REPORTS
// Table: reports
// Columns: id (uuid), user_id, slug (unique), title,
//          scan_type, result_data (jsonb), is_public (bool), created_at
// ─────────────────────────────────────────────

/**
 * Save a shareable public report.
 *
 * Called when user clicks "Generate Public Report" on any tool page.
 * The slug becomes the URL: /report/:slug
 *
 * @param {string} userId
 * @param {string} slug        - Unique URL-safe string (e.g. "abc123")
 * @param {string} title       - Report title
 * @param {string} scanType    - Which tool generated this
 * @param {object} resultData  - The full scan result object
 * @param {boolean} isPublic   - Whether anyone with the link can view it
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function saveReport(userId, slug, title, scanType, resultData, isPublic = true) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        slug,
        title,
        scan_type: scanType,
        result_data: resultData,
        is_public: isPublic,
      })
      .select()
      .single()

    if (error) {
      console.error("[supabaseService] saveReport failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] saveReport threw:", err)
    return { data: null, error: err }
  }
}

/**
 * Fetch a public report by its slug.
 *
 * Used by /report/:slug — works without auth (is_public = true).
 *
 * @param {string} slug
 *
 * @returns {{ data: object|null, error: object|null }}
 */
export async function getReportBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", slug)
      .eq("is_public", true)
      .single()

    if (error) {
      console.error("[supabaseService] getReportBySlug failed:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error("[supabaseService] getReportBySlug threw:", err)
    return { data: null, error: err }
  }
}
