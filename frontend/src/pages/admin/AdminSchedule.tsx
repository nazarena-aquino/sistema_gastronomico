import { useEffect, useState } from 'react'
import { configApi } from '../../api'
import toast from 'react-hot-toast'
import styles from './AdminConfig.module.css'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string, string> = {
  monday:'Lunes', tuesday:'Martes', wednesday:'Miércoles',
  thursday:'Jueves', friday:'Viernes', saturday:'Sábado', sunday:'Domingo'
}

export default function AdminSchedule() {
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    configApi.get()
      .then(r => setForm(r.data.data || {}))
      .catch(() => toast.error('Error cargando configuración'))
      .finally(() => setLoading(false))
  }, [])

  const setHours = (day: string, field: string, value: any) => {
    setForm((f: any) => ({
      ...f,
      opening_hours: {
        ...f.opening_hours,
        [day]: { ...(f.opening_hours?.[day] || {}), [field]: value }
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await configApi.update({ opening_hours: form.opening_hours })
      toast.success('Horarios guardados')
    } catch {
      toast.error('Error guardando horarios')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Horarios del local</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : '💾 Guardar horarios'}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.hint}>
            Configurá los días y horarios de atención. Los clientes solo podrán reservar en los días y horarios habilitados.
          </p>
          <div className={styles.hoursList}>
            {DAYS.map((day) => {
              const hours = form.opening_hours?.[day] || { open: '09:00', close: '23:00', is_open: true }
              return (
                <div key={day} className={styles.hourRow}>
                  <label className={styles.dayToggle}>
                    <input
                      type="checkbox"
                      checked={hours.is_open}
                      onChange={(e) => setHours(day, 'is_open', e.target.checked)}
                    />
                    <span className={styles.dayName}>{DAY_LABELS[day]}</span>
                  </label>
                  {hours.is_open ? (
                    <div className={styles.timeInputs}>
                      <input
                        type="time"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={hours.open}
                        onChange={(e) => setHours(day, 'open', e.target.value)}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={hours.close}
                        onChange={(e) => setHours(day, 'close', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className={styles.closedLabel}>Cerrado</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
