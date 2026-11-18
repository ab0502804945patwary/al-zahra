// Dropdown lists for the Expenses page. Edit here to add or rename an option.
export const EXPENSE_CATEGORIES = [
  'Office Rent', 'Salary', 'Utilities (Electric / Water / Internet)', 'Government Fees', 'Visa & Iqama',
  'Transport', 'Travel', 'Communication', 'Printing & Stationery', 'Maintenance', 'Marketing', 'Commission', 'Other',
]
export const EXPENSE_ACCOUNTS = ['Cash in Hand', 'Bank Account', 'Petty Cash', 'Owner Account']
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'Other']
export const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected'] as const
export const EXPENSE_CURRENCY = 'SAR'
export const MAX_FILES = 5
export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx']
