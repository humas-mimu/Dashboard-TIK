import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Clock, ArrowRight, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../utils/api'

const DashboardSiswa = () => {
  const [user, setUser] = useState({})
  const [stats, setStats] = useState({ total: 0, selesai: 0, belum: 0 })
  const [tugasList, setTugasList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(storedUser)

    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/siswa/dashboard-data')
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)

        const total = data.tugas.length
        const selesai = data.pengumpulan.length
        setStats({ total, selesai, belum: total - selesai })
        setTugasList(data.tugas)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-100 font-medium">Selamat datang kembali,</p>
          <h1 className="text-3xl font-bold mt-1">{user.nama || 'Siswa'}! 👋</h1>
          <p className="mt-3 text-blue-50 max-w-lg">Tetap semangat belajar. Ada {stats.belum > 0 ? `${stats.belum} tugas yang perlu kamu selesaikan.` : 'semua tugas sudah selesai.'}</p>
        </div>
        <div className="absolute -right-10 -bottom-12 opacity-20">
          <BookOpen className="w-64 h-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4"><BookOpen className="w-6 h-6 text-blue-500" /></div>
          <p className="text-gray-500 text-sm">Total Tugas</p>
          <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.total}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6 text-green-500" /></div>
          <p className="text-gray-500 text-sm">Sudah Selesai</p>
          <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.selesai}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4"><Clock className="w-6 h-6 text-orange-500" /></div>
          <p className="text-gray-500 text-sm">Belum Selesai</p>
          <h3 className="text-3xl font-bold text-gray-800">{loading ? '...' : stats.belum}</h3>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Tugas Mendatang</h2>
          <Link to="/siswa/tugas" className="text-sm text-blue-500 font-semibold hover:text-blue-600 flex items-center gap-1">Lihat Semua <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {loading ? (
          <p className="text-sm text-center py-10 text-gray-400">Memuat tugas...</p>
        ) : tugasList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">🎉</div>
            <p className="font-semibold text-gray-600">Semua Tugas Selesai!</p>
            <p className="text-sm mt-1">Saat ini belum ada tugas baru untuk Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tugasList.slice(0, 3).map((tugas) => (
              <Link to={`/siswa/tugas/${tugas.id}`} key={tugas.id} className="block p-4 rounded-xl hover:bg-gray-50 border border-gray-100 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{tugas.judul}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><Bell className="w-3 h-3" /> Deadline: {new Date(tugas.deadline).toLocaleDateString('id-ID')}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardSiswa
