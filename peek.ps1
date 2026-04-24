$p1 = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$content1 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p1))

# Find the button's inner JSX (between > and </button>)
$idx = $content1.IndexOf("transition: ""all 0.15s""")
if ($idx -gt 0) {
  Write-Host "=== Star button inner (after style closing) ===" -ForegroundColor Cyan
  # Skip past style closing, find the inner
  $afterStyle = $content1.IndexOf("}}", $idx) + 2
  $endBtn = $content1.IndexOf("</button>", $afterStyle)
  Write-Host $content1.Substring($afterStyle, $endBtn - $afterStyle + 10)
}

$p2 = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$content2 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p2))

Write-Host ""
Write-Host "=== Watchlist modal: price render ===" -ForegroundColor Cyan
# Find the modal price display
$idx = $content2.IndexOf("currentPrice")
if ($idx -gt 0) {
  Write-Host $content2.Substring($idx, 800)
}