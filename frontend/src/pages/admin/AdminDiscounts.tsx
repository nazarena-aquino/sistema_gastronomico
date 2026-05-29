import { useEffect, useState } from 'react'
import { discountApi } from '../../api'
import { Discount } from '../../types'
import { formatPrice } from '../../utils/format'
import toast from 'react-hot-toast'
import styles from './AdminDiscounts.module.css'

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '', min_order_amount: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const res = await discountApi.getAll(); setDiscounts(res.data.data || []) }
    catch {} finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.value) { toast.error('Nombre y valor requeridos'); return }
    try {
      await discountApi.create({ ...form, value: parseFloat(form.value), min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null })
      toast.success('Descuento creado'); setShowForm(false); setForm({ name: '', type: 'percentage', value: '', min_order_amount: '' }); load()
    } catch { toast.error('Error') }
  }

  const handleToggle = async (d: Discount) => {
    try { await discountApi.update(d.id, { is_active: !d.is_active }); load() } catch { toast.error('Error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este descuento?')) return
    try { await discountApi.delete(id); toast.success('Eliminado'); load() } catch { toast.error('Error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Descuentos</h1><p>{discounts.length} descuentos</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Nuevo descuento</button>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className={styles.list}>
          {discounts.length === 0 ? <div className="empty-state"><div className="icon">🏷️</div><p>Sin descuentos</p></div>
            : discounts.map((d) => (
              <div key={d.id} className={`${styles.card} ${!d.is_active ? styles.inactive : ''}`}>
                <div className={styles.info}>
                  <h3>{d.name}</h3>
                  <div className={styles.meta}>
                    <span className={styles.value}>{d.type === 'percentage' ? `${d.value}% de descuento` : `${formatPrice(d.value)} de descuento`}</span>
                    {d.min_order_amount && <span>Mín: {formatPrice(d.min_order_amount)}</span>}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button className={`btn btn-sm ${d.is_active ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleToggle(d)}>
                    {d.is_active ? '🔴 Desactivar' : '🟢 Activar'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>🗑</button>
                </div>
              </div>
            ))}
        </div>
      )}
      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Nuevo descuento</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" placeholder="Ej: 10% todos los lunes" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor *</label>
                  <input type="number" className="form-input" placeholder={form.type === 'percentage' ? '10' : '500'} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} required min="0" step="0.01" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pedido mínimo (opcional)</label>
                <input type="number" className="form-input" placeholder="Ej: 2000" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} min="0" />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear descuento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
