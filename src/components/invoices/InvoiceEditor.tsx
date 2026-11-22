'use client'
import { useRouter } from 'next/navigation'
import NewInvoiceForm from './NewInvoiceForm'

/** Opens the invoice form in edit mode and returns to the invoice afterwards. */
export default function InvoiceEditor({ invoice, items, paid, customers, services }: { invoice: any; items: any[]; paid: number; customers: any[]; services: any[] }) {
  const router = useRouter()
  return (
    <NewInvoiceForm
      customers={customers}
      services={services}
      editing={{ invoice, items, paid }}
      onClose={() => router.push(`/dashboard/invoices/${invoice.id}`)}
    />
  )
}
