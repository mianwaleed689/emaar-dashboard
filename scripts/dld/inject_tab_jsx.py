"""Place <TabIntro> and <TabProvenance> into the wired tabs.

add_tab_intros.py added the imports and a `_copy` const. This puts the JSX in.

It is deliberately cautious. A regex that guesses at JSX structure is how a
working screen gets broken, so this only acts where the shape is unambiguous:

  · finds the component's `return (` and the single root element that follows
  · inserts <TabIntro> immediately inside that root
  · inserts <TabProvenance> immediately before the root closes
  · writes the file, re-parses it, and REVERTS if the parse fails

Anything it cannot match confidently is reported and left alone for a human.

    python scripts/dld/inject_tab_jsx.py [--apply]
"""
import re, os, sys, subprocess, shutil, tempfile

APPLY = "--apply" in sys.argv
ROOT = r"C:\Users\TAD\emaar-dashboard"
TABS = os.path.join(ROOT, "src", "tabs")

FILES = ["ProjectsTab.jsx", "CommunityMapTab.jsx", "LaunchCalendarTab.jsx",
         "HandoverTab.jsx", "DXBEstimateTab.jsx", "FlipTab.jsx",
         "GoldenVisaTab.jsx", "DLDVolumesTab.jsx", "TeamTab.jsx",
         "AgencyTab.jsx", "PipelineTab.jsx", "ListingsTab.jsx",
         "DataQualityTab.jsx"]

INTRO = ('{_copy && <TabIntro title={_copy.title} what={_copy.what} '
         'detail={_copy.detail} includes={_copy.includes} excludes={_copy.excludes} '
         'warning={_copy.warning} />}')
PROV = '{_copy?.provenance && <TabProvenance {..._copy.provenance} />}'


def parses(path):
    r = subprocess.run(
        ["npx", "--no-install", "esbuild", "--loader:.jsx=jsx",
         "--log-level=error", "--outfile=" + os.devnull, path],
        capture_output=True, shell=True)
    return r.returncode == 0


def find_root_span(src):
    """Locate the top-level `return ( <X ...> ... </X> )` of the component."""
    m = re.search(r'\n  return \(\s*\n(\s*)<(\w+)', src)
    if not m:
        return None
    indent, tag = m.group(1), m.group(2)
    open_end = src.find(">", m.end())
    if open_end == -1:
        return None
    # self-closing root is not something we can nest into
    if src[open_end - 1] == "/":
        return None
    close = f"\n{indent}</{tag}>"
    close_at = src.find(close, open_end)
    if close_at == -1:
        return None
    return open_end + 1, close_at, indent


done, skipped = [], []
for f in FILES:
    path = os.path.join(TABS, f)
    src = open(path, encoding="utf-8").read()
    if "<TabIntro" in src:
        skipped.append((f, "already has the JSX")); continue
    if "_copy" not in src:
        skipped.append((f, "not wired — run add_tab_intros.py first")); continue

    span = find_root_span(src)
    if not span:
        skipped.append((f, "root element not matched — place by hand")); continue
    a, b, indent = span
    pad = indent + "  "
    new = (src[:a] + f"\n{pad}{INTRO}\n" + src[a:b] +
           f"\n{pad}{PROV}\n" + src[b:])

    if not APPLY:
        done.append((f, "would inject")); continue

    backup = src
    open(path, "w", encoding="utf-8", newline="").write(new)
    if parses(path):
        done.append((f, "injected"))
    else:
        open(path, "w", encoding="utf-8", newline="").write(backup)
        skipped.append((f, "REVERTED — injection broke the parse"))

print(f"{'APPLIED' if APPLY else 'DRY RUN — pass --apply'}\n")
print(f"injected ({len(done)}):")
for f, why in done:
    print(f"   {f:26} {why}")
print(f"\nleft alone ({len(skipped)}):")
for f, why in skipped:
    print(f"   {f:26} {why}")
