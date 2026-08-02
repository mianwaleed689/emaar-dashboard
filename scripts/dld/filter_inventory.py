"""Filter inventory — every <select> in the app, what it offers, and whether
anything actually filters rows on it.

Static analysis only. No Firestore reads, no quota spent.

Verdict per bound variable, strongest signal first:
  FILTERS-ROWS  appears on a line with .filter( / .some( / `return false`
                -> it really narrows a dataset
  COMPARED      compared against a property, but only in a .find()/label/chip
                position -> usually display lookup, NOT filtering. Confirm.
  RENDER-ONLY   appears only in state, JSX, chips and active-counts.
                The user can change it and nothing downstream moves.

RENDER-ONLY is the finding that matters. Every verdict is a lead to confirm by
reading the file: this is a regex over JSX, not a parser.
"""
import re, json, sys, os
from collections import defaultdict

ROOT = r"C:\Users\TAD\emaar-dashboard\src"

files = []
for dirpath, _, names in os.walk(ROOT):
    if "node_modules" in dirpath:
        continue
    for n in names:
        if n.endswith((".jsx", ".js")):
            files.append(os.path.join(dirpath, n))

src = {}
for f in files:
    with open(f, "r", encoding="utf-8", errors="replace") as fh:
        src[f] = fh.read()

def rel(p):
    return os.path.relpath(p, os.path.dirname(ROOT)).replace("\\", "/")

def brace_match(s, i):
    """Given s[i] == '{', return index just past the matching '}'."""
    depth, j = 0, i
    while j < len(s):
        if s[j] == "{": depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0: return j + 1
        j += 1
    return -1

OPTLIT = re.compile(r'<option\s+value=(?:"([^"]*)"|\{([^}]*)\})[^>]*>([^<]*)</option>')
MAPPED = re.compile(r"\{\s*([A-Za-z_$][\w$.]*)\s*\??\.map\s*\(")

# ── 1. every <select>, its bound variable, its options ───────────────────────
selects = []
for f, s in src.items():
    for m in re.finditer(r"<select\b", s):
        start = m.start()
        end = s.find("</select>", start)
        if end == -1:
            continue
        block = s[start:end]
        # attributes only: up to the first '>' that closes the opening tag
        head_end = block.find(">")
        head = block[:head_end] if head_end != -1 else block

        var = None
        vm = re.search(r"value=", head)
        if vm:
            k = head.find("{", vm.end() - 1)
            if k != -1 and k <= vm.end():
                j = brace_match(head, k)
                if j != -1:
                    var = head[k + 1:j - 1].strip()
            else:
                lm = re.match(r'value="([^"]*)"', head[vm.start():])
                if lm: var = f'"{lm.group(1)}"'

        lits = [{"value": (a if a is not None else b), "label": (c or "").strip()}
                for a, b, c in OPTLIT.findall(block)]
        selects.append({
            "file": rel(f), "line": s[:start].count("\n") + 1,
            "boundTo": var,
            # identifiers AND dotted paths (filters.status) are both classifiable
            "boundToSimple": var if var and re.fullmatch(r"[A-Za-z_$][\w$.]*", var) else None,
            "literalOptions": lits,
            "mappedFrom": sorted(set(MAPPED.findall(block))),
            "optionCount": len(lits),
        })

# ── 2. classify each simple bound variable ───────────────────────────────────
RENDER   = ("<select", "<option", "onChange=", "value={", "placeholder=", "=> set")
# a reference that is only the variable's own declaration/destructure
DECL     = re.compile(r"useState\(|^\s*(const|let|var)\s|^\s*\w+\s*[,:]?\s*$|"
                      r"=\s*_gf\.|^\s*\w+\s*=\s*_gf\.")
STRONG   = (".filter(", ".some(", ".every(", "return false")
DISPLAY  = (".find(", "chips.push", "label:", "activeCount", "activeFilter")
PROPCMP  = re.compile(r"[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*")
CMP      = ("===", "!==", "==", "!=", ".includes(")

