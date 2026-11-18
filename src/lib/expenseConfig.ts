// Suggestions and dropdown lists for the Expenses page. Category is free text: whatever is typed is saved.
export const EXPENSE_CATEGORIES = [
  'Office Rent', 'Salary', 'Utilities (Electric / Water / Internet)', 'Government Fees', 'Visa & Iqama',
  'Transport', 'Travel', 'Communication', 'Printing & Stationery', 'Maintenance', 'Marketing', 'Commission', 'Other',
]
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'Other']
export const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected'] as const
export const EXPENSE_CURRENCY = 'BDT'
export const MAX_FILES = 5
export const MAX_FILE_BYTES = 5 * 1024 * 1024
// any photo/screenshot (phones also give webp, heic, jfif) plus PDF and Word files
export const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'jfif', 'webp', 'heic', 'heif', 'gif', 'bmp', 'pdf', 'doc', 'docx']
