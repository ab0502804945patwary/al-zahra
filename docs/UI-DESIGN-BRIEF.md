# AL ZAHRA ERP — UI Design Brief (page by page)

Use this file to brief a designer or an AI design tool. It describes **every page, form, dropdown, button, status colour and rule** of the current app, so a new UI can be designed without opening the code.
Everything below is the **current** behaviour. Business rules must stay the same; look, layout and wording may change.

---

## 0. How to use this with a design AI

Paste this whole file, then ask for example:

> "Redesign the whole app UI from this brief. Keep every field, dropdown option, rule, role and status colour. Deliver: design system (colours, type, spacing, components), then each page as a high-fidelity screen for desktop (1440px) and mobile (390px). Start with the app shell and the Dashboard."

Ask for one section at a time (shell → login → dashboard → company pages → workflow stages → money pages → team/settings) so the result stays detailed.

---

## 1. Product in one paragraph

**AL ZAHRA Consultancy** helps foreign investors (mostly Bangladeshi and other South-Asian owners) get a **Saudi investor licence and company set-up**. Staff move each client company through a **9-step workflow**, one team member per step. The app also manages **renewal-only companies**, **customers**, **agents**, a **service price list**, **invoices and payments**, **expenses**, **reports**, **government-portal accounts**, and **staff access**.

- UI language: **English** (team also speaks Bengali; some company names are Arabic).
- Currency: invoices and expenses in **BDT** (Bangladeshi Taka). Staff salary in SAR.
- Devices: **desktop** (main), **phone** (installed as an app / PWA). Both must be first-class.
- Tone: professional, calm, trustworthy. Dense data screens used all day.

## 2. People and permissions

| Role | Who | What they see |
|---|---|---|
| **Admin** ("System Administrator", shown as "Al Zahra") | Owner / manager | Everything: all modules, all 9 stages, Team & Access Control, Master password |
| **Staff** ("Operations Staff") | Employees | Only what the admin ticks for them: **workflow stages** (one or more) and **modules** (Dashboard, Company Directory, **Leads**, Renewal Companies, Customers, Agents, Services, Expenses, Reports, Invoices). Settings is always available. |

Rules that affect the UI:
- A staff member sees **only their ticked items** in the sidebar and cannot open other pages by URL.
- Staff land on their **first assigned stage** (or first module, or Settings) after login. Admin lands on the Dashboard.
- Inside a stage a staff member can add/edit only if the stage is theirs. Otherwise the page shows a "View only" label.
- A staff member **cannot edit a record once it is completed**; the **submission date is automatic** (admins can change it).
- **Editing or deleting an existing company is admin-only.** Staff with the Company Directory / Renewal Companies module can look at companies and **register new ones**, but the edit pencil and the Delete button are not shown to them (and the database refuses it).
- **Delete** (company, record, staff, lead) always asks for the **Master password** (set by admin in Settings; locks after 5 wrong tries). The delete dialog has an eye icon to show what was typed and a hint "Forgot it? An admin can set a new one in Settings → Master password". The stored password can never be displayed (it is hashed).
- The admin can give a staff member **all nine Investor Workflow phases with one click** ("All Investor Workflow phases" link in the team form).
- Client **portal passwords** (Stage 6) are visible only to admins and the Stage 6 staff.

## 3. Brand and current design tokens

Logo files: `/al_zahra_logo.svg` (wide, text), `/al_zahra_icon.svg` (round "AZC" globe + handshake). Logo colours are **blue #3d5fab** and **navy #26394f** (logo text is navy, so keep a light background behind it).

Current palette (Tailwind tokens remapped to the logo):
- Brand blue scale: 50 `#eef2fa`, 100 `#dde5f4`, 200 `#bccae9`, 300 `#94a9d9`, 400 `#6a85c4`, 500 `#4e6fb5`, **600 `#3d5fab` (primary)**, 700 `#314c8a`, 800 `#2b4272`, 900 `#26394f` (navy), 950 `#1a2738`.
- Neutrals: slate (headings navy `#26394f`, body slate-600/700, borders slate-200, page background `#f8fafc`).
- Status colours (used everywhere): **Green/emerald** = on time / paid / active · **Amber/yellow** = caution / partial / warning · **Red/rose** = overdue / unpaid / blocked / error · **Slate/grey** = queued / inactive / cancelled · **Violet** = renewal tag.
- Font: **Inter**. Base text is small: 12px for form/table text, 11px for helper text, 10px for table headings (uppercase).
- Icons: Lucide line icons. Corners: 8–16px radius. Light shadows. White cards with 1px slate border on a very light grey page.
- Sidebar: light blue-tinted (`#eef2fa`), white top strip behind the logo, **active item solid blue with white text**.

