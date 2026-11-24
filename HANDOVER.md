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
2. Open **Team & Access Control** and add the staff. In **Assigned Modules** tick what each person may open: workflow phases (01-09) and the other modules (Dashboard, Company Register, Renewal Companies, Customers, Agents, Services, Expenses, Reports, Invoices). Admins always have everything.

## 4. Setting up a brand-new Supabase project (only if moving to a new database)

In Supabase → SQL Editor run, in this order: `supabase-schema.sql`, then the files in `db/`:
`rls-lockdown.sql`, `stage3-8-guard.sql`, `customers.sql`, `invoices.sql`, `agents.sql`, `expenses.sql`, `company-statutory.sql`, `portal-accounts.sql`, `push.sql`, `modules.sql`, `videos.sql`, `foreign-stages.sql`, `selected-phases.sql`, `skipped-phases.sql`, `foreign-subsidiary-1.sql`, `foreign-accounts.sql`, `cr-association.sql`, `bd-approval-status.sql`, `bd-name-sync.sql`, `stage9-cascade.sql`, `invoice-cancel-admin.sql`, `invoice-edit-admin.sql`, `leads-owner.sql`, `expense-approve-admin.sql`, `agents-owner.sql`, `customer-form.sql` (and the other files in `db/`, oldest first).
Also create the storage buckets: `avatars` (public), `expense-files` (private). `customer-form.sql` creates the private `company-docs` bucket itself.

## 5. How the work flows

- Menu order (= phase number): 01 Parent Entity, 02 Bangladesh Company, 03 Foreign Mother Company, 04 Activity, 05 1 Foreign Subsidiary Company, 06 2 Foreign Subsidiary Company, 07 Company Name Clearance, 08 MISA, 09 CR, 10 Portals, 11 Final Dossier.
- On the Company Register form, choosing the License Type shows boxes: Trading = Bangladesh Company, Foreign Mother, 1 and 2 Foreign Subsidiary; Service = Bangladesh Company, Foreign Mother; Service to Trade = 1 and 2 Foreign Subsidiary. Work goes only to the ticked ones, and MISA waits for exactly those.
- New company: **Service License** → Parent, Bangladesh Company, Activity, Company Name Clearance get the work at the same time. **Trading License** → the same plus the three foreign phases (Foreign Mother, 1 and 2 Foreign Subsidiary).
- MISA opens when Parent, Bangladesh Company, Activity, Company Name Clearance (and the 1 Foreign Subsidiary phase for Trading License) are complete. Then CR → Portals → Final Dossier.
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
