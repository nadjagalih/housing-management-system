import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { logout } from '../../api/authApi'

export default function Topbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // tetap logout meski API gagal
    }
    clearAuth()
    navigate('/login')
  }

  const initials = (user?.name ?? 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between shrink-0 shadow-sm">
      {/* Page context (empty — acts as breadcrumb space) */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Sistem Manajemen RT</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name ?? 'Admin'}</p>
          <p className="text-xs text-gray-400 leading-tight">{user?.email}</p>
        </div>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gray-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  )
}
