import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { authApi } from '../../api'
import toast from 'react-hot-toast'
import styles from './MozoLayout.module.css'

export default function MozoLayout() {
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const auth = sessionStorage.getItem('mozo_auth')
    if (!auth) navigate('/mozo/login', { replace: true })
    else setAuthorized(true)
  }, [])

  if (!authorized) return null

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <span className={styles.logo}>👨‍🍳 App Mozos</span>
        <nav className={styles.nav}>
          <NavLink to="/mozo" end className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>🪑 Mesas</NavLink>
        </nav>
        <button className={styles.logout} onClick={() => { sessionStorage.removeItem('mozo_auth'); navigate('/mozo/login') }}>Salir</button>
      </header>
      <main className={styles.main}><Outlet /></main>
    </div>
  )
}
