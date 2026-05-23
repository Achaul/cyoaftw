# update-cachebuster.ps1

$FilePath = "C:\Git\CYOAFTW\cyoaftw-engine-CORE.html"

# UTC timestamp with seconds
$UtcStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")

Write-Host "Using UTC cache version: $UtcStamp"

# Read file
$content = [System.IO.File]::ReadAllText($FilePath)

# Replace placeholder OR existing timestamp
$content = $content -replace '\?\{\{UTC\}\}\}\}', "?v=$UtcStamp"
$content = $content -replace '\?v=\d+', "?v=$UtcStamp"

# Write UTF8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText(
    $FilePath,
    $content,
    $utf8NoBom
)

Write-Host "Updated cache-buster timestamps successfully."