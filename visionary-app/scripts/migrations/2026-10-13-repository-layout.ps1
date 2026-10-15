$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskRootPrefix = $taskRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$taskMoves = @(
    @('src', 'frontend/src'), @('public', 'frontend/public'), @('tests', 'frontend/tests'),
    @('node_modules', 'frontend/node_modules'), @('dist', 'frontend/dist'),
    @('package.json', 'frontend/package.json'), @('package-lock.json', 'frontend/package-lock.json'),
    @('index.html', 'frontend/index.html'), @('vite.config.js', 'frontend/vite.config.js'),
    @('eslint.config.js', 'frontend/eslint.config.js'), @('jsconfig.json', 'frontend/jsconfig.json'),
    @('tsconfig.domain.json', 'frontend/tsconfig.domain.json'), @('tailwind.config.js', 'frontend/tailwind.config.js'),
    @('postcss.config.js', 'frontend/postcss.config.js'), @('components.json', 'frontend/components.json'),
    @('scripts/design-quality-review.mjs', 'frontend/scripts/design-quality-review.mjs'),
    @('scripts/font-surface-review.mjs', 'frontend/scripts/font-surface-review.mjs'),
    @('scripts/navigation-quality-review.mjs', 'frontend/scripts/navigation-quality-review.mjs'),
    @('integration/compose.local.yml', 'infrastructure/local/compose.yml'),
    @('integration/init-databases.sql', 'infrastructure/local/init-databases.sql'),
    @('tmp', 'artifacts/tmp'), @('scripts-tmp', 'artifacts/legacy/scripts-tmp'), @('dev', 'artifacts/legacy/dev')
)
foreach ($taskFile in Get-ChildItem -LiteralPath $taskRoot -Force -File) {
    if ($taskFile.Name -match '^(audit-report\.json|l0-report\.json|tmp-.*\.(png|json))$' -or $taskFile.Extension -eq '.log') {
        $taskMoves += ,@($taskFile.Name, "artifacts/legacy/root/$($taskFile.Name)")
    }
    if ($taskFile.Name -match '^\.env($|\.)') { $taskMoves += ,@($taskFile.Name, "frontend/$($taskFile.Name)") }
}
$taskPlan = @()
foreach ($taskMove in $taskMoves) {
    $taskSource = [IO.Path]::GetFullPath((Join-Path $taskRoot $taskMove[0]))
    $taskTarget = [IO.Path]::GetFullPath((Join-Path $taskRoot $taskMove[1]))
    if (!$taskSource.StartsWith($taskRootPrefix, [StringComparison]::OrdinalIgnoreCase) -or !$taskTarget.StartsWith($taskRootPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Move escapes the product root.' }
    if (!(Test-Path -LiteralPath $taskSource)) { continue }
    if (Test-Path -LiteralPath $taskTarget) { throw "Destination already exists: $($taskMove[1]). Nothing moved." }
    if ((Get-Item -LiteralPath $taskSource -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Source is a reparse point: $($taskMove[0])" }
    $taskPlan += [pscustomobject]@{ From = $taskMove[0]; To = $taskMove[1]; Source = $taskSource; Target = $taskTarget }
}
if (!(Test-Path -LiteralPath (Join-Path $taskRoot 'src'))) { throw 'Original frontend source absent. This one-time migration is not a repair/overwrite command.' }
# Verify both absolute endpoints for every directory move before changing the tree.
$taskEvidence = Join-Path $taskRoot 'docs/architecture'
New-Item -ItemType Directory -Force -Path $taskEvidence | Out-Null
$taskHashes = @()
foreach ($taskMove in $taskPlan | Where-Object { $_.From -in @('src', 'public', 'tests') }) {
    foreach ($taskFile in Get-ChildItem -LiteralPath $taskMove.Source -Recurse -Force -File) {
        $taskRelative = $taskFile.FullName.Substring($taskMove.Source.Length + 1).Replace('\', '/')
        $taskHashes += [pscustomobject]@{ Path = "$($taskMove.To)/$taskRelative"; Sha256 = (Get-FileHash -LiteralPath $taskFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
    }
}
[pscustomobject]@{ Date = '2026-10-13'; Moves = @($taskPlan | Select-Object From,To); PreservedFiles = $taskHashes } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $taskEvidence 'restructure-2026-10-13.json') -Encoding utf8
foreach ($taskMove in $taskPlan) {
    New-Item -ItemType Directory -Force -Path (Split-Path $taskMove.Target -Parent) | Out-Null
    Move-Item -LiteralPath $taskMove.Source -Destination $taskMove.Target
    Write-Output "$($taskMove.From) -> $($taskMove.To)"
}
