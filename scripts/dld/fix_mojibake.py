"""Repair text that was UTF-8, decoded as cp1252, and re-saved.

The damage is mechanical and therefore reversible: take each character back to
the cp1252 byte it came from, then decode those bytes as UTF-8 again. Some files
were run through the cycle twice, so it repeats until the text stops changing.

The one trap is that cp1252 leaves five byte values undefined — 0x81, 0x8D,
0x8F, 0x90 and 0x9D. A decoder that discards them cannot round-trip, and those
five are exactly the ones that appear inside emoji variation selectors (U+FE0F
is EF B8 8F). So this maps them to the matching C1 control character and back.

    python scripts/dld/fix_mojibake.py <file> [...]        report only
    python scripts/dld/fix_mojibake.py --apply <file> [...]  rewrite

Nothing is rewritten unless the repaired text re-encodes to valid UTF-8 and the
file still parses, so a partial or wrong guess cannot land silently.
"""
import io, re, sys, subprocess, os

APPLY = "--apply" in sys.argv
_args = [a for a in sys.argv[1:] if not a.startswith("--")]

# Accept directories as well as files. Shell globbing splits on whitespace, and
# this repo has a source file with a space in its name, so walking here rather
# than relying on the caller's expansion is the difference between scanning
# everything and silently skipping a file.
FILES = []
for _a in _args:
    if os.path.isdir(_a):
        for _root, _dirs, _names in os.walk(_a):
            _dirs[:] = [d for d in _dirs if d != "node_modules"]
            FILES += [os.path.join(_root, n) for n in _names
                      if n.endswith((".js", ".jsx", ".ts", ".tsx", ".md", ".json"))
                      and not n.endswith(".bak")]
    else:
        FILES.append(_a)

# The five cp1252 holes, mapped to the C1 controls at the same code points.
UNDEFINED = {0x81: "", 0x8d: "", 0x8f: "",
             0x90: "", 0x9d: ""}
REVERSE = {v: k for k, v in UNDEFINED.items()}


def to_cp1252_bytes(s):
    """The bytes this string would have been, before the bad decode."""
    out = bytearray()
    for ch in s:
        if ch in REVERSE:
            out.append(REVERSE[ch])
        else:
            try:
                out.extend(ch.encode("cp1252"))
            except UnicodeEncodeError:
                return None          # not from cp1252 — leave it alone
    return bytes(out)


def repair(s, rounds=3):
    """Undo the cycle, repeating for double-encoded text. Idempotent."""
    cur = s
    for _ in range(rounds):
        raw = to_cp1252_bytes(cur)
        if raw is None:
            break
        try:
            nxt = raw.decode("utf-8")
        except UnicodeDecodeError:
            break
        if nxt == cur:
            break
        cur = nxt
    return cur


# Characters that only appear together when text has been mangled.
#
# The obvious set — U+0080 to U+00FF — is NOT enough, and getting this wrong
# silently skips real damage. cp1252 maps its 0x80–0x9F range to characters
# scattered well outside Latin-1: 0x9A is š (U+0161), 0x8A is Š (U+0160), 0x80
# is € (U+20AC). A run like â š ¡ — which is ⚡ mangled — contains a U+0161 and
# so never matched. Build the set from the codec itself rather than by hand.
_chars = set(UNDEFINED.values())
for _b in range(0x80, 0x100):
    _chars.add(chr(_b))                        # byte read as Latin-1
    try:
        _chars.add(bytes([_b]).decode("cp1252"))   # byte read as cp1252
    except UnicodeDecodeError:
        pass                                   # one of the five holes
SUSPECT = "".join(sorted(_chars))
RUN = re.compile("[" + re.escape(SUSPECT) + "]{2,}")


def parses(path):
    if not path.endswith((".js", ".jsx")):
        return True
    r = subprocess.run(["npx", "--no-install", "esbuild", "--loader:.jsx=jsx",
                        "--log-level=error", "--outfile=" + os.devnull, path],
                       capture_output=True, shell=True)
    return r.returncode == 0


total = 0
for path in FILES:
    src = io.open(path, encoding="utf-8").read()
    changes = {}
    unresolved = []

    def sub(m):
        run = m.group()
        fixed = repair(run)
        # Refuse anything that decodes to nothing, or to control characters —
        # that means the guess was wrong, and a wrong repair is worse than none.
        if fixed == run or not fixed.strip():
            return run
        if any(ord(c) < 0x20 and c not in "\t" for c in fixed):
            return run
        # A correct repair lands on real text or a real symbol. If the result
        # still contains characters from the cp1252 high range, the guess was
        # wrong and the run needs a human — "Saving?" decoding to "s-not-a-word"
        # is not a fix, it is a different kind of broken.
        if any(0x80 <= ord(c) <= 0xBF or c in UNDEFINED.values() for c in fixed):
            unresolved.append((run, fixed))
            return run
        changes[run] = fixed
        return fixed

    out = RUN.sub(sub, src)
    if not changes:
        print("  %-44s clean" % path)
        continue

    n = sum(src.count(k) for k in changes)
    total += n
    print("  %-44s %d sequences, %d distinct" % (path, n, len(changes)))
    for bad, good in sorted(changes.items())[:12]:
        print("       %-24s -> %s" % (bad.encode("unicode_escape").decode()[:24],
                                      good.encode("unicode_escape").decode()[:24]))

    if unresolved:
        print("       %d run(s) left alone — repair produced more mojibake:" % len(unresolved))
        for bad, got in unresolved[:6]:
            print("         %-22s would give %s" % (bad.encode("unicode_escape").decode()[:22],
                                                    got.encode("unicode_escape").decode()[:22]))

    if APPLY:
        backup = src
        io.open(path, "w", encoding="utf-8", newline="").write(out)
        if parses(path):
            print("       written")
        else:
            io.open(path, "w", encoding="utf-8", newline="").write(backup)
            print("       REVERTED — the repair broke the parse")

print("\n%s: %d sequences" % ("REPAIRED" if APPLY else "WOULD REPAIR", total))
if not APPLY:
    print("re-run with --apply to write")
