import { useEffect, useState } from 'react'
import { tableApi } from '../../api'
import { Table } from '../../types'
import { tableStatusLabel, tableStatusColor } from '../../utils/format'
import { socket } from '../../utils/socket'
import toast from 'react-hot-toast'
import styles from './AdminTables.module.css'

export default function AdminTables() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [showForm, setShowForm] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [form, setForm] = useState({ number: '', capacity: '4', shape: 'square', zone: '' })

  useEffect(() => {
    load()
    socket.on('mesa_actualizada', load)
    return () => { socket.off('mesa_actualizada') }
  }, [])

  const load = async () => {
    try { const res = await tableApi.getAll(); setTables(res.data.data || []) }
    catch {} finally { setLoading(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.number) { toast.error('Número de mesa requerido'); return }
    try {
      await tableApi.create({ ...form, capacity: parseInt(form.capacity) })
      toast.success('Mesa creada'); setShowForm(false); setForm({ number: '', capacity: '4', shape: 'square', zone: '' }); load()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error creando mesa') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta mesa?')) return
    try { await tableApi.delete(id); toast.success('Mesa eliminada'); load() } catch { toast.error('Error') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await tableApi.updateStatus(id, { status }); load() } catch { toast.error('Error') }
  }

  const handleDragEnd = async (id: string, e: React.DragEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    const x = Math.max(10, Math.round(e.clientX - rect.left - 36))
    const y = Math.max(10, Math.round(e.clientY - rect.top - 36))
    try { await tableApi.updatePosition(id, { position_x: x, position_y: y }); load() } catch {}
    setDragging(null)
  }

  const zones = [...new Set(tables.map((t) => t.zone || 'Principal'))]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Mesas</h1><p>{tables.length} mesas configuradas</p></div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button className={`${styles.toggleBtn} ${view === 'map' ? styles.active : ''}`} onClick={() => setView('map')}>🗺️ Mapa</button>
            <button className={`${styles.toggleBtn} ${view === 'list' ? styles.active : ''}`} onClick={() => setView('list')}>📋 Lista</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Nueva mesa</button>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(tableStatusLabel).map(([s, label]) => (
          <div key={s} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: tableStatusColor[s] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        view === 'map' ? (
          zones.map((zone) => (
            <div key={zone} className={styles.zone}>
              <h2 className={styles.zoneTitle}>{zone}</h2>
              <div className={styles.mapArea}>
                {tables.filter((t) => (t.zone || 'Principal') === zone).map((table) => (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={() => setDragging(table.id)}
                    onDragEnd={(e) => handleDragEnd(table.id, e)}
                    className={`${styles.mapTable} ${styles[`shape_${table.shape}`]} ${dragging === table.id ? styles.dragging : ''}`}
                    style={{ left: table.position_x, top: table.position_y, borderColor: tableStatusColor[table.status] }}
                  >
                    <span className={styles.tableNum}>{table.number}</span>
                    <span className={styles.tableCap}>{table.capacity}p</span>
                    <div className={styles.tableActions}>
                      <select
                        className={styles.statusSelect}
                        value={table.status}
                        onChange={(e) => handleStatusChange(table.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Object.entries(tableStatusLabel).map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                      </select>
                      <button className={styles.deleteMapBtn} onClick={(e) => { e.stopPropagation(); handleDelete(table.id) }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.mapHint}>💡 Arrastrá las mesas para reposicionarlas</p>
            </div>
          ))
        ) : (
          <div className={styles.list}>
            {tables.length === 0 ? (
              <div className="empty-state"><div className="icon">🪑</div><p>Sin mesas configuradas</p></div>
            ) : tables.map((table) => (
              <div key={table.id} className={styles.listItem}>
                <div className={styles.listLeft}>
                  <div className={styles.listTableIcon} style={{ background: `${tableStatusColor[table.status]}22`, color: tableStatusColor[table.status] }}>
                    {table.shape === 'round' ? '⬤' : '⬛'}
                  </div>
                  <div>
                    <p className={styles.listTableNum}>Mesa {table.number}</p>
                    <p className={styles.listMeta}>{table.capacity} personas · {table.zone || 'Principal'}</p>
                  </div>
                </div>
                <div className={styles.listRight}>
                  <select className="form-select" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} value={table.status} onChange={(e) => handleStatusChange(table.id, e.target.value)}>
                    {Object.entries(tableStatusLabel).map(([s, l]) => <option key={s} value={s}>{l}</option>)}
                  </select>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(table.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Nueva mesa</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleCreate}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label">Número *</label>
                  <input className="form-input" placeholder="Ej: 1" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad</label>
                  <input type="number" className="form-input" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} min="1" max="20" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label">Forma</label>
                  <select className="form-select" value={form.shape} onChange={(e) => setForm((f) => ({ ...f, shape: e.target.value }))}>
                    <option value="square">⬛ Cuadrada</option>
                    <option value="round">⬤ Redonda</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Zona</label>
                  <input className="form-input" placeholder="Ej: Terraza" value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear mesa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
