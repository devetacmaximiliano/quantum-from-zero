$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $taskRoot 'frontend')
try {
    npm test; if ($LASTEXITCODE -ne 0) { throw 'Frontend tests failed.' }
    npm run lint; if ($LASTEXITCODE -ne 0) { throw 'Frontend lint failed.' }
    npm run build; if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
} finally { Pop-Location }
Push-Location (Join-Path $taskRoot 'backend')
try {
    $env:PYTHONUTF8 = '1'
    uv run pytest -q; if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }
    uv run ruff check app tests examples; if ($LASTEXITCODE -ne 0) { throw 'Backend lint failed.' }
    uv run python -m examples.run_examples; if ($LASTEXITCODE -ne 0) { throw 'Examples failed.' }
} finally { Pop-Location }
