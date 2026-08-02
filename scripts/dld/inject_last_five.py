"""Place <TabIntro> and <TabProvenance> in the five tabs the first injector skipped.

WHY THE FIRST INJECTOR COULD NOT DO THESE
─────────────────────────────────────────
It looked for the first `return (` after the component started. In three of
these files that lands inside a .map() callback that renders one row of a list —
the JSX there carries a `key=` prop. Injecting at that point puts a tab intro
inside every row. That is how it broke three tabs on the first attempt.

The five split into two shapes:

  Agency, Pipeline, Listings   content lives inside `return (<>` within an IIFE.
                               Insert after that, close before the matching </>.

  Flip                         a plain <div> wrapper. Insert inside it.

  Launch Calendar              a horizontal flex row with a fixed height. An
                               intro inserted as a child would become a second
                               column, so the whole thing is wrapped in a
                               fragment instead.

Each file is written, re-parsed, and REVERTED if the parse fails.

    python scripts/dld/inject_last_five.py [--apply]
"""
import io, os, re, sys, subprocess

APPLY = "--apply" in sys.argv
TABS = "src/tabs"

INTRO = ("{_copy && <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail} "
         "includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning}/>}")
PROV = "{_copy?.provenance && <TabProvenance {..._copy.provenance}/>}"


def parses(path):
    r = subprocess.run(["npx", "--no-install", "esbuild", "--loader:.jsx=jsx",
                        "--log-level=error", "--outfile=" + os.devnull, path],
                       capture_output=True, shell=True)
    return r.returncode == 0, r.stderr.decode()[:300]


def fragment_style(src, anchor):
    """Agency / Pipeline / Listings: content sits in `return (<>` ... `</>`."""
    i = src.find(anchor)
    if i < 0:
        return None, "anchor not found"
    ins = i + len(anchor)
    out = src[:ins] + "\n\n            " + INTRO + "\n" + src[ins:]

    # the matching close is the last `</>` before the component's final brace
    j = out.rfind("</>")
    if j < 0:
        return None, "no closing fragment"
    return out[:j] + PROV + "\n            " + out[j:], None


def apply_to(name, fn):
    path = os.path.join(TABS, name + ".jsx")
    src = io.open(path, encoding="utf-8").read()
    if "<TabIntro" in src:
        return name, "already has the JSX"
    new, err = fn(src)
    if err:
        return name, "SKIPPED - " + err
    if not APPLY:
        return name, "would inject"
    io.open(path, "w", encoding="utf-8", newline="").write(new)
    ok, msg = parses(path)
    if ok:
        return name, "injected"
    io.open(path, "w", encoding="utf-8", newline="").write(src)
    return name, "REVERTED - " + msg.replace("\n", " ")[:120]


def flip(src):
    a = '<div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>'
    i = src.find(a)
    if i < 0:
        return None, "wrapper div not found"
    ins = i + len(a)
    out = src[:ins] + "\n      " + INTRO + "\n" + src[ins:]
    # close before the component's final </div>
    j = out.rfind("</div>")
    return out[:j] + PROV + "\n      " + out[j:], None


def launch(src):
    a = ('  return (\n'
         '    <div style={{display:"flex",gap:16,height:"calc(100vh - 140px)",paddingBottom:20}}>')
    if a not in src:
        return None, "flex root not found"
    b = ('  return (\n'
         '    <>\n'
         '      ' + INTRO + '\n'
         '    <div style={{display:"flex",gap:16,height:"calc(100vh - 140px)",paddingBottom:20}}>')
    out = src.replace(a, b, 1)

    tail = "    </div>\n  );\n}"
    if not out.rstrip().endswith(tail.rstrip()):
        return None, "unexpected tail"
    return out.rstrip()[: -len(tail.rstrip())] + \
        "    </div>\n      " + PROV + "\n    </>\n  );\n}\n", None


JOBS = [
    ("AgencyTab",         lambda s: fragment_style(s, "return (<>")),
    ("PipelineTab",       lambda s: fragment_style(s, "return (<>")),
    ("ListingsTab",       lambda s: fragment_style(s, "return (<>")),
    ("FlipTab",           flip),
    ("LaunchCalendarTab", launch),
]

print("APPLIED\n" if APPLY else "DRY RUN - pass --apply\n")
for name, fn in JOBS:
    n, msg = apply_to(name, fn)
    print("  %-20s %s" % (n, msg))
