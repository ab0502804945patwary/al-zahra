# AL ZAHRA ERP — Handover

A web app (also installable on PC and phone) for investor-license work: companies, the 9-phase workflow with staff notifications, customers, invoices, expenses, agents, reports.

## 1. What runs where

| Part | Service | What it does |
|---|---|---|
| Website + server code | **Vercel** | Runs the app. Every push to the `main` branch on GitHub deploys automatically. |
| Database, logins, files | **Supabase** | Stores all data, staff logins, uploaded files. |
| Code | **GitHub** | The source code and all database scripts (`db/` and `supabase-schema.sql`). |

The client should own all three accounts (or be added as owner).

## 2. Environment variables (Vercel → Settings → Environment Variables)

| Name | Needed | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | same page. **Secret.** Never share or put in the browser. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | for phone/PC notifications | public half of the push key pair |
| `VAPID_PRIVATE_KEY` | for phone/PC notifications | **Secret.** private half of the same pair |
| `NEXT_PUBLIC_SITE_URL` | optional | the website address, e.g. `https://erp.example.com` |

Generate a fresh push key pair with: `npx web-push generate-vapid-keys`.
After adding or changing any variable, **redeploy** (variables starting with `NEXT_PUBLIC_` are fixed at build time).

## 3. Create the first administrator

The database starts with no users. On a computer that has the project folder and a `.env.local` file with the Supabase URL and the `service_role` key:

```
npm install
node scripts/create-admin.mjs
```

It asks for the email, name and password (hidden while typing). Then sign in on the website and:
1. Open **Settings → Master password** and set one. Every delete in the app asks for it.
2. Open **Team & Access Control** and add the staff. Give each person only the phases they work on.

## 4. Setting up a brand-new Supabase project (only if moving to a new database)

In Supabase → SQL Editor run, in this order: `supabase-schema.sql`, then the files in `db/`:
`rls-lockdown.sql`, `stage3-8-guard.sql`, `customers.sql`, `invoices.sql`, `agents.sql`, `expenses.sql`, `company-statutory.sql`, `portal-accounts.sql`, `push.sql`.
Also create two storage buckets: `avatars` (public) and `expense-files`.

## 5. How the work flows

- New company: **Service License** → Phases 1, 2, 3, 5 get the work at the same time. **Trading License** → Phases 1, 2, 3, 4, 5.
- Phase 6 (MISA) opens when all of those are complete. Then CR (7) → Portals (8) → Final Dossier (9).
- Renewal / Other companies skip the phase chain.
- Staff see only their phases, cannot change the submission date, and cannot edit a record after it is completed. Admins can.
- Deleting anything needs the master password (5 wrong tries lock it for 15 minutes).

## 6. Security — please keep these

- The database blocks everyone who is not signed in. Only admins see invoices, customers, expenses, agents, reports.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` secret. If a key was ever shared in chat or email, rotate it (Supabase → Settings → API, then update Vercel and redeploy).
- Government portal user names and passwords saved on Phase 8 records are stored as plain text in the database (visible only to admins and Phase 8 staff). Consider whether this is acceptable for the client.
- Backups: Supabase → Database → Backups (daily on paid plans). Without a paid plan, export the data regularly.

## 7. Updates

Push code to `main` → Vercel deploys → within about 5 minutes every open screen shows **“New version available — Update now”**. Installed phone/PC apps update the same way.

## 8. Local development

```
npm install
npm run dev
```
Needs `.env.local` with the variables above (never commit this file; it is already in `.gitignore`).
