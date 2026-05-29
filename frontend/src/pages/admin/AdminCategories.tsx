import { useEffect, useState } from 'react'
import { productApi } from '../../api'
import { Category } from '../../types'
import toast from 'react-hot-toast'
import styles from './AdminCategories.module.css'

export default function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', is_active: true })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const res = await productApi.getCategoriesAdmin(); setCats(res.data.data || []) }
    catch {} finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', is_active: true }); setShowForm(true) }
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description || '', is_active: c.is_active }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Nombre requerido'); return }
    try {
      if (editing) { await productApi.updateCategory(editing.id, form); toast.success('Categoría actualizada') }
      else { await productApi.createCategory(form); toast.success('Categoría creada') }
      setShowForm(false); load()
    } catch { toast.error('Error guardando') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deshabilitar esta categoría?')) return
    try { await productApi.deleteCategory(id); toast.success('Categoría deshabilitada'); load() } catch { toast.error('Error') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Categorías</h1><p>{cats.length} categorías</p></div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nueva categoría</button>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className={styles.grid}>
          {cats.map((c) => (
            <div key={c.id} className={`${styles.card} ${!c.is_active ? styles.disabled : ''}`}>
              <div className={styles.cardInfo}>
                <h3>{c.name}</h3>
                <p>{c.description || 'Sin descripción'}</p>
                <span className={c.is_active ? styles.active : styles.inactive}>{c.is_active ? 'Activa' : 'Inactiva'}</span>
              </div>
              <div className={styles.cardActions}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑</button>
              </div>
            </div>
          ))}
          {cats.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="icon">🏷️</div><p>Sin categorías</p></div>}
        </div>
      )}
      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Editar' : 'Nueva'} categoría</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeBtn}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Activa
              </label>
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
