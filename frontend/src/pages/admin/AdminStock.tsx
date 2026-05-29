import { useEffect, useState } from 'react'
import { productApi } from '../../api'
import toast from 'react-hot-toast'
import styles from './AdminStock.module.css'

export default function AdminStock() {
  const [products, setProducts] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdjust, setShowAdjust] = useState<any | null>(null)
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'in', reason: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const [pRes, mRes, lRes] = await Promise.all([productApi.getAllAdmin(), productApi.getStockMovements ? productApi.getStockMovements() : Promise.resolve({ data: { data: [] } }), productApi.getLowStock()])
      setProducts((pRes.data.data || []).filter((p: any) => p.track_stock))
      setMovements(mRes?.data?.data || [])
      setLowStock(lRes.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustForm.quantity) { toast.error('Cantidad requerida'); return }
    try {
      await productApi.updateStock(showAdjust.id, { quantity: parseInt(adjustForm.quantity), type: adjustForm.type, reason: adjustForm.reason || 'Ajuste manual' })
      toast.success('Stock actualizado'); setShowAdjust(null); load()
    } catch { toast.error('Error actualizando stock') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1>Control de Stock</h1></div>

      {lowStock.length > 0 && (
        <div className={styles.alertBox}>
          <h3>⚠️ Stock bajo</h3>
          <div className={styles.alertList}>
            {lowStock.map((p) => (
              <div key={p.id} className={styles.alertItem}>
                <span>{p.name}</span>
                <span className={styles.alertStock}>Stock: {p.stock} (alerta: {p.stock_alert})</span>
                <button className="btn btn-warning btn-sm" onClick={() => { setShowAdjust(p); setAdjustForm({ quantity: '', type: 'in', reason: '' }) }}>Reponer</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          <h2 className={styles.sectionTitle}>Productos con stock</h2>
          {products.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>No hay productos con control de stock activo</p></div>
          ) : (
            <div className={styles.list}>
              {products.map((p) => (
                <div key={p.id} className={`${styles.stockCard} ${p.stock <= (p.stock_alert || 5) ? styles.low : ''}`}>
                  <div className={styles.productInfo}>
                    <h3>{p.name}</h3>
                    <p>{p.categories?.name || 'Sin categoría'}</p>
                  </div>
                  <div className={styles.stockInfo}>
                    <span className={`${styles.stockNum} ${p.stock <= 0 ? styles.stockZero : p.stock <= (p.stock_alert || 5) ? styles.stockLow : styles.stockOk}`}>
                      {p.stock ?? '—'} unidades
                    </span>
                    <span className={styles.stockAlert}>Alerta: {p.stock_alert || 5}</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setShowAdjust(p); setAdjustForm({ quantity: '', type: 'in', reason: '' }) }}>
                    📦 Ajustar
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAdjust && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowAdjust(null)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Ajustar stock — {showAdjust.name}</h2>
              <button onClick={() => setShowAdjust(null)} className={styles.closeBtn}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleAdjust}>
              <div className={styles.currentStock}>
                Stock actual: <strong>{showAdjust.stock ?? 0}</strong>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de movimiento</label>
                <select className="form-select" value={adjustForm.type} onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="in">📥 Entrada (sumar)</option>
                  <option value="out">📤 Salida (restar)</option>
                  <option value="adjustment">🔧 Ajuste (fijar valor)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad *</label>
                <input type="number" className="form-input" value={adjustForm.quantity} onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))} required min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo</label>
                <input className="form-input" placeholder="Ej: Compra proveedor, venta manual..." value={adjustForm.reason} onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjust(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
