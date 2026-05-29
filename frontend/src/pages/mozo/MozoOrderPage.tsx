import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tableApi, productApi, orderApi, paymentApi } from '../../api'
import { Table, Product, Category, Order } from '../../types'
import { formatPrice, orderStatusLabel, orderStatusColor } from '../../utils/format'
import { socket } from '../../utils/socket'
import toast from 'react-hot-toast'
import styles from './MozoOrderPage.module.css'

interface CartItem { product_id: string; product_name: string; price: number; quantity: number; notes?: string }

export default function MozoOrderPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const [table, setTable] = useState<Table | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [tab, setTab] = useState<'orders' | 'new'>('orders')

  // Carga inicial
  useEffect(() => {
    loadAll()
  }, [tableId])

  // Websockets — se registran cuando table está cargada
  useEffect(() => {
    if (!table) return

    socket.on('nuevo_pedido', (pedido: any) => {
      if (pedido.order_type !== 'dine_in') return
      const esEstaMesa = pedido.table_id === tableId || pedido.table_number === table.number
      if (!esEstaMesa) return
      setActiveOrders((prev) => {
        if (prev.find((o) => o.id === pedido.id)) return prev
        return [pedido, ...prev]
      })
      setTab('orders')
      toast.success('🆕 Nuevo pedido en esta mesa')
    })

    socket.on('pedido_actualizado', (updated: any) => {
      setActiveOrders((prev) => {
        if (updated.status === 'cancelled' || updated.payment_status === 'paid') {
          return prev.filter((o) => o.id !== updated.id)
        }
        return prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o)
      })
    })

    return () => {
      socket.off('nuevo_pedido')
      socket.off('pedido_actualizado')
    }
  }, [tableId, table])

  const loadAll = async () => {
    try {
      const [tRes, pRes, cRes, oRes] = await Promise.all([
        tableApi.getById(tableId!),
        productApi.getAll(),
        productApi.getCategories(),
        orderApi.getByTable(tableId!),
      ])
      setTable(tRes.data.data)
      setProducts(pRes.data.data || [])
      setCategories(cRes.data.data || [])
      const orders = oRes.data.data || []
      setActiveOrders(orders)
      if (orders.length === 0) setTab('new')
    } catch {} finally { setLoading(false) }
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product_id: product.id, product_name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === productId)
      if (existing && existing.quantity > 1) return prev.map((i) => i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i)
      return prev.filter((i) => i.product_id !== productId)
    })
  }

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error('Agregá al menos un producto'); return }
    setSubmitting(true)
    try {
      await orderApi.create({
        customer_name: customerName || `Mesa ${table?.number}`,
        order_type: 'dine_in',
        table_id: tableId,
        table_number: table?.number,
        items: cart,
        payment_method: 'cash',
        waiter_name: 'Mozo',
      })
      toast.success('Pedido enviado a cocina 🍳')
      setCart([])
      setCustomerName('')
      await loadAll()
      setTab('orders')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error enviando pedido')
    } finally { setSubmitting(false) }
  }

  const handleDeliverAll = async () => {
    const readyOrders = activeOrders.filter((o) => o.status === 'ready')
    try {
      await Promise.all(readyOrders.map((o) => orderApi.updateStatus(o.id, 'delivered')))
      toast.success('Pedido entregado ✅')
      await loadAll()
    } catch { toast.error('Error') }
  }

  const handleChargeAll = async () => {
    const toCharge = activeOrders.filter((o) => o.status === 'delivered' && o.payment_status !== 'paid')
    try {
      await Promise.all(toCharge.map((o) => paymentApi.confirmPayment(o.id)))
      toast.success('Cobro registrado 💰')
      await loadAll()
    } catch { toast.error('Error al registrar cobro') }
  }

  const handleFreeTable = async () => {
    if (!table) return
    try {
      await tableApi.updateStatus(table.id, { status: 'free' })
      toast.success('Mesa liberada')
      navigate('/mozo')
    } catch { toast.error('Error al liberar mesa') }
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const filtered = products.filter((p) => activeCategory === 'all' || p.category_id === activeCategory)
  const hasReadyOrders = activeOrders.some((o) => o.status === 'ready')
  const readyOrders = activeOrders.filter((o) => o.status === 'ready')
  const deliveredUnpaid = activeOrders.filter((o) => o.status === 'delivered' && o.payment_status !== 'paid')
  const combinedTotal = activeOrders.reduce((s, o) => s + o.total, 0)

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/mozo')}>← Mesas</button>
        <h1>Mesa {table?.number}</h1>
        <span className={styles.capacity}>{table?.capacity} personas</span>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === 'orders' ? styles.tabActive : ''} ${hasReadyOrders ? styles.tabReady : ''}`}
          onClick={() => setTab('orders')}
        >
          {hasReadyOrders && <span className={styles.readyDot} />}
          📋 Pedidos activos {activeOrders.length > 0 && `(${activeOrders.length})`}
        </button>
        <button className={`${styles.tabBtn} ${tab === 'new' ? styles.tabActive : ''}`} onClick={() => setTab('new')}>
          ➕ Nuevo pedido
        </button>
      </div>

      {tab === 'orders' && (
        <div className={styles.ordersTab}>
          {activeOrders.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <p>No hay pedidos activos en esta mesa</p>
              <button className="btn btn-primary btn-sm" onClick={() => setTab('new')}>+ Tomar pedido</button>
              {table?.status !== 'free' && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }} onClick={handleFreeTable}>🔓 Liberar mesa</button>
              )}
            </div>
          ) : (
            <div className={`${styles.orderCard} ${hasReadyOrders ? styles.orderReady : ''}`}>
              {activeOrders.map((order, idx) => (
                <div key={order.id}>
                  {activeOrders.length > 1 && (
                    <div className={styles.orderCardHeader}>
                      <span className={styles.orderNum}>{order.order_number}</span>
                      <span className="badge" style={{ background: `${orderStatusColor[order.status]}22`, color: orderStatusColor[order.status] }}>
                        {orderStatusLabel[order.status]}
                      </span>
                    </div>
                  )}
                  <div className={styles.orderItems}>
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className={styles.orderItem}>
                        <span className={styles.itemQty}>{item.quantity}×</span>
                        <span className={styles.itemName}>{item.product_name}</span>
                        <span className={styles.itemPrice}>{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  {idx < activeOrders.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.75rem 0' }} />}
                </div>
              ))}
              <div className={styles.orderTotal}>
                <span>Total</span>
                <strong>{formatPrice(combinedTotal)}</strong>
              </div>
              {readyOrders.length > 0 && (
                <button className={`btn btn-success btn-lg ${styles.deliverBtn}`} onClick={handleDeliverAll}>
                  ✅ Marcar como entregado
                </button>
              )}
              {deliveredUnpaid.length > 0 && readyOrders.length === 0 && (
                <button className={`btn btn-primary btn-lg ${styles.deliverBtn}`} onClick={handleChargeAll}>
                  💰 Cobrar
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', width: '100%' }}
                onClick={handleFreeTable}
              >
                🔓 Liberar mesa
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'new' && (
        <div className={styles.layout}>
          <div className={styles.menu}>
            <div className={styles.categories}>
              <button className={`${styles.catBtn} ${activeCategory === 'all' ? styles.active : ''}`} onClick={() => setActiveCategory('all')}>Todos</button>
              {categories.filter((c) => c.is_active).map((c) => (
                <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.active : ''}`} onClick={() => setActiveCategory(c.id)}>{c.name}</button>
              ))}
            </div>
            <div className={styles.grid}>
              {filtered.map((p) => {
                const cartItem = cart.find((i) => i.product_id === p.id)
                return (
                  <div key={p.id} className={`${styles.productCard} ${!p.is_available ? styles.unavailable : ''}`}>
                    <div className={styles.productInfo}>
                      <h3>{p.name}</h3>
                      {p.description && <p>{p.description.slice(0, 50)}{p.description.length > 50 ? '…' : ''}</p>}
                      <span className={styles.price}>{formatPrice(p.price)}</span>
                    </div>
                    {p.is_available ? (
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
                    ) : <span className={styles.noStock}>Sin stock</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.cart}>
            <h2>Pedido</h2>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Nombre del cliente (opcional)</label>
              <input type="text" className="form-input" placeholder="Ej: Juan" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}><p>🛒</p><p>Agregá productos del menú</p></div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.product_id} className={styles.cartItem}>
                    <div className={styles.cartItemInfo}>
                      <p className={styles.cartItemName}>{item.product_name}</p>
                      <p className={styles.cartItemPrice}>{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className={styles.cartQty}>
                      <button onClick={() => removeFromCart(item.product_id)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCart(products.find((p) => p.id === item.product_id)!)}>+</button>
                    </div>
                  </div>
                ))}
                <div className={styles.cartTotal}>
                  <span>Total</span>
                  <span className={styles.cartTotalAmt}>{formatPrice(total)}</span>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Enviando...' : '🍳 Enviar a cocina'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}