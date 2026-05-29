import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { useConfigStore } from '../../store/authStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const itemCount = useCartStore((s) => s.getItemCount())
  const { config } = useConfigStore()
  const [activeOrder, setActiveOrder] = useState<string | null>(null)

  useEffect(() => {
    setActiveOrder(localStorage.getItem('gastro_last_order'))
  }, [location.pathname])

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            {config?.logo_url
              ? <img src={config.logo_url} alt={config.business_name} />
              : <span>{config?.business_name || 'Restaurante'}</span>
            }
          </Link>
          <div className={styles.links}>
            <Link to="/" className={`${styles.link} ${location.pathname === '/' ? styles.active : ''}`}>Inicio</Link>
            <Link to="/menu" className={`${styles.link} ${location.pathname === '/menu' ? styles.active : ''}`}>Menú</Link>
          </div>
          <Link to="/cart" className={styles.cartBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className={styles.cartLabel}>Carrito</span>
            {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
          </Link>
        </div>
      </nav>
      {activeOrder && !location.pathname.startsWith('/order-status') && (
        <div className={styles.orderBanner}>
          <span>📦 Tenés un pedido en curso</span>
          <button className={styles.bannerBtn} onClick={() => navigate(`/order-status/${activeOrder}`)}>
            Ver estado →
          </button>
        </div>
      )}
    </>
  )
}
