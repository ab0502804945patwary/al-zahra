// One-click test accounts. Real Supabase users (created on first use by /api/quick-login).
// Set ENABLE_QUICK_LOGIN=false in the environment to switch this off before going live.
export interface QuickAccount { key: string; name: string; email: string; role: 'admin' | 'employee'; stages: number[] }

export const QUICK_ACCOUNTS: QuickAccount[] = [
  { key: 'admin', name: 'Al Zahra (Admin)', email: 'admin@alzahra.com', role: 'admin', stages: [] },
  { key: 's1', name: 'Shahariar Hossain Rakib', email: 'rakib@alzahra.com', role: 'employee', stages: [1] },
  { key: 's2', name: 'Abdul Kaium', email: 'kaium@alzahra.com', role: 'employee', stages: [2] },
  { key: 's3', name: 'Arju Hossain', email: 'arju@alzahra.com', role: 'employee', stages: [3] },
  { key: 's4', name: 'Md Miraj', email: 'miraj@alzahra.com', role: 'employee', stages: [4] },
  { key: 's5', name: 'Md Ishak', email: 'ishak@alzahra.com', role: 'employee', stages: [5] },
  { key: 's6', name: 'Md Azad', email: 'azad@alzahra.com', role: 'employee', stages: [6] },
  { key: 's7', name: 'Tariq Hasan', email: 'tariq@alzahra.com', role: 'employee', stages: [7] },
  { key: 's8', name: 'Nasir Uddin', email: 'nasir@alzahra.com', role: 'employee', stages: [8] },
  { key: 's9', name: 'Bangladesh Desk', email: 'bd@alzahra.com', role: 'employee', stages: [9] },
]