Common components (current look):
- **Primary button**: blue-600, white 12px semibold text, 8px radius. **Secondary**: white, slate border. **Danger**: rose text, rose border.
- **Input / select**: white, slate-300 border, 8px radius, blue focus ring, 12–14px text, label above (12px semibold).
- **Cards/sections** in forms: light grey-blue panel with uppercase section title and an icon.
- **Badge/pill**: small rounded-full with coloured border + tinted background.
- **Tables**: white card, grey uppercase header row, thin row dividers, hover tint, horizontal scroll on small screens.
- **Stat card**: white card, label, big number, small hint, tinted icon square on the right.

## 4. App shell (on every signed-in page)

**Desktop (≥1024px)**
- **Left sidebar** (fixed, collapsible to icon-only):
  - Top: logo icon + wide logo, collapse button.
  - Group **OVERVIEW**: Dashboard · Company Directory · **New Lead** · **Leads** · Renewal Companies · Customers · Agents · Services · Expenses · Reports · Invoices.
  - Group **INVESTOR WORKFLOW** (click the group title to expand/collapse; opens automatically on a stage page): the 9 stages in order (see §8) with small count badges for "waiting for you".
  - Group **ADMINISTRATION** (admin only): Team & Access Control.
  - Footer: "Collapse category list".
- **Top bar**: collapse button · global search box "Search entity…" (Ctrl+K hint; currently a visual box only) · **notification bell** (dropdown) · **user menu** (photo/initial, name, role; menu: Settings, Access Privileges (admin), Sign Out).
- **Page area**: scrolls; max width ~2000px; 24px padding.

**Mobile (<1024px)**
- Top bar with burger (opens the sidebar as a drawer), search, bell, user menu.
- **Bottom navigation** (fixed): Home · Companies · and the first workflow shortcuts · More (opens the drawer). Only items the user may open.
- Safe-area padding for iPhone.

**Global overlays**
- **Notification bell dropdown**: list of "company X is ready for Stage N" items, "Mark all read", empty text "No pending work", optional sound, optional phone push notification.
- **Update banner** (bottom, dark): "New version available — Update".
- **Offline page**: shows **"You are offline"** only when the device has no network; if the device is online but the server did not answer it says **"We could not reach the server"** (weak connection). Button **Try again**, link **Sign out and sign in again**, reloads by itself when the network returns. The app retries once automatically before showing it.
- **Master-password dialog** for deletes.
- Browser `alert()` / `confirm()` are used for some errors and confirmations (a design chance: replace with toasts and proper dialogs).

## 5. Page-by-page

### 5.1 Login — `/login`
- Centered white card on a soft blue-tinted background with two blurred blue circles.
- Logo icon + wide logo, title **Sign In**.
- Fields: **Corporate Email Address** (placeholder `name@alzahra.com`, mail icon) · **Secure Password** (lock icon, show/hide eye).
- Button **Sign In** (loading: "Signing In…").
- Messages: red error (wrong password / cannot reach server); amber note "Your session ended or this account has no access. Please sign in again…".
- Footer text: "© 2026 AL ZAHRA Investor Services • Confidential Enterprise System".
- No sign-up (admin creates accounts).

### 5.2 Dashboard — `/dashboard` (admin or staff with the Dashboard module)
Top to bottom:
1. **Accounts Summary** (title + link "All invoices →"): 5 stat cards — **Total Invoiced** (count, fully paid) · **Received** (this month) · **Expenses** (this month) · **Balance** (Received − Expenses; red if negative) · **Total Due** (unpaid/partial counts). Below: table **Customers with the highest due** (top 5).
2. **Master Investor Lifecycle Matrix** block:
   - Header with title, "Live 9-Stage Tracker" tag and short description.
   - Shows **both new and renewal companies** (renewal rows have "—" in the stage cells; there is no separate filter pill for them).
   - 4 stat cards: **Active Portfolios** (all registered entities) · **Compliant & On Track** · **Action Needed (Overdue)** · **Trade Name Expiry Radar** (expiring within 60 days).
   - Toolbar: search "Search AZC code, company…"; filter pills **New Company · Needs Action** (New Company is selected by default).
   - Table: one row per company (ID badge + name + country flag); **one column per stage** (Parent, BD Company, Activity, Foreign, Name, MISA, CR, Portals, Filing). Each cell is a coloured status badge with a short label (e.g. "Approved", "Delay 17d", "In Queue", "N/A") and days; clicking opens that stage.
   - Legend: Compliant (≤10d) green · Caution (11–13d) yellow · Overdue red · Queued grey.
   - The **Upcoming Expiries — Contact List is NOT on the Dashboard** any more; it lives only on the Renewal Companies page (§5.4).
