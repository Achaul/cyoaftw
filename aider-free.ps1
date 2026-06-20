<#
.SYNOPSIS
    aider-free.ps1 - launch aider using the first available OpenRouter free-tier model.
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [object]$ModelIndex = 0,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$AiderArgs
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Normalize arguments
# Supports:
#   .\aider-free.ps1
#   .\aider-free.ps1 2
#   .\aider-free.ps1 --no-auto-commits
#   .\aider-free.ps1 2 --no-auto-commits
# ---------------------------------------------------------------------------

if ($ModelIndex -is [array]) {
    $AiderArgs = @($ModelIndex) + @($AiderArgs)
    $ModelIndex = 0
}

$parsedIndex = 0
if ([int]::TryParse([string]$ModelIndex, [ref]$parsedIndex)) {
    $ModelIndex = $parsedIndex
} else {
    $AiderArgs = @([string]$ModelIndex) + @($AiderArgs)
    $ModelIndex = 0
}

if ($ModelIndex -lt 0) {
    Write-Error "ModelIndex cannot be negative."
    exit 1
}

# Remove PowerShell's optional -- separator if present
if ($AiderArgs.Count -gt 0 -and $AiderArgs[0] -eq "--") {
    $AiderArgs = $AiderArgs[1..($AiderArgs.Count - 1)]
}

# ---------------------------------------------------------------------------
# Ensure user-local Python tools are available
# ---------------------------------------------------------------------------

$LocalBin = Join-Path $env:USERPROFILE ".local\bin"

if (Test-Path $LocalBin) {
    $pathParts = $env:PATH -split ";"
    if ($pathParts -notcontains $LocalBin) {
        $env:PATH = "$LocalBin;$env:PATH"
    }
}

$aiderCmd = Get-Command aider -ErrorAction SilentlyContinue

if (-not $aiderCmd) {
    Write-Error "aider was not found. Install it, then reopen PowerShell: powershell -ExecutionPolicy ByPass -c `"irm https://aider.chat/install.ps1 | iex`""
    exit 1
}

# ---------------------------------------------------------------------------
# Model priority list
# ---------------------------------------------------------------------------

$Models = @(
    "qwen/qwen3-coder:free",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
)

if ($ModelIndex -ge $Models.Count) {
    Write-Error "ModelIndex $ModelIndex is outside the model list. Max index is $($Models.Count - 1)."
    exit 1
}

# ---------------------------------------------------------------------------
# OpenRouter key setup
# ---------------------------------------------------------------------------

$ConfigDir = Join-Path $env:USERPROFILE ".config\aider-free"
$KeyFile   = Join-Path $ConfigDir "openrouter.key"

if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
}

if (-not (Test-Path $KeyFile)) {
    Write-Host "No OpenRouter key found. Setting it up once."
    $secureKey = Read-Host -Prompt "Paste your OpenRouter API key" -AsSecureString

    if ($secureKey.Length -eq 0) {
        Write-Error "No key entered. Aborting."
        exit 1
    }

    $secureKey | ConvertFrom-SecureString | Set-Content -Path $KeyFile
    Write-Host "Saved encrypted key to $KeyFile"
}

$encrypted = Get-Content -Path $KeyFile | ConvertTo-SecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($encrypted)

try {
    $OpenRouterKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($OpenRouterKey)) {
    Write-Error "Decrypted key is empty. Delete $KeyFile and rerun this script."
    exit 1
}

$env:OPENROUTER_API_KEY = $OpenRouterKey

# ---------------------------------------------------------------------------
# Test model availability
# ---------------------------------------------------------------------------

function Test-ModelAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ModelId
    )

    $body = @{
        model      = $ModelId
        messages   = @(
            @{
                role    = "user"
                content = "ping"
            }
        )
        max_tokens = 1
    } | ConvertTo-Json -Compress -Depth 5

    try {
        $response = Invoke-WebRequest `
            -Uri "https://openrouter.ai/api/v1/chat/completions" `
            -Method Post `
            -Headers @{
                Authorization = "Bearer $OpenRouterKey"
                "HTTP-Referer" = "https://localhost"
                "X-Title" = "aider-free.ps1"
            } `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 15 `
            -UseBasicParsing

        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
    }
    catch {
        return $false
    }
}

# ---------------------------------------------------------------------------
# Select first available model
# ---------------------------------------------------------------------------

Write-Host "Checking free models for availability (starting at index $ModelIndex)..."

$Selected = $null
$SelectedIndex = -1

for ($i = $ModelIndex; $i -lt $Models.Count; $i++) {
    $model = $Models[$i]

    Write-Host -NoNewline ("  [{0}] {1,-65} " -f $i, $model)

    if (Test-ModelAvailable -ModelId $model) {
        Write-Host "OK"
        $Selected = $model
        $SelectedIndex = $i
        break
    }

    Write-Host "rate-limited / unavailable"
}

if (-not $Selected) {
    Write-Host ""
    Write-Host "All free models from index $ModelIndex onward are currently unavailable."
    Write-Host "Retry later, start from a different index, or add OpenRouter credit."
    exit 1
}

# ---------------------------------------------------------------------------
# Launch aider
# ---------------------------------------------------------------------------

$NextIndex = $SelectedIndex + 1

Write-Host ""
Write-Host "==> Using: openrouter/$Selected"

if ($NextIndex -lt $Models.Count) {
    Write-Host "==> If this gets rate-limited mid-session, type inside aider:"
    Write-Host "    /model openrouter/$($Models[$NextIndex])"
}

Write-Host ""

& $aiderCmd.Source --model "openrouter/$Selected" @AiderArgs