import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardGuru from './pages/DashboardGuru'
import DashboardSiswa from './pages/DashboardSiswa'
import TugasPage from './pages/TugasPage'
import PengumpulanPage from './pages/PengumpulanPage'
import SiswaPage from './pages/SiswaPage'
import SettingsPage from './pages/SettingsPage'
import AcakTempatDudukPage from './pages/AcakTempatDudukPage'
import QuickSharePage from './pages/QuickSharePage'
import DetailTugasPage from './pages/DetailTugasPage'
import FileSharingPage from './pages/FileSharingPage'
import LocalDiskPage from './pages/LocalDiskPage'

function App() {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user:', e)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setCheckingAuth(false)
  }, [])

  useEffect(() => {
    if (!checkingAuth && !user && window.location.pathname !== '/login') {
      navigate('/login', { replace: true })
    }
  }, [checkingAuth, user, navigate])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user && window.location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  const LayoutWithSidebar = ({ children }) => (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {user?.role === 'guru' && (
        <Route path="/dashboard/*" element={<LayoutWithSidebar><GuruRoutes /></LayoutWithSidebar>} />
      )}

      {user?.role === 'siswa' && (
        <Route path="/siswa/*" element={<LayoutWithSidebar><SiswaRoutes /></LayoutWithSidebar>} />
      )}

      <Route path="/" element={<LoginPage />} />
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  )
}

const GuruRoutes = () => (
  <Routes>
    <Route path="/" element={<DashboardGuru />} />
    <Route path="/tugas" element={<TugasPage />} />
    <Route path="/pengumpulan" element={<PengumpulanPage />} />
    <Route path="/siswa" element={<SiswaPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/acak" element={<AcakTempatDudukPage />} />
    <Route path="/quick" element={<QuickSharePage />} />
    <Route path="/tugas/:id" element={<DetailTugasPage />} />
    <Route path="/sharing" element={<FileSharingPage />} />
    <Route path="/disk" element={<LocalDiskPage />} />
    <Route path="/*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
)

const SiswaRoutes = () => (
  <Routes>
    <Route path="/" element={<DashboardSiswa />} />
    <Route path="/tugas" element={<TugasPage />} />
    <Route path="/tugas/:id" element={<DetailTugasPage />} />
    <Route path="/sharing" element={<FileSharingPage />} />
    <Route path="/quick" element={<QuickSharePage />} />
    <Route path="/*" element={<Navigate to="/siswa" replace />} />
  </Routes>
)

export default App
