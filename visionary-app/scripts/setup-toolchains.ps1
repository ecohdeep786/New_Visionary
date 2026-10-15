$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskManifest = Get-Content -LiteralPath (Join-Path $taskRoot 'integration/toolchains.windows.json') -Raw | ConvertFrom-Json
$taskDownloads = Join-Path $taskRoot '.tools/downloads'
New-Item -ItemType Directory -Force -Path $taskDownloads | Out-Null
foreach ($taskKind in @('node', 'go')) {
    $taskEntry = $taskManifest.$taskKind
    $taskDirectory = Join-Path $taskRoot $taskEntry.directory
    $taskExecutable = if ($taskKind -eq 'node') { Join-Path $taskDirectory 'node.exe' } else { Join-Path $taskDirectory 'bin/go.exe' }
    if (Test-Path -LiteralPath $taskExecutable) { Write-Output "$taskKind already installed: $($taskEntry.version)"; continue }
    $taskArchive = Join-Path $taskDownloads ([IO.Path]::GetFileName(([Uri]$taskEntry.url).AbsolutePath))
    if (!(Test-Path -LiteralPath $taskArchive)) { Invoke-WebRequest -Uri $taskEntry.url -OutFile $taskArchive }
    if ((Get-FileHash -LiteralPath $taskArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskEntry.sha256) { throw "Checksum mismatch for $taskKind. No archive extracted." }
    $taskExtractDirectory = Split-Path $taskDirectory -Parent
    Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskExtractDirectory -Force
    if ($taskKind -eq 'node') { & $taskExecutable --version } else { & $taskExecutable version }
    if ($LASTEXITCODE -ne 0) { throw "$taskKind installation verification failed" }
}