3. **Stage summary table**: per stage → stage name, responsible employee, total files, green / yellow / red counts, average completion % (with bar).

### 5.3 Company Directory — `/dashboard/companies` (new companies only)
- Header: title **Corporate Directory & Master Data**, subtitle, chip **Next Auto ID: AZC803**, button **Register Corporate Entity**.
- Toolbar: search ("Search name, ID, serial no., phone, country, CR, MISA…"), "Showing X of Y", **grid / list view** toggle (remembered).
- **Grid view**: cards (3 columns): icon, company name, ID badge, country flag; rows License Classification, CR Registration, MISA Licence, TIN, Corporate Email, WhatsApp, General Manager, Bank; footer: status pill (Active/Inactive), type badge ("New Company"), "Electronic Folder" link.
- **List view** columns: SL · ID · Company · Country · Service Type · License · CR No. · MISA No. · CR Expiry · Status · Folder · Edit.
- Empty state: building icon, "No matching corporate entities located".
- Opening **Register** or the **Edit** pencil opens the **Company form** as a full page area (not a pop-up) — see §6.1.

### 5.4 Renewal Companies — `/dashboard/renewals`
- Same layout as the directory but only **Renewal / Other Service** companies; button **Add Renewal Company**; default list view; column **Next Due** (soonest of CR, MISA, RJSC return, BD audit, Saudi audit) shown as a coloured pill with days left.
- On top: **Upcoming Expiries — Contact List** card: filter pills **Expired · 7 · 15 · 30 · 60 · 90 days** (with counts); table Company · Service · Document (CR, MISA, RJSC Annual Return, BD Audit, Saudi Audit) · Expiry date · Days left (coloured) · **Contact buttons** (WhatsApp, call, email).

### 5.5 Workflow stage pages — `/dashboard/stage/{id}` (9 pages)
Shared layout:
- **Header**: badge "PHASE 0X" + category text (e.g. "Corporate Eligibility & Attestation"), big stage title, button **Add Record** (or "View only — handled by another team member").
- **KPI row (5 cards)**: Total Files · On Track · Caution · Overdue · Completed.
- **Status Guide** legend (see §8).
- **"Waiting for you (N)"** amber panel: companies that just became ready for this stage, each with a **Start** button (opens the Add form with the company pre-selected).
- **Table card** with search "Filter records…" and horizontally scrolling table; row action **edit pencil**; Drive link icon; colour badges.
- Stage-specific tables and forms are listed in §6.4.

### 5.6 Portal accounts sheet — `/dashboard/portal-accounts/{recordId}` (Stage 6 staff + admin)
- **A4 printable sheet** to give to the client: logo + company name, big "PORTAL ACCOUNTS", date, **Company box** (name, ID, client, phone), table **Portal (logo + name) · User name / ID · Password**, amber privacy note, thank-you line, dark footer with both office addresses and phone.
- Buttons above (hidden when printing): **Back**, **Download PDF / Print**.

### 5.7 Customers — `/dashboard/customers`
- List: title, **Add Customer**, search ("Search name, code, phone, email, NID, passport…"), table Code · Customer (name, "S/O father") · Type · Phone · Email · Nationality · Assigned To · Status pill · edit.
- Form: see §6.5.

### 5.8 Agents — `/dashboard/agents`
- List: title, **Add Agent**, search, **category filter dropdown**; table Agent ID · Company Name · Agent Name · Mobile No. · Address/Location · Category pill · Remarks · edit. Form: §6.6 (**Address / Location is a dropdown of Saudi places**).

### 5.9 Services — `/dashboard/services`
- Title, **Add Service**; inline form card (name, price, description, active tick); table Service · Description · Price (BDT) · Status · edit.

