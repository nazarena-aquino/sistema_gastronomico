import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { configApi, productApi } from '../api'
import { useConfigStore } from '../store/authStore'
import { formatPrice } from '../utils/format'
import { api } from '../api'
import toast from 'react-hot-toast'
import styles from './ReservationPage.module.css'

interface CartItem { product_id: string; product_name: string; price: number; quantity: number }

const DAYS: Record<string, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

const generateTimeSlots = (open: string, close: string): string[] => {
  const slots: string[] = []
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  let h = oh, m = om
  const closeMin = ch * 60 + cm
  while (h * 60 + m < closeMin - 30) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) { h++; m = 0 }
  }
  return slots
}

const getTodayMin = () => {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function ReservationPage() {
  const { config } = useConfigStore()
  const [step, setStep] = useState(1)
  const [type, setType] = useState<'table' | 'preorder' | ''>('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [people, setPeople] = useState(2)
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const timeSlots = (() => {
    if (!date || !config?.opening_hours) return []
    const dayKey = DAYS[new Date(date + 'T12:00:00').getDay()]
    const dayConfig = config.opening_hours[dayKey]
    if (!dayConfig?.is_open) return []
    return generateTimeSlots(dayConfig.open, dayConfig.close)
  })()

  const isDayAvailable = (d: string) => {
    if (!config?.opening_hours) return true
    const dayKey = DAYS[new Date(d + 'T12:00:00').getDay()]
    return config.opening_hours[dayKey]?.is_open !== false
  }

  useEffect(() => {
    if (type === 'preorder') {
      productApi.getAll().then(r => setProducts(r.data.data || [])).catch(() => {})
      productApi.getCategories().then(r => setCategories(r.data.data || [])).catch(() => {})
    }
  }, [type])

  useEffect(() => {
    if (date && !isDayAvailable(date)) {
      toast.error('El local no abre ese día'); setDate(''); setTime('')
    } else {
      setTime('')
    }
  }, [date])

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id)
      if (ex) return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product_id: p.id, product_name: p.name, price: p.price, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === productId)
      if (ex && ex.quantity > 1) return prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter(i => i.product_id !== productId)
    })
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const filtered = products.filter(p => activeCategory === 'all' || p.category_id === activeCategory)

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Ingresá tu nombre'); return }
    setSubmitting(true)
    try {
      await api.post('/reservations', {
        customer_name: name.trim(),
        customer_email: email || null,
        customer_phone: phone || null,
        reservation_type: type,
        people_count: people,
        date, time,
        notes: notes || null,
        items: cart,
        total: cartTotal,
      })
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error enviando la reserva')
    } finally { setSubmitting(false) }
  }

  if (done) return (
    <>
      <Navbar />
      <div className={styles.successWrap}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2>¡Reserva enviada!</h2>
          <p>Revisaremos tu solicitud y te confirmaremos a la brevedad{email ? ' por email' : ''}.</p>
          <div className={styles.successDetails}>
            <p><strong>📅</strong> {new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p><strong>🕐</strong> {time}</p>
            <p><strong>👥</strong> {people} persona{people !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.5rem' }}>Volver al inicio</Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Hacer una reserva</h1>
            <p>En {config?.business_name || 'nuestro local'}</p>
          </div>

          {/* Progress */}
          <div className={styles.progress}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`${styles.progressStep} ${step >= s ? styles.progressActive : ''}`}>
                <span className={styles.progressDot}>{step > s ? '✓' : s}</span>
                <span className={styles.progressLabel}>
                  {s === 1 ? 'Tipo' : s === 2 ? 'Fecha y hora' : s === 3 ? type === 'preorder' ? 'Productos' : 'Confirmar' : 'Confirmar'}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Type */}
          {step === 1 && (
            <div className={styles.stepCard}>
              <h2>¿Qué querés reservar?</h2>
              <div className={styles.typeGrid}>
                <button
                  className={`${styles.typeCard} ${type === 'table' ? styles.typeSelected : ''}`}
                  onClick={() => setType('table')}
                >
                  <span className={styles.typeIcon}>🪑</span>
                  <strong>Solo mesa</strong>
                  <p>Reservá tu lugar y elegís en el momento</p>
                </button>
                <button
                  className={`${styles.typeCard} ${type === 'preorder' ? styles.typeSelected : ''}`}
                  onClick={() => setType('preorder')}
                >
                  <span className={styles.typeIcon}>📋</span>
                  <strong>Mesa + pre-pedido</strong>
                  <p>Elegí los productos de antemano</p>
                </button>
              </div>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '1.5rem' }}
                disabled={!type}
                onClick={() => setStep(2)}
              >
                Continuar →
              </button>
            </div>
          )}

          {/* Step 2: Date / Time / People */}
          {step === 2 && (
            <div className={styles.stepCard}>
              <h2>¿Cuándo y cuántos?</h2>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    min={getTodayMin()}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cantidad de personas</label>
                  <select className="form-select" value={people} onChange={e => setPeople(Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} persona{n !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
              {date && timeSlots.length === 0 && (
                <p className={styles.closedMsg}>⚠️ El local no abre ese día. Elegí otra fecha.</p>
              )}
              {date && timeSlots.length > 0 && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Hora</label>
                  <div className={styles.timeGrid}>
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        className={`${styles.timeSlot} ${time === slot ? styles.timeSelected : ''}`}
                        onClick={() => setTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.stepActions}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Atrás</button>
                <button
                  className="btn btn-primary"
                  disabled={!date || !time}
                  onClick={() => setStep(type === 'preorder' ? 3 : 4)}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Products (only preorder) */}
          {step === 3 && type === 'preorder' && (
            <div className={styles.stepCard}>
              <h2>Elegí los productos</h2>
              <div className={styles.categories}>
                <button className={`${styles.catBtn} ${activeCategory === 'all' ? styles.catActive : ''}`} onClick={() => setActiveCategory('all')}>Todos</button>
                {categories.filter(c => c.is_active).map(c => (
                  <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.catActive : ''}`} onClick={() => setActiveCategory(c.id)}>{c.name}</button>
                ))}
              </div>
              <div className={styles.productGrid}>
                {filtered.filter(p => p.is_available).map(p => {
                  const cartItem = cart.find(i => i.product_id === p.id)
                  return (
                    <div key={p.id} className={styles.productCard}>
                      {p.image_url && <img src={p.image_url} alt={p.name} className={styles.productImg} />}
                      <div className={styles.productInfo}>
                        <strong>{p.name}</strong>
                        <span>{formatPrice(p.price)}</span>
                      </div>
                      <div className={styles.qtyControl}>
                        {cartItem ? (
                          <>
                            <button onClick={() => removeFromCart(p.id)}>−</button>
                            <span>{cartItem.quantity}</span>
                            <button onClick={() => addToCart(p)}>+</button>
                          </>
                        ) : (
                          <button className={styles.addBtn} onClick={() => addToCart(p)}>+ Agregar</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {cart.length > 0 && (
                <div className={styles.cartSummary}>
                  <span>{cart.reduce((s, i) => s + i.quantity, 0)} productos</span>
                  <strong>{formatPrice(cartTotal)}</strong>
                </div>
              )}
              <div className={styles.stepActions}>
                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Atrás</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 4: Contact + Confirm */}
          {step === 4 && (
            <div className={styles.stepCard}>
              <h2>Tus datos y confirmación</h2>

              {/* Summary */}
              <div className={styles.summary}>
                <div className={styles.summaryRow}><span>Tipo</span><strong>{type === 'table' ? '🪑 Solo mesa' : '📋 Mesa + pre-pedido'}</strong></div>
                <div className={styles.summaryRow}><span>Fecha</span><strong>{new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>
                <div className={styles.summaryRow}><span>Hora</span><strong>{time}</strong></div>
                <div className={styles.summaryRow}><span>Personas</span><strong>{people}</strong></div>
                {cart.length > 0 && <div className={styles.summaryRow}><span>Pre-pedido</span><strong>{formatPrice(cartTotal)}</strong></div>}
              </div>

              <div className={styles.formGrid} style={{ marginTop: '1.25rem' }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="Para la confirmación" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input className="form-input" placeholder="Opcional" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Notas (opcional)</label>
                  <textarea className="form-input" rows={2} placeholder="Alergias, pedidos especiales..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>

              <div className={styles.stepActions}>
                <button className="btn btn-secondary" onClick={() => setStep(type === 'preorder' ? 3 : 2)}>← Atrás</button>
                <button className="btn btn-primary btn-lg" disabled={submitting || !name.trim()} onClick={handleSubmit}>
                  {submitting ? 'Enviando...' : '✅ Confirmar reserva'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
