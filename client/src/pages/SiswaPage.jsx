import React, { useEffect, useRef, useState } from 'react'
import { Upload, Download, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { apiRequest } from '../utils/api'

const SiswaPage = () => {
  const fileInputRef = useRef(null)
  const [siswa, setSiswa] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchSiswa = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/siswa')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal memuat data siswa.')
      setSiswa(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Gagal memuat data siswa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSiswa()
  }, [])

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null)
    setMessage('')
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pilih file Excel terlebih dahulu.')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await apiRequest('/api/siswa/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal mengimpor data siswa.')

      setMessage(data.message)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchSiswa()
    } catch (e) {
      setError(e.message || 'Gagal mengimpor data siswa.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    setError('')
    try {
      const res = await apiRequest('/api/siswa/template/download')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Gagal mengunduh template.')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'template-data-siswa.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Gagal mengunduh template.')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
          <p className="text-gray-500 mt-1">Impor data siswa dari file Excel</p>
        </div>
        <button type="button" onClick={handleDownloadTemplate} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-300 transition">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Upload File Excel</h3>
          <p className="text-gray-500 mb-4">Format kolom: NAMA, KELAS, ROMBEL, TANGGAL LAHIR, JENIS KELAMIN</p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="siswa-file-input" />
          <label htmlFor="siswa-file-input" className="inline-flex cursor-pointer bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition">
            Pilih File
          </label>
          {selectedFile && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-gray-600 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-green-600" /> {selectedFile.name}</span>
              <button type="button" onClick={handleUpload} disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {uploading && <RefreshCw className="w-4 h-4 animate-spin" />} {uploading ? 'Mengimpor...' : 'Import Data'}
              </button>
            </div>
          )}
          {message && <p className="mt-4 text-sm text-green-600 font-medium">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Daftar Siswa</h2>
          <span className="text-sm text-gray-500">Total: {siswa.length} siswa</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Rombel</th>
                <th className="px-6 py-4">Tanggal Lahir</th>
                <th className="px-6 py-4">Jenis Kelamin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Memuat data siswa...</td></tr>
              ) : siswa.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Belum ada data siswa.</td></tr>
              ) : siswa.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{item.nama}</td>
                  <td className="px-6 py-4 text-gray-600">{item.kelas}</td>
                  <td className="px-6 py-4 text-gray-600">{item.rombel}</td>
                  <td className="px-6 py-4 text-gray-600">{item.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{item.jenisKelamin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SiswaPage