### 5.10 Invoices — `/dashboard/invoices`
- Title with **"Total due from customers"**, button **New Invoice**, search, status filter pills **All · Unpaid · Partial · Paid**.
- Table: Invoice no. · Date · Customer (name + phone) · Total · Paid · Due · Status pill · view (eye).
- **New Invoice form** (full page area): see §6.7.
- **Invoice page `/dashboard/invoices/{id}`**: A4 invoice (see §9) + below it an **Add payment** card. Buttons: **All invoices**, **Edit invoice**, **Cancel invoice**, **Print / Save as PDF**.
- **Edit invoice** (`/dashboard/invoices/{id}/edit`): the same form as New Invoice, pre-filled, without the payment box, title "Edit Invoice INV-…", button **Save Changes**. Customer, date, services (qty/price), discount and notes can change. Payments already received stay; the new total can never be lower than the amount already received; a cancelled invoice cannot be edited.
- **Collecting what is still due**: open the invoice → **Add payment** (amount, date, method, reference, "Pay full balance"), as many times as needed; status moves Unpaid → Partial → Paid. Tip for the redesign: a quick **Collect** button on each unpaid row of the list.

### 5.11 Expenses — `/dashboard/expenses`
- Title, **Add Expense**, 3 stat cards (This month · All time · Pending approval), search, status pills **All · Pending · Approved · Rejected**.
- Table: Expense No. · Date · Category · Method · Amount · Reference · Files (paperclip chips that open the file) · Status pill · approve ✓ / reject 🚫 buttons.
- Add form: §6.8.

### 5.12 Reports — `/dashboard/reports`
- Controls: **Monthly / Yearly** toggle, month dropdown, year dropdown, **CSV**, **Print / PDF**.
- 4 stat cards (Invoiced, Received, Expenses, **Balance**) → **bar chart** (green Received, amber Expenses; per day or per month) + table with totals → **Expenses by category** (progress bars with %) and **Top customers** (+ total due now) → 4 small cards (New customers, New companies, New renewal companies, Agents) → **Invoices in this period** table → **Renewals falling due in this period** table.
- Prints as a clean report.

### 5.13 Team & Access Control — `/dashboard/employees` (admin)
- Title, **Add Team Member**, 3 stat cards (Total Staff, Active, Inactive).
- Staff cards/rows: photo/initial, name, email, phone, **tags of assigned stages and modules**, active state, **Quick Edit**, link to the staff profile.
- **Add / Edit Team Member** is a full page area form: §6.9.

### 5.14 Staff profile — `/dashboard/employees/{id}` (admin)
- Header with photo, name, role badge, contact, assigned module tags; button **Edit Salary & Benefits**.
- KPI cards (tasks done, success rate, etc.).
- **Tabs**: **Tasks** (task table with status, health colour, dates, quality) · **Salary & Compensation** (type badge, base salary, allowances, commission formula, bank/IBAN block, "Salary Disbursement Ledger" table) · **Performance & Quality Review** (rating dimensions, reviews list, **Add Appraisal Review**).
- Modals: **Adjust Salary Structure**, **Add Appraisal Review** (reviewer, date, ratings for speed, accuracy, compliance, communication, overall, feedback).

### 5.15 Settings — `/dashboard/settings` (everyone)
Single column of cards (max ~768px):
1. **Profile** — photo (Change photo / Remove), Name, Phone, Email (read-only), **Save profile**.
2. **My password** — New password, Repeat new password, **Change password** (min 6 chars).
3. **Master password** (admin only) — status "Set / Not set", current (if set) + new, **Set / Change master password**.
4. **Install the app** — **Install App** button (or steps for iPhone/Android/PC).
5. **Notifications on this device** — **Turn on**, **Send test**, **Turn off**; messages for unsupported/blocked.
6. **Notification sound** — On/Off switch.

### 5.16 Leads — `/dashboard/leads`, `/dashboard/leads/new`, `/dashboard/leads/{id}` (module "Leads")
- Sidebar has two items: **New Lead** (opens the form) and **Leads** (the list).
- **List**: title "Leads Management", button **Add New Lead**; 5 stat cards (Total Leads, Contacted, Interested, Quotation, Converted); filter bar: search "Search by name, mobile or company…", **All Countries / All Status / All Sources / All Employees**, **Follow-up date range**, **Reset**; table **# · Lead Name · Mobile · Country (flag) · Company Name · Service Required · Source (pill) · Assigned To · Status (dot pill) · Follow-up Date · Action (view / edit / delete)**; footer "Showing 1 to 10 of N entries" with page numbers.
- **Status**: New · Contacted · Interested · Quotation · Negotiation · Payment · Completed (counted as Converted) · Lost; **Overdue** is shown automatically when the follow-up date has passed and the lead is still open.
- **Source**: Website, Facebook, WhatsApp, Google Ads, Social Media, Referral, Agent, Walk-in, Email, Other.
- **Form**: Lead Name * · Mobile * · Country (flag dropdown) · Company Name · Service Required (type or pick: services from the Services page + MISA License, CR + Labor, Investor License, Renewal, MISA + CR, Trade License, Company Setup, VAT & ZATCA) · Source · Assigned To (staff dropdown) · Status · Follow-up Date · Notes. The eye icon opens the same form read-only; delete asks the master password.

