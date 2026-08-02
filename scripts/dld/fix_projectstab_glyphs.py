"""Restore the lost glyphs in ProjectsTab.jsx.

WHY THIS IS BY HAND AND NOT fix_mojibake.py
───────────────────────────────────────────
The corruption in this file is lossy, not just a bad decode. Elsewhere in the
app a mangled run maps cleanly back to its original bytes; here the bytes are
shifted. The clipboard emoji arrives as F0 9F 82 93, which is a valid UTF-8
sequence for a playing card, so an automatic repair "succeeds" and writes a
playing card into a WhatsApp message. Running the generic tool over this file
would produce subscript digits and playing cards throughout.

Git offers no way out either — all twelve revisions of this file carry the same
twelve damaged lines, so the corruption predates the history.

So each glyph below is chosen from the label sitting next to it in the source,
which is intact and unambiguous: the line reading `Developer: ${...}` gets an
office building, the line reading `PRICING` gets a money bag. Where the original
character genuinely cannot be known, the choice is noted as such.

This matters more than decoration. Lines 2433-2453 are the WhatsApp and email
templates an agent sends to a client, so the garbage is delivered outside the
product, over the agent's own name.

    python scripts/dld/fix_projectstab_glyphs.py [--apply]
"""
import io, re, sys, subprocess, os

APPLY = "--apply" in sys.argv
PATH = "src/tabs/ProjectsTab.jsx"

RULE = "─" * 34          # box-drawing horizontal, the app's usual divider

# line -> (what the damaged run looks like, replacement, why)
FIXES = [
    (133,  "comment divider",          RULE,               "code comment rule"),
    (135,  "comment divider",          RULE,               "code comment rule"),
    (941,  "metro distance badge",     "≤",           "'<=800m' — the guard above it is p.distMetro <= 0.8"),
    (1457, "small square button",      "✕",           "close button, 14px, centred, no padding"),
    (1545, "teal bold marker",         "✓",           "tick, next to 'DLD-Verified:'"),
    (1709, "gold badge",               "⭐",           "star, next to 'Golden Visa Eligible'"),
    (1710, "purple badge",             "\U0001F451",       "crown, next to brandPartner (branded residence)"),
    (2433, "report header",            "\U0001F4CA",       "chart, 'DXB ANALYTICS - PROPERTY DATA REPORT'"),
    (2434, "divider",                  RULE,               "rule under the header"),
    (2435, "project name line",        "\U0001F4CB",       "clipboard, the project name"),
    (2437, "community line",           "\U0001F4CD",       "pin, 'Community:'"),
    (2440, "pricing header",           "\U0001F4B0",       "money bag, 'PRICING'"),
    (2443, "unit breakdown header",    "\U0001F4D0",       "ruler, 'UNIT BREAKDOWN'"),
    (2445, "rental data header",       "\U0001F4C8",       "chart, 'RENTAL DATA'"),
    (2450, "rera line",                "\U0001F3DB",       "classical building, 'RERA:' — the regulator"),
    (2452, "report link line",         "\U0001F517",       "link, 'Full report:'"),
    (2453, "divider",                  RULE,               "closing rule"),
    (2464, "whatsapp button",          "\U0001F4F1",       "phone, 'WhatsApp'"),
    (2465, "email button",             "✉️",     "envelope, 'Email'"),
]

# Characters that only occur in mangled text — same construction as fix_mojibake.
UNDEF = "\x81\x8d\x8f\x90\x9d"
chars = set(UNDEF)
for b in range(0x80, 0x100):
    chars.add(chr(b))
    try:
        chars.add(bytes([b]).decode("cp1252"))
    except UnicodeDecodeError:
        pass
# The em dash and middle dot are used correctly all over this file; excluding
# them stops a legitimate "Handover — TBC" from being eaten as damage.
chars -= set("—·–→≤≥")
RUN = re.compile("[" + re.escape("".join(sorted(chars))) + "]{2,}")

lines = io.open(PATH, encoding="utf-8").read().split("\n")
done, missed = [], []

# Two runs are built from characters the general pattern deliberately excludes,
# because an em dash is legitimate everywhere else in this file. They are matched
# explicitly rather than by loosening the rule for the whole file.
SPECIAL = re.compile(r'(?:â—)+|’—')

for ln, what, repl, why in FIXES:
    i = ln - 1
    m = RUN.search(lines[i]) or SPECIAL.search(lines[i])
    if not m:
        missed.append((ln, what, "no damaged run on this line"))
        continue
    lines[i] = lines[i][:m.start()] + repl + lines[i][m.end():]
    done.append((ln, why))

for ln, why in done:
    print("  %-6d %s" % (ln, why))
for ln, what, why in missed:
    print("  MISS %-4d %s - %s" % (ln, what, why))

left = sum(1 for l in lines if RUN.search(l))
print("\n%d replaced, %d missed, %d lines still carrying a damaged run"
      % (len(done), len(missed), left))

if APPLY:
    backup = "\n".join(io.open(PATH, encoding="utf-8").read().split("\n"))
    io.open(PATH, "w", encoding="utf-8", newline="").write("\n".join(lines))
    r = subprocess.run(["npx", "--no-install", "esbuild", "--loader:.jsx=jsx",
                        "--log-level=error", "--outfile=" + os.devnull, PATH],
                       capture_output=True, shell=True)
    if r.returncode == 0:
        print("written")
    else:
        io.open(PATH, "w", encoding="utf-8", newline="").write(backup)
        print("REVERTED - the edit broke the parse")
else:
    print("re-run with --apply to write")
