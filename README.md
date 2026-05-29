# 🍽️ Sistema Gastronómico v2.0

Sistema completo de gestión gastronómica — menú digital, pedidos, mesas, KDS cocina, app mozos, stock, clientes, reportes y más.

---

## Stack
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React 18 + Vite 4.5.3 (compatible macOS Catalina)
- **Base de datos:** Supabase (PostgreSQL)
- **Pagos:** MercadoPago
- **Tiempo real:** Socket.io

---

## Instalación

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

---

## Configuración

### 1. Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → ejecutar `docs/schema.sql`
3. Settings → API → copiar URL y keys al `backend/.env`

### 2. Variables de entorno backend
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=secreto-largo-random
MP_ACCESS_TOKEN=TEST-xxx
MP_PUBLIC_KEY=TEST-xxx
WAITER_PIN=1234
FRONTEND_URL=http://localhost:5173
```

### 3. Levantar
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## Accesos

| URL | Descripción |
|-----|-------------|
| `localhost:5173` | Menú público |
| `localhost:5173/admin` | Panel admin |
| `localhost:5173/mozo` | App mozos (PIN) |
| `localhost:5173/cocina` | Monitor cocina KDS |

**Admin:** `admin@restaurante.com` / `Admin2024!`  
**PIN mozos:** `1234` (configurable en `.env`)

---

## Funcionalidades

- ✅ Menú digital con QR por mesa
- ✅ Pedidos online (mesa, takeaway, delivery, mostrador)
- ✅ Pago con MercadoPago, efectivo, transferencia, tarjeta
- ✅ Modificadores y adicionales de productos
- ✅ Panel admin completo
- ✅ Gestión de mesas (mapa visual + lista)
- ✅ App para mozos con PIN
- ✅ Monitor de cocina KDS en tiempo real
- ✅ Control de stock con alertas
- ✅ Base de datos de clientes
- ✅ Descuentos por porcentaje o monto fijo
- ✅ Reportes de ventas
- ✅ Websockets para tiempo real
- ✅ Seguimiento de pedido para el cliente
