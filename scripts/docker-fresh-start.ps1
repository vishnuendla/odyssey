# Tear down Odyssey containers/volumes and rebuild the full stack.
# Requires Docker Desktop (Linux engine) to be running.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Warning ".env was missing — copied from .env.example. Edit secrets before production."
}

docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Docker daemon is not running. Start Docker Desktop, wait until it is ready, then run this script again."
}

Write-Host "Stopping and removing containers, networks, and volumes..."
docker compose down -v --remove-orphans

Write-Host "Building and starting mysql, backend, frontend..."
docker compose up -d --build

Write-Host ""
Write-Host "Stack starting. App: http://localhost:8080  API: http://127.0.0.1:9090"
Write-Host "Follow logs: docker compose logs -f"
Write-Host "Status:      docker compose ps"