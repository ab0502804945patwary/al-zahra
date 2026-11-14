'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface ModuleStat {
  code: string
  name: string
  shortName: string
  total: number
  green: number
  yellow: number
  red: number
}

interface Props {
  moduleStats: ModuleStat[]
  green: number
  yellow: number
  red: number
}

const DONUT_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function DashboardCharts({ moduleStats, green, yellow, red }: Props) {
  const pieData = [
    { name: 'Compliant (On Track)', value: green },
    { name: 'At Risk (Caution)', value: yellow },
    { name: 'Overdue (Action Required)', value: red },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Workflow Module SLA Distribution</h3>
            <p className="text-xs text-slate-400">Status allocation across active processing modules</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={moduleStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
            />
            <Bar dataKey="green" name="Compliant" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="yellow" name="Caution" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="red" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 text-sm">Overall SLA Adherence</h3>
          <p className="text-xs text-slate-400">Aggregate file distribution</p>
        </div>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="48%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            No pipeline data available
          </div>
        )}
      </div>
    </div>
  )
}