def classify(varname):
    if not varname:
        return "UNPARSED", []
    # `filters.status` / `f.beds` -> search the whole expression, not a bare word
    pat = (re.compile(r"\b" + re.escape(varname) + r"\b")
           if re.fullmatch(r"[A-Za-z_$][\w$]*", varname)
           else re.compile(re.escape(varname)))
    strong, compared, plain, render = [], [], [], []
    for f, s in src.items():
        for i, ln in enumerate(s.splitlines(), 1):
            if not pat.search(ln):
                continue
            t = ln.strip()
            e = {"file": rel(f), "line": i, "code": t[:160]}
            # A JSX render line can contain `e.target.value` and `!==` and look
            # like a predicate. It never is. Guard before anything else.
            if any(h in t for h in RENDER):
                render.append(e)
                continue
            if any(h in t for h in STRONG):
                strong.append(e)
            elif PROPCMP.search(t) and any(c in t for c in CMP):
                (compared if any(d in t for d in DISPLAY) else strong).append(e)
            else:
                plain.append(e)
    if strong:
        return "FILTERS-ROWS", strong[:5]
    if compared:
        return "COMPARED", compared[:5]
    # A variable can be consumed without any comparison: FLOOR_MULTIPLIER[floor],
    # calc(floor), floor * x. Only call it dead when every non-render reference
    # is its own declaration.
    live = [e for e in plain if not DECL.search(e["code"])]
    if live:
        return "CONSUMED-OTHER", live[:5]
    return ("RENDER-ONLY", (render + plain)[:6]) if (render or plain) else ("UNREFERENCED", [])

FORMISH = re.compile(r"form|drawer|settings|schedule|modalForm|\bnew[A-Z]", re.I)

def kind_of(var):
    """A <select> that edits a record is not a broken filter when it doesn't
    filter. Separate the two so the report stays honest."""
    if not var:
        return "unknown"
    if "filter" in var.lower():
        return "filter"
    return "form-input" if FORMISH.search(var) else "filter"

cache = {}
for s in selects:
    v = s["boundToSimple"]
    s["kind"] = kind_of(v)
    key = v or f"__x__{s['file']}:{s['line']}"
    if key not in cache:
        cache[key] = classify(v)
    s["verdict"], s["evidence"] = cache[key]

# ── 3. report ────────────────────────────────────────────────────────────────
by = defaultdict(list)
for s in selects:
    by[s["verdict"]].append(s)

out = {
    "generated": "2026-07-31",
    "method": "static regex analysis of JSX; no Firestore reads",
    "caveat": "Heuristic, not a parser. Every verdict is a lead to confirm by "
              "reading the file. RENDER-ONLY means no code was found that "
              "narrows a dataset using this control's value.",
    "totals": {
        "filesScanned": len(files),
        "selects": len(selects),
        "literalOptions": sum(s["optionCount"] for s in selects),
        "byVerdict": {k: len(v) for k, v in sorted(by.items())},
    },
    "selects": sorted(selects, key=lambda s: ({"RENDER-ONLY": 0, "COMPARED": 1,
                                               "UNPARSED": 2, "UNREFERENCED": 3,
                                               "FILTERS-ROWS": 4}.get(s["verdict"], 5),
                                              s["file"], s["line"])),
}
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print(f"scanned {len(files)} files -> {len(selects)} <select> controls, "
      f"{out['totals']['literalOptions']} literal options")
for k, v in sorted(by.items(), key=lambda kv: -len(kv[1])):
    print(f"  {k:14} {len(v):>4}")

print(f"\n  of which kind=filter: "
      f"{sum(1 for s in selects if s['kind'] == 'filter')}, "
      f"form-input: {sum(1 for s in selects if s['kind'] == 'form-input')}")

for verdict, blurb in (("RENDER-ONLY", "user can change it; no code narrows data on it"),
                       ("COMPARED", "only used in a .find()/label lookup — confirm")):
    rows = [s for s in by.get(verdict, []) if s["kind"] == "filter"]
    if not rows: continue
    print(f"\n=== {verdict} — FILTERS ONLY ({len(rows)}) — {blurb} ===")
    for s in rows:
        opts = ", ".join(o["value"] for o in s["literalOptions"][:4]) or \
               ("←" + ",".join(s["mappedFrom"][:2]) if s["mappedFrom"] else "?")
        print(f"  {s['file']}:{s['line']:<5} {str(s['boundToSimple'])[:24]:26}"
              f"{s['optionCount']:>3}opt [{opts[:44]}]")

un = by.get("UNPARSED", [])
if un:
    print(f"\n=== UNPARSED ({len(un)}) — binding expression not a plain path ===")
    for s in un[:14]:
        print(f"  {s['file']}:{s['line']:<5} value={{{str(s['boundTo'])[:58]}}}")
print(f"\n-> {sys.argv[1]}")
