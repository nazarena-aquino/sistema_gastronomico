import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import styles from './AdminLayout.module.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/orders', label: 'Pedidos', icon: '📋' },
  { to: '/admin/tables', label: 'Mesas', icon: '🪑' },
  { to: '/admin/products', label: 'Productos', icon: '🍽️' },
  { to: '/admin/categories', label: 'Categorías', icon: '🏷️' },
  { to: '/admin/stock', label: 'Stock', icon: '📦' },
  { to: '/admin/customers', label: 'Clientes', icon: '👥' },
  { to: '/admin/discounts', label: 'Descuentos', icon: '🏷️' },
  { to: '/admin/reports', label: 'Reportes', icon: '📈' },
  { to: '/admin/qr', label: 'Código QR', icon: '📱' },
  { to: '/admin/config', label: 'Configuración', icon: '⚙️' },
]

export default function AdminLayout() {
  const { admin, logout, checkAuth } = useAuthStore()
  const navigate = useNavigate()
  useEffect(() => { checkAuth() }, [])

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <span className={styles.logo}>🍽️</span>
          <div><p className={styles.title}>Panel Admin</p><p className={styles.sub}>Sistema Gastronómico</p></div>
        </div>
        <nav className={styles.nav}>
          {NAV.map((l) => (
            <NavLink key={l.to} to={l.to} end={'end' in l ? l.end : false}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              <span>{l.icon}</span><span className={styles.label}>{l.label}</span>
            </NavLink>
          ))}
          <div className={styles.divider} />
          <a href="/mozo" target="_blank" className={styles.link}>
            <span>👨‍🍳</span><span className={styles.label}>App Mozos</span>
          </a>
          <a href="/cocina" target="_blank" className={styles.link}>
            <span>👨‍🍳</span><span className={styles.label}>Monitor Cocina</span>
          </a>
        </nav>
        <div className={styles.footer}>
          <div className={styles.user}>
            <span className={styles.avatar}>{admin?.name?.charAt(0) || 'A'}</span>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{admin?.name || 'Admin'}</p>
              <p className={styles.userRole}>{admin?.role}</p>
            </div>
          </div>
          <button className={styles.logout} onClick={() => { logout(); navigate('/admin/login') }} title="Cerrar sesión">🚪</button>
        </div>
      </aside>
      <main className={styles.main}><Outlet /></main>
    </div>
  )
}
