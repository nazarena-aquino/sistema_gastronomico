import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { orderApi } from '../api'
import { Order } from '../types'
import { formatPrice, formatDate, orderStatusLabel, orderStatusColor, orderTypeLabel, paymentMethodLabel, paymentStatusLabel } from '../utils/format'
import styles from './OrderStatusPage.module.css'

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
const FINAL = ['ready', 'delivered', 'cancelled']

export default function OrderStatusPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paymentResult = searchParams.get('payment')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const savedOrder = localStorage.getItem('gastro_last_order')
  const effectiveOrderNumber = orderNumber || savedOrder || ''

  const fetchOrder = async () => {
    if (!effectiveOrderNumber) { setNotFound(true); setLoading(false); return }
    try {
      const res = await orderApi.track(effectiveOrderNumber)
      const o = res.data.data
      setOrder(o)
      if (FINAL.includes(o.status)) { localStorage.removeItem('gastro_last_order'); localStorage.removeItem('gastro_last_order_time') }
    } catch { setNotFound(true) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!orderNumber && savedOrder) { navigate(`/order-status/${savedOrder}`, { replace: true }); return }
    if (!effectiveOrderNumber) { setNotFound(true); setLoading(false); return }
    fetchOrder()
    const interval = setInterval(fetchOrder, 15000)
    return () => clearInterval(interval)
  }, [effectiveOrderNumber])

  if (loading) return (<><Navbar /><div className="loading-center"><div className="spinner" /></div></>)

  if (notFound || !order) return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.center}>
          <div className={styles.centerIcon}>😕</div>
          <h2>No hay pedidos activos</h2>
          <p>Cuando hagas un pedido podés seguirlo desde acá</p>
          <Link to="/menu" className="btn btn-primary">Ver Menú</Link>
        </div>
      </main>
    </>
  )

  const stepIndex = STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {paymentResult === 'success' && <div className={styles.bannerSuccess}>🎉 ¡Pago exitoso! Tu pedido está confirmado.</div>}
          {paymentResult === 'failure' && <div className={styles.bannerError}>❌ El pago no pudo procesarse. Podés pagar en efectivo.</div>}
          {paymentResult === 'pending' && <div className={styles.bannerWarning}>⏳ Tu pago está siendo procesado.</div>}

          <div className={styles.layout}>
            <div className={styles.statusCard}>
              <div className={styles.orderHead}>
                <div>
                  <p className={styles.orderLabel}>Pedido</p>
                  <h1 className={styles.orderNumber}>{order.order_number}</h1>
                </div>
                <span className="badge" style={{ background: `${orderStatusColor[order.status]}22`, color: orderStatusColor[order.status] }}>
                  {orderStatusLabel[order.status]}
                </span>
              </div>
              <p className={styles.orderMeta}>📅 {formatDate(order.created_at)}</p>
              <p className={styles.orderMeta}>{orderTypeLabel[order.order_type]}{order.table_number && ` — Mesa ${order.table_number}`}</p>
              {order.delivery_address && <p className={styles.orderMeta}>📍 {order.delivery_address}</p>}

              {!isCancelled && (
                <div className={styles.progress}>
                  {STEPS.slice(0, -1).map((s, idx) => (
                    <div key={s} className={styles.progressItem}>
                      <div className={`${styles.dot} ${idx <= stepIndex ? styles.dotDone : ''} ${idx === stepIndex ? styles.dotCurrent : ''}`}>
                        {idx < stepIndex ? '✓' : idx + 1}
                      </div>
                      <div className={styles.progressLabel}>{orderStatusLabel[s]}</div>
                      {idx < STEPS.length - 2 && <div className={`${styles.progressLine} ${idx < stepIndex ? styles.lineDone : ''}`} />}
                    </div>
                  ))}
                </div>
              )}
              {isCancelled && <div className={styles.cancelledBox}>❌ Este pedido fue cancelado</div>}

              <div className={styles.paymentRow}>
                <span>💳 Pago:</span>
                <span className={`badge payment-${order.payment_status}`}>
                  {order.payment_method ? paymentMethodLabel[order.payment_method] : '—'} — {paymentStatusLabel[order.payment_status]}
                </span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <h2>Detalle</h2>
              <div className={styles.itemsList}>
                {(order.order_items || []).map((item) => (
                  <div key={item.id} className={styles.detailItem}>
                    <div className={styles.itemLeft}>
                      <span className={styles.qty}>{item.quantity}×</span>
                      <div>
                        <p className={styles.itemName}>{item.product_name}</p>
                        {item.notes && <p className={styles.itemNotes}>📝 {item.notes}</p>}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className={styles.itemMods}>{item.modifiers.map((m) => m.modifier_name).join(', ')}</p>
                        )}
                      </div>
                    </div>
                    <span className={styles.itemSubtotal}>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              {order.discount_amount > 0 && (
                <div className={styles.totalRow} style={{ color: 'var(--color-success)' }}>
                  <span>Descuento</span><span>−{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Total</span><span className={styles.totalAmt}>{formatPrice(order.total)}</span>
              </div>
              {order.order_type === 'delivery' && <p className={styles.deliveryNote}>🚚 El costo de envío se coordina con el local</p>}
              {order.notes && <div className={styles.notes}><strong>Notas:</strong> {order.notes}</div>}
              <div className={styles.actions}>
                <Link to="/menu" className="btn btn-primary btn-sm">+ Nuevo pedido</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
