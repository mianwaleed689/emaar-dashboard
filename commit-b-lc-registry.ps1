$path = "C:\Users\TAD\emaar-dashboard\src\tabs\LaunchCalendarTab.jsx"
$backup = $path + ".bak-wire-registry"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Replace both the inline LC_DEV_ONTIME AND the old lookupDevOnTime helper
# with a registry-first lookup

$oldBlock = '    // Developer on-time research-backed lookup (inline - mirror of HandoverTab DEVELOPER_INDEX)' + "`n" + '    const LC_DEV_ONTIME = {' + "`n" + '      "sobha realty": 91, "emaar": 88, "ellington properties": 88, "majid al futtaim": 87,' + "`n" + '      "omniyat": 85, "mira developments": 82, "nakheel": 80, "london gate": 78,' + "`n" + '      "dubai investments real estate": 75, "binghatti": 74, "damac properties": 71,' + "`n" + '      "object 1 development": 70, "bigfoot developers": 68,' + "`n" + '    };' + "`n" + '    const lookupDevOnTime = (devName) => {' + "`n" + '      if (!devName) return null;' + "`n" + '      const needle = String(devName).toLowerCase().trim();' + "`n" + '      for (const k of Object.keys(LC_DEV_ONTIME)) {' + "`n" + '        if (k === needle || needle.includes(k) || k.includes(needle)) return LC_DEV_ONTIME[k];' + "`n" + '      }' + "`n" + '      return null; // honest: unknown = null, not fake 85' + "`n" + '    };'

$c = ([regex]::Matches($content, [regex]::Escape($oldBlock))).Count
Write-Host "Anchor matches: $c"
if ($c -ne 1) { Write-Host "Anchor not unique" -ForegroundColor Red; exit 1 }

$newBlock = '    // Developer on-time lookup - uses REAL 30+ developer registry from props' + "`n" + '    // Scales automatically: add developer to ALL_DUBAI_DEVELOPERS and it appears here' + "`n" + '    // Fallback: hardcoded 13 entries for backwards compat if registry unavailable' + "`n" + '    const LC_DEV_ONTIME_FALLBACK = {' + "`n" + '      "sobha realty": 91, "emaar": 88, "ellington properties": 88, "majid al futtaim": 87,' + "`n" + '      "omniyat": 85, "mira developments": 82, "nakheel": 80, "london gate": 78,' + "`n" + '      "dubai investments real estate": 75, "binghatti": 74, "damac properties": 71,' + "`n" + '      "object 1 development": 70, "bigfoot developers": 68,' + "`n" + '    };' + "`n" + '    const lookupDevOnTime = (devName) => {' + "`n" + '      if (!devName) return null;' + "`n" + '      const needle = String(devName).toLowerCase().trim();' + "`n" + '      // Primary: look up in allDevelopers prop (30+ entries from registry)' + "`n" + '      if (Array.isArray(allDevelopers) && allDevelopers.length > 0) {' + "`n" + '        const dev = allDevelopers.find(d => {' + "`n" + '          const dn = String(d.name || "").toLowerCase();' + "`n" + '          const di = String(d.id || "").toLowerCase();' + "`n" + '          return dn === needle || di === needle ||' + "`n" + '                 (dn && (needle.includes(dn) || dn.includes(needle))) ||' + "`n" + '                 (di && (needle.includes(di) || di.includes(needle)));' + "`n" + '        });' + "`n" + '        if (dev && typeof dev.deliveryRecord === "number") return dev.deliveryRecord;' + "`n" + '        if (dev && typeof dev.onTime === "number") return dev.onTime;' + "`n" + '      }' + "`n" + '      // Fallback: inline map for rare cases where registry empty' + "`n" + '      for (const k of Object.keys(LC_DEV_ONTIME_FALLBACK)) {' + "`n" + '        if (k === needle || needle.includes(k) || k.includes(needle)) return LC_DEV_ONTIME_FALLBACK[k];' + "`n" + '      }' + "`n" + '      return null; // honest: unknown -> null, UI hides field' + "`n" + '    };'

$content = $content.Replace($oldBlock, $newBlock)

$hasRegistryLookup = $content.Contains('allDevelopers prop (30+ entries')
$hasDeliveryRecord = $content.Contains('dev.deliveryRecord')
$hasFallbackMap = $content.Contains('LC_DEV_ONTIME_FALLBACK')
$oldMapGone = -not $content.Contains('const LC_DEV_ONTIME = {')

Write-Host ""
Write-Host "Verification:"
Write-Host "  Registry-first lookup: $hasRegistryLookup"
Write-Host "  deliveryRecord field used: $hasDeliveryRecord"
Write-Host "  Fallback map renamed: $hasFallbackMap"
Write-Host "  Old LC_DEV_ONTIME removed: $oldMapGone"

if (-not ($hasRegistryLookup -and $hasDeliveryRecord -and $hasFallbackMap -and $oldMapGone)) {
  Write-Host "Verification failed - reverting" -ForegroundColor Red
  Copy-Item $backup $path -Force
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "COMMIT B: LaunchCalendarTab uses allDevelopers registry" -ForegroundColor Green