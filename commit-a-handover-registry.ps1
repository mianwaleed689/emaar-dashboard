$path = "C:\Users\TAD\emaar-dashboard\src\tabs\HandoverTab.jsx"
$backup = $path + ".bak-wire-registry"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# STEP 1: Replace inline lookupDevOnTime helper with allDevelopers prop lookup
$oldHelper = '    // Helper: fuzzy developer name lookup (Emaar Properties -> Emaar in DEVELOPER_INDEX)' + "`n" + '    const lookupDevOnTime = (devName) => {' + "`n" + '      if (!devName) return null;' + "`n" + '      const needle = String(devName).toLowerCase().trim();' + "`n" + '      const keys = Object.keys(DEVELOPER_INDEX);' + "`n" + '      for (const k of keys) {' + "`n" + '        const kl = k.toLowerCase();' + "`n" + '        if (kl === needle || needle.includes(kl) || kl.includes(needle)) {' + "`n" + '          return DEVELOPER_INDEX[k].onTime;' + "`n" + '        }' + "`n" + '      }' + "`n" + '      return null; // honest: unknown developer returns null, not a fake default' + "`n" + '    };'

$newHelper = '    // Developer on-time lookup - uses REAL 30+ developer registry from props' + "`n" + '    // Scales automatically: add developer to ALL_DUBAI_DEVELOPERS and it appears here' + "`n" + '    // Fallback: inline DEVELOPER_INDEX (hardcoded 13 entries) for backwards compat' + "`n" + '    const lookupDevOnTime = (devName) => {' + "`n" + '      if (!devName) return null;' + "`n" + '      const needle = String(devName).toLowerCase().trim();' + "`n" + '      // Primary: look up in allDevelopers prop (30+ entries from Firestore/registry)' + "`n" + '      if (Array.isArray(allDevelopers) && allDevelopers.length > 0) {' + "`n" + '        const dev = allDevelopers.find(d => {' + "`n" + '          const dn = String(d.name || "").toLowerCase();' + "`n" + '          const di = String(d.id || "").toLowerCase();' + "`n" + '          return dn === needle || di === needle ||' + "`n" + '                 (dn && (needle.includes(dn) || dn.includes(needle))) ||' + "`n" + '                 (di && (needle.includes(di) || di.includes(needle)));' + "`n" + '        });' + "`n" + '        if (dev && typeof dev.deliveryRecord === "number") return dev.deliveryRecord;' + "`n" + '        if (dev && typeof dev.onTime === "number") return dev.onTime;' + "`n" + '      }' + "`n" + '      // Fallback: inline DEVELOPER_INDEX for rare cases where registry unavailable' + "`n" + '      const keys = Object.keys(DEVELOPER_INDEX);' + "`n" + '      for (const k of keys) {' + "`n" + '        const kl = k.toLowerCase();' + "`n" + '        if (kl === needle || needle.includes(kl) || kl.includes(needle)) {' + "`n" + '          return DEVELOPER_INDEX[k].onTime;' + "`n" + '        }' + "`n" + '      }' + "`n" + '      return null; // honest: unknown developer -> null, UI hides field' + "`n" + '    };'

$c = ([regex]::Matches($content, [regex]::Escape($oldHelper))).Count
Write-Host "Helper anchor matches: $c"
if ($c -ne 1) { Write-Host "Anchor not unique" -ForegroundColor Red; exit 1 }

$content = $content.Replace($oldHelper, $newHelper)

$hasRegistryLookup = $content.Contains('allDevelopers prop (30+ entries')
$hasDeliveryRecord = $content.Contains('dev.deliveryRecord')

Write-Host ""
Write-Host "Verification:"
Write-Host "  Registry-first lookup: $hasRegistryLookup"
Write-Host "  deliveryRecord field used: $hasDeliveryRecord"

if (-not ($hasRegistryLookup -and $hasDeliveryRecord)) {
  Write-Host "Verification failed - reverting" -ForegroundColor Red
  Copy-Item $backup $path -Force
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "COMMIT A: HandoverTab uses allDevelopers registry" -ForegroundColor Green