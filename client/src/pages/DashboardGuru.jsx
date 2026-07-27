import React from 'react'
import { motion } from 'framer-motion'
import { Users, ClipboardList, UploadCloud, Download, CheckCircle, Clock } from 'lucide-react'

const DashboardGuru = () => {
  const stats = [
    { title: 'Total Siswa', value: '120', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Tugas Aktif', value: '4', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Tugas Terkumpul', value: '85', icon: UploadCloud, color: 'text-green-500', bg: 'bg-green-50' },
    { title: 'Storage Sisa', value: '42GB', icon: Download, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Utama</h1>
        <p className="text-gray-500 mt-1">Ringkasan aktivitas hari ini</p>
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
            <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Progress Pengumpulan Tugas</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-600">Microsoft Word Dasar (Kelas 5)</span>
                <span className="font-bold text-blue-600">80%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-600">Animasi PPT (Kelas 6)</span>
                <span className="font-bold text-green-600">45%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Aktivitas Terbaru</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Ahmad Fauzi (5A)</p>
                  <p className="text-xs text-gray-500">Mengumpulkan tugas MS Word</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 2 menit yang lalu
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardGuru
