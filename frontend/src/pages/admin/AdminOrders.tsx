import { useEffect, useState } from 'react'
import { orderApi, paymentApi } from '../../api'
import { Order, OrderStatus } from '../../types'
import { formatPrice, formatDate, orderStatusLabel, orderStatusColor, orderTypeLabel, paymentMethodLabel, paymentStatusLabel } from '../../utils/format'
import { socket } from '../../utils/socket'
import toast from 'react-hot-toast'
import styles from './AdminOrders.module.css'

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 20

  useEffect(() => {
    load()
    socket.on('nuevo_pedido', (pedido) => {
      setOrders((prev) => [pedido, ...prev])
      toast.success(`🆕 Nuevo pedido: ${pedido.order_number}`)
    })
    socket.on('pedido_actualizado', (updated) => {
      setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o))
      setSelectedOrder((prev: any) => prev?.id === updated.id ? { ...prev, ...updated } : prev)
    })
    return () => { socket.off('nuevo_pedido'); socket.off('pedido_actualizado') }
  }, [filterStatus, filterType, page])

  const load = async () => {
    try {
      const params: any = { page, limit: LIMIT }
      if (filterStatus) params.status = filterStatus
      if (filterType) params.order_type = filterType
      const res = await orderApi.getAll(params)
      setOrders(res.data.data.orders || [])
      setTotal(res.data.data.total || 0)
    } catch {} finally { setLoading(false) }
  }

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, status)
      toast.success(`Estado: ${orderStatusLabel[status]}`)
      load()
    } catch { toast.error('Error actualizando estado') }
  }

  const confirmPayment = async (orderId: string) => {
    try {
      await paymentApi.confirmPayment(orderId)
      toast.success('Pago confirmado')
      load()
      setSelectedOrder((prev: any) => prev?.id === orderId ? { ...prev, payment_status: 'paid' } : prev)
    } catch { toast.error('Error confirmando pago') }
  }

  const handlePrint = (order: Order) => {
    const items = (order.order_items || []).map((i) =>
      `${i.quantity}x ${i.product_name}${i.notes ? ` (${i.notes})` : ''} - ${formatPrice(i.subtotal)}`
    ).join('\n')
    const content = `COMANDA - ${order.order_number}
================================
${orderTypeLabel[order.order_type]}${order.table_number ? ` - Mesa ${order.table_number}` : ''}
${order.customer_name ? `Cliente: ${order.customer_name}` : ''}
${order.customer_phone ? `Tel: ${order.customer_phone}` : ''}
Fecha: ${formatDate(order.created_at)}
================================
${items}
================================
${order.discount_amount > 0 ? `Descuento: -${formatPrice(order.discount_amount)}\n` : ''}TOTAL: ${formatPrice(order.total)}
${order.notes ? `\nNotas: ${order.notes}` : ''}
================================`
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px">${content}</pre>`)
      win.document.close()
      win.print()
    }
    orderApi.markPrinted(order.id).catch(() => {})
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Pedidos</h1>
          <p>{total} pedido{total !== 1 ? 's' : ''} en total</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Actualizar</button>
      </div>

      <div className={styles.filters}>
        <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{orderStatusLabel[s]}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}>
          <option value="">Todos los tipos</option>
          <option value="dine_in">En el local</option>
          <option value="takeaway">Para llevar</option>
          <option value="delivery">Delivery</option>
          <option value="counter">Mostrador</option>
        </select>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {loading ? <div className="loading-center"><div className="spinner" /></div>
            : orders.length === 0 ? <div className="empty-state"><div className="icon">📋</div><p>Sin pedidos</p></div>
            : orders.map((order) => (
              <div key={order.id} className={`${styles.orderCard} ${selectedOrder?.id === order.id ? styles.selected : ''}`} onClick={() => setSelectedOrder(order)}>
                <div className={styles.cardTop}>
                  <span className={styles.orderNum}>{order.order_number}</span>
                  <span className="badge" style={{ background: `${orderStatusColor[order.status]}22`, color: orderStatusColor[order.status], fontSize: '0.72rem' }}>
                    {orderStatusLabel[order.status]}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span>{orderTypeLabel[order.order_type]}</span>
                  {order.table_number && <span>· Mesa {order.table_number}</span>}
                  {order.customer_name && <span>· {order.customer_name}</span>}
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.cardTime}>{formatDate(order.created_at)}</span>
                  <span className={styles.cardTotal}>{formatPrice(order.total)}</span>
                </div>
                {order.payment_status === 'pending' && order.payment_method !== 'mercadopago' && (
                  <span className={styles.pendingBadge}>💳 Pago pendiente</span>
                )}
              </div>
            ))
          }
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Anterior</button>
              <span>{page} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente →</button>
            </div>
          )}
        </div>

        <div className={styles.detail}>
          {!selectedOrder ? (
            <div className="empty-state"><div className="icon">👆</div><p>Seleccioná un pedido</p></div>
          ) : (
            <div className={styles.detailContent}>
              <div className={styles.detailHeader}>
                <h2>{selectedOrder.order_number}</h2>
                <div className={styles.detailHeaderActions}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(selectedOrder)}>🖨️ Imprimir</button>
                  <button className={styles.closeBtn} onClick={() => setSelectedOrder(null)}>✕</button>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaRow}><span>Tipo</span><strong>{orderTypeLabel[selectedOrder.order_type]}</strong></div>
                {selectedOrder.table_number && <div className={styles.metaRow}><span>Mesa</span><strong>{selectedOrder.table_number}</strong></div>}
                {selectedOrder.delivery_address && <div className={styles.metaRow}><span>Dirección</span><strong>{selectedOrder.delivery_address}</strong></div>}
                {selectedOrder.customer_name && <div className={styles.metaRow}><span>Cliente</span><strong>{selectedOrder.customer_name}</strong></div>}
                {selectedOrder.customer_phone && (
                  <div className={styles.metaRow}>
                    <span>Teléfono</span>
                    <a href={`tel:${selectedOrder.customer_phone}`}><strong>{selectedOrder.customer_phone}</strong></a>
                  </div>
                )}
                {selectedOrder.waiter_name && <div className={styles.metaRow}><span>Mozo</span><strong>{selectedOrder.waiter_name}</strong></div>}
                <div className={styles.metaRow}><span>Fecha</span><strong>{formatDate(selectedOrder.created_at)}</strong></div>
                {selectedOrder.notes && <div className={styles.metaRow}><span>Notas</span><strong>{selectedOrder.notes}</strong></div>}
              </div>

              <h3 className={styles.sectionTitle}>Productos</h3>
              <div className={styles.itemsList}>
                {(selectedOrder.order_items || []).map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <span className={styles.itemQty}>{item.quantity}×</span>
                    <div className={styles.itemInfo}>
                      <p>{item.product_name}</p>
                      {item.modifiers && item.modifiers.length > 0 && <small className={styles.itemMods}>{item.modifiers.map((m: any) => m.modifier_name).join(', ')}</small>}
                      {item.notes && <small>📝 {item.notes}</small>}
                    </div>
                    <span className={styles.itemPrice}>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {selectedOrder.discount_amount > 0 && (
                <div className={styles.totalRow} style={{ color: 'var(--color-success)' }}>
                  <span>Descuento</span><span>−{formatPrice(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Total</span><strong>{formatPrice(selectedOrder.total)}</strong>
              </div>

              <h3 className={styles.sectionTitle}>Cambiar estado</h3>
              <div className={styles.statusBtns}>
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} className="btn btn-sm"
                    onClick={() => updateStatus(selectedOrder.id, s)}
                    disabled={selectedOrder.status === s}
                    style={{
                      borderColor: orderStatusColor[s],
                      color: selectedOrder.status === s ? 'white' : orderStatusColor[s],
                      background: selectedOrder.status === s ? orderStatusColor[s] : 'transparent',
                      border: `2px solid ${orderStatusColor[s]}`,
                    }}>
                    {orderStatusLabel[s]}
                  </button>
                ))}
              </div>

              <h3 className={styles.sectionTitle}>Estado del pago</h3>
              {selectedOrder.payment_status === 'paid' ? (
                <div className={styles.paidBox}>
                  ✓ Pago confirmado — {selectedOrder.payment_method ? paymentMethodLabel[selectedOrder.payment_method] : '-'}
                </div>
              ) : (
                <div className={styles.pendingPayBox}>
                  <div className={styles.pendingPayInfo}>
                    ⏳ Pendiente — {selectedOrder.payment_method ? paymentMethodLabel[selectedOrder.payment_method] : '-'}
                  </div>
                  <button className="btn btn-success btn-sm" style={{ width: '100%' }} onClick={() => confirmPayment(selectedOrder.id)}>
                    ✓ Confirmar pago recibido
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
