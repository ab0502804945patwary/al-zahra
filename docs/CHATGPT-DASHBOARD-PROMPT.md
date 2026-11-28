You are a senior product designer. Design a UI for the dashboard of my web app. Everything you need is below.

## What to design now
Pick one (I will edit this line before sending):
- [ ] A) The FULL dashboard
- [ ] B) ONLY the "Master Investor Lifecycle Matrix" section

## How to answer
1. First show me 3 clearly different design directions as high-fidelity mockup IMAGES (desktop 1440px wide).
2. Wait until I choose one.
3. Then give me the final desktop image, a mobile (390px) image, and a short design spec: exact hex colours, font sizes, spacing, radius, shadows, and the behaviour of every control.
Do not invent new data, features or numbers. Use only what is listed here.

## The product
"AL ZAHRA ERP" helps foreign investors get a Saudi investor licence and company set-up. Staff move each client company through 11 phases. Used all day, mostly on desktop, also on phones. UI language: English. Currency: Bangladeshi Taka, written with the ৳ sign.

## Style I like
Clean, light, modern "workspace" dashboards like Microsoft 365 Home and Google Workspace Overview: soft white cards, very light blue-grey page, generous spacing, calm and professional. (I will attach two sample screenshots.)

Brand colours: blue #3D5FAB, navy #26394F. Status colours: green = on time, amber = caution, red = overdue, grey = not started. Font: Inter. Icons: Lucide line icons.

## App shell (keep as it is, design only the content area)
- Left sidebar, light, active item solid blue: Dashboard, Company Register, New Lead, Leads, Video Management, Renewal Companies, Customers, Agents, Services, Expenses, Reports, Receive Voucher, Journal & Staff Cash, Invoices, Investor Workflow (11 phases), Team & Access Control.
- Top bar: rounded search box, notification bell, user avatar with name.

## Dashboard sections, top to bottom
1. Greeting: "Good evening, Al Zahra!" + one line of text + today's date.
2. Four counters: Active Portfolios · Compliant & On Track · Action Needed (Overdue) · Company Name Expiry Radar (expiring within 40 days).
3. Work Progress: share of all files that are On Time / Caution / Overdue / Pending.
4. Accounts Summary: Total Invoiced (invoice count, fully paid) · Received (this month) · Expenses (this month) · Balance · Total Due (unpaid, partial) + money received in each of the last 7 months. Link "All invoices".
5. Waiting to Start: companies ready for a phase but not started (can be 60+ rows). Each row: company ID, company name, phase number and name. Filter by phase. Click opens the phase.
6. Recent Companies: ID, name, country with flag, type (New / Renewal). Link "View all".
7. Phase Overview: for each of the 11 phases: number, name, responsible employee, total files, on time, caution, overdue, average completion %.
8. Highest Customer Dues: top 5 customers with number of invoices and amount due.
9. Master Investor Lifecycle Matrix (details below).

## Master Investor Lifecycle Matrix (the most important section)
Purpose: see at a glance where every client company stands across all 11 phases, and what needs action.

The 11 phases, in order:
1 Parent Entity Verification (short: Parent)
2 Bangladesh Company Name (BD Company)
3 Foreign Mother Company (Foreign Mother)
4 Commercial Activity Classification (Activity)
5 1st Foreign Subsidiary Company (Foreign Sub 1)
6 2nd Foreign Subsidiary Company (Foreign Sub 2)
7 Company Name Clearance (Name)
8 MISA Investment License (MISA)
9 Commercial Registration (CR)
10 Government Portals & Compliance (Portals)
11 Final Legal Dossier & Issuance (Filing)

For one company, each phase has:
- a state: Not started / In progress / Complete / Not applicable
- a timing colour: green (up to 10 days), amber (11-13 days or 3 days or less left), red (more than 13 days or past target)
- a text label while in progress, for example "Document Collection", "Govt Collection", "Payment Pending", "Under MISA Review"
- the number of days taken
- phase 7 is different: it shows days of validity left, for example "52d left", or "Expired"

Each company has: ID (like AZC801), name (often very long and in CAPITALS), country with flag, Active/Inactive, New or Renewal.

Controls: search by ID, name or country · two tabs "New Company (count)" and "Needs Action" (any red phase) · 5 companies per page with Previous / Next · "Show all" · click a phase to open it.

Real situation to design for: dozens of companies, and MOST phases are still "Not started". The design must still look good and readable when it is mostly empty.

## Designs already tried that I did NOT like (do not repeat them)
- Wide table with a text pill in every cell ("Not started" repeated everywhere, horizontal scroll)
- Table with round icon marks in every cell
- One numbered segmented colour bar per company
- Plain text list that expands to show phases
- Company list on the left with a vertical timeline on the right
- Card grid with a percentage ring and 11 thin segments
- Metro / route map line with 11 station circles per company and a dark blue gradient header

## Sample data for the mockups
AZC801 SAMPLE TRADING COMPANY, Bangladesh, New: phases 1-3 complete (4, 12, 6 days), phase 4 in progress "Document Collection".
AZC802 SAMPLE SERVICE COMPANY, Saudi Arabia, New: phase 1 complete, phase 2 overdue "Payment Pending", phases 3, 5, 6 not applicable.
AZC803 SAMPLE INDUSTRIAL METALS AND AIR CONDITIONING COMPANY LIMITED, Pakistan, New: all phases complete.
AZC804 SAMPLE CONSTRUCTION OPC, Saudi Arabia, New: nothing started.
AZC805 SAMPLE TOURS AND TRAVELS LTD, Bangladesh, Renewal.
