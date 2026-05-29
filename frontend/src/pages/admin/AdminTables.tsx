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
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ number: '', zone: '' })

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
      await tableApi.create({ ...form })
      toast.success('Mesa creada'); setShowForm(false); setForm({ number: '', zone: '' }); load()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Error creando mesa') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta mesa?')) return
    try { await tableApi.delete(id); toast.success('Mesa eliminada'); load() } catch { toast.error('Error') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try { await tableApi.updateStatus(id, { status }); load() } catch { toast.error('Error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Mesas</h1><p>{tables.length} mesas configuradas</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Nueva mesa</button>
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
        <div className={styles.list}>
          {tables.length === 0 ? (
            <div className="empty-state"><div className="icon">🪑</div><p>Sin mesas configuradas</p></div>
          ) : tables.map((table) => (
            <div key={table.id} className={styles.listItem}>
              <div className={styles.listLeft}>
                <div>
                  <p className={styles.listTableNum}>Mesa {table.number}</p>
                  <p className={styles.listMeta}>{table.zone || 'Principal'}</p>
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
