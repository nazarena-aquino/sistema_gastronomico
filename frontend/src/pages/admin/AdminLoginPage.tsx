import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import styles from './AdminLoginPage.module.css'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, admin, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => { if (admin) navigate('/admin', { replace: true }) }, [admin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Completá todos los campos'); return }
    try {
      await login(email, password)
      toast.success('¡Bienvenido!')
      navigate('/admin')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>🍽️</span>
          <h1>Panel de Administración</h1>
          <p>Sistema Gastronómico</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="admin@restaurante.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className={styles.pwdWrap}>
              <input type={showPwd ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(!showPwd)}>{showPwd ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className={styles.footer}>
          <p className={styles.hint}>Contraseña inicial: <code>Admin2024!</code></p>
          <Link to="/" className={styles.backLink}>← Volver al sitio</Link>
        </div>
      </div>
    </div>
  )
}
