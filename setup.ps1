$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
    $jwtSecret = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
$envLines = @(
    "NODE_ENV=development",
    "PORT=3000",
    "DATABASE_URL=postgres://postgres:postgres@localhost:5432/room_booking",
    (("JWT_SECRET") + "=" + $jwtSecret),
    "JWT_EXPIRES_IN=15m"
)
$envLines | Set-Content ".env"

    Write-Host "Utworzono .env z losowym JWT_SECRET"
}

Write-Host "Instalowanie zaleznosci..."
npm install

Write-Host "Uruchamianie PostgreSQL..."
docker compose up -d

Write-Host "Oczekiwanie na baze..."
$status = ""
for ($i = 0; $i -lt 30; $i++) {
    try {
        $status = docker inspect -f '{{.State.Health.Status}}' room-booking-db 2>$null
    } catch {
        $status = ""
    }

    if ($status -eq "healthy") {
        break
    }

    Start-Sleep -Seconds 2
}

if ($status -ne "healthy") {
    throw "PostgreSQL nie osiagnal stanu healthy. Sprawdz Docker Desktop i docker compose logs postgres."
}

Write-Host "Migracje..."
npx knex migrate:latest

Write-Host "Seedy..."
npx knex seed:run

Write-Host ""
Write-Host "Gotowe. Uruchom:"
Write-Host "node src/server.js"
