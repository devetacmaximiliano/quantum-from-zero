#Requires -Version 7.0
param([switch]$Install)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskFrontend = Join-Path $taskRoot 'frontend'
$taskBackend = Join-Path $taskRoot 'backend'
$taskLogs = Join-Path $taskRoot '.local'
New-Item -ItemType Directory -Force -Path $taskLogs | Out-Null
if ($Install -or !(Test-Path (Join-Path $taskFrontend 'node_modules'))) {
    Push-Location $taskFrontend
    try { npm ci; if ($LASTEXITCODE -ne 0) { throw 'Frontend installation failed.' } } finally { Pop-Location }
}
Push-Location $taskBackend
try { uv sync --locked; if ($LASTEXITCODE -ne 0) { throw 'Backend installation failed.' } } finally { Pop-Location }
foreach ($taskPort in @(3000, 8000)) {
    if (Get-NetTCPConnection -LocalPort $taskPort -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $taskPort is already in use. Close the existing server or use its running instance."
    }
}
$env:PYTHONUTF8 = '1'
$taskApi = Start-Process -FilePath (Join-Path $taskBackend '.venv\Scripts\python.exe') -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $taskBackend -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskLogs 'backend.log') -RedirectStandardError (Join-Path $taskLogs 'backend-error.log')
$taskNode = (Get-Command node).Source
$taskWeb = Start-Process -FilePath $taskNode -ArgumentList @('node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1') -WorkingDirectory $taskFrontend -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskLogs 'frontend.log') -RedirectStandardError (Join-Path $taskLogs 'frontend-error.log')
Write-Host 'Quantum from Zero: http://localhost:3000'
Write-Host 'API docs: http://localhost:8000/docs'
Write-Host "Server process IDs: frontend=$($taskWeb.Id), backend=$($taskApi.Id). Logs: .local/"
Write-Host 'Press Ctrl+C to stop both servers.'
try { while (!$taskWeb.HasExited -and !$taskApi.HasExited) { Start-Sleep -Seconds 2; $taskWeb.Refresh(); $taskApi.Refresh() } }
finally { foreach ($taskProcess in @($taskWeb, $taskApi)) { if (!$taskProcess.HasExited) { $taskProcess.Kill($true) } } }