---

## 6. Forms — every field

Common input rules: required fields show a red `*`; dates use the native date picker; error text in a red box under the form; Save button shows a spinner while saving.

### 6.1 Company form (full page area; header "Register Corporate Entity" / "Edit Corporate Profile"; × to close)
Sections as grey panels with icon + uppercase title; fields in a 12-column grid (3 / 4 / 6 / 12 wide); on phone two columns, long fields full width.

**New Company** shows: Company Profile & Identification · Headquarters & Official Communication · Executive Leadership & Shareholders.
**Renewal / Other Service** shows: Company Profile · Statutory & Legal Identifiers · Executive Leadership · **Bangladesh Company (RJSC)** · **Bangladesh Audit Information** · **Saudi Audit Information**.

| Section | Fields (type) |
|---|---|
| **Company Profile & Identification** | Company ID * (auto `AZC801…`, reset button) · Country (flag dropdown, all countries) · **Province / State** (dropdown for known countries, else text) · License Type (dropdown: Trading License, Service License, Service to Trade) · **Client Contact Name** · **Client Phone** · Company Name * |
| **Statutory & Legal Identifiers** (renewal only; for new companies these are filled later in Stage 7) | CR Number · CR Issue Date · CR Expiry Date · MISA License No. · MISA Issue Date · MISA Expiry Date · TIN Number · VAT Number · Chamber of Commerce · GOSI / Qiwa Status |
| **Headquarters & Official Communication** (new only) | Corporate Email · WhatsApp · National Address |
| **Executive Leadership & Shareholders** | CEO / GM Name · National ID / Iqama · Main Shareholder · Shareholder Mobile |
| **Bangladesh Company (RJSC)** (renewal) | RJSC Registration No. · Incorporation Date · RJSC Annual Return Due Date · Issue No · Auditor / Firm |
| **Bangladesh Audit Information** (renewal) | Last Audit Date · Audit Status (dropdown: Not Started, In Progress, Completed, Overdue) · Next Audit Due Date · Financial Year · Auditor / Audit Firm Name · Audit Report (link) · Additional Information (text area) |
| **Saudi Audit Information** (renewal) | same 7 fields |

**Mandatory fields (red \*, the form will not save without them):**
- **New Company**: License Type · Company Name · Client Contact Name · Client Phone · CEO / GM Name · National ID / Iqama.
- **Renewal / Other Service**: License Type · Company Name · Client Contact Name · Client Phone · CR Number + Issue Date + Expiry Date · MISA License No. + Issue Date + Expiry Date · RJSC Registration No. · Incorporation Date · Issue No · (Bangladesh Audit) Last Audit Date · Audit Status · Financial Year · (Saudi Audit) Last Audit Date · Audit Status · Financial Year.
- The company ID is suggested by the database (`AZC801…`); if someone else took it a moment earlier, the next free one is used automatically and the user is told.

Buttons: **Cancel**, **Create Entity Record / Update Entity**, and (edit) red **Delete Entity** (asks master password). Each field label has a small icon.

### 6.2 Stage forms — shared pieces (modal "Add Workflow Record" / "Edit")
- **Corporate Entity** dropdown (only companies **eligible** for this stage; helper line explains the rule; "No eligible company yet" when empty).
- Read-only boxes (taken from the company profile): **Authorized Client Contact**, **Contact Phone**, **Licensing Category**; **Priority Tier** is chosen in Stage 1 and shown read-only afterwards.
- Date fields **Submission Date** (locked/auto for staff), **Target SLA Date**, **Completion Date**; **Payment Status** (Paid, Pending, Partial); **Electronic Dossier Link (Google Drive)**; **Operational Remarks**. Edit form also has red **Delete**.
- The old "Assigned Employee" field was removed (work moves between stages automatically).

