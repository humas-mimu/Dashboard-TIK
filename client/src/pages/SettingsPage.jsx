import React, { useEffect, useState } from 'react'
import { Save, Globe, Palette, Clock, HardDrive, FolderTree, Files } from 'lucide-react'
import { apiRequest } from '../utils/api'

const SettingsPage = () => {
  const [form, setForm] = useState({
    namaSekolah: '',
    alamat: '',
    baseDir: 'D:\\Dashboard_TIK\\',
    tema: 'light',
    jamLogout: 60,
    submissionFolderPattern: 'KELAS_ROMBEL/NAMA_TUGAS',
    duplicateFileHandling: 'RENAME_INCREMENT',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/pengaturan')
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Gagal memuat pengaturan.')
        setForm((prev) => ({ ...prev, ...data }))
      } catch (e) {
        setError(e.message || 'Gagal memuat pengaturan.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setMessage('')
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await apiRequest('/api/pengaturan', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan pengaturan.')
      setMessage('Pengaturan berhasil disimpan.')
      setForm((prev) => ({ ...prev, ...data }))
    } catch (e) {
      setError(e.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">Memuat pengaturan...</div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-500 mt-1">Konfigurasi sistem Dashboard Guru TIK</p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> Identitas Sekolah
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
              <input
                type="text"
                value={form.namaSekolah}
                onChange={(e) => handleChange('namaSekolah', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="SMP Negeri ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sekolah</label>
              <input
                type="text"
                value={form.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Jl. Pendidikan No. 1..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Sekolah</label>
              <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-green-500" /> Konfigurasi Folder Local Disk
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Root Storage Path</label>
              <input
                type="text"
                value={form.baseDir}
                onChange={(e) => handleChange('baseDir', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="D:\\Dashboard_TIK\\"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder Materi</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="D:\Dashboard_TIK\Materi\" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder Backup</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="D:\Dashboard_TIK\Backup\" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-orange-500" /> Pola Folder Pengumpulan
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Susunan Folder</label>
              <select
                value={form.submissionFolderPattern}
                onChange={(e) => handleChange('submissionFolderPattern', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="KELAS_ROMBEL/NAMA_TUGAS">KELAS_ROMBEL / NAMA TUGAS (Default)</option>
                <option value="NAMA_TUGAS/KELAS_ROMBEL">NAMA TUGAS / KELAS_ROMBEL</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Contoh struktur: <code>{`{baseDir}/PengumpulanTugas/5A/Praktik-Word/`}</code>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penanganan File Duplikat</label>
              <select
                value={form.duplicateFileHandling}
                onChange={(e) => handleChange('duplicateFileHandling', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="RENAME_INCREMENT">Rename Increment (file (1).ext, (2).ext)</option>
                <option value="REPLACE">Replace (timpa file lama)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" /> Tampilan & Sistem
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Tema Aplikasi</span>
              <select
                value={form.tema}
                onChange={(e) => handleChange('tema', e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none bg-white"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="glass">Glassmorphism</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Sesi Logout Otomatis</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.jamLogout}
                  onChange={(e) => handleChange('jamLogout', parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-center"
                />
                <span className="text-xs text-gray-400">Menit</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-4 lg:col-span-2">
          <p className="text-sm text-gray-500 text-center">Simpan semua perubahan pengaturan sistem</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full max-w-md py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage