# 🏢 AL ZAHRA ERP — Investor License Management System

Enterprise-grade ERP system built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + RLS)**. Designed specifically for corporate investor license processing, statutory compliance tracking, and cross-border entity operations.

---

## 🚀 Key Features

- **Executive Analytics Dashboard:** Real-time KPI cards, SLA distribution charts, pipeline fulfillment rates, and compliance tracking.
- **Corporate Directory (Master Data):** Centralized corporate records with CR, MISA licenses, TIN, VAT, bank details, and electronic dossier links.
- **8-Phase Investor Workflow Modules:**
  1. **Phase 01:** Parent Entity Verification
  2. **Phase 02:** Commercial Activity Classification
  3. **Phase 03:** Cross-Border Foreign Licensing (USA & Canada entity filings)
  4. **Phase 04:** MISA Investment Licensing (Ministry of Investment)
  5. **Phase 05:** Commercial Registration (CR)
  6. **Phase 06:** Government Portals & Compliance (Qiwa, Muqeem, GOSI, Chamber)
  7. **Phase 07:** Final Legal Dossier & Issuance
  8. **Phase 08:** Commercial Trade Name Clearance & 60-Day Validity Countdown
- **Role-Based Access Control (RBAC):** System Administrator vs. Module Specialist access with Row-Level Security (RLS).
- **Automated SLA Thresholds:**
  - 🟢 **Compliant:** Completed within target timeline (≤10 days)
  - 🟡 **Caution:** Approaching threshold (11-13 days)
  - 🔴 **Overdue:** Exceeded SLA target (>13 days)
- **Instant Demo Mode:** Immediate UI & mock workflow exploration without mandatory live database setup.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (Turbopack, App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Data Visualization:** Recharts
- **Database & Auth:** Supabase (PostgreSQL, Auth, RLS Policies)

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/robiofficial96-arch/alzahra.git
cd alzahra
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
1. Create a project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy and run the contents of `supabase-schema.sql`.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

---

## 📄 License
Confidential & Proprietary — AL ZAHRA Investor Services.