### 6.3 Option lists used in stage forms
- **Priority Tier**: BD Company Submited · In-Corporation Send Arju · BD Company Complete · USA MOTHER COMPANY · EGYPT · Pakistan Company
- **Licensing Category** (read-only): Service License · Trading License · Service to Trade
- **Workflow Phase Status** — Stages 1: Document Collection, Govt Collection, Payment Pending, Approved, PENDING · Stages 2, 3, 5, 7, 9: Document Collection, Govt Collection, Payment Pending, Approved · Stage 4: Application Submitted, Under MISA Review, Fully Completed
- **Payment Status**: Paid · Pending · Partial
- **Foreign filing type (USA/UK)**: USA License Submit/Complete · UK License Submit/Complete · MEXICO License Submit/Complete
- **Canada**: Canada License · SUBMIT · Pending · Not Submitted
- **CR Association Status** (Stage 8): Complete · Pending

### 6.4 Stage-by-stage content
| Stage (menu order) | Title / category | Form differences | Table columns |
|---|---|---|---|
| **1 Parent Entity Verification** — Corporate Eligibility & Attestation | choose **Priority Tier**, Phase Status, dates, payment, dossier, remarks | No. · Entity (ID, name, flag) · Authorized Contact · Classification · Priority · Workflow Status · Submission · Target · Completion · Milestone · Elapsed · SLA Compliance · Fulfillment % (bar) · Payment · Notes · Dossier · Actions |
| **9 Bangladesh Company Name** — RJSC Registration & Annual Return | extra block: Bangladesh Company Name *, Country, RJSC Registration No., Issue No, Incorporation Date, Auditor / Firm, RJSC Annual Return Due Date; company link optional | same table with the extra RJSC columns first |
| **2 Activity Classification** — ISIC4 Activity Mapping | standard | standard |
| **3 Foreign Entity Licensing** — Cross-Border (USA & Canada) | **two panels**: *United States Corporate Filing* (type, submission, completion, target, payment) and *Canadian Corporate Filing* (same) | Entity · Category · Priority · **USA** Submit/Target/Issued/SLA/Days/% /Payment · **CAN** same · Actions |
| **8 Trade Name Clearance** — Official Name Reservation | Entity Structure, Clearance Reference Number, Official English Name, Official Arabic Name, Submission Date, **Approval Date** (expiry is auto = +60 days), CR Association Status, Regulatory Notes | Entity · Structure · Clearance Ref · Submission · Approval · Expiration · Remaining Validity (coloured days) · Status (Active/Warning/Urgent/Expired) · CR Association · Notes · Actions |
| **4 MISA Investment License** — Ministry of Investment Portal | standard (4-option phase list) | standard |
| **5 Commercial Registration (CR)** — Ministry of Commerce | standard | standard |
| **6 Portals & Compliance** — Qiwa, Muqeem, GOSI, Chamber | **No dates or payment.** Block **Portal Accounts**: repeating lines **[Portal dropdown with logo + name] [User name / ID] [Password with eye] [delete]**, link **+ Add another portal**; after saving a link opens the client PDF | table shows Entity, contact, classification, priority, **Portal Accounts** (logos, count, PDF icon), Notes, Dossier, Actions |
| **7 Final Dossier & Filing** — Corporate File Handover | standard + block **Statutory & Legal Identifiers** (CR no./dates, MISA no./dates, TIN, VAT, Chamber of Commerce, GOSI/Qiwa status) that is saved to the company profile | standard |

**Portals available in the dropdown (each with its logo):** SPL (National Address) · Ministry of Investment (MISA) · QIWA · MUQEEM · GOSI Certificate · VAT (ZATCA) · Ministry of Commerce · Chamber of Commerce (badge only, logo not supplied yet).

### 6.5 Customer form (full page area, "Add Customer" / "Edit Customer")
Two panels side by side on desktop, stacked on phone.
- **Left panel**: **Customer Type** (radio: Individual, Corporate, VIP, Guest Customer) · Customer Code * (auto `CUS0000001…`) · Given Name * · Surname * · Father's Name · Date of Birth · Gender * (Male/Female/Other) · Nationality (country dropdown) · NID Number · Birth Certificate Number · Iqama Number.
- **Right panel "Contact Information"**: Phone * · Email *. **"Status & Assignment"**: Status (radio: Active, Inactive, Blocked) · Agent (dropdown from Agents) · **Assigned To** * (dropdown of staff).
- Buttons: Cancel, **Create Customer / Update Customer**. Error box if a required field is missing.

