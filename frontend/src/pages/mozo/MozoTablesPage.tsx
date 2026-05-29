import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tableApi } from '../../api'
import { Table } from '../../types'
import { tableStatusLabel, tableStatusColor } from '../../utils/format'
import { socket } from '../../utils/socket'
import styles from './MozoTablesPage.module.css'

export default function MozoTablesPage() {
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const tablesRef = useRef<Table[]>([])
  const [readyTables, setReadyTables] = useState<Set<string>>(new Set())
  const [newOrderTables, setNewOrderTables] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { tablesRef.current = tables }, [tables])

  useEffect(() => {
    load()
    socket.on('mesa_actualizada', load)
    socket.on('nuevo_pedido', (pedido: any) => {
      if (pedido.order_type !== 'dine_in') return
      load()
      const tableId = pedido.table_id || tablesRef.current.find((t) => String(t.number) === String(pedido.table_number))?.id
      if (tableId) {
        setNewOrderTables((prev) => {
          const next = new Set(prev)
          next.add(tableId)
          return next
        })
      }
    })
    socket.on('pedido_actualizado', (pedido: any) => {
      const tableId = pedido.table_id || tablesRef.current.find((t) => String(t.number) === String(pedido.table_number))?.id
      if (!tableId) return
      setReadyTables((prev) => {
        const next = new Set(prev)
        if (pedido.status === 'ready') next.add(tableId)
        else next.delete(tableId)
        return next
      })
      if (['delivered', 'cancelled'].includes(pedido.status) || pedido.payment_status === 'paid') {
        setNewOrderTables((prev) => {
          const next = new Set(prev)
          next.delete(tableId)
          return next
        })
      }
    })
    return () => {
      socket.off('mesa_actualizada')
      socket.off('nuevo_pedido')
      socket.off('pedido_actualizado')
    }
  }, [])

  const load = async () => {
    try {
      const res = await tableApi.getAll()
      setTables(res.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  const handleTableClick = (table: Table) => {
    // Limpiar badge de nuevo pedido al entrar a la mesa
    setNewOrderTables((prev) => {
      const next = new Set(prev)
      next.delete(table.id)
      return next
    })
    navigate(`/mozo/order/${table.id}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Mesas</h1>
      </div>

      <div className={styles.legend}>
        {Object.entries(tableStatusLabel).map(([status, label]) => (
          <div key={status} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: tableStatusColor[status] }} />
            <span>{label}</span>
          </div>
        ))}
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#3B82F6' }} />
          <span>🆕 Pedido nuevo</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#10B981' }} />
          <span>✅ Listo para entregar</span>
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className={styles.list}>
          {tables.length === 0 ? (
            <div className="empty-state"><div className="icon">🪑</div><p>No hay mesas configuradas</p></div>
          ) : (
            tables.map((table) => {
              const isReady = readyTables.has(table.id)
              const hasNew = newOrderTables.has(table.id)
              return (
                <div
                  key={table.id}
                  className={`${styles.listItem} ${isReady ? styles.listItemReady : ''} ${hasNew && !isReady ? styles.listItemNew : ''}`}
                  onClick={() => handleTableClick(table)}
                  style={{ borderLeftColor: isReady ? '#10B981' : hasNew ? '#3B82F6' : tableStatusColor[table.status] }}
                >
                  <div className={styles.listMain}>
                    <div className={styles.listTableNum}>Mesa {table.number}</div>
                    <div className={styles.listMeta}>{table.capacity} personas · {table.zone || 'Principal'}</div>
                  </div>
                  {isReady ? (
                    <span className={styles.readyBadge}>✅ Listo para entregar</span>
                  ) : hasNew ? (
                    <span className={styles.newBadge}>🆕 Pedido nuevo</span>
                  ) : (
                    <span className="badge" style={{ background: `${tableStatusColor[table.status]}22`, color: tableStatusColor[table.status] }}>
                      {tableStatusLabel[table.status]}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}