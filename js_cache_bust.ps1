# update-cachebuster.ps1

$FilePath = "C:\Git\CYOAFTW\cyoaftw-engine-CORE.html"

# UTC timestamp with seconds
$UtcStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")

Write-Host "Using UTC cache version: $UtcStamp"

# Read file as raw text
$content = [System.IO.File]::ReadAllText($FilePath)

# Replace placeholder
$content = $content -replace '\?\{\{UTC\}\}\}\}', "?v=$UtcStamp"

# Replace existing timestamps
$content = $content -replace '\?v=\d{14}', "?v=$UtcStamp"

# Write UTF-8 without BOM
[System.IO.File]::WriteAllText(
    $FilePath,
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "Updated cache-buster timestamps."