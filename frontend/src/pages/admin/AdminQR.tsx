import { useEffect, useState } from 'react'
import { configApi, tableApi } from '../../api'
import { Table } from '../../types'
import toast from 'react-hot-toast'
import styles from './AdminQR.module.css'

export default function AdminQR() {
  const [menuQR, setMenuQR] = useState<string | null>(null)
  const [menuUrl, setMenuUrl] = useState('')
  const [tables, setTables] = useState<Table[]>([])
  const [tableQRs, setTableQRs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const [qrRes, tablesRes] = await Promise.all([configApi.getMenuQR(), tableApi.getAll()])
      setMenuQR(qrRes.data.data.qr_data_url)
      setMenuUrl(qrRes.data.data.menu_url)
      setTables(tablesRes.data.data || [])
    } catch {} finally { setLoading(false) }
  }

  const loadTableQR = async (tableNumber: string) => {
    if (tableQRs[tableNumber]) return
    try {
      const res = await configApi.getTableQR(tableNumber)
      setTableQRs((prev) => ({ ...prev, [tableNumber]: res.data.data.qr_data_url }))
    } catch { toast.error('Error generando QR') }
  }

  const downloadQR = (dataUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = dataUrl; a.download = filename; a.click()
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1>Códigos QR</h1><p>Generá QR para el menú y cada mesa</p></div>

      <div className={styles.grid}>
        {/* QR Menú general */}
        <div className={styles.qrCard}>
          <h2>Menú general</h2>
          <p className={styles.url}>{menuUrl}</p>
          {menuQR && (
            <>
              <img src={menuQR} alt="QR Menú" className={styles.qrImg} />
              <div className={styles.qrActions}>
                <button className="btn btn-primary btn-sm" onClick={() => downloadQR(menuQR, 'menu-qr.png')}>⬇️ Descargar</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(menuUrl); toast.success('URL copiada') }}>📋 Copiar URL</button>
              </div>
            </>
          )}
        </div>

        {/* QR por mesa */}
        {tables.map((table) => (
          <div key={table.id} className={styles.qrCard}>
            <h2>Mesa {table.number}</h2>
            <p className={styles.tableInfo}>{table.capacity} personas · {table.zone || 'Principal'}</p>
            {!tableQRs[table.number] ? (
              <button className="btn btn-secondary btn-sm" onClick={() => loadTableQR(table.number)}>Generar QR</button>
            ) : (
              <>
                <img src={tableQRs[table.number]} alt={`QR Mesa ${table.number}`} className={styles.qrImg} />
                <div className={styles.qrActions}>
                  <button className="btn btn-primary btn-sm" onClick={() => downloadQR(tableQRs[table.number], `mesa-${table.number}-qr.png`)}>⬇️ Descargar</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
