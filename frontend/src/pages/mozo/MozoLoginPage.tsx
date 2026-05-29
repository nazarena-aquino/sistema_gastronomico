import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api'
import toast from 'react-hot-toast'
import styles from './MozoLoginPage.module.css'

export default function MozoLoginPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.verifyWaiterPin(pin)
      sessionStorage.setItem('mozo_auth', 'true')
      navigate('/mozo')
    } catch {
      toast.error('PIN incorrecto')
      setPin('')
    } finally { setLoading(false) }
  }

  const addDigit = (d: string) => { if (pin.length < 6) setPin((p) => p + d) }
  const del = () => setPin((p) => p.slice(0, -1))

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>👨‍🍳</span>
          <h1>App para Mozos</h1>
          <p>Ingresá el PIN de acceso</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.pinDisplay}>
            {[0,1,2,3].map((i) => (
              <div key={i} className={`${styles.pinDot} ${pin.length > i ? styles.filled : ''}`} />
            ))}
          </div>
          <div className={styles.keypad}>
            {['1','2','3','4','5','6','7','8','9'].map((d) => (
              <button key={d} type="button" className={styles.key} onClick={() => addDigit(d)}>{d}</button>
            ))}
            <button type="button" className={styles.key} onClick={del}>⌫</button>
            <button type="button" className={styles.key} onClick={() => addDigit('0')}>0</button>
            <button type="submit" className={`${styles.key} ${styles.keyEnter}`} disabled={loading || pin.length < 4}>✓</button>
          </div>
        </form>
        <a href="/" className={styles.backLink}>← Volver al sitio</a>
      </div>
    </div>
  )
}
