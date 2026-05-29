import { useEffect, useState } from 'react'
import { orderApi } from '../../api'
import { Order } from '../../types'
import { socket } from '../../utils/socket'
import toast from 'react-hot-toast'
import styles from './CocinaPage.module.css'

export default function CocinaPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    socket.emit('join_cocina')
    load()
    socket.on('nuevo_pedido', (pedido) => {
      setOrders((prev) => {
        if (prev.find((o) => o.id === pedido.id)) return prev
        return [pedido, ...prev]
      })
      toast.success(`🆕 Nuevo pedido: ${pedido.order_number}`)
    })
    socket.on('pedido_actualizado', (updated) => {
      setOrders((prev) => {
        if (['cancelled', 'delivered'].includes(updated.status)) {
          return prev.filter((o) => o.id !== updated.id)
        }
        if (updated.status === 'ready') {
          return prev.filter((o) => o.id !== updated.id)
        }
        return prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o)
      })
    })
    const interval = setInterval(load, 30000)
    return () => {
      socket.off('nuevo_pedido')
      socket.off('pedido_actualizado')
      clearInterval(interval)
    }
  }, [])

  const load = async () => {
    try {
      const res = await orderApi.getAll({ limit: 50 })
      const allOrders = res.data.data.orders || []
      setOrders(allOrders.filter((o: Order) =>
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      ))
    } catch {} finally { setLoading(false) }
  }

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, status)
      if (status === 'ready') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        toast.success('Pedido listo ✅ — el mozo fue notificado')
      } else {
        setOrders((prev) => prev.map((o) =>
          o.id === orderId ? { ...o, status: status as any } : o
        ))
      }
    } catch { toast.error('Error actualizando estado') }
  }

  const updateItemStatus = async (itemId: string, status: string, orderId: string) => {
    try {
      await orderApi.updateItemStatus(itemId, status)
      setOrders((prev) => prev.map((o) => {
        if (o.id !== orderId) return o
        return {
          ...o,
          order_items: o.order_items?.map((i) =>
            i.id === itemId ? { ...i, status: status as any } : i
          )
        }
      }))
    } catch {}
  }

  const getElapsedMinutes = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)

  const getUrgencyClass = (minutes: number) => {
    if (minutes >= 20) return styles.urgent
    if (minutes >= 10) return styles.warning
    return ''
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>🍳 Monitor de Cocina</h1>
        <div className={styles.headerRight}>
          <span className={styles.count}>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} activo{orders.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={load}>🔄</button>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✅</div>
          <h2>Todo al día</h2>
          <p>No hay pedidos pendientes en cocina</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {orders.map((order) => {
            const elapsed = getElapsedMinutes(order.created_at)
            return (
              <div
                key={order.id}
                className={`${styles.orderCard} ${getUrgencyClass(elapsed)} ${order.status === 'preparing' ? styles.preparing : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.orderNum}>{order.order_number}</div>
                  <div className={styles.cardMeta}>
                    {order.table_number && (
                      <span className={styles.table}>Mesa {order.table_number}</span>
                    )}
                    {order.customer_name && order.order_type !== 'dine_in' && (
                      <span>{order.customer_name}</span>
                    )}
                    {order.order_type === 'takeaway' && <span className={styles.table}>Para llevar</span>}
                    {order.order_type === 'delivery' && <span className={styles.table}>Delivery</span>}
                  </div>
                  <div className={`${styles.elapsed} ${elapsed >= 15 ? styles.elapsedUrgent : ''}`}>
                    ⏱ {elapsed}min
                  </div>
                </div>

                <div className={styles.items}>
                  {(order.order_items || []).map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.item} ${item.status === 'ready' ? styles.itemReady : ''}`}
                    >
                      <div className={styles.itemLeft}>
                        <span className={styles.itemQty}>{item.quantity}×</span>
                        <div>
                          <p className={styles.itemName}>{item.product_name}</p>
                          {item.notes && <p className={styles.itemNotes}>📝 {item.notes}</p>}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <p className={styles.itemMods}>
                              {item.modifiers.map((m) => m.modifier_name).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        className={`${styles.itemStatus} ${item.status === 'ready' ? styles.itemStatusReady : item.status === 'preparing' ? styles.itemStatusPreparing : ''}`}
                        onClick={() => updateItemStatus(item.id, item.status === 'ready' ? 'pending' : 'ready', order.id)}
                      >
                        {item.status === 'ready' ? '✓' : item.status === 'preparing' ? '🔥' : '○'}
                      </button>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className={styles.orderNotes}>📝 {order.notes}</div>
                )}

                <div className={styles.cardActions}>
                  {order.status === 'pending' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => updateStatus(order.id, 'confirmed')}
                    >
                      👀 Confirmar pedido
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      className="btn btn-warning btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => updateStatus(order.id, 'preparing')}
                    >
                      🔥 Empezar a preparar
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => updateStatus(order.id, 'ready')}
                    >
                      ✅ Listo para entregar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}