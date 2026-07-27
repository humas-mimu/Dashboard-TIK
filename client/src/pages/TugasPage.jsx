import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Clock, FileText, Eye, Edit, Trash2 } from 'lucide-react'
import { apiRequest } from '../utils/api'

const TugasPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isGuru = user.role === 'guru'

  const [tugasList, setTugasList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('semua')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTugas()
  }, [])

  const fetchTugas = async () => {
    setLoading(true)
    try {
      const url = isGuru ? '/api/tugas' : '/api/tugas/siswa'
      const res = await apiRequest(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTugasList(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Gagal memuat tugas:', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = tugasList

    if (filter === 'aktif') list = list.filter(t => t.status === 'launch')
    else if (filter === 'berakhir') list = list.filter(t => t.deadline && new Date(t.deadline) < new Date())
    else if (filter === 'draft') list = list.filter(t => t.status === 'draft')

    const keyword = search.trim().toLowerCase()
    if (keyword) list = list.filter(t => t.judul.toLowerCase().includes(keyword))

    return list
  }, [tugasList, filter, search])

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return
    try {
      const res = await apiRequest(`/api/tugas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message)
      }
      setTugasList(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      console.error('Gagal menghapus:', e)
    }
  }

  const getTimeLeft = (deadline) => {
    if (!deadline) return null
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'Berakhir'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days} Hari ${hours} Jam`
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isGuru ? 'Informasi Tugas' : 'Daftar Tugas'}</h1>
          <p className="text-gray-500 mt-1">{isGuru ? 'Kelola tugas yang diberikan kepada siswa' : 'Tugas yang perlu kamu kerjakan'}</p>
        </div>
        {isGuru && (
          <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-200">
            <Plus className="w-5 h-5" /> Tambah Tugas
          </button>
        )}
      </div>

      {isGuru && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {['semua', 'aktif', 'berakhir', 'draft'].map(key => (
              <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 font-medium rounded-lg capitalize ${filter === key ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {key === 'semua' ? 'Semua Tugas' : key === 'aktif' ? 'Sedang Berlangsung' : key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari tugas..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64" />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-16">Memuat daftar tugas...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-semibold text-gray-600">Belum Ada Tugas</p>
          <p className="text-sm mt-1">{isGuru ? 'Buat tugas baru untuk memulai.' : 'Guru belum membagikan tugas untuk kelasmu.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(tugas => {
            const timeLeft = getTimeLeft(tugas.deadline)
            const isEnded = timeLeft === 'Berakhir'

            return (
              <div key={tugas.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${isEnded ? 'bg-gray-100 text-gray-500' : tugas.status === 'draft' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
                    {isEnded ? 'Berakhir' : tugas.status === 'draft' ? 'Draft' : 'Aktif'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition">{tugas.judul}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{tugas.deskripsi || 'Tidak ada deskripsi.'}</p>

                {timeLeft && (
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500">Sisa Waktu</span>
                    <span className={`font-semibold flex items-center gap-1 ${isEnded ? 'text-gray-400' : 'text-orange-500'}`}>
                      <Clock className="w-4 h-4" /> {timeLeft}
                    </span>
                  </div>
                )}

                {isGuru && tugas._count && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-gray-500">Pengumpulan</span>
                      <span className="font-bold text-blue-600">{tugas._count.pengumpulan}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
                  <Link to={isGuru ? `/dashboard/tugas/${tugas.id}` : `/siswa/tugas/${tugas.id}`} className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Lihat
                  </Link>
                  {isGuru && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(tugas.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {isGuru && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-[380px] text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition cursor-pointer">
              <Plus className="w-8 h-8 mb-2" />
              <p className="font-medium">Tambah Tugas Baru</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TugasPage
