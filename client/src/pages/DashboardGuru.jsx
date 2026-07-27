import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ClipboardList, UploadCloud, HardDrive, CheckCircle, Clock } from 'lucide-react'
import { apiRequest } from '../utils/api'

const DashboardGuru = () => {
  const [siswaList, setSiswaList] = useState([])
  const [tugasList, setTugasList] = useState([])
  const [diskInfo, setDiskInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [siswaRes, tugasRes, diskRes] = await Promise.all([
          apiRequest('/api/siswa'),
          apiRequest('/api/tugas'),
          apiRequest('/api/localdisk/usage'),
        ])

        const siswaData = await siswaRes.json()
        const tugasData = await tugasRes.json()
        const diskData = await diskRes.json()

        setSiswaList(siswaRes.ok && Array.isArray(siswaData) ? siswaData : [])
        setTugasList(tugasRes.ok && Array.isArray(tugasData) ? tugasData : [])
        setDiskInfo(diskRes.ok ? diskData : null)
      } catch (error) {
        console.error('Gagal memuat dashboard guru:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const activeTasks = useMemo(() => tugasList.filter((tugas) => tugas.status === 'launch'), [tugasList])

  const totalPengumpulan = useMemo(() => (
    tugasList.reduce((total, tugas) => total + (tugas._count?.pengumpulan || 0), 0)
  ), [tugasList])

  const stats = [
    { title: 'Total Siswa', value: siswaList.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Tugas Aktif', value: activeTasks.length, icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Tugas Terkumpul', value: totalPengumpulan, icon: UploadCloud, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Storage Path', value: diskInfo?.baseDir || '-', icon: HardDrive, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  const progressRows = activeTasks.slice(0, 5).map((tugas) => {
    const collected = tugas._count?.pengumpulan || 0
    const percent = siswaList.length > 0 ? Math.round((collected / siswaList.length) * 100) : 0
    return { ...tugas, collected, percent }
  })

  const recentItems = tugasList.slice(0, 4)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Utama</h1>
        <p className="text-gray-500 mt-1">Ringkasan data terbaru dari sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-800 truncate">{loading ? '...' : stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Progress Pengumpulan Tugas</h2>
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Memuat progress...</p>
          ) : progressRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Belum ada tugas aktif.</p>
          ) : (
            <div className="space-y-6">
              {progressRows.map((tugas) => (
                <div key={tugas.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-600">{tugas.judul}</span>
                    <span className="font-bold text-blue-600">{tugas.percent}% ({tugas.collected}/{siswaList.length})</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${tugas.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Aktivitas Terbaru</h2>
          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Memuat aktivitas...</p>
          ) : recentItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-4">
              {recentItems.map((tugas) => (
                <div key={tugas.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tugas.judul}</p>
                    <p className="text-xs text-gray-500">{tugas._count?.pengumpulan || 0} pengumpulan</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(tugas.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardGuru
