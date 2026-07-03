# Deployment Guide — Vercel + Hosted Postgres (Neon)

This deploys the app to **Vercel** with a managed **Neon** Postgres database, so
the client gets a permanent URL they can open from any device.

> Estimated time: ~30 minutes. Free tier is enough to start.

---

## Step 1 — Create the hosted database (Neon)

1. Sign up at https://neon.tech and create a project (region closest to the client).
2. Create a database named `borewellbills`.
3. From the dashboard copy **two** connection strings:
   - **Pooled** connection string → this becomes `DATABASE_URL`
   - **Direct** connection string → this becomes `DIRECT_URL`
   (Neon shows a "Pooled connection" toggle; grab both variants.)

> Supabase works too — use its "Transaction pooler" URL for `DATABASE_URL` and
> the direct URL for `DIRECT_URL`.

---

## Step 2 — Push the code to GitHub

```bash
git add .
git commit -m "Production-ready borewell billing system"
git branch -M main
git remote add origin https://github.com/<you>/vardhini-borewells.git
git push -u origin main
```

`.env` is gitignored, so your secrets are NOT pushed. Good.

---

## Step 3 — Prepare the database (run once, from your machine)

Point a temporary local `.env` at the Neon database, then:

```bash
npx prisma migrate deploy      # creates all tables on Neon
# seed with a strong admin password:
ADMIN_PASSWORD="<a-strong-password>" npx prisma db seed
```

(On Windows PowerShell: `$env:ADMIN_PASSWORD="..."; npx prisma db seed`)

This loads all drilling slabs, charges, settings, and the admin user.

---

## Step 4 — Deploy on Vercel

1. Go to https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset auto-detects **Next.js**. Leave build settings default.
3. Under **Environment Variables**, add:

   | Name             | Value                                            |
   | ---------------- | ------------------------------------------------ |
   | `DATABASE_URL`   | Neon **pooled** connection string                |
   | `DIRECT_URL`     | Neon **direct** connection string                |
   | `AUTH_SECRET`    | the long random string generated below           |

   Generate `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```

4. Click **Deploy**. Vercel builds and gives you a URL like
   `https://vardhini-borewells.vercel.app`.

> The build runs `prisma generate` automatically via the postinstall step in
> `package.json`. If migrations change later, re-run `prisma migrate deploy`
> against Neon (Step 3) before/after deploying.

---

## Step 5 — Security checklist (do NOT skip)

- [ ] `AUTH_SECRET` is a fresh random string (not the dev placeholder).
- [ ] Admin was seeded with a strong password (Step 3), or changed immediately
      via **Master Data → User Management** after first login.
- [ ] Change/disable the `manager` and `operator` demo accounts, or reset their
      passwords, in User Management.
- [ ] Neon database password is strong (Neon generates one — keep it secret).
- [ ] Custom domain (optional): add it in Vercel → Settings → Domains.

---

## Step 6 — Hand over to the client

Give them:
- **URL**: their Vercel address (or custom domain)
- **Admin login**: `admin` + the password you set
- A short note: "Manage prices under **Master Data**; create bills under
  **Create Bill**; add staff under **User Management**."

---

## Ongoing / maintenance

- **Backups**: Neon keeps automatic point-in-time backups on paid tiers; on free
  tier, periodically export with `pg_dump` (or upgrade for auto-backup).
- **Updates**: push to GitHub `main` → Vercel auto-redeploys.
- **Costs**: Vercel Hobby + Neon Free = ₹0 to start. For heavy daily use,
  budget for Vercel Pro and a paid Neon plan (auto-backups, more compute).

---

## Alternative: keep it on the client's own PC
If they'd rather run it locally (no monthly cost, works offline on the shop PC):
`npm run build` then `npm start`, keep local Postgres running, and schedule a
daily `pg_dump` backup. Ask and I'll provide a Windows auto-start + backup script.
