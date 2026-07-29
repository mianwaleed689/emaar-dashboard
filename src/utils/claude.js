/**
 * Shared configuration for calls to the Claude API via /api/proxy?service=claude.
 *
 * Why this file exists: the model id was hardcoded in three separate places
 * (AI Insights, the marketing listing generator, and the CRM lead filter) and
 * all three pointed at `claude-sonnet-4-20250514`, which has been retired. Every
 * one of those features was returning HTTP 400 and failing silently, because the
 * calling code swallowed the error and fell back to an empty result.
 */

/** Current model. Change here and every feature follows. */
export const CLAUDE_MODEL = "claude-opus-5";

/**
 * Sensible token ceiling.
 *
 * Current models think before answering, and `max_tokens` caps thinking AND the
 * visible response together. The previous 1,000 was sized for a non-thinking
 * model and would now risk truncating the answer mid-sentence.
 */
export const CLAUDE_MAX_TOKENS = 4000;

/**
 * Effort level. These are short, well-specified generation tasks, so a low
 * setting keeps latency and cost down without hurting quality.
 */
export const CLAUDE_OUTPUT_CONFIG = { effort: "low" };

/**
 * Pull the assistant's text out of a Messages API response.
 *
 * `content` is an array of typed blocks and the first one is not necessarily the
 * text — on a thinking-enabled model it is usually a thinking block. All three
 * call sites previously read `content[0].text`, which yields undefined and
 * silently produced an empty result.
 */
export function extractClaudeText(response) {
  const blocks = response?.content;
  if (!Array.isArray(blocks)) return "";
  return blocks.find(b => b?.type === "text")?.text ?? "";
}

/**
 * Strip markdown fences some responses wrap JSON in, then parse.
 * Returns `fallback` rather than throwing, so a malformed response degrades
 * instead of breaking the screen.
 */
export function parseClaudeJson(text, fallback = null) {
  if (!text) return fallback;
  try {
    return JSON.parse(text.replace(/```json/gi, "").replace(/```/g, "").trim());
  } catch (e) {
    console.error("parseClaudeJson: response was not valid JSON", e);
    return fallback;
  }
}
