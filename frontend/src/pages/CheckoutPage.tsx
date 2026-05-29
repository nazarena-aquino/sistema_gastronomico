import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { useCartStore } from '../store/cartStore'
import { orderApi, paymentApi, discountApi } from '../api'
import { OrderType, PaymentMethod, Discount } from '../types'
import { formatPrice } from '../utils/format'
import toast from 'react-hot-toast'
import styles from './CheckoutPage.module.css'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const total = getTotal()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [tableNumber, setTableNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago')
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const table = params.get('table')
    if (table) { setOrderType('dine_in'); setTableNumber(table) }
    discountApi.getActive().then((r) => setDiscounts(r.data.data || [])).catch(() => {})
  }, [])

  const discountAmount = selectedDiscount
    ? selectedDiscount.type === 'percentage'
      ? total * (selectedDiscount.value / 100)
      : selectedDiscount.value
    : 0
  const finalTotal = Math.max(0, total - discountAmount)

  if (items.length === 0) return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem' }}>🛒</p>
          <p>Tu carrito está vacío</p>
          <Link to="/menu" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ver Menú</Link>
        </div>
      </main>
    </>
  )

  const validateStep1 = () => {
    if (orderType === 'dine_in' && !tableNumber.trim()) { toast.error('Ingresá el número de mesa'); return false }
    if (orderType === 'delivery' && !deliveryAddress.trim()) { toast.error('Ingresá la dirección'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error('Ingresá tu nombre'); return }
    if (!customerPhone.trim()) { toast.error('Ingresá tu teléfono'); return }
    setLoading(true)
    try {
      const orderData = {
        customer_name: customerName, customer_phone: customerPhone,
        order_type: orderType,
        table_number: orderType === 'dine_in' ? tableNumber : undefined,
        delivery_address: orderType === 'delivery' ? deliveryAddress : undefined,
        delivery_notes: orderType === 'delivery' ? deliveryNotes : undefined,
        items: items.map((i) => ({ product_id: i.product_id, product_name: i.product_name, price: i.price, quantity: i.quantity, notes: i.notes, modifiers: i.modifiers })),
        payment_method: paymentMethod,
        discount_id: selectedDiscount?.id,
        notes: orderNotes || undefined,
      }
      const res = await orderApi.create(orderData)
      const order = res.data.data
      localStorage.setItem('gastro_last_order', order.order_number)

      if (paymentMethod === 'mercadopago') {
        const prefRes = await paymentApi.createPreference(order.id)
        const { init_point, sandbox_init_point } = prefRes.data.data
        clearCart()
        toast.success('Redirigiendo a MercadoPago...')
        const mpUrl = import.meta.env.DEV ? sandbox_init_point : init_point
        setTimeout(() => { window.location.href = mpUrl }, 800)
      } else {
        clearCart()
        toast.success(paymentMethod === 'transfer' ? '¡Pedido recibido! Realizá la transferencia.' : '¡Pedido recibido!')
        navigate(`/order-status/${order.order_number}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al procesar el pedido')
    } finally { setLoading(false) }
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.layout}>
            <div className={styles.form}>
              <h1 className={styles.title}>Confirmar Pedido</h1>
              <div className={styles.steps}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}><span>1</span> Tipo de pedido</div>
                <div className={styles.stepLine} />
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}><span>2</span> Datos y pago</div>
              </div>

              {step === 1 && (
                <div className={styles.content}>
                  <button className={styles.backBtn} onClick={() => navigate('/cart')}>← Volver al carrito</button>
                  <h2>¿Cómo querés tu pedido?</h2>
                  <div className={styles.orderTypes}>
                    {[
                      { value: 'dine_in', icon: '🍽️', label: 'En el local', desc: 'Consumo en mesa' },
                      { value: 'takeaway', icon: '🛍️', label: 'Para llevar', desc: 'Retirás en el local' },
                      { value: 'delivery', icon: '🚚', label: 'Delivery', desc: 'Envío a domicilio' },
                    ].map((opt) => (
                      <label key={opt.value} className={`${styles.typeCard} ${orderType === opt.value ? styles.selected : ''}`}>
                        <input type="radio" name="orderType" value={opt.value} checked={orderType === opt.value} onChange={() => setOrderType(opt.value as OrderType)} hidden />
                        <span className={styles.typeIcon}>{opt.icon}</span>
                        <div><strong>{opt.label}</strong><small>{opt.desc}</small></div>
                        {orderType === opt.value && <span className={styles.check}>✓</span>}
                      </label>
                    ))}
                  </div>
                  {orderType === 'dine_in' && (
                    <div className="form-group">
                      <label className="form-label">Número de mesa *</label>
                      <input type="text" className="form-input" placeholder="Ej: 5" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
                    </div>
                  )}
                  {orderType === 'delivery' && (
                    <>
                      <div className={styles.infoBox}><span>ℹ️</span><p>El costo de envío <strong>no está incluido</strong> y se coordina con el local.</p></div>
                      <div className="form-group">
                        <label className="form-label">Dirección *</label>
                        <input type="text" className="form-input" placeholder="Calle, número, piso..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Referencia</label>
                        <textarea className="form-textarea" placeholder="Timbre, portón..." value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
                      </div>
                    </>
                  )}
                  <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} onClick={() => { if (validateStep1()) setStep(2) }}>Continuar →</button>
                </div>
              )}

              {step === 2 && (
                <div className={styles.content}>
                  <button className={styles.backBtn} onClick={() => setStep(1)}>← Volver</button>
                  <h2>Tus datos</h2>
                  <div className={styles.fieldsRow}>
                    <div className="form-group">
                      <label className="form-label">Nombre *</label>
                      <input type="text" className="form-input" placeholder="Tu nombre" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono *</label>
                      <input type="tel" className="form-input" placeholder="+54 9..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas del pedido</label>
                    <textarea className="form-textarea" placeholder="Alergias, preferencias..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
                  </div>

                  {/* Descuentos */}
                  {discounts.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Descuento</label>
                      <select className="form-select" value={selectedDiscount?.id || ''} onChange={(e) => { const d = discounts.find((d) => d.id === e.target.value); setSelectedDiscount(d || null) }}>
                        <option value="">Sin descuento</option>
                        {discounts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} — {d.type === 'percentage' ? `${d.value}%` : formatPrice(d.value)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <h2 style={{ marginTop: '1rem' }}>Método de pago</h2>
                  <div className={styles.payments}>
                    {[
                      { value: 'mercadopago', icon: '💳', label: 'MercadoPago', desc: 'Tarjeta, QR, saldo' },
                      { value: 'transfer', icon: '🏦', label: 'Transferencia', desc: 'Alias: ver al confirmar' },
                      { value: 'cash', icon: '💵', label: 'Efectivo', desc: 'Pagás al retirar' },
                      { value: 'card', icon: '💳', label: 'Tarjeta POS', desc: 'Con posnet en el local' },
                    ].map((opt) => (
                      <label key={opt.value} className={`${styles.payCard} ${paymentMethod === opt.value ? styles.selected : ''}`}>
                        <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value as PaymentMethod)} hidden />
                        <span style={{ fontSize: '1.6rem' }}>{opt.icon}</span>
                        <div><strong>{opt.label}</strong><small>{opt.desc}</small></div>
                        {paymentMethod === opt.value && <span className={styles.check}>✓</span>}
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'transfer' && (
                    <div className={styles.transferInfo}>
                      <p className={styles.transferTitle}>📲 Datos para transferir</p>
                      <div className={styles.transferRow}><span>Alias</span><strong>Ver en configuración del local</strong></div>
                      <div className={styles.transferRow}><span>Monto</span><strong>{formatPrice(finalTotal)}</strong></div>
                      <p className={styles.transferNote}>⚠️ El local verifica la transferencia y confirma el pedido.</p>
                    </div>
                  )}

                  <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Procesando...' : paymentMethod === 'mercadopago' ? '💳 Ir a pagar con MercadoPago' : '✓ Confirmar pedido'}
                  </button>
                </div>
              )}
            </div>

            <div className={styles.sidebar}>
              <div className={styles.summaryBox}>
                <h2>Tu pedido</h2>
                {items.map((item) => (
                  <div key={item.product_id} className={styles.summaryItem}>
                    <span className={styles.summaryQty}>{item.quantity}×</span>
                    <span className={styles.summaryName}>{item.product_name}</span>
                    <span className={styles.summaryPrice}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className={styles.summaryDivider} />
                <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(total)}</span></div>
                {discountAmount > 0 && <div className={styles.summaryRow} style={{ color: 'var(--color-success)' }}><span>Descuento</span><span>−{formatPrice(discountAmount)}</span></div>}
                {orderType === 'delivery' && <div className={styles.summaryRow}><span>Envío</span><span>A coordinar</span></div>}
                <div className={styles.summaryTotal}><span>Total</span><span className={styles.totalAmt}>{formatPrice(finalTotal)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
