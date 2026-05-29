import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useConfigStore } from './store/authStore'

// Public
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderStatusPage from './pages/OrderStatusPage'
import ReservationPage from './pages/ReservationPage'

// Mozo
import MozoLoginPage from './pages/mozo/MozoLoginPage'
import MozoLayout from './components/mozo/MozoLayout'
import MozoTablesPage from './pages/mozo/MozoTablesPage'
import MozoOrderPage from './pages/mozo/MozoOrderPage'

// Cocina KDS
import CocinaPage from './pages/cocina/CocinaPage'

// Admin
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminTables from './pages/admin/AdminTables'
import AdminDiscounts from './pages/admin/AdminDiscounts'
import AdminStock from './pages/admin/AdminStock'
import AdminConfig from './pages/admin/AdminConfig'
import AdminSchedule from './pages/admin/AdminSchedule'
import AdminQR from './pages/admin/AdminQR'
import AdminReservations from './pages/admin/AdminReservations'

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { admin, token } = useAuthStore()
  if (!token && !admin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  const { checkAuth } = useAuthStore()
  const { fetch } = useConfigStore()

  useEffect(() => {
    checkAuth()
    fetch()
  }, [])

  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-status/:orderNumber" element={<OrderStatusPage />} />
      <Route path="/reservar" element={<ReservationPage />} />

      {/* Mozo */}
      <Route path="/mozo/login" element={<MozoLoginPage />} />
      <Route path="/mozo" element={<MozoLayout />}>
        <Route index element={<MozoTablesPage />} />
        <Route path="order/:tableId" element={<MozoOrderPage />} />
      </Route>

      {/* Cocina KDS */}
      <Route path="/cocina" element={<CocinaPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tables" element={<AdminTables />} />
        <Route path="discounts" element={<AdminDiscounts />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="schedule" element={<AdminSchedule />} />
        <Route path="config" element={<AdminConfig />} />
        <Route path="qr" element={<AdminQR />} />
        <Route path="reservations" element={<AdminReservations />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
