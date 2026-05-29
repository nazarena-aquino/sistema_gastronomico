import { useEffect, useState } from 'react'
import { api } from '../../api'
import { socket } from '../../utils/socket'
import { formatPrice } from '../../utils/format'
import toast from 'react-hot-toast'
import styles from './AdminReservations.module.css'

interface Reservation {
  id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  reservation_type: 'table' | 'preorder' | 'pickup'
  people_count: number
  date: string
  time: string
  notes?: string
  items: any[]
  total: number
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

const statusLabel: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const statusColor: Record<string, string> = { pending: '#F59E0B', confirmed: '#10B981', cancelled: '#EF4444' }
const typeLabel: Record<string, string> = { table: '🪑 Solo mesa', preorder: '📋 Mesa + pre-pedido', pickup: '🛍️ Solo pedido' }

const formatDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })

const emptyForm = { customer_name: '', customer_email: '', customer_phone: '', reservation_type: 'table', people_count: 2, date: '', time: '', notes: '' }

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    socket.on('nueva_reserva', (r: Reservation) => {
      setReservations(prev => [r, ...prev])
      toast.success(`📅 Nueva reserva de ${r.customer_name}`)
    })
    socket.on('reserva_actualizada', (updated: Reservation) => {
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r))
      setSelected(prev => prev?.id === updated.id ? updated : prev)
    })
    return () => { socket.off('nueva_reserva'); socket.off('reserva_actualizada') }
  }, [filterStatus, filterDate])

  const load = async () => {
    try {
      const params: any = {}
      if (filterStatus) params.status = filterStatus
      if (filterDate) params.date = filterDate
      const res = await api.get('/reservations', { params })
      setReservations(res.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status })
      toast.success(status === 'confirmed' ? '✅ Reserva confirmada' : '❌ Reserva cancelada')
      setSelected(null)
    } catch { toast.error('Error actualizando reserva') }
  }

  const deleteRes = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva?')) return
    try {
      await api.delete(`/reservations/${id}`)
      setReservations(prev => prev.filter(r => r.id !== id))
      setSelected(null)
      toast.success('Reserva eliminada')
    } catch { toast.error('Error') }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForm.customer_name.trim() || !newForm.date || !newForm.time) {
      toast.error('Nombre, fecha y hora son requeridos'); return
    }
    setSaving(true)
    try {
      await api.post('/reservations', {
        ...newForm,
        people_count: Number(newForm.people_count),
        items: [],
        total: 0,
      })
      toast.success('Reserva creada')
      setShowNewForm(false)
      setNewForm(emptyForm)
      load()
    } catch { toast.error('Error creando reserva') }
    finally { setSaving(false) }
  }

  const pending = reservations.filter(r => r.status === 'pending').length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Reservas {pending > 0 && <span className={styles.badge}>{pending} pendiente{pending !== 1 ? 's' : ''}</span>}</h1>
          <p>{reservations.length} reservas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowNewForm(true); setSelected(null) }}>+ Nueva reserva</button>
      </div>

      <div className={styles.filters}>
        <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setLoading(true) }}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <input type="date" className="form-input" style={{ width: 'auto' }} value={filterDate} onChange={e => { setFilterDate(e.target.value); setLoading(true) }} />
        {filterDate && <button className="btn btn-secondary btn-sm" onClick={() => { setFilterDate(''); setLoading(true) }}>✕ Limpiar fecha</button>}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className={styles.layout}>
          <div className={styles.list}>
            {reservations.length === 0 ? (
              <div className="empty-state"><div className="icon">📅</div><p>No hay reservas</p></div>
            ) : reservations.map(r => (
              <div
                key={r.id}
                className={`${styles.item} ${selected?.id === r.id ? styles.itemSelected : ''}`}
                style={{ borderLeftColor: statusColor[r.status] }}
                onClick={() => { setSelected(r); setShowNewForm(false) }}
              >
                <div className={styles.itemTop}>
                  <strong>{r.customer_name}</strong>
                  <span className={styles.statusBadge} style={{ background: `${statusColor[r.status]}22`, color: statusColor[r.status] }}>
                    {statusLabel[r.status]}
                  </span>
                </div>
                <div className={styles.itemMeta}>
                  <span>📅 {formatDate(r.date)} · {r.time.slice(0, 5)}</span>
                  {r.reservation_type !== 'pickup' && <span>👥 {r.people_count} personas</span>}
                  <span>{typeLabel[r.reservation_type]}</span>
                </div>
              </div>
            ))}
          </div>

          {showNewForm && (
            <div className={styles.detail}>
              <div className={styles.detailHeader}>
                <h2>Nueva reserva manual</h2>
                <button className={styles.closeBtn} onClick={() => setShowNewForm(false)}>✕</button>
              </div>
              <form onSubmit={handleCreate} className={styles.detailBody}>
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={newForm.customer_name} onChange={e => setNewForm((f: any) => ({ ...f, customer_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={newForm.customer_email} onChange={e => setNewForm((f: any) => ({ ...f, customer_email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input className="form-input" value={newForm.customer_phone} onChange={e => setNewForm((f: any) => ({ ...f, customer_phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={newForm.reservation_type} onChange={e => setNewForm((f: any) => ({ ...f, reservation_type: e.target.value }))}>
                    <option value="table">Solo mesa</option>
                    <option value="preorder">Mesa + pre-pedido</option>
                    <option value="pickup">Solo pedido (para retirar)</option>
                  </select>
                </div>
                {newForm.reservation_type !== 'pickup' && (
                  <div className="form-group">
                    <label className="form-label">Personas</label>
                    <input type="number" className="form-input" min={1} value={newForm.people_count} onChange={e => setNewForm((f: any) => ({ ...f, people_count: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" value={newForm.date} onChange={e => setNewForm((f: any) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora *</label>
                  <input type="time" className="form-input" value={newForm.time} onChange={e => setNewForm((f: any) => ({ ...f, time: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea className="form-input" rows={2} value={newForm.notes} onChange={e => setNewForm((f: any) => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className={styles.detailActions}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : '✅ Crear reserva'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {selected && !showNewForm && (
            <div className={styles.detail}>
              <div className={styles.detailHeader}>
                <h2>Detalle de reserva</h2>
                <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className={styles.detailBody}>
                <div className={styles.detailRow}><span>Cliente</span><strong>{selected.customer_name}</strong></div>
                {selected.customer_email && <div className={styles.detailRow}><span>Email</span><a href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a></div>}
                {selected.customer_phone && <div className={styles.detailRow}><span>Teléfono</span><a href={`https://wa.me/${selected.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">{selected.customer_phone} 💬</a></div>}
                <div className={styles.detailRow}><span>Fecha</span><strong>{formatDate(selected.date)}</strong></div>
                <div className={styles.detailRow}><span>Hora</span><strong>{selected.time.slice(0, 5)}</strong></div>
                {selected.reservation_type !== 'pickup' && <div className={styles.detailRow}><span>Personas</span><strong>{selected.people_count}</strong></div>}
                <div className={styles.detailRow}><span>Tipo</span><strong>{typeLabel[selected.reservation_type]}</strong></div>
                <div className={styles.detailRow}><span>Estado</span>
                  <span className={styles.statusBadge} style={{ background: `${statusColor[selected.status]}22`, color: statusColor[selected.status] }}>
                    {statusLabel[selected.status]}
                  </span>
                </div>
                {selected.notes && <div className={styles.detailRow}><span>Notas</span><span>{selected.notes}</span></div>}
                {selected.items?.length > 0 && (
                  <div className={styles.detailSection}>
                    <p className={styles.detailSectionTitle}>Pre-pedido</p>
                    {selected.items.map((item: any, i: number) => (
                      <div key={i} className={styles.detailRow}>
                        <span>{item.quantity}× {item.product_name}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className={styles.detailRow} style={{ fontWeight: 600 }}>
                      <span>Total estimado</span><span>{formatPrice(selected.total)}</span>
                    </div>
                  </div>
                )}
              </div>

              {selected.status === 'pending' && (
                <div className={styles.detailActions}>
                  <button className="btn btn-success" onClick={() => updateStatus(selected.id, 'confirmed')}>
                    ✅ Confirmar reserva
                  </button>
                  <button className="btn btn-danger" onClick={() => updateStatus(selected.id, 'cancelled')}>
                    ❌ Cancelar
                  </button>
                </div>
              )}
              <button className={styles.deleteBtn} onClick={() => deleteRes(selected.id)}>🗑 Eliminar reserva</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
