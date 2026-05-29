import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { productApi } from '../api'
import { Product, Category, SelectedModifier } from '../types'
import { formatPrice } from '../utils/format'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'
import styles from './MenuPage.module.css'

export default function MenuPage() {
  const [searchParams] = useSearchParams()
  const tableNumber = searchParams.get('table')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [itemNotes, setItemNotes] = useState('')
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    Promise.all([productApi.getAll(), productApi.getCategories()])
      .then(([pRes, cRes]) => { setProducts(pRes.data.data || []); setCategories(cRes.data.data || []); })
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category_id === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = categories.filter((c) => c.is_active).map((cat) => ({
    category: cat, products: filtered.filter((p) => p.category_id === cat.id)
  })).filter((g) => g.products.length > 0)

  const openProduct = (product: Product) => {
    setSelectedProduct(product); setSelectedModifiers([]); setItemNotes(''); setQty(1);
  }

  const toggleModifier = (group: any, modifier: any) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find((m) => m.modifier_id === modifier.id)
      if (exists) return prev.filter((m) => m.modifier_id !== modifier.id)
      if (!group.multiple) {
        const filtered = prev.filter((m) => m.group_id !== group.id)
        return [...filtered, { group_id: group.id, group_name: group.name, modifier_id: modifier.id, modifier_name: modifier.name, price: modifier.price }]
      }
      return [...prev, { group_id: group.id, group_name: group.name, modifier_id: modifier.id, modifier_name: modifier.name, price: modifier.price }]
    })
  }

  const canAdd = () => {
    if (!selectedProduct) return false
    if (!selectedProduct.modifier_groups?.length) return true
    for (const group of selectedProduct.modifier_groups) {
      if (group.required && !selectedModifiers.find((m) => m.group_id === group.id)) return false
    }
    return true
  }

  const handleAddToCart = () => {
    if (!selectedProduct || !canAdd()) return
    const modifiersPrice = selectedModifiers.reduce((s, m) => s + m.price, 0)
    addItem({ product_id: selectedProduct.id, product_name: selectedProduct.name, price: selectedProduct.price + modifiersPrice, notes: itemNotes || undefined, modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined }, qty)
    toast.success(`${selectedProduct.name} agregado al carrito`)
    setSelectedProduct(null)
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {tableNumber && <div className={styles.tableBanner}>🍽️ Mesa <strong>{tableNumber}</strong> — Tu pedido se confirma en el local</div>}
        <div className={styles.header}>
          <div className="container">
            <h1>Nuestra Carta</h1>
            <p>Elegí tus favoritos y armá tu pedido</p>
          </div>
        </div>
        <div className="container">
          <div className={styles.searchWrap}>
            <span>🔍</span>
            <input type="text" className={styles.searchInput} placeholder="Buscar en el menú..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={styles.categories}>
            <button className={`${styles.catBtn} ${activeCategory === 'all' ? styles.active : ''}`} onClick={() => setActiveCategory('all')}>Todos</button>
            {categories.filter((c) => c.is_active).map((c) => (
              <button key={c.id} className={`${styles.catBtn} ${activeCategory === c.id ? styles.active : ''}`} onClick={() => setActiveCategory(c.id)}>{c.name}</button>
            ))}
          </div>
          {loading ? <div className="loading-center"><div className="spinner" /></div>
            : filtered.length === 0 ? <div className="empty-state"><div className="icon">🍽️</div><p>No encontramos productos</p></div>
            : activeCategory === 'all' ? grouped.map(({ category, products: catProducts }) => (
                <section key={category.id} className={styles.section}>
                  <h2 className={styles.catTitle}>{category.name}</h2>
                  {category.description && <p className={styles.catDesc}>{category.description}</p>}
                  <div className={styles.grid}>
                    {catProducts.map((p) => (
                      <div key={p.id} className={styles.card} onClick={() => openProduct(p)}>
                        <div className={styles.cardImg}>
                          {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span>🍽️</span>}
                          {p.is_featured && <span className={styles.featuredBadge}>⭐</span>}
                          {p.track_stock && p.stock !== null && p.stock <= 0 && <span className={styles.outOfStock}>Sin stock</span>}
                        </div>
                        <div className={styles.cardBody}>
                          <h3>{p.name}</h3>
                          {p.description && <p>{p.description}</p>}
                          {p.preparation_time && <span className={styles.prepTime}>⏱ {p.preparation_time} min</span>}
                          <div className={styles.cardFooter}>
                            <span className={styles.price}>{formatPrice(p.price)}</span>
                            <span className={styles.addBtn}>+ Agregar</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            : <div className={styles.grid}>{filtered.map((p) => (
                <div key={p.id} className={styles.card} onClick={() => openProduct(p)}>
                  <div className={styles.cardImg}>{p.image_url ? <img src={p.image_url} alt={p.name} /> : <span>🍽️</span>}</div>
                  <div className={styles.cardBody}>
                    <h3>{p.name}</h3>
                    {p.description && <p>{p.description}</p>}
                    <div className={styles.cardFooter}><span className={styles.price}>{formatPrice(p.price)}</span><span className={styles.addBtn}>+ Agregar</span></div>
                  </div>
                </div>
              ))}</div>
          }
        </div>
      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setSelectedProduct(null)}>
          <div className={styles.modal}>
            {selectedProduct.image_url && <img src={selectedProduct.image_url} alt={selectedProduct.name} className={styles.modalImg} />}
            <div className={styles.modalBody}>
              <h2>{selectedProduct.name}</h2>
              {selectedProduct.description && <p className={styles.modalDesc}>{selectedProduct.description}</p>}
              {selectedProduct.allergens?.length > 0 && <p className={styles.allergens}>⚠️ {selectedProduct.allergens.join(', ')}</p>}

              {/* Modifiers */}
              {(selectedProduct.modifier_groups || []).map((group) => (
                <div key={group.id} className={styles.modGroup}>
                  <p className={styles.modGroupTitle}>{group.name} {group.required && <span className={styles.required}>* requerido</span>}</p>
                  <div className={styles.modOptions}>
                    {group.modifiers.filter((m) => m.is_available).map((mod) => {
                      const selected = selectedModifiers.find((m) => m.modifier_id === mod.id)
                      return (
                        <label key={mod.id} className={`${styles.modOption} ${selected ? styles.modSelected : ''}`}>
                          <input type={group.multiple ? 'checkbox' : 'radio'} name={group.id} checked={!!selected} onChange={() => toggleModifier(group, mod)} />
                          <span>{mod.name}</span>
                          {mod.price > 0 && <span className={styles.modPrice}>+{formatPrice(mod.price)}</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <input type="text" className="form-input" placeholder="Sin cebolla, extra queso..." value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} />
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.qtyControl}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)}>+</button>
                </div>
                <button className="btn btn-primary" onClick={handleAddToCart} disabled={!canAdd()}>
                  Agregar — {formatPrice((selectedProduct.price + selectedModifiers.reduce((s, m) => s + m.price, 0)) * qty)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
