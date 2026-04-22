# DXB Analytics · Phase 0 Integration Guide

## What's in this package

```
phase-0/
├── data/projects/
│   ├── emaar-golf-grand.js              ✓ Corrected, audit-clean
│   ├── emaar-the-golf-residence.js      ⚠ Migrated from data.js, needs research
│   ├── emaar-hills-park.js              ⚠ Migrated from data.js, needs research
│   └── index.js                         ✓ Barrel with helpers
├── utils/
│   └── auditProject.js                  ✓ 11 validation rules
├── scripts/
│   └── audit-projects.js                ✓ CI-runnable gate
└── docs/
    ├── ROADMAP.md                       ✓ Full strategy document
    └── ROADMAP.html                     ✓ Visual version
```

**Verified working:** `node scripts/audit-projects.js` runs against the 3 projects and produces zero errors, zero warnings (Golf Grand fully clean; the other two flagged as info-level "needs research" which is correct).

---

## Integration Steps

### Step 1 — Copy files into your repo

```powershell
cd C:\Users\TAD\emaar-dashboard

# Create target folders (some may already exist)
New-Item -ItemType Directory -Force src\data\projects, src\utils, scripts, docs | Out-Null

# Move files from your Downloads (after extracting phase-0.zip there)
Move-Item "$HOME\Downloads\phase-0\data\projects\*" ".\src\data\projects\" -Force
Move-Item "$HOME\Downloads\phase-0\utils\auditProject.js" ".\src\utils\auditProject.js" -Force
Move-Item "$HOME\Downloads\phase-0\scripts\audit-projects.js" ".\scripts\audit-projects.js" -Force
Move-Item "$HOME\Downloads\phase-0\docs\*" ".\docs\" -Force
```

### Step 2 — Fix Golf Grand in data.js

Open `src/data.js` and **delete** the entry at line ~21 that starts with `{ id:3, name:"Golf Grand", ...`.

Then at the top of `data.js`, add this re-export so existing imports still work:

```javascript
// Re-export from new canonical catalog
export { allProjects as emaarProjects } from "./data/projects/index.js";
```

**⚠️ Before you do this:** grep your codebase for other consumers of `emaarProjects`:

```powershell
Select-String -Path src\*.jsx,src\**\*.jsx -Pattern "emaarProjects" -List
```

If nothing crashes, the re-export keeps everything working.

### Step 3 — Add npm script

In `package.json`, add to the `"scripts"` block:

```json
"scripts": {
  "audit:projects": "node scripts/audit-projects.js",
  "audit:projects:verbose": "node scripts/audit-projects.js --verbose",
  "audit:projects:ci": "node scripts/audit-projects.js --ci"
}
```

Test it:

```powershell
npm run audit:projects
```

Expected output: 1 clean project (Golf Grand), 2 info-level flagged (needs research).

### Step 4 — Wire into your pre-commit hook

Your existing pre-commit check (the "DXB Analytics — Pre-Commit Safety Check" in your PowerShell) should have `npm run audit:projects:ci` added before the commit is allowed.

Find whichever script/hook runs your existing check and add:

```bash
npm run audit:projects:ci || exit 1
```

### Step 5 — Commit

```powershell
git add src/data/projects/ src/utils/auditProject.js scripts/audit-projects.js docs/ package.json src/data.js
git commit -m "Phase 0: single source of truth for projects + audit gate"
git push
```

Your Cloudflare deploy will pick it up automatically.

---

## Verifying It Works

After deploy, three things should be true:

1. **Golf Grand displays corrected data** in your dashboard
2. **`npm run audit:projects`** runs and reports 1 clean / 2 needs-research
3. **Pre-commit blocks** if you introduce a project with an invalid RERA or similar error

Try this to confirm the gate works:

```powershell
# Create a test broken project
@"
export default {
  id: "test-bad",
  project: "Bad Project",
  developer: "X",
  community: "Y",
  type: "Apartment",
  reraNo: "12345678901",    // invalid — too many digits
  priceMin: 2500000,
  goldenVisa: false,        // wrong, should be true at this price
};
"@ | Set-Content src\data\projects\test-bad.js

npm run audit:projects:ci
# → should fail with 2 errors
```

Then delete that file — you just proved the gate works.

---

## What's Next

After Phase 0 is deployed and stable, move to **Phase 1: Extract the Dashboard Shell**.

The full plan is in `docs/ROADMAP.html` — open it in a browser for the visual version, or read `docs/ROADMAP.md` for the text version.

**Don't skip Phase 0 verification.** The gate needs to be catching errors in your pre-commit flow before you start Phase 1 migrations, because Phase 1 will touch a lot of files and you want safety rails.

---

## Questions

- **Why individual files per project instead of one array?** At 1000s of projects, git diffs, blame, and merge conflicts become impossible with a single massive array. Individual files = one project touched = one clean PR.

- **Why `_audit` metadata?** Provenance. When a field is wrong in 6 months, `_audit.sources` tells you where it came from; `_audit.lastVerified` tells you when to re-check.

- **Why keep the legacy `emaarProjects` alias?** Safety. Existing code imports `emaarProjects` from `./data`. The alias means Phase 0 ships without breaking anything. Once Phase 1 migrates all consumers to `allProjects` / `useProjects()`, the alias can be removed.

- **Why not use TypeScript?** Your codebase is JS. Adding TS to only Phase 0 would create a split-language problem. Keep it consistent with the rest of the codebase. The `_audit` schema acts as informal typing.
