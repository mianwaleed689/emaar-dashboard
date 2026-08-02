"""Restore the glyphs in EmaarDashboardV2.jsx that lost their leading bytes.

WHY THESE NEED A HUMAN AND fix_mojibake.py CANNOT HELP
──────────────────────────────────────────────────────
Ordinary mojibake is reversible: map each character back to the cp1252 byte it
came from and decode as UTF-8. These are different. An emoji is four bytes —
F0 9F xx xx — and in these the leading F0 9F is gone. What survives is the tail,
which renders as the pair "—”". Two bytes cannot be decoded back into four, so
the original character is genuinely unrecoverable and any round-trip attempt
either fails or invents something.

fix_mojibake.py leaves them alone by design, which is correct: a wrong repair is
worse than a visible gap.

So each replacement below is read off the label sitting beside it in the source,
which is intact. `{ key: "Yields", icon: X, label: "Yields" }` gets a chart.
A `<button onClick={() => setShowAlerts(false)}>` gets a close cross.

Scope: 358 more of these sit inside `/* ── SECTION ── */` comment rules, where
they are cosmetic and invisible to users. Those are left alone. This file fixes
only what renders.

    python scripts/dld/fix_lost_glyphs.py [--apply]
"""
import io, re, sys, subprocess, os

APPLY = "--apply" in sys.argv
PATH = "src/pages/EmaarDashboardV2.jsx"
BAD = "—”"          # the surviving tail of a four-byte emoji

# line -> (replacement, why). Read off the adjacent label in every case.
FIX = {
    632:  ("✕", "close button"),
    1240: ("›", "chevron on a clickable card"),
    1258: ("ℹ", "info marker beside a source note"),
    1268: ("•", "bullet before a list item"),
    1821: ("✓", "upgrade modal: '7-day money-back'"),
    1863: ("●", "data badge: 'Live · Firestore'"),
    1864: ("✨", "data badge: 'AI Estimate'"),
    1918: ("↗", "outbound source link"),
    2067: ("\U0001F3E2", "Competitors tab icon — office building"),
    3330: ("✓", "notify: 'Added ... to comparison'"),
    4293: ("✓", "notify: 'Added to portfolio!'"),
    4416: ("✓", "notify: tier changed"),
    4438: ("✗", "notify: 'Failed to update tier'"),
    4593: ("›", "sidebar disclosure chevron"),
    4994: ("▸", "'CURRENT STAGE' marker"),
    5729: ("⚖", "heading: 'Project Comparison' — scales"),
    5790: ("·", "separator between project name and domain"),
    5827: ("⏳", "handover countdown, not yet passed"),
    6091: ("\U0001F4CA", "mobile nav: Overview"),
    6092: ("\U0001F3D7", "mobile nav: Projects"),
    6093: ("\U0001F4C8", "mobile nav: Yields"),
    6094: ("\U0001F4BC", "mobile nav: Portfolio"),
    6095: ("\U0001F30D", "mobile nav: Market"),
    6106: ("›", "chevron"),
    6121: ("\U0001F6E1", "profile badge: 'Admin'"),
    6190: ("⭐", "'Latest' marker on the newest KPI"),
    6207: ("↗", "'View Source' outbound link"),
    6223: ("✕", "close the notifications panel"),
    6236: ("✕", "remove an alert"),
    6253: ("\U0001F514", "default notification icon — bell"),
}

lines = io.open(PATH, encoding="utf-8").read().split("\n")
done, missed = [], []

for ln, (repl, why) in sorted(FIX.items()):
    i = ln - 1
    if i >= len(lines) or BAD not in lines[i]:
        missed.append((ln, why))
        continue
    lines[i] = lines[i].replace(BAD, repl, 1)
    done.append((ln, why))

# 6303 holds two in one expression: price went up, or price went down.
i = 6303 - 1
if i < len(lines) and lines[i].count(BAD) == 2:
    lines[i] = lines[i].replace(BAD, "↑", 1).replace(BAD, "↓", 1)
    done.append((6303, "watchlist: price up / price down arrows"))

for ln, why in done:
    print("  %-6d %s" % (ln, why))
for ln, why in missed:
    print("  MISS %-4d %s" % (ln, why))

rendered_left = sum(
    l.count(BAD) for l in lines
    if BAD in l and not l.strip().startswith(("/*", "*", "//", "{/*")))
print("\n%d replaced, %d missed, %d still rendering" % (len(done), len(missed), rendered_left))

if APPLY:
    backup = io.open(PATH, encoding="utf-8").read()
    io.open(PATH, "w", encoding="utf-8", newline="").write("\n".join(lines))
    r = subprocess.run(["npx", "--no-install", "esbuild", "--loader:.jsx=jsx",
                        "--log-level=error", "--outfile=" + os.devnull, PATH],
                       capture_output=True, shell=True)
    if r.returncode == 0:
        print("written")
    else:
        io.open(PATH, "w", encoding="utf-8", newline="").write(backup)
        print("REVERTED — the edit broke the parse")
else:
    print("re-run with --apply to write")
