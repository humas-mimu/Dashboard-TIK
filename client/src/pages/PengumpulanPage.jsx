import React, { useState, useEffect } from 'react'
import { apiRequest } from '../utils/api'
import { Download, CheckCircle, XCircle, FileSpreadsheet, RefreshCw } from 'lucide-react'

const PengumpulanPage = () => {
  const [tugasList, setTugasList] = useState([])
  const [selectedTugasId, setSelectedTugasId] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTugas()
  }, [])

  useEffect(() => {
    if (selectedTugasId) fetchStatus()
  }, [selectedTugasId])

  const fetchTugas = async () => {
    try {
      const res = await apiRequest('/api/tugas')
      const data = await res.json()
      setTugasList(data)
      if (data.length > 0) setSelectedTugasId(data[0].id)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await apiRequest(`/api/pengumpulan/status/${selectedTugasId}`)
      const data = await res.json()
      setSubmissions(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!selectedTugasId) return
    try {
      const res = await apiRequest(`/api/pengumpulan/export/${selectedTugasId}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rekap-pengumpulan.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      console.error('Export failed:', e)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Pengumpulan</h1>
        <p className="text-gray-500 mt-1">Pantau status pengerjaan tugas oleh siswa</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedTugasId}
              onChange={(e) => setSelectedTugasId(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Tugas</option>
              {tugasList.map(t => <option key={t.id} value={t.id}>{t.judul}</option>)}
            </select>
            <button
              onClick={fetchStatus}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={!selectedTugasId || loading}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-100 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download Rekap (Excel)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Jam Upload</th>
                <th className="px-6 py-4">Nama File</th>
                <th className="px-6 py-4">Ukuran</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-medium">Memuat data pengumpulan...</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-medium">Belum ada data untuk tugas ini.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4 font-bold text-gray-800">{sub.nama}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{sub.kelas}{sub.rombel}</td>
                    <td className="px-6 py-4">
                      {sub.sudahUpload ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider border border-green-100">
                          <CheckCircle className="w-3 h-3" /> Sudah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider border border-red-100">
                          <XCircle className="w-3 h-3" /> Belum
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{sub.jamUpload ? new Date(sub.jamUpload).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]" title={sub.namaFile}>{sub.namaFile || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{sub.ukuran ? `${(sub.ukuran / 1024).toFixed(1)} KB` : '-'}</td>
                    <td className="px-6 py-4">
                      {sub.sudahUpload && (
                        <a
                          href={`/api/pengumpulan/download/${sub.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center w-fit"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PengumpulanPage
