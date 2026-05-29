import { useEffect, useState } from 'react'
import { configApi, authApi } from '../../api'
import { BusinessConfig } from '../../types'
import toast from 'react-hot-toast'
import styles from './AdminConfig.module.css'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string, string> = { monday:'Lunes',tuesday:'Martes',wednesday:'Miércoles',thursday:'Jueves',friday:'Viernes',saturday:'Sábado',sunday:'Domingo' }

export default function AdminConfig() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'general'|'hours'|'services'|'security'>('general')
  const [form, setForm] = useState<any>({})
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await configApi.get()
      const c = res.data.data
      setConfig(c)
      setForm(c || {})
    } catch {} finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await configApi.update(form); toast.success('Configuración guardada'); load() }
    catch { toast.error('Error guardando') }
    finally { setSaving(false) }
  }

  const setHours = (day: string, field: string, value: any) => {
    setForm((f: any) => ({ ...f, opening_hours: { ...f.opening_hours, [day]: { ...(f.opening_hours?.[day] || {}), [field]: value } } }))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (pwdForm.newPassword.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    try { await authApi.changePassword(pwdForm.currentPassword, pwdForm.newPassword); toast.success('Contraseña cambiada'); setPwdForm({ currentPassword: '', newPassword: '', confirm: '' }) }
    catch { toast.error('Contraseña actual incorrecta') }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1>Configuración</h1></div>
      <div className={styles.tabs}>
        {(['general','hours','services','security'] as const).map((t) => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`} onClick={() => setTab(t)}>
            {t === 'general' ? '🏪 General' : t === 'hours' ? '🕐 Horarios' : t === 'services' ? '⚙️ Servicios' : '🔒 Seguridad'}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {tab === 'general' && (
          <div className={styles.section}>
            <div className={styles.formGrid}>
              <div className="form-group"><label className="form-label">Nombre del negocio</label><input className="form-input" value={form.business_name || ''} onChange={(e) => setForm((f: any) => ({ ...f, business_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Tipo de negocio</label><input className="form-input" placeholder="Restaurante, Cafetería, Bar..." value={form.business_type || ''} onChange={(e) => setForm((f: any) => ({ ...f, business_type: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Dirección</label><input className="form-input" value={form.address || ''} onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={form.phone || ''} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email || ''} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Logo URL</label><input className="form-input" placeholder="https://..." value={form.logo_url || ''} onChange={(e) => setForm((f: any) => ({ ...f, logo_url: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">PIN Mozos</label><input className="form-input" maxLength={6} value={form.waiter_pin || ''} onChange={(e) => setForm((f: any) => ({ ...f, waiter_pin: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Color principal</label><input type="color" style={{ height: '42px' }} className="form-input" value={form.primary_color || '#1a1a2e'} onChange={(e) => setForm((f: any) => ({ ...f, primary_color: e.target.value }))} /></div>
            </div>
          </div>
        )}
        {tab === 'hours' && (
          <div className={styles.section}>
            <p className={styles.hint}>Configurá los horarios de atención de tu negocio</p>
            <div className={styles.hoursList}>
              {DAYS.map((day) => {
                const hours = form.opening_hours?.[day] || { open: '09:00', close: '23:00', is_open: true }
                return (
                  <div key={day} className={styles.hourRow}>
                    <label className={styles.dayToggle}>
                      <input type="checkbox" checked={hours.is_open} onChange={(e) => setHours(day, 'is_open', e.target.checked)} />
                      <span className={styles.dayName}>{DAY_LABELS[day]}</span>
                    </label>
                    {hours.is_open ? (
                      <div className={styles.timeInputs}>
                        <input type="time" className="form-input" style={{ width: 'auto' }} value={hours.open} onChange={(e) => setHours(day, 'open', e.target.value)} />
                        <span>a</span>
                        <input type="time" className="form-input" style={{ width: 'auto' }} value={hours.close} onChange={(e) => setHours(day, 'close', e.target.value)} />
                      </div>
                    ) : <span className={styles.closedLabel}>Cerrado</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {tab === 'services' && (
          <div className={styles.section}>
            <p className={styles.hint}>Activá o desactivá los tipos de servicio disponibles</p>
            <div className={styles.serviceList}>
              {[
                { key: 'dine_in_available', label: '🍽️ Consumo en el local', desc: 'Los clientes pueden pedir para comer en el local' },
                { key: 'takeaway_available', label: '🛍️ Para llevar', desc: 'Los clientes pueden retirar el pedido en el local' },
                { key: 'delivery_available', label: '🚚 Delivery', desc: 'Los clientes pueden pedir envío a domicilio' },
                { key: 'counter_available', label: '🏪 Mostrador', desc: 'Venta directa en el mostrador' },
                { key: 'is_open', label: '🟢 Local abierto', desc: 'Si está desactivado los clientes ven el local como cerrado' },
              ].map((s) => (
                <label key={s.key} className={styles.serviceRow}>
                  <div>
                    <p className={styles.serviceLabel}>{s.label}</p>
                    <p className={styles.serviceDesc}>{s.desc}</p>
                  </div>
                  <input type="checkbox" className={styles.toggle} checked={!!form[s.key]} onChange={(e) => setForm((f: any) => ({ ...f, [s.key]: e.target.checked }))} />
                </label>
              ))}
            </div>
          </div>
        )}
        {tab === 'security' && (
          <div className={styles.section}>
            <h3 className={styles.subTitle}>Cambiar contraseña del administrador</h3>
            <form onSubmit={handleChangePassword} className={styles.pwdForm}>
              <div className="form-group"><label className="form-label">Contraseña actual</label><input type="password" className="form-input" value={pwdForm.currentPassword} onChange={(e) => setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Nueva contraseña</label><input type="password" className="form-input" value={pwdForm.newPassword} onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))} required minLength={8} /></div>
              <div className="form-group"><label className="form-label">Confirmar nueva contraseña</label><input type="password" className="form-input" value={pwdForm.confirm} onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))} required /></div>
              <button type="submit" className="btn btn-primary">Cambiar contraseña</button>
            </form>
          </div>
        )}
        {tab !== 'security' && (
          <div className={styles.saveRow}>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar cambios'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
