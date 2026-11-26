'use client'
import { useId, type ReactNode } from 'react'

/** Two-tone gradient icons for the dashboard cards; they stand on their own, without a background tile. */
function Icon({ from, to, className, children }: { from: string; to: string; className?: string; children: (fill: string) => ReactNode }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className} style={{ filter: `drop-shadow(0 4px 5px ${to}40)` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      {children(`url(#${id})`)}
    </svg>
  )
}

type P = { className?: string }

export const InvoiceIcon = ({ className }: P) => (
  <Icon from="#60a5fa" to="#1d4ed8" className={className}>{fill => (
    <>
      <path d="M12 4h17l11 11v25a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z" fill={fill} />
      <path d="M29 4l11 11h-8a3 3 0 0 1-3-3V4Z" fill="#fff" opacity="0.45" />
      <path d="M15 22h18M15 29h18M15 36h11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  )}</Icon>
)

export const ReceivedIcon = ({ className }: P) => (
  <Icon from="#34d399" to="#047857" className={className}>{fill => (
    <>
      <rect x="4" y="13" width="40" height="29" rx="7" fill={fill} />
      <path d="M9 13l22-8a4 4 0 0 1 5.4 2.6L38 13H9Z" fill={fill} opacity="0.55" />
      <path d="M31 22h13v12H31a6 6 0 0 1 0-12Z" fill="#fff" opacity="0.35" />
      <circle cx="32" cy="28" r="2.6" fill="#fff" />
      <path d="M16 20v12m0 0-5-5m5 5 5-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const ExpenseIcon = ({ className }: P) => (
  <Icon from="#fbbf24" to="#d97706" className={className}>{fill => (
    <>
      <path d="M9 8a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v36l-5-3.5-5 3.5-5-3.5-5 3.5-5-3.5-5 3.5V8Z" fill={fill} />
      <circle cx="24" cy="21" r="10" fill="#fff" opacity="0.35" />
      <path d="M24 27V15m0 0-5 5m5-5 5 5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 35h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </>
  )}</Icon>
)

export const BalanceIcon = ({ className }: P) => (
  <Icon from="#2dd4bf" to="#0f766e" className={className}>{fill => (
    <>
      <ellipse cx="19" cy="37" rx="15" ry="6" fill={fill} opacity="0.55" />
      <ellipse cx="19" cy="31" rx="15" ry="6" fill={fill} opacity="0.75" />
      <ellipse cx="19" cy="25" rx="15" ry="6" fill={fill} />
      <circle cx="32" cy="16" r="12" fill={fill} stroke="#fff" strokeWidth="2.5" />
      <path d="m26.5 16 4 4 7-7.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const DueIcon = ({ className }: P) => (
  <Icon from="#fb7185" to="#be123c" className={className}>{fill => (
    <>
      <circle cx="24" cy="25" r="20" fill={fill} />
      <circle cx="24" cy="25" r="14" fill="#fff" opacity="0.28" />
      <path d="M24 16v10l7 4" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="38" cy="10" r="7" fill={fill} stroke="#fff" strokeWidth="2.5" />
      <path d="M38 7v3.5M38 13.4v.1" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </>
  )}</Icon>
)

export const PortfolioIcon = ({ className }: P) => (
  <Icon from="#60a5fa" to="#1d4ed8" className={className}>{fill => (
    <>
      <path d="M8 10a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v34H8V10Z" fill={fill} />
      <path d="M30 20h7a4 4 0 0 1 4 4v20H30V20Z" fill={fill} opacity="0.65" />
      <path d="M14 14h4M21 14h3M14 22h4M21 22h3M14 30h4M21 30h3M35 28h1M35 35h1" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M4 44h40" stroke={fill} strokeWidth="3" strokeLinecap="round" />
    </>
  )}</Icon>
)

export const CompliantIcon = ({ className }: P) => (
  <Icon from="#34d399" to="#047857" className={className}>{fill => (
    <>
      <path d="M24 3 42 10v13c0 11-7.4 18.6-18 22C13.4 41.6 6 34 6 23V10L24 3Z" fill={fill} />
      <path d="M24 9 36 13.8V23c0 7.4-4.6 12.8-12 15.6V9Z" fill="#fff" opacity="0.22" />
      <path d="m15.5 24 6 6 11-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const OverdueIcon = ({ className }: P) => (
  <Icon from="#fb7185" to="#be123c" className={className}>{fill => (
    <>
      <path d="M19.7 7.6a5 5 0 0 1 8.6 0l16 27.6A5 5 0 0 1 40 42.8H8a5 5 0 0 1-4.3-7.6l16-27.6Z" fill={fill} />
      <path d="M24 17v11M24 35v.2" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" />
    </>
  )}</Icon>
)

export const MatrixIcon = ({ className }: P) => (
  <Icon from="#60a5fa" to="#1d4ed8" className={className}>{fill => (
    <>
      <path d="M24 4 45 15 24 26 3 15 24 4Z" fill={fill} />
      <path d="m7.5 22.5 16.5 8.7 16.5-8.7L45 25 24 36 3 25l4.5-2.5Z" fill={fill} opacity="0.75" />
      <path d="m7.5 32.5 16.5 8.7 16.5-8.7L45 35 24 46 3 35l4.5-2.5Z" fill={fill} opacity="0.5" />
    </>
  )}</Icon>
)

export const ExpiryIcon = ({ className }: P) => (
  <Icon from="#a78bfa" to="#6d28d9" className={className}>{fill => (
    <>
      <rect x="5" y="9" width="34" height="33" rx="6" fill={fill} />
      <path d="M5 19h34" stroke="#fff" strokeWidth="2.5" opacity="0.6" />
      <path d="M14 5v8M30 5v8" stroke={fill} strokeWidth="4" strokeLinecap="round" />
      <path d="M12 27h5M22 27h5M12 34h5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="35" cy="35" r="10" fill={fill} stroke="#fff" strokeWidth="2.5" />
      <path d="M35 30v5.5l3.5 2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const WalletIcon = ({ className }: P) => (
  <Icon from="#34d399" to="#047857" className={className}>{fill => (
    <>
      <path d="M8 13 31 5a4 4 0 0 1 5.4 2.7L38 13H8Z" fill={fill} opacity="0.6" />
      <rect x="4" y="12" width="40" height="31" rx="8" fill={fill} />
      <path d="M30 21h14v13H30a6.5 6.5 0 0 1 0-13Z" fill="#fff" opacity="0.35" />
      <circle cx="31.5" cy="27.5" r="3" fill="#fff" />
      <path d="M11 20h12" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.8" />
    </>
  )}</Icon>
)

export const PaymentsIcon = ({ className }: P) => (
  <Icon from="#34d399" to="#047857" className={className}>{fill => (
    <>
      <rect x="10" y="5" width="34" height="23" rx="5" fill={fill} opacity="0.55" />
      <rect x="4" y="14" width="34" height="24" rx="5" fill={fill} stroke="#fff" strokeWidth="2" />
      <circle cx="21" cy="26" r="6.5" fill="#fff" opacity="0.9" />
      <path d="M9.5 20.5h.1M32.5 31.5h.1" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="37" cy="37" r="9" fill={fill} stroke="#fff" strokeWidth="2.5" />
      <path d="m33 37 3 3 5.5-5.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const CashFlowIcon = ({ className }: P) => (
  <Icon from="#34d399" to="#047857" className={className}>{fill => (
    <>
      <rect x="5" y="26" width="10" height="18" rx="3" fill={fill} opacity="0.6" />
      <rect x="19" y="19" width="10" height="25" rx="3" fill={fill} opacity="0.8" />
      <rect x="33" y="12" width="10" height="32" rx="3" fill={fill} />
      <path d="M6 18 18 8l8 5 13-9" fill="none" stroke={fill} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 3.5h8.5V12" fill="none" stroke={fill} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const PieIcon = ({ className }: P) => (
  <Icon from="#fbbf24" to="#d97706" className={className}>{fill => (
    <>
      <path d="M21 7a19 19 0 1 0 20 20H21V7Z" fill={fill} />
      <path d="M27 3a18 18 0 0 1 18 18H27V3Z" fill={fill} opacity="0.65" />
      <path d="M21 27 8 40" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.75" />
    </>
  )}</Icon>
)

export const InvoiceStatusIcon = ({ className }: P) => (
  <Icon from="#34d399" to="#047857" className={className}>{fill => (
    <>
      <path d="M8 8a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8Z" fill={fill} />
      <path d="M15 14h14M15 22h14M15 30h7" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="35" cy="35" r="10" fill={fill} stroke="#fff" strokeWidth="2.5" />
      <path d="m30.5 35 3.2 3.2 6-6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const CompareIcon = ({ className }: P) => (
  <Icon from="#2dd4bf" to="#0f766e" className={className}>{fill => (
    <>
      <path d="M24 8v32M12 42h24M8 13h32" stroke={fill} strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="9" r="5" fill={fill} stroke="#fff" strokeWidth="2" />
      <path d="M2 28 9 15l7 13a7 6 0 0 1-14 0ZM32 28l7-13 7 13a7 6 0 0 1-14 0Z" fill={fill} />
    </>
  )}</Icon>
)

export const WorkIcon = ({ className }: P) => (
  <Icon from="#60a5fa" to="#1d4ed8" className={className}>{fill => (
    <>
      <path d="M13 16v8a6 6 0 0 0 6 6h10M13 24v6" fill="none" stroke={fill} strokeWidth="4" strokeLinecap="round" />
      <rect x="4" y="4" width="18" height="16" rx="5" fill={fill} />
      <rect x="4" y="30" width="18" height="14" rx="5" fill={fill} opacity="0.65" />
      <rect x="27" y="22" width="18" height="16" rx="5" fill={fill} />
      <path d="m32 30 3 3 5.5-5.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const ProgressRingIcon = ({ className }: P) => (
  <Icon from="#60a5fa" to="#1d4ed8" className={className}>{fill => (
    <>
      <circle cx="24" cy="24" r="18" fill="none" stroke={fill} strokeWidth="8" opacity="0.28" />
      <path d="M24 6a18 18 0 1 1-17 24" fill="none" stroke={fill} strokeWidth="8" strokeLinecap="round" />
      <path d="m17 24.5 5 5 9.5-10" fill="none" stroke={fill} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )}</Icon>
)

export const PhaseIcon = ({ className }: P) => (
  <Icon from="#60a5fa" to="#1d4ed8" className={className}>{fill => (
    <>
      <path d="M12 38h18a8 8 0 0 0 0-16H18a8 8 0 0 1 0-16h12" fill="none" stroke={fill} strokeWidth="4.4" strokeLinecap="round" />
      <circle cx="10" cy="38" r="7.5" fill={fill} stroke="#fff" strokeWidth="2" />
      <circle cx="37" cy="9" r="8.5" fill={fill} stroke="#fff" strokeWidth="2" />
      <circle cx="37" cy="9" r="3" fill="#fff" />
    </>
  )}</Icon>
)
