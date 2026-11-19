# Room Booking API — Zadanie 05

![CI](https://github.com/Matthias3721/room-booking-api/actions/workflows/ci.yml/badge.svg)

REST API do rezerwowania sal: Node.js 22, Express, PostgreSQL 16, Knex, JWT, Jest, Supertest, Docker Compose i GitHub Actions.

## Uruchomienie od zera

```bash
git clone <URL_REPOZYTORIUM>
cd room-booking-api
cp .env.example .env
# ustaw własne DB_PASSWORD i JWT_SECRET w .env
docker compose up --build
```

Po starcie:
- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs
- PostgreSQL: localhost:5432

Migracje są wykonywane automatycznie przy starcie kontenera `api`.

### Seed ADMIN

```bash
docker compose exec api npx knex seed:run
```

Konto demonstracyjne po seedzie:
- `admin@example.com` / `admin-password-123`
- `jan@example.com` / `user-password-123`

## Testy

Najpierw uruchom bazę:

```bash
docker compose up -d db
```

Unit testy nie korzystają z PostgreSQL i przechodzą także przy wyłączonej bazie:

```bash
npm run test:unit
```

Integracyjne korzystają wyłącznie z `room_booking_test`. Jeżeli baza nie istnieje, test tworzy ją przez `TEST_DATABASE_ADMIN_URL`, a migracje są wykonywane w `beforeAll`:

```bash
npm run test:integration
```

Wszystkie testy:

```bash
npm test
```

## Test mutacyjny reguły nakładania

W `src/modules/reservations/reservations.repository.memory.js` tymczasowo zmień warunek stykania przedziałów tak, aby używał `<=` zamiast `<`. Następnie:

```bash
npm run test:unit
```

Test `allows touching intervals` powinien się wywrócić. Zrób screenshot do sprawozdania i **przywróć poprawny `<`** przed commitem.

## Docker Compose

```bash
docker compose up -d --build
docker compose ps
docker compose logs api
docker compose down
```

`db` ma healthcheck, `api` startuje dopiero po stanie `healthy`, a dane PostgreSQL są w named volume `room-booking-pgdata`.

Aplikacja obsługuje `SIGTERM`: przestaje przyjmować nowe requesty, zamyka serwer HTTP i pulę połączeń do bazy. W logach widać `[shutdown] ...`.

## Eventy i audit log

Po udanej operacji service publikuje:
- `reservation.created`
- `reservation.cancelled`

Eventy są publikowane po udanej transakcji. Kolizja `409` nie publikuje eventu, a ponowne anulowanie `CANCELLED` jest idempotentne i również nie publikuje kolejnego eventu.

Listenery:
- zapisują event do tabeli `audit_log` (`payload` jako `jsonb`),
- przy anulowaniu cudzej rezerwacji przez ADMIN logują `[notification] to: <email> ...`.

Endpoint tylko dla ADMIN:

```http
GET /api/admin/audit-log?page=1&limit=20&eventType=reservation.cancelled
```

Błędy listenerów są izolowane przez event bus i nie zmieniają odpowiedzi API.

## CI — GitHub Actions

Workflow: `.github/workflows/ci.yml`.

Uruchamia się:
- przy push do `main`,
- przy każdym pull requeście.

Wykonuje:
1. checkout,
2. Node.js 22 + cache npm,
3. `npm ci`,
4. PostgreSQL service z healthcheck,
5. `npm test`,
6. `docker build .`.

### Wymagany sekret GitHub

W repozytorium dodaj:

`Settings → Secrets and variables → Actions → New repository secret`

Nazwa:

```text
CI_DB_PASSWORD
```

Ustaw dowolne silne hasło. Workflow nie zawiera hasła na stałe.

## Scenariusz czerwonego i zielonego CI

1. Utwórz branch, np. `ci-demo-failure`.
2. Celowo zepsuj jeden test lub regułę nakładania.
3. Push + Pull Request → zrób screenshot czerwonego workflow.
4. Napraw błąd w tym samym PR.
5. Push → zrób screenshot zielonego workflow.
6. Merge PR.

## Struktura

```text
src/
  db/migrations/
  events/
  middleware/
  modules/
tests/
  unit/
  integration/
.github/workflows/ci.yml
Dockerfile
docker-compose.yml
```

