# 🎨 Frontend Implementation Guide — React + Vite

> **Stack:** React 18 · Vite · Axios · Zustand · React Router v6 · Recharts · TailwindCSS
> Ikuti urutan pengerjaan berikut agar dependency antar modul tidak konflik.

---

## Urutan Implementasi

```
1. Setup Project & Dependencies
2. Konfigurasi Axios (API Client)
3. State Management (Zustand)
4. Routing & Protected Route
5. Layout Komponen
6. Halaman Auth (Login)
7. Halaman Dashboard
8. Halaman Houses (Rumah)
9. Halaman Residents (Penghuni)
10. Halaman Payments (Pembayaran)
11. Halaman Expenses (Pengeluaran)
12. Halaman Reports (Laporan & Grafik)
13. Portal Warga (Opsional)
```

---

## 1. Setup Project & Dependencies

### 1.1 Buat project Vite + React

```bash
npm create vite@latest rt-management-frontend -- --template react
cd rt-management-frontend
```

### 1.2 Install semua dependencies

```bash
# Core
npm install react-router-dom axios zustand

# UI & Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Grafik
npm install recharts

# Form & Utility
npm install react-hook-form
npm install dayjs
```

### 1.3 Konfigurasi Tailwind

Edit `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Edit `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 1.4 Konfigurasi `.env`

```env
VITE_API_URL=http://localhost:8000
```

### 1.5 Struktur folder awal

```bash
mkdir -p src/{api,components/{layout,ui,charts},pages/{auth,dashboard,houses,residents,payments,expenses,reports,public},hooks,store,utils,routes}
```

---

## 2. Konfigurasi Axios

### `src/api/axios.js`

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Inject token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — otomatis redirect ke login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

### `src/api/authApi.js`

```js
import api from './axios'

export const login  = (data) => api.post('/auth/login', data)
export const logout = ()     => api.post('/auth/logout')
export const getMe  = ()     => api.get('/auth/me')
```

### `src/api/houseApi.js`

```js
import api from './axios'

export const getHouses          = (params) => api.get('/houses', { params })
export const getHouse           = (id)     => api.get(`/houses/${id}`)
export const createHouse        = (data)   => api.post('/houses', data)
export const updateHouse        = (id, data) => api.put(`/houses/${id}`, data)
export const assignResident     = (id, data) => api.post(`/houses/${id}/assign-resident`, data)
export const unassignResident   = (id, data) => api.post(`/houses/${id}/unassign-resident`, data)
```

### `src/api/residentApi.js`

```js
import api from './axios'

export const getResidents  = (params)    => api.get('/residents', { params })
export const getResident   = (id)        => api.get(`/residents/${id}`)
export const createResident = (data)     => api.post('/residents', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateResident = (id, data) => api.post(`/residents/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
// Gunakan POST + _method override untuk PUT dengan file
export const deleteResident = (id)       => api.delete(`/residents/${id}`)
```

> ⚠️ Untuk update dengan file upload, gunakan `POST` dengan tambahan field `_method: PUT` agar Laravel bisa membaca file dari `multipart/form-data`. Tambahkan di `UpdateResidentRequest`: `$this->route()->methods()[0] === 'POST'`.

### `src/api/paymentApi.js`

```js
import api from './axios'

export const getPayments       = (params) => api.get('/payments', { params })
export const getPayment        = (id)     => api.get(`/payments/${id}`)
export const createPayment     = (data)   => api.post('/payments', data)
export const generateMonthly   = (data)   => api.post('/payments/generate-monthly', data)
export const markPaid          = (id, data) => api.put(`/payments/${id}/mark-paid`, data)
export const deletePayment     = (id)     => api.delete(`/payments/${id}`)
export const getPaymentTypes   = ()       => api.get('/payment-types')
export const updatePaymentType = (id, data) => api.put(`/payment-types/${id}`, data)
```

### `src/api/expenseApi.js`

```js
import api from './axios'

export const getExpenses   = (params)    => api.get('/expenses', { params })
export const createExpense = (data)      => api.post('/expenses', data)
export const updateExpense = (id, data)  => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id)        => api.delete(`/expenses/${id}`)
```

### `src/api/reportApi.js`

```js
import api from './axios'

