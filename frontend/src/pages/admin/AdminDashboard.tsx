import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { orderApi, configApi } from '../../api'
import { formatPrice, formatDate, orderStatusLabel, orderStatusColor, orderTypeLabel } from '../../utils/format'
import { Order, BusinessConfig } from '../../types'
import toast from 'react-hot-toast'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i) }, [])

  const load = async () => {
    try {
      const [statsRes, ordersRes, configRes] = await Promise.all([orderApi.getStats(), orderApi.getAll({ limit: 8 }), configApi.get()])
      setStats(statsRes.data.data)
      setRecentOrders(ordersRes.data.data.orders || [])
      setConfig(configRes.data.data)
    } catch {} finally { setLoading(false) }
  }

  const toggleOpen = async () => {
    try { await configApi.toggleOpen(); await load(); toast.success(config?.is_open ? 'Local cerrado' : 'Local abierto') } catch { toast.error('Error') }
  }

  const chartData = (stats?.weekOrders || []).reduce((acc: any[], order: any) => {
    const date = new Date(order.created_at).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    const existing = acc.find((d) => d.date === date)
    if (existing) { existing.pedidos += 1; if (order.payment_status === 'paid') existing.ingresos += order.total }
    else acc.push({ date, pedidos: 1, ingresos: order.payment_status === 'paid' ? order.total : 0 })
    return acc
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p>Resumen de actividad</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`btn ${config?.is_open ? 'btn-danger' : 'btn-success'} btn-sm`} onClick={toggleOpen}>
            {config?.is_open ? '🔴 Cerrar local' : '🟢 Abrir local'}
          </button>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">Ver pedidos</Link>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { icon: '📦', label: 'Pedidos hoy', value: stats?.today?.orders || 0, format: false },
          { icon: '💰', label: 'Ingresos hoy', value: stats?.today?.revenue || 0, format: true },
          { icon: '⏳', label: 'Pedidos activos', value: stats?.pending || 0, format: false, alert: stats?.pending > 0 },
          { icon: '📅', label: 'Ingresos del mes', value: stats?.month?.revenue || 0, format: true },
        ].map((s, i) => (
          <div key={i} className={`${styles.statCard} ${s.alert ? styles.statAlert : ''}`}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.format ? formatPrice(s.value as number) : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Chart */}
        <div className={styles.chartCard}>
          <h2>Pedidos — últimos 7 días</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any, name: string) => [name === 'ingresos' ? formatPrice(value) : value, name === 'ingresos' ? 'Ingresos' : 'Pedidos']} />
                <Bar dataKey="pedidos" fill="#1a1a2e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Sin datos esta semana</p></div>}
        </div>

        {/* Top products */}
        <div className={styles.section}>
          <h2>Más pedidos</h2>
          {(stats?.topProducts || []).length === 0 ? (
            <div className="empty-state"><div className="icon">🍽️</div><p>Sin datos</p></div>
          ) : (
            <div className={styles.topList}>
              {(stats?.topProducts || []).slice(0, 8).map((p: any, i: number) => (
                <div key={p.name} className={styles.topItem}>
                  <span className={styles.topRank}>#{i + 1}</span>
                  <span className={styles.topName}>{p.name}</span>
                  <span className={styles.topCount}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Pedidos recientes</h2>
          <Link to="/admin/orders" className={styles.seeAll}>Ver todos →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>Sin pedidos aún</p></div>
        ) : (
          <div className={styles.ordersList}>
            {recentOrders.map((order) => (
              <div key={order.id} className={styles.orderRow}>
                <div className={styles.orderInfo}>
                  <p className={styles.orderNum}>{order.order_number}</p>
                  <p className={styles.orderMeta}>{orderTypeLabel[order.order_type]}{order.customer_name ? ` · ${order.customer_name}` : ''}</p>
                  <p className={styles.orderDate}>{formatDate(order.created_at)}</p>
                </div>
                <div className={styles.orderRight}>
                  <p className={styles.orderTotal}>{formatPrice(order.total)}</p>
                  <span className="badge" style={{ background: `${orderStatusColor[order.status]}22`, color: orderStatusColor[order.status], fontSize: '0.72rem' }}>{orderStatusLabel[order.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className={styles.quickGrid}>
        {[
          { to: '/admin/orders', icon: '📋', label: 'Gestionar pedidos' },
          { to: '/admin/tables', icon: '🪑', label: 'Mesas' },
          { to: '/admin/products', icon: '🍽️', label: 'Productos' },
          { to: '/admin/stock', icon: '📦', label: 'Stock' },
          { to: '/admin/reports', icon: '📈', label: 'Reportes' },
          { to: '/admin/customers', icon: '👥', label: 'Clientes' },
        ].map((l) => (
          <Link key={l.to} to={l.to} className={styles.quickCard}>
            <span>{l.icon}</span><p>{l.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
