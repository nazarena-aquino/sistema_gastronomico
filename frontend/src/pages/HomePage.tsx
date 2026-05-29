import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { productApi, configApi } from '../api'
import { Product } from '../types'
import { formatPrice } from '../utils/format'
import { useCartStore } from '../store/cartStore'
import { useConfigStore } from '../store/authStore'
import toast from 'react-hot-toast'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([])
  const { config } = useConfigStore()
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    productApi.getAll({ featured: true }).then((r) => {
      setFeatured((r.data.data || []).slice(0, 6))
    }).catch(() => {})
  }, [])

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className={styles.hero} style={{ '--primary': config?.primary_color || '#1a1a2e' } as any}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{config?.business_type || 'Restaurante'}</p>
            <h1 className={styles.title}>{config?.business_name || 'Bienvenido'}</h1>
            <p className={styles.subtitle}>Pedí desde tu mesa, para llevar o con envío. Rápido, fácil y seguro.</p>
            <div className={styles.heroBtns}>
              <Link to="/menu" className="btn btn-accent btn-lg">Ver Menú</Link>
              <Link to="/menu" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>Hacer un pedido</Link>
            </div>
          </div>
          <div className={styles.heroStats}>
            {config?.dine_in_available && <div className={styles.stat}><span>🍽️</span><p>En el local</p></div>}
            {config?.takeaway_available && <div className={styles.stat}><span>🛍️</span><p>Para llevar</p></div>}
            {config?.delivery_available && <div className={styles.stat}><span>🚚</span><p>Delivery</p></div>}
            <div className={styles.stat}><span>💳</span><p>MercadoPago</p></div>
          </div>
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className={styles.featured}>
            <div className="container">
              <h2 className={styles.sectionTitle}>⭐ Más pedidos</h2>
              <div className={styles.grid}>
                {featured.map((p) => (
                  <div key={p.id} className={styles.productCard}>
                    <div className={styles.productImg}>
                      {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span>🍽️</span>}
                    </div>
                    <div className={styles.productInfo}>
                      <h3>{p.name}</h3>
                      {p.description && <p>{p.description}</p>}
                      <div className={styles.productFooter}>
                        <span className={styles.price}>{formatPrice(p.price)}</span>
                        <button className="btn btn-primary btn-sm" onClick={() => { addItem({ product_id: p.id, product_name: p.name, price: p.price }); toast.success(`${p.name} agregado`); }}>
                          + Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to="/menu" className="btn btn-secondary">Ver carta completa →</Link>
              </div>
            </div>
          </section>
        )}

        {/* Info */}
        {config && (
          <section className={styles.info}>
            <div className="container">
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}><span>📍</span><div><strong>Dónde estamos</strong><p>{config.address || 'Consultar'}</p></div></div>
                <div className={styles.infoCard}><span>📞</span><div><strong>Contacto</strong><p>{config.phone || '-'}</p></div></div>
                <div className={styles.infoCard}><span>{config.is_open ? '🟢' : '🔴'}</span><div><strong>Estado</strong><p>{config.is_open ? 'Abierto ahora' : 'Cerrado'}</p></div></div>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <p>🍽️ {config?.business_name || 'Restaurante'}</p>
          <Link to="/admin" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Admin</Link>
        </div>
      </footer>
    </>
  )
}