### 6.6 Agent form
Agent Name * · Company Name · Mobile No. · **Agent Category** (dropdown: Travel Agency, Consultancy, Maktab Al Khadamat) · **Address / Location (dropdown: Riyadh, Jeddah, Makkah, Madinah, Dammam, Al Khobar, Dhahran, Jubail, Al Ahsa (Hofuf), Qatif, Taif, Yanbu, Rabigh, Tabuk, Abha, Khamis Mushait, Najran, Jazan, Buraidah, Unaizah, Hail, Al Kharj, Al Majmaah, Sakaka, Arar, Al Bahah, Hafar Al Batin, Other)** · Remarks. Agent ID auto `AGT0001…`.

### 6.7 Invoice forms
**New Invoice** (two columns on desktop):
- Left: **Customer** * (dropdown "CUS0000001 — Name (phone)") · **Invoice Date** · **Services (select one or more)** — a search box and **toggle chips** `Service name · BDT price` (selected = blue with a check) → an editable lines table **Service · Qty · Unit price · Total · delete** · link **+ Add a custom line** · **Notes**.
- Right: **Summary** (Subtotal, **Discount** input, **Total**) and **Payment**: three buttons **Pay Later / Partial / Full**; for Partial an amount box; when money is received: **Method** (Cash, Bank Transfer, bKash, Nagad, Cheque, Other) and **Reference**; live "Received now" and "Due after this".
- Buttons: Cancel, **Create Invoice**.

**Add payment** (on the invoice page): Amount · Date · Method · Reference · link "Pay full balance" · **Save payment** (over-payment is rejected).

### 6.8 Expense form ("Add New Expense")
Expense Number (auto `EXP` + DDMMYY + 4 digits, read-only) · Date * · **Category** * (type anything; suggestions open right under the box: Office Rent, Salary, Utilities, Government Fees, Visa & Iqama, Transport, Travel, Communication, Printing & Stationery, Maintenance, Marketing, Commission, Other, plus anything typed before) · Amount (BDT) * · Reference Number · Payment Method * (Cash, Bank Transfer, Cheque, Card, Other) · **Attachments** * (drag-and-drop box: photos, PDF, DOC, up to 5MB each, max 5; file list with remove) · Notes. Buttons Cancel, **Save Expense**.

### 6.9 Team member form (full page area)
- **Profile photo** (upload button, preview, remove; or paste a link).
- Full Name * · **Email *** (this is also the sign-in email; **editable when editing**, with a note) · (new staff) Initial Password * (min 8) · **(editing) New Password — optional, leave empty to keep the current one, eye icon, min 8** · Contact Mobile. Only an admin can change another person's email or password; an email already used by someone else is refused.
- **Access Role** (dropdown: Process Specialist, System Administrator).
- **Assigned Modules** (for staff): two small links above the box — **All Investor Workflow phases** (ticks all 9) and **Clear phases** — and a **multi-select dropdown with tags**, grouped **Workflow phases** (the 9 stages) and **Other modules** (Dashboard, Company Directory, Leads, Renewal Companies, Customers, Agents, Services, Expenses, Reports, Invoices); opens inline and pushes content down.
- Job Title / Designation · Department.
- **Salary & Compensation Structure**: Salary Type (Monthly Fixed, Commission Based, Hybrid: Base + Commission, Hourly Rate, Per File / Dossier) · Base Salary (SAR).
- Checkbox **Active Operational Account**. Buttons: Cancel, **Save**, red **Delete** (master password).

### 6.10 Services form
Service Name * · Price (BDT) * · Description · tick "Active (shows in the invoice list)".

## 7. Lists and rules for lookups
- **Countries**: full list with flags (used for company country, customer nationality, passport/country fields, BD company country). Province dropdowns exist for Saudi Arabia, Bangladesh, India, Pakistan, Afghanistan, Sudan, Egypt; other countries use free text.
- **Search** boxes everywhere accept: name, code (`AZC802` or `802`), serial number (`5` or `#5`), phone (with or without leading zero), country and other fields.
- **Money**: shown as `BDT 12,500.00`.

## 8. Workflow rules and status colours (must stay)

