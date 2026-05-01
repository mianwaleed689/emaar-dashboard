/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬
   DXB ANALYTICS вв‚¬вЂќ SAFE ASYNC HELPERS
   src/utils/safeAsync.js

   Purpose: replace silent empty catch(e){} blocks with helpers
   that guarantee errors are logged and, when appropriate, shown
   to the user via a toast.

   Two variants:
   - safeAsync(fn, context) в†вЂ™ logs to console only. Use from
     module-level helpers, cleanup functions, or anywhere outside
     a React component scope where a toast function is unavailable.
   - safeAsyncWithToast(fn, context, notify) в†вЂ™ logs to console AND
     calls notify("Something went wrong вв‚¬вЂќ please try again"). Use
     inside React components where the notify function is in scope.

   Both return { ok: boolean, data?: any, error?: Error } so
   callers can decide whether to continue, retry, or bail out.

   When you see { ok: false } in logs, grep for the context string
   to find the exact call site. Every context string in this
   codebase is unique.
   ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */

export async function safeAsync(fn, context = "unknown") {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    // Log with context so we can find the call site later
    console.error(`[safeAsync:${context}]`, error);
    return { ok: false, error };
  }
}

export async function safeAsyncWithToast(fn, context, notify, userMessage) {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    console.error(`[safeAsync:${context}]`, error);
    if (typeof notify === "function") {
      notify(userMessage || "Something went wrong вв‚¬вЂќ please try again");
    }
    return { ok: false, error };
  }
}

// Convenience: sync version for non-async operations that still throw.
// Used by localStorage/sessionStorage reads where the call isn't awaited.
export function safeSync(fn, context = "unknown") {
  try {
    const data = fn();
    return { ok: true, data };
  } catch (error) {
    console.error(`[safeSync:${context}]`, error);
    return { ok: false, error };
  }
}