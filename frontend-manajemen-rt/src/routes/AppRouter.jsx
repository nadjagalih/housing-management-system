import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import AdminLayout from '../components/layout/AdminLayout'

// Pages
import LoginPage          from '../pages/auth/LoginPage'
import DashboardPage      from '../pages/dashboard/DashboardPage'
import HouseListPage      from '../pages/houses/HouseListPage'
import HouseDetailPage    from '../pages/houses/HouseDetailPage'
import HouseFormPage      from '../pages/houses/HouseFormPage'
import ResidentListPage   from '../pages/residents/ResidentListPage'
import ResidentDetailPage from '../pages/residents/ResidentDetailPage'
import ResidentFormPage   from '../pages/residents/ResidentFormPage'
import PaymentListPage    from '../pages/payments/PaymentListPage'
import PaymentFormPage    from '../pages/payments/PaymentFormPage'
import ExpenseListPage    from '../pages/expenses/ExpenseListPage'
import ExpenseFormPage    from '../pages/expenses/ExpenseFormPage'
import ReportSummaryPage  from '../pages/reports/ReportSummaryPage'
import ReportMonthlyPage  from '../pages/reports/ReportMonthlyPage'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — semua dalam AdminLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Houses */}
          <Route path="houses"           element={<HouseListPage />} />
          <Route path="houses/new"       element={<HouseFormPage />} />
          <Route path="houses/:id"       element={<HouseDetailPage />} />
          <Route path="houses/:id/edit"  element={<HouseFormPage />} />

          {/* Residents */}
          <Route path="residents"          element={<ResidentListPage />} />
          <Route path="residents/new"      element={<ResidentFormPage />} />
          <Route path="residents/:id"      element={<ResidentDetailPage />} />
          <Route path="residents/:id/edit" element={<ResidentFormPage />} />

          {/* Payments */}
          <Route path="payments"     element={<PaymentListPage />} />
          <Route path="payments/new" element={<PaymentFormPage />} />

          {/* Expenses */}
          <Route path="expenses"          element={<ExpenseListPage />} />
          <Route path="expenses/new"      element={<ExpenseFormPage />} />
          <Route path="expenses/:id/edit" element={<ExpenseFormPage />} />

          {/* Reports */}
          <Route path="reports/summary" element={<ReportSummaryPage />} />
          <Route path="reports/monthly" element={<ReportMonthlyPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
