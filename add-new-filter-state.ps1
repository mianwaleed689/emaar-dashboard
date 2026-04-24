$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Anchor: after the last proj* state line, before the blank line
$old = '  const [projFurnished, setProjFurnished] = useState(false);'
$new = '  const [projFurnished, setProjFurnished] = useState(false);' + "`n" +
       '  // NEW FILTER SYSTEM - per finalized filter spec' + "`n" +
       '  const [projCategory, setProjCategory] = useState("All");    // Residential | Commercial | Industrial | Hospitality | Land | All' + "`n" +
       '  const [projBuildPct, setProjBuildPct] = useState("All");    // 0-25 | 26-50 | 51-75 | 76-99 | 100 | All' + "`n" +
       '  const [projEscrow, setProjEscrow] = useState("All");        // Emirates NBD | Mashreq | etc | All' + "`n" +
       '  const [showMoreFilters, setShowMoreFilters] = useState(false);'

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  [System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "New state variables added" -ForegroundColor Green
} else {
  Write-Host "Anchor not found" -ForegroundColor Red
}