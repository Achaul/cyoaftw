# update-cachebuster.ps1

$FilePath = "C:\Git\CYOAFTW\cyoaftw-engine-CORE.html"

# Get source directory
$SourceDirectory = Split-Path -Parent $FilePath

# JavaScript file in same directory
$JsFilePath = Join-Path $SourceDirectory "cyoaftw-context-builder.js"

# Publish file one directory above source directory
$PublishDirectory = Split-Path -Parent $SourceDirectory
$PublishFilePath = Join-Path $PublishDirectory "Publish.HTML"


# ------------------------------------------------------------
# UPDATE CACHE BUSTER
# ------------------------------------------------------------

# UTC timestamp with seconds
$UtcStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")

Write-Host "Using UTC cache version: $UtcStamp"

# Read HTML file
$content = [System.IO.File]::ReadAllText($FilePath)

# Replace placeholder OR existing timestamp
$content = $content -replace '\?\{\{UTC\}\}\}\}', "?$UtcStamp"
$content = $content -replace '\?\d+', "?$UtcStamp"

# UTF8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Write updated CORE HTML
[System.IO.File]::WriteAllText(
    $FilePath,
    $content,
    $utf8NoBom
)

Write-Host "Updated cache-buster timestamps successfully."


# ------------------------------------------------------------
# CREATE PUBLISH.HTML
# ------------------------------------------------------------

# Read updated HTML
$htmlContent = [System.IO.File]::ReadAllText($FilePath)

# Read JavaScript
$jsContent = [System.IO.File]::ReadAllText($JsFilePath)

# Combine:
# CORE HTML
# <script>
# JS content
# </script>

$publishContent = @"
$htmlContent
<script>
$jsContent
</script>
"@

# Create/overwrite Publish.HTML
[System.IO.File]::WriteAllText(
    $PublishFilePath,
    $publishContent,
    $utf8NoBom
)

Write-Host "Created publish file successfully:"
Write-Host $PublishFilePath