import React from 'react'
import { Upload, FileSpreadsheet, Download } from 'lucide-react'

const SiswaPage = () => {
  const siswa = [
    { id: 1, nama: 'Ahmad Fauzi', kelas: '5', rombel: 'A', jk: 'Laki-laki' },
    { id: 2, nama: 'Siti Aisyah', kelas: '5', rombel: 'A', jk: 'Perempuan' },
    { id: 3, nama: 'Budi Santoso', kelas: '5', rombel: 'B', jk: 'Laki-laki' },
  ]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
          <p className="text-gray-500 mt-1">Impor data siswa dari file Excel</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2">
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
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition">
            Pilih File
          </button>
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
                <th className="px-6 py-4">Jenis Kelamin</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {siswa.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{item.nama}</td>
                  <td className="px-6 py-4 text-gray-600">{item.kelas}</td>
                  <td className="px-6 py-4 text-gray-600">{item.rombel}</td>
                  <td className="px-6 py-4 text-gray-600">{item.jk}</td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Edit</button>
                  </td>
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
