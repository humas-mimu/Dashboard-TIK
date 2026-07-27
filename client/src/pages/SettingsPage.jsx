import React from 'react'
import { Save, Globe, Layout, Palette, Clock, HardDrive } from 'lucide-react'

const SettingsPage = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-500 mt-1">Konfigurasi sistem Dashboard Guru TIK</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> Identitas Sekolah
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="SMP Negeri ..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sekolah</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jl. Pendidikan No. 1..." />
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
              <div className="flex gap-2">
                <input type="text" className="flex-1 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600" value="D:\Dashboard_TIK\" readOnly />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition">Ubah</button>
              </div>
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
            <Palette className="w-5 h-5 text-purple-500" /> Tampilan & Sistem
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Tema Aplikasi</span>
              <select className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none">
                <option>Light Mode</option>
                <option>Dark Mode</option>
                <option>Glassmorphism</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Sesi Logout Otomatis</span>
              <div className="flex items-center gap-2">
                <input type="number" className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-center" defaultValue={60} />
                <span className="text-xs text-gray-400">Menit</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Port Backend</span>
              <input type="text" className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-center" defaultValue={5000} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-4">
          <p className="text-sm text-gray-500 text-center">Simpan semua perubahan pengaturan sistem</p>
          <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