export const getDashboard    = ()       => api.get('/reports/dashboard')
export const getSummary      = (params) => api.get('/reports/summary', { params })
export const getMonthlyDetail = (params) => api.get('/reports/monthly-detail', { params })
export const getUnpaid       = (params) => api.get('/reports/unpaid', { params })
```

---

## 3. State Management (Zustand)

### `src/store/authStore.js`

```js
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user:  JSON.parse(localStorage.getItem('user') || 'null'),

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  clearAuth: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
}))

export default useAuthStore
```

### `src/store/notificationStore.js`

```js
import { create } from 'zustand'

const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (message, type = 'success') => {
    const id = Date.now()
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))
    // Auto-remove setelah 3 detik
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, 3000)
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))

export default useNotificationStore
```

---

## 4. Routing & Protected Route

### `src/routes/AppRouter.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import AdminLayout from '../components/layout/AdminLayout'

// Pages
import LoginPage            from '../pages/auth/LoginPage'
import DashboardPage        from '../pages/dashboard/DashboardPage'
import HouseListPage        from '../pages/houses/HouseListPage'
import HouseDetailPage      from '../pages/houses/HouseDetailPage'
import HouseFormPage        from '../pages/houses/HouseFormPage'
import ResidentListPage     from '../pages/residents/ResidentListPage'
import ResidentDetailPage   from '../pages/residents/ResidentDetailPage'
import ResidentFormPage     from '../pages/residents/ResidentFormPage'
import PaymentListPage      from '../pages/payments/PaymentListPage'
import PaymentFormPage      from '../pages/payments/PaymentFormPage'
import ExpenseListPage      from '../pages/expenses/ExpenseListPage'
import ExpenseFormPage      from '../pages/expenses/ExpenseFormPage'
import ReportSummaryPage    from '../pages/reports/ReportSummaryPage'
import ReportMonthlyPage    from '../pages/reports/ReportMonthlyPage'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="houses" element={<HouseListPage />} />
          <Route path="houses/create" element={<HouseFormPage />} />
          <Route path="houses/:id" element={<HouseDetailPage />} />
          <Route path="houses/:id/edit" element={<HouseFormPage />} />

          <Route path="residents" element={<ResidentListPage />} />
          <Route path="residents/create" element={<ResidentFormPage />} />
          <Route path="residents/:id" element={<ResidentDetailPage />} />
          <Route path="residents/:id/edit" element={<ResidentFormPage />} />

          <Route path="payments" element={<PaymentListPage />} />
          <Route path="payments/create" element={<PaymentFormPage />} />

          <Route path="expenses" element={<ExpenseListPage />} />
          <Route path="expenses/create" element={<ExpenseFormPage />} />
          <Route path="expenses/:id/edit" element={<ExpenseFormPage />} />

          <Route path="reports/summary" element={<ReportSummaryPage />} />
          <Route path="reports/monthly" element={<ReportMonthlyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### `src/App.jsx`

```jsx
import AppRouter from './routes/AppRouter'
import Notifications from './components/ui/Notifications'

export default function App() {
  return (
    <>
      <AppRouter />
      <Notifications />
    </>
  )
}
```

---

## 5. Layout Komponen

### `src/components/layout/AdminLayout.jsx`

```jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### `src/components/layout/Sidebar.jsx`

```jsx
import { NavLink } from 'react-router-dom'

const menus = [
  { label: 'Dashboard',   path: '/dashboard',        icon: '📊' },
  { label: 'Rumah',       path: '/houses',            icon: '🏠' },
  { label: 'Penghuni',    path: '/residents',         icon: '👥' },
  { label: 'Pembayaran',  path: '/payments',          icon: '💰' },
  { label: 'Pengeluaran', path: '/expenses',          icon: '📤' },
  { label: 'Laporan',     path: '/reports/summary',   icon: '📈' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-lg font-bold">🏘️ RT Management</h1>
        <p className="text-slate-400 text-xs mt-1">Perumahan Elite</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menus.map((m) => (
          <NavLink
            key={m.path}
            to={m.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            <span>{m.icon}</span>
            {m.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

### `src/components/layout/Topbar.jsx`

```jsx
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { logout } from '../../api/authApi'

export default function Topbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          👤 {user?.name}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
```

---

## 6. UI Components

### `src/components/ui/Badge.jsx`

```jsx
export default function Badge({ status }) {
  const styles = {
    paid:     'bg-green-100 text-green-700',
    unpaid:   'bg-red-100 text-red-700',
    occupied: 'bg-blue-100 text-blue-700',
    empty:    'bg-gray-100 text-gray-600',
    permanent:'bg-purple-100 text-purple-700',
    contract: 'bg-orange-100 text-orange-700',
  }
  const labels = {
    paid: 'Lunas', unpaid: 'Belum Lunas',
    occupied: 'Dihuni', empty: 'Kosong',
    permanent: 'Tetap', contract: 'Kontrak',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
}
```

### `src/components/ui/Modal.jsx`

```jsx
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

### `src/components/ui/ConfirmDialog.jsx`

```jsx
import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
        >
          Hapus
        </button>
      </div>
    </Modal>
  )
}
```

### `src/components/ui/Notifications.jsx`

```jsx
import useNotificationStore from '../../store/notificationStore'

export default function Notifications() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm min-w-64 ${
            n.type === 'success' ? 'bg-green-500' :
            n.type === 'error'   ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          <span className="flex-1">{n.message}</span>
          <button onClick={() => removeNotification(n.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
```

### `src/components/ui/EmptyState.jsx`

```jsx
export default function EmptyState({ message = 'Data tidak ditemukan.', icon = '📭' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-5xl mb-3">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  )
}
```

---

## 7. Utilities

### `src/utils/formatter.js`

```js
export const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount)

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export const MONTH_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export const EXPENSE_CATEGORIES = {
  gaji_satpam:      'Gaji Satpam',
  token_listrik:    'Token Listrik',
  perbaikan_jalan:  'Perbaikan Jalan',
  perbaikan_selokan:'Perbaikan Selokan',
  other:            'Lainnya',
}
```

### `src/utils/constants.js`

```js
export const RESIDENT_TYPES = [
  { value: 'permanent', label: 'Tetap' },
  { value: 'contract',  label: 'Kontrak' },
]

export const MARITAL_STATUS = [
  { value: 'married', label: 'Sudah Menikah' },
  { value: 'single',  label: 'Belum Menikah' },
]

export const HOUSE_TYPES = [
  { value: 'permanent', label: 'Permanen' },
  { value: 'flexible',  label: 'Fleksibel' },
]

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'gaji_satpam',       label: 'Gaji Satpam' },
  { value: 'token_listrik',     label: 'Token Listrik' },
  { value: 'perbaikan_jalan',   label: 'Perbaikan Jalan' },
  { value: 'perbaikan_selokan', label: 'Perbaikan Selokan' },
  { value: 'other',             label: 'Lainnya' },
]
```

---

## 8. Halaman Auth

### `src/pages/auth/LoginPage.jsx`

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/authApi'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth }         = useAuthStore()
  const navigate            = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(form)
      setAuth(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏘️</div>
          <h1 className="text-2xl font-bold text-gray-800">RT Management</h1>
          <p className="text-gray-400 text-sm mt-1">Admin Panel Perumahan Elite</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@rt.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## 9. Halaman Dashboard

### `src/pages/dashboard/DashboardPage.jsx`

```jsx
import { useEffect, useState } from 'react'
import { getDashboard } from '../../api/reportApi'
import { formatRupiah } from '../../utils/formatter'

const StatCard = ({ label, value, sub, color }) => (
  <div className={`bg-white rounded-xl p-5 border-l-4 shadow-sm ${color}`}>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

export default function DashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Memuat...</div>
  if (!data)   return null

  const { houses, residents, current_month: cm } = data

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
      <p className="text-sm text-gray-500 -mt-4">{cm.month_label}</p>

      {/* Statistik Rumah */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Rumah"    value={houses.total}    color="border-blue-500"  />
        <StatCard label="Dihuni"         value={houses.occupied} color="border-green-500" />
        <StatCard label="Kosong"         value={houses.empty}    color="border-gray-400"  />
        <StatCard label="Total Penghuni" value={residents.total}
          sub={`${residents.permanent} tetap · ${residents.contract} kontrak`}
          color="border-purple-500"
        />
      </div>

      {/* Statistik Keuangan Bulan Ini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          label="Pemasukan Bulan Ini"
          value={formatRupiah(cm.pemasukan)}
          color="border-green-500"
        />
        <StatCard
          label="Pengeluaran Bulan Ini"
          value={formatRupiah(cm.pengeluaran)}
          color="border-red-400"
        />
        <StatCard
          label="Saldo"
          value={formatRupiah(cm.saldo)}
          color={cm.saldo >= 0 ? 'border-green-600' : 'border-red-600'}
        />
      </div>

      {/* Status Tagihan */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Status Tagihan {cm.month_label}</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Lunas: <strong>{cm.tagihan_lunas}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-sm text-gray-600">Belum Lunas: <strong>{cm.tagihan_belum_lunas}</strong></span>
          </div>
        </div>
        <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{
              width: `${
                cm.tagihan_lunas + cm.tagihan_belum_lunas > 0
                  ? (cm.tagihan_lunas / (cm.tagihan_lunas + cm.tagihan_belum_lunas)) * 100
                  : 0
              }%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## 10. Halaman Houses

### `src/pages/houses/HouseListPage.jsx`

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHouses } from '../../api/houseApi'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

export default function HouseListPage() {
  const [houses, setHouses]   = useState([])
  const [meta, setMeta]       = useState({})
  const [filter, setFilter]   = useState({ status: '', type: '' })
  const [loading, setLoading] = useState(true)

  const fetchHouses = () => {
    setLoading(true)
    getHouses(filter)
      .then((res) => { setHouses(res.data.data); setMeta(res.data.meta) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHouses() }, [filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Manajemen Rumah</h2>
        <Link to="/houses/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Tambah Rumah
        </Link>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>Total: <strong>{meta.total}</strong></span>
        <span>Dihuni: <strong className="text-blue-600">{meta.occupied}</strong></span>
        <span>Kosong: <strong className="text-gray-400">{meta.empty}</strong></span>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="occupied">Dihuni</option>
          <option value="empty">Kosong</option>
        </select>
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Semua Tipe</option>
          <option value="permanent">Permanen</option>
          <option value="flexible">Fleksibel</option>
        </select>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Memuat...</div>
      ) : houses.length === 0 ? (
        <EmptyState message="Belum ada data rumah." icon="🏠" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No. Rumah</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Alamat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Penghuni</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {houses.map((house) => (
                <tr key={house.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{house.house_number}</td>
                  <td className="px-4 py-3 text-gray-600">{house.address}</td>
                  <td className="px-4 py-3"><Badge status={house.house_type} /></td>
                  <td className="px-4 py-3"><Badge status={house.status} /></td>
                  <td className="px-4 py-3 text-gray-600">
                    {house.active_resident?.full_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/houses/${house.id}`}
                      className="text-blue-500 hover:underline text-xs"
                    >
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

### `src/pages/houses/HouseFormPage.jsx`

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createHouse, getHouse, updateHouse } from '../../api/houseApi'
import useNotificationStore from '../../store/notificationStore'
import { HOUSE_TYPES } from '../../utils/constants'

export default function HouseFormPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { addNotification } = useNotificationStore()
  const isEdit      = !!id

  const [form, setForm]     = useState({
    house_number: '', block: '', address: '', house_type: 'permanent', notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getHouse(id).then((res) => {
        const h = res.data.data
        setForm({
          house_number: h.house_number,
          block: h.block || '',
          address: h.address,
          house_type: h.house_type,
          notes: h.notes || '',
        })
      })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await updateHouse(id, form)
        addNotification('Rumah berhasil diperbarui.')
      } else {
        await createHouse(form)
        addNotification('Rumah berhasil ditambahkan.')
      }
      navigate('/houses')
    } catch (err) {
      addNotification(err.response?.data?.message || 'Terjadi kesalahan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Rumah' : 'Tambah Rumah'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Rumah *</label>
            <input
              value={form.house_number}
              onChange={(e) => setForm({ ...form, house_number: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="A1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blok</label>
            <input
              value={form.block}
              onChange={(e) => setForm({ ...form, block: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="A"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat *</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Rumah *</label>
          <select
            value={form.house_type}
            onChange={(e) => setForm({ ...form, house_type: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {HOUSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" onClick={() => navigate('/houses')}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

## 11. Halaman Residents

### `src/pages/residents/ResidentFormPage.jsx`

```jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createResident, getResident, updateResident } from '../../api/residentApi'
import useNotificationStore from '../../store/notificationStore'
import { RESIDENT_TYPES, MARITAL_STATUS } from '../../utils/constants'

export default function ResidentFormPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { addNotification } = useNotificationStore()
  const isEdit      = !!id
  const fileRef     = useRef()

  const [form, setForm] = useState({
    full_name: '', resident_type: 'permanent',
    phone_number: '', marital_status: 'single',
  })
  const [ktpFile, setKtpFile]     = useState(null)
  const [ktpPreview, setKtpPreview] = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    if (isEdit) {
      getResident(id).then((res) => {
        const r = res.data.data
        setForm({
          full_name:      r.full_name,
          resident_type:  r.resident_type,
          phone_number:   r.phone_number,
          marital_status: r.marital_status,
        })
        if (r.ktp_photo_url) setKtpPreview(r.ktp_photo_url)
      })
    }
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setKtpFile(file)
    setKtpPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    if (ktpFile) formData.append('ktp_photo', ktpFile)
    if (isEdit)  formData.append('_method', 'PUT')

    try {
      if (isEdit) {
        await updateResident(id, formData)
        addNotification('Data penghuni berhasil diperbarui.')
      } else {
        await createResident(formData)
        addNotification('Penghuni berhasil ditambahkan.')
      }
      navigate('/residents')
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors
        ? Object.values(errors).flat().join(', ')
        : err.response?.data?.message || 'Terjadi kesalahan.'
      addNotification(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Penghuni' : 'Tambah Penghuni'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              value={form.resident_type}
              onChange={(e) => setForm({ ...form, resident_type: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {RESIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Nikah *</label>
            <select
              value={form.marital_status}
              onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {MARITAL_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon *</label>
          <input
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="081234567890"
            required
          />
        </div>

        {/* Upload KTP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foto KTP {!isEdit && '*'}
          </label>
          <div
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 text-center"
          >
            {ktpPreview ? (
              <img src={ktpPreview} alt="KTP Preview"
                className="mx-auto max-h-40 object-contain rounded"
              />
            ) : (
              <div className="text-gray-400 text-sm py-4">
                📎 Klik untuk upload foto KTP
                <br />
                <span className="text-xs">JPG / PNG, maks. 2MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpg,image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" onClick={() => navigate('/residents')}
            className="border px-6 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

## 12. Halaman Payments

### `src/pages/payments/PaymentListPage.jsx`

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateMonthly, getPayments, markPaid } from '../../api/paymentApi'
import Badge from '../../components/ui/Badge'
import { formatRupiah, MONTH_LABELS } from '../../utils/formatter'
import useNotificationStore from '../../store/notificationStore'

export default function PaymentListPage() {
  const now     = new Date()
  const [filter, setFilter] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
    status: '',
  })
  const [payments, setPayments] = useState([])
  const [summary, setSummary]   = useState({})
  const [loading, setLoading]   = useState(true)
  const { addNotification }     = useNotificationStore()

  const fetchPayments = () => {
    setLoading(true)
    getPayments(filter)
      .then((res) => {
        setPayments(res.data.data)
        setSummary(res.data.summary)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments() }, [filter])

  const handleGenerate = async () => {
    try {
      const res = await generateMonthly({ month: filter.month, year: filter.year })
      addNotification(res.data.message)
      fetchPayments()
    } catch (err) {
      addNotification(err.response?.data?.message || 'Gagal generate tagihan.', 'error')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await markPaid(id, { payment_date: new Date().toISOString().split('T')[0] })
      addNotification('Tagihan berhasil ditandai lunas.')
      fetchPayments()
    } catch (err) {
      addNotification('Gagal memperbarui tagihan.', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Pembayaran Iuran</h2>
        <div className="flex gap-2">
          <button onClick={handleGenerate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            ⚡ Generate Tagihan
          </button>
          <Link to="/payments/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Input Pembayaran
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>Total: <strong>{summary.total_tagihan}</strong></span>
        <span>Lunas: <strong className="text-green-600">{summary.lunas}</strong></span>
        <span>Belum: <strong className="text-red-500">{summary.belum_lunas}</strong></span>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filter.month}
          onChange={(e) => setFilter({ ...filter, month: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {MONTH_LABELS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={filter.year}
          onChange={(e) => setFilter({ ...filter, year: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm w-24"
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="paid">Lunas</option>
          <option value="unpaid">Belum Lunas</option>
        </select>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Memuat...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rumah</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Penghuni</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis Iuran</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Jumlah</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{p.house?.house_number}</td>
                  <td className="px-4 py-3 text-gray-600">{p.resident?.full_name}</td>
                  <td className="px-4 py-3 capitalize">{p.payment_type?.name}</td>
                  <td className="px-4 py-3">{formatRupiah(p.amount)}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'unpaid' && (
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Tandai Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

---

## 13. Halaman Reports (Grafik)

### `src/components/charts/IncomeExpenseChart.jsx`

```jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatRupiah } from '../../utils/formatter'

const formatYAxis = (val) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}rb`
  return val
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function IncomeExpenseChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="total_pemasukan"   name="Pemasukan"   fill="#22c55e" radius={[4,4,0,0]} />
        <Bar dataKey="total_pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### `src/pages/reports/ReportSummaryPage.jsx`

```jsx
import { useEffect, useState } from 'react'
import { getSummary } from '../../api/reportApi'
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart'
import { formatRupiah } from '../../utils/formatter'

export default function ReportSummaryPage() {
  const [year, setYear]   = useState(new Date().getFullYear())
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSummary({ year })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Laporan Tahunan</h2>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm w-24"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Memuat...</div>
      ) : data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
              <p className="text-xs text-gray-500 mb-1">Total Pemasukan {year}</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatRupiah(data.annual_summary.total_pemasukan)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-400">
              <p className="text-xs text-gray-500 mb-1">Total Pengeluaran {year}</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatRupiah(data.annual_summary.total_pengeluaran)}
              </p>
            </div>
            <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${
              data.annual_summary.saldo_akhir >= 0 ? 'border-green-600' : 'border-red-600'
            }`}>
              <p className="text-xs text-gray-500 mb-1">Saldo Akhir {year}</p>
              <p className={`text-2xl font-bold ${
                data.annual_summary.saldo_akhir >= 0 ? 'text-green-700' : 'text-red-600'
              }`}>
                {formatRupiah(data.annual_summary.saldo_akhir)}
              </p>
            </div>
          </div>

          {/* Grafik */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4">
              Grafik Pemasukan vs Pengeluaran {year}
            </h3>
            <IncomeExpenseChart data={data.data} />
          </div>

          {/* Tabel per Bulan */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Bulan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Pemasukan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Pengeluaran</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{row.month_label}</td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {formatRupiah(row.total_pemasukan)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      {formatRupiah(row.total_pengeluaran)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      row.saldo >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {formatRupiah(row.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
```

---

## 14. `main.jsx` & Titik Masuk

### `src/main.jsx`

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Verifikasi Frontend

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Buka `http://localhost:5173` dan pastikan:
- [ ] Halaman login tampil dengan benar
- [ ] Login dengan `admin@rt.com` / `password` berhasil dan redirect ke dashboard
- [ ] Sidebar & navigasi antar halaman berfungsi
- [ ] Data dashboard terisi dari API backend
- [ ] Tabel rumah, penghuni, dan pembayaran menampilkan data seeder
- [ ] Upload foto KTP berhasil saat tambah penghuni
- [ ] Grafik laporan tahunan tampil dengan data Recharts

---

## Catatan Penting

**Method spoofing untuk update dengan file:**
Laravel tidak bisa menerima file via `PUT`, selalu gunakan `POST` + `_method: PUT`. Tambahkan di `UpdateResidentRequest`:
```php
public function method(): string
{
    return 'PUT';
}
```

**CORS error:**
Pastikan `php artisan config:clear` sudah dijalankan setelah mengubah `config/cors.php`.

**Foto KTP tidak muncul:**
Pastikan `php artisan storage:link` sudah dijalankan dan `FILESYSTEM_DISK=public` di `.env` backend.

---

*Selamat, seluruh implementasi frontend sudah selesai. Lanjutkan dengan testing manual per fitur dan persiapkan screenshot untuk output tugas.*
