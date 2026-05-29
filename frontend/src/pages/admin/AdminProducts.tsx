import { useEffect, useState } from 'react'
import { productApi } from '../../api'
import { Product, Category } from '../../types'
import { formatPrice } from '../../utils/format'
import toast from 'react-hot-toast'
import styles from './AdminProducts.module.css'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '', is_available: true, is_featured: false, track_stock: false, stock: '', stock_alert: '5', preparation_time: '' })
  const [uploading, setUploading] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const [pRes, cRes] = await Promise.all([productApi.getAllAdmin(), productApi.getCategoriesAdmin()])
      setProducts(pRes.data.data || [])
      setCategories(cRes.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', price: '', category_id: categories[0]?.id || '', image_url: '', is_available: true, is_featured: false, track_stock: false, stock: '', stock_alert: '5', preparation_time: '' }); setShowForm(true) }
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, description: p.description || '', price: String(p.price), category_id: p.category_id, image_url: p.image_url || '', is_available: p.is_available, is_featured: p.is_featured, track_stock: p.track_stock, stock: p.stock != null ? String(p.stock) : '', stock_alert: p.stock_alert ? String(p.stock_alert) : '5', preparation_time: p.preparation_time ? String(p.preparation_time) : '' }); setShowForm(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category_id) { toast.error('Nombre, precio y categoría son obligatorios'); return }
    try {
      const data = { ...form, price: parseFloat(form.price), stock: form.stock ? parseInt(form.stock) : null, stock_alert: parseInt(form.stock_alert) || 5, preparation_time: form.preparation_time ? parseInt(form.preparation_time) : null }
      if (editing) { await productApi.update(editing.id, data); toast.success('Producto actualizado') }
      else { await productApi.create(data); toast.success('Producto creado') }
      setShowForm(false); load()
    } catch { toast.error('Error guardando producto') }
  }

  const handleToggle = async (id: string) => {
    try { await productApi.toggle(id); load() } catch { toast.error('Error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deshabilitar este producto?')) return
    try { await productApi.delete(id); toast.success('Producto deshabilitado'); load() } catch { toast.error('Error') }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try { const res = await productApi.uploadImage(file); setForm((f) => ({ ...f, image_url: res.data.data.url })); toast.success('Imagen subida') }
    catch { toast.error('Error subiendo imagen') }
    finally { setUploading(false) }
  }

  const filtered = products.filter((p) => !filterCat || p.category_id === filterCat)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1>Productos</h1><p>{products.length} productos</p></div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nuevo producto</button>
      </div>
      <div className={styles.filters}>
        <select className="form-select" style={{ width: 'auto' }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <div key={p.id} className={`${styles.card} ${!p.is_available ? styles.disabled : ''}`}>
              <div className={styles.cardImg}>{p.image_url ? <img src={p.image_url} alt={p.name} /> : <span>🍽️</span>}</div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <h3>{p.name}</h3>
                  <span className={styles.price}>{formatPrice(p.price)}</span>
                </div>
                <p className={styles.desc}>{p.description || '—'}</p>
                <div className={styles.tags}>
                  {p.is_featured && <span className={styles.tagFeatured}>⭐ Destacado</span>}
                  {p.track_stock && <span className={styles.tagStock}>📦 Stock: {p.stock ?? '—'}</span>}
                  {!p.is_available && <span className={styles.tagOff}>🔴 Inactivo</span>}
                </div>
                <div className={styles.actions}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Editar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(p.id)}>{p.is_available ? '🔴 Desactivar' : '🟢 Activar'}</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="icon">🍽️</div><p>Sin productos</p></div>}
        </div>
      )}

      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input type="number" className="form-input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required min="0" step="0.01" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select className="form-select" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} required>
                  <option value="">Seleccionar</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Imagen URL</label>
                <input className="form-input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
                <div className={styles.uploadRow}>
                  <label className={styles.uploadBtn}>
                    {uploading ? 'Subiendo...' : '📷 Subir imagen'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                  {form.image_url && <img src={form.image_url} alt="" className={styles.preview} />}
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label">Tiempo preparación (min)</label>
                  <input type="number" className="form-input" value={form.preparation_time} onChange={(e) => setForm((f) => ({ ...f, preparation_time: e.target.value }))} min="0" />
                </div>
              </div>
              <div className={styles.checkboxRow}>
                {[
                  { key: 'is_available', label: 'Disponible' },
                  { key: 'is_featured', label: '⭐ Destacado' },
                  { key: 'track_stock', label: '📦 Control de stock' },
                ].map((opt) => (
                  <label key={opt.key} className={styles.checkLabel}>
                    <input type="checkbox" checked={(form as any)[opt.key]} onChange={(e) => setForm((f) => ({ ...f, [opt.key]: e.target.checked }))} />
                    {opt.label}
                  </label>
                ))}
              </div>
              {form.track_stock && (
                <div className={styles.formRow}>
                  <div className="form-group">
                    <label className="form-label">Stock actual</label>
                    <input type="number" className="form-input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alerta de stock bajo</label>
                    <input type="number" className="form-input" value={form.stock_alert} onChange={(e) => setForm((f) => ({ ...f, stock_alert: e.target.value }))} min="0" />
                  </div>
                </div>
              )}
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
