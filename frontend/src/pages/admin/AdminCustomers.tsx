import { useEffect, useState } from 'react'
import { customerApi } from '../../api'
import { Customer } from '../../types'
import { formatPrice, formatDate } from '../../utils/format'
import toast from 'react-hot-toast'
import styles from './AdminCustomers.module.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

  useEffect(() => { load() }, [])
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t) }, [search])

  const load = async () => {
    try { const res = await customerApi.getAll(search ? { search } : {}); setCustomers(res.data.data || []) }
    catch {} finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '', notes: '' }); setShowForm(true) }
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Nombre requerido'); return }
    try {
      if (editing) { await customerApi.update(editing.id, form); toast.success('Cliente actualizado') }
      else { await customerApi.create(form); toast.success('Cliente creado') }
      setShowForm(false); load()
    } catch { toast.error('Error guardando') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    try { await customerApi.delete(id); toast.success('Cliente eliminado'); load() } catch { toast.error('Error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Clientes</h1><p>{customers.length} clientes</p></div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nuevo cliente</button>
      </div>
      <div className={styles.searchWrap}>
        <span>🔍</span>
        <input className={styles.searchInput} placeholder="Buscar por nombre, teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className={styles.list}>
          {customers.length === 0 ? <div className="empty-state"><div className="icon">👥</div><p>Sin clientes</p></div>
            : customers.map((c) => (
              <div key={c.id} className={styles.card}>
                <div className={styles.avatar}>{c.name.charAt(0).toUpperCase()}</div>
                <div className={styles.info}>
                  <h3>{c.name}</h3>
                  <div className={styles.meta}>
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.email && <span>✉️ {c.email}</span>}
                    {c.address && <span>📍 {c.address}</span>}
                  </div>
                  <div className={styles.stats}>
                    <span>{c.total_orders} pedidos</span>
                    <span>·</span>
                    <span>{formatPrice(c.total_spent)} total</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
                </div>
              </div>
            ))}
        </div>
      )}
      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Editar' : 'Nuevo'} cliente</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div className={styles.formRow}>
                <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Dirección</label><input className="form-input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