**Menu order of the 9 stages** (phase numbers 1–9): Parent Entity Verification → Bangladesh Company Name → Activity Classification → Foreign Entity Licensing → Trade Name Clearance → MISA Investment License → Commercial Registration → Portals & Compliance → Final Dossier & Filing.

**Flow**
1. For a **new company**: Parent Entity, Bangladesh Company, Activity and Trade Name start **together**; Foreign Entity also starts together but **only for Trading License and Service to Trade** (Service License skips it).
2. **MISA opens only when all of those are complete.** Then MISA → Commercial Registration → Portals & Compliance → Final Dossier & Filing, each opening when the previous one is complete (Portals opens Final Dossier as soon as a Portals record exists).
3. **Renewal / Other Service** companies skip the whole chain.
4. When a company becomes ready for a stage, the responsible staff get a notification (bell, optional sound, optional phone push) and the company appears in that stage's **"Waiting for you"** panel and as a count badge in the sidebar.

**Status colours (timing)**
- With a target date: finished on/before target → **green**; finished 1–3 days late or still running with ≤3 days left → **yellow**; more than 3 days late or target passed → **red**.
- Without a target date: ≤10 days taken green, 11–13 yellow, >13 red.
- Not started → grey "Queued". Completed badge shown separately.
- Completion % bar: green 100%, yellow 60%, red 30%.
- **Trade Name validity**: expiry = approval date + 60 days; >40 days left Active (green), 31–40 Warning (yellow), ≤30 Urgent (red), past → Expired (red).

## 9. Print / PDF layouts (A4)
1. **Invoice**: blue top bar; logo + company name/tagline left, big blue **INVOICE** + invoice number + status pill right; **Bill to** box + details box (invoice no., date, currency); service table with blue header and zebra rows; totals box (Subtotal, Discount, blue **Total**, Paid, **Balance due**); payments received list; notes; optional bank details; thank-you line; dark footer with **Jeddah office** and **Dhaka office** addresses and phone. A faint **CANCELLED** watermark when cancelled.
2. **Portal accounts sheet**: same header style, company box, portal table with logos, privacy note, footer.
3. **Report**: page content without the app chrome.
App chrome (sidebar, top bar, buttons) is hidden when printing.

## 10. Installable app (PWA)
- Name "AL ZAHRA ERP", blue theme colour, icon from the logo, opens in its own window (desktop) / full screen (phone).
- **Install App** lives in Settings; iPhone shows "Share → Add to Home Screen" steps.
- Offline shows a friendly offline page; data is never cached.
- Phone/PC push notifications for new work (opt-in in Settings).

## 11. Responsive behaviour to keep
- Sidebar becomes a drawer + bottom navigation under 1024px.
- Forms: 12-column grid on desktop; two columns on phone; short pairs (e.g. two dates) stay side by side; long fields full width.
- Tables scroll horizontally inside their card; key columns first.
- Buttons ≥ 36px tall on phone; important actions reachable by thumb.

## 12. Known UX weak spots (good targets for the redesign)
- Very small type (10–12px) and dense tables.
- Stage tables have many columns (up to 25) — consider card/row summaries on mobile and column pickers on desktop.
- Browser `alert()`/`confirm()` pop-ups for errors and confirmations — replace with toasts and dialogs.
- Global search in the top bar is only a visual box.
- Long forms (company, team member, stage forms) could use steps, sticky save bar and inline validation.
- Status is colour-only in places — add text/icons for accessibility.
- Dashboard has many stacked blocks; consider tabs or a clearer hierarchy (money vs workflow).
- Add loading skeletons and friendly empty states with a primary action.

## 13. Data entities (for realistic sample data)
Company (AZC801…, name, country, province, licence type, client contact, statutory numbers/dates, leadership, RJSC/audit data for renewals) · Stage record (per company per stage: dates, status, payment, links, remarks) · Customer (CUS0000001…) · Agent (AGT0001…) · Service (name, price) · Invoice (INV-000001…, items, payments) · Expense (EXP1911260001…, attachments) · Staff (name, email, role, stages, modules, salary) · Portal account lines (portal, user name, password).

Sample companies in the app: *Steel Com* (AZC801, Afghanistan, Trading License), *Al Tamayyuz Sharikat Taj Trading* (AZC802, Bangladesh, Trading License).

---
_Last updated: 22 Nov 2026 — includes Leads, mandatory company fields, invoice edit, Saudi agent locations, Balance card, team email/password change, all-phases shortcut, Dashboard without the expiry list, and the new offline page wording._
