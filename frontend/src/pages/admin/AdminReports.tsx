import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { orderApi } from '../../api'
import { formatPrice, formatDate } from '../../utils/format'
import styles from './AdminReports.module.css'

const COLORS = ['#1a1a2e', '#e94560', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6']

export default function AdminReports() {
  const [stats, setStats] = useState<any>(null)
  const [sales, setSales] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) })
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => { load() }, [from, to])

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, salesRes] = await Promise.all([orderApi.getStats(), orderApi.getSalesReport({ from, to })])
      setStats(statsRes.data.data)
      setSales(salesRes.data.data)
    } catch {} finally { setLoading(false) }
  }

  const chartData = (stats?.weekOrders || []).reduce((acc: any[], order: any) => {
    const date = new Date(order.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    const existing = acc.find((d) => d.date === date)
    if (existing) { existing.pedidos += 1; if (order.payment_status === 'paid') existing.ingresos += order.total }
    else acc.push({ date, pedidos: 1, ingresos: order.payment_status === 'paid' ? order.total : 0 })
    return acc
  }, [])

  const typeData = sales?.byType ? Object.entries(sales.byType).map(([type, value]: any) => ({
    name: type === 'dine_in' ? 'En local' : type === 'takeaway' ? 'Para llevar' : type === 'delivery' ? 'Delivery' : 'Mostrador',
    value: Math.round(value)
  })) : []

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1>Reportes</h1></div>

      <div className={styles.dateRow}>
        <div className="form-group">
          <label className="form-label">Desde</label>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Hasta</label>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Pedidos en el período</p>
              <p className={styles.statVal}>{sales?.count || 0}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Ingresos en el período</p>
              <p className={styles.statVal}>{formatPrice(sales?.total || 0)}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Ticket promedio</p>
              <p className={styles.statVal}>{sales?.count ? formatPrice((sales?.total || 0) / sales.count) : '—'}</p>
            </div>
          </div>

          <div className={styles.charts}>
            <div className={styles.chartCard}>
              <h2>Pedidos — últimos 7 días</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any, name: string) => [name === 'ingresos' ? formatPrice(value) : value, name === 'ingresos' ? 'Ingresos' : 'Pedidos']} />
                    <Bar dataKey="pedidos" fill="#1a1a2e" radius={[4,4,0,0]} name="pedidos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>Sin datos</p></div>}
            </div>

            {typeData.length > 0 && (
              <div className={styles.chartCard}>
                <h2>Ventas por tipo</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {typeData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatPrice(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={styles.topSection}>
            <h2>Productos más vendidos</h2>
            <div className={styles.topList}>
              {(stats?.topProducts || []).slice(0, 10).map((p: any, i: number) => (
                <div key={p.name} className={styles.topItem}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <span className={styles.topName}>{p.name}</span>
                  <span className={styles.topCount}>{p.count} unidades</span>
                </div>
              ))}
              {!(stats?.topProducts?.length) && <div className="empty-state"><div className="icon">📊</div><p>Sin datos</p></div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
