"""Wire <TabIntro> and <TabProvenance> into the tabs that failed the clarity check.

The check across all 29 shipped tabs on 2026-08-02 found the same two blocking
failures repeatedly:

    14 tabs   no plain-English explanation before the controls
     7 tabs   no source stated anywhere

Editing 14 files by hand guarantees they drift. This inserts the two shared
components mechanically, reading their copy from src/data/tabCopy.js.

It is conservative on purpose:
  · skips a file that already imports TabIntro (so re-running is safe)
  · skips a file with no entry in tabCopy.js
  · reports every file it did not touch and why, rather than guessing

    python scripts/dld/add_tab_intros.py [--apply]
"""
import re, sys, os, json

APPLY = "--apply" in sys.argv
ROOT = r"C:\Users\TAD\emaar-dashboard"
TABS_DIR = os.path.join(ROOT, "src", "tabs")

# tab name in tabCopy.js  ->  component file
TARGETS = {
    "Projects":      "ProjectsTab.jsx",
    "Map":           "CommunityMapTab.jsx",
    "Launch Calendar": "LaunchCalendarTab.jsx",
    "Handover":      "HandoverTab.jsx",
    "DXB Estimate":  "DXBEstimateTab.jsx",
    "Flip":          "FlipTab.jsx",
    "Golden Visa":   "GoldenVisaTab.jsx",
    "DLD Volumes":   "DLDVolumesTab.jsx",
    "Team":          "TeamTab.jsx",
    "Agency":        "AgencyTab.jsx",
    "Pipeline":      "PipelineTab.jsx",
    "Listings":      "ListingsTab.jsx",
    "Data Quality":  "DataQualityTab.jsx",
}

copy_src = open(os.path.join(ROOT, "src", "data", "tabCopy.js"), encoding="utf-8").read()
have_copy = set(re.findall(r'^\s*"([^"]+)":\s*\{', copy_src, re.M))

def rel(p): return os.path.relpath(p, ROOT).replace("\\", "/")

touched, skipped = [], []

for tab, fname in TARGETS.items():
    path = os.path.join(TABS_DIR, fname)
    if not os.path.exists(path):
        skipped.append((tab, fname, "file not found")); continue
    if tab not in have_copy:
        skipped.append((tab, fname, "no entry in tabCopy.js")); continue

    src = open(path, encoding="utf-8").read()
    if "TabIntro" in src:
        skipped.append((tab, fname, "already wired")); continue

    # 1. imports — placed after the last existing import
    imports = list(re.finditer(r'^import .+?;\s*$', src, re.M))
    if not imports:
        skipped.append((tab, fname, "no import block found")); continue
    ins = imports[-1].end()
    add = ('\nimport TabIntro from "../components/TabIntro";'
           '\nimport TabProvenance from "../components/TabProvenance";'
           '\nimport { tabCopy } from "../data/tabCopy";')
    new = src[:ins] + add + src[ins:]

    # 2. a const holding this tab's copy, right after the component signature
    sig = re.search(r'^(?:export default )?function\s+\w+\s*\([^)]*\)\s*\{', new, re.M | re.S)
    if not sig:
        skipped.append((tab, fname, "component signature not matched")); continue
    decl = f'\n  const _copy = tabCopy("{tab}");\n'
    new = new[:sig.end()] + decl + new[sig.end():]

    if APPLY:
        open(path, "w", encoding="utf-8", newline="").write(new)
    touched.append((tab, fname))

print(f"{'APPLIED' if APPLY else 'DRY RUN — pass --apply to write'}\n")
print(f"wired ({len(touched)}):")
for tab, f in touched:
    print(f"   {tab:18} {f}")
print(f"\nskipped ({len(skipped)}):")
for tab, f, why in skipped:
    print(f"   {tab:18} {f:26} {why}")
print("\nNOTE: this adds the imports and the `_copy` const only. The JSX for")
print("<TabIntro {..._copy} /> and <TabProvenance {..._copy.provenance} /> must be")
print("placed by hand — where a tab's header belongs differs per file, and a")
print("regex guessing at JSX is how you break a working screen.")
