# Vardhini Borewells — Billing & Management System

A modern, fully database-driven borewell drilling billing system. Slab-wise
drilling costs, additional charges, payments, reports, and an admin panel for
managing all pricing — with **zero hardcoded rates**.

Built with **Next.js 16 (App Router) · TypeScript · PostgreSQL · Prisma ·
TailwindCSS · Recharts · Lucide**.

---

## Features

- **Automatic slab drilling calculation** — enter a depth, the engine splits it
  across the configured slabs and prices each segment live as you type.
  (e.g. 4.75″ @ 400 ft → ₹20,000 + ₹11,000 + ₹13,000 = **₹44,000**).
- **Additional charges** — PVC, transport, cleaning, blasting, etc., priced per
  borewell type with per-ft / per-day / per-hole / fixed units.
- **Billing wizard** — pick/create customer → choose diameter → enter depth →
  live breakdown → add charges → discount → generate → print.
- **Printable A4 invoice** with company header, QR code, and authorized signature.
- **Payments** with partial payment tracking and auto status (Unpaid/Partial/Paid).
- **Dashboard** — today's/monthly revenue, pending payments, revenue chart, top customers.
- **Master Data admin** — edit borewell types, drilling slabs, and charges. Every
  price change is recorded in an **audit trail** (who, what, when, why).
- **Role-based access control** — Super Admin / Admin / Manager / Operator.
- **Reports** with CSV export, **global search**, dark/light mode, WhatsApp share,
  bill duplication, and cancellation with audit trail.
- GST-ready architecture (disabled by default), multi-company-ready settings.

## Architecture

- **Service layer** (`src/lib/services`) — all DB reads.
- **Server actions** (`src/app/actions`) — validated with **Zod**, guarded by RBAC.
- **Calculation engine** (`src/lib/calc.ts`) — pure, DB-fed logic.
- **Transactions** — bills are created atomically; the server always recomputes
  prices from the database, so a bill can never be tampered with client-side.
- **Auto bill numbers** — `VB-YYYY-0001`, sequential per year, collision-safe.

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (a database named `borewellbills`)

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and set your database URL:
```
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/borewellbills?schema=public"
AUTH_SECRET="a-long-random-string"
```

### 3. Migrate & seed
```bash
npm run db:migrate     # creates all tables
npm run db:seed        # inserts all drilling slabs, charges, users, settings
```

### 4. Run
```bash
npm run dev            # http://localhost:3000
```

### Demo accounts
| Role        | Username   | Password      |
| ----------- | ---------- | ------------- |
| Super Admin | `admin`    | `admin123`    |
| Manager     | `manager`  | `manager123`  |
| Operator    | `operator` | `operator123` |

> Change these immediately in a real deployment (User Management page).

---

## Useful scripts
| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start dev server                         |
| `npm run build`      | Production build                         |
| `npm run db:migrate` | Create/apply migrations                  |
| `npm run db:seed`    | Seed master data + users                 |
| `npm run db:studio`  | Open Prisma Studio                       |
| `npm run db:reset`   | Drop, re-migrate, re-seed (destructive)  |

Verify the calculation engine against the spec example:
```bash
npx tsx scripts/verify-calc.ts
```

## Docker
A `docker-compose.yml` (Postgres) and `Dockerfile` (app) are included. To run
Postgres in a container, point `DATABASE_URL` at it and run `docker compose up -d`.

---

## Changing prices — no code required
All pricing lives in the database and is editable from **Master Data**:
- Add a borewell diameter → *Borewell Types*
- Edit a slab rate → *Drilling Rate Slabs* (recorded in *Rate History*)
- Add/adjust a charge → *Additional Charges*

Every new bill automatically uses the latest rates.
