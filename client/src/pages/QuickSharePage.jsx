import React from 'react'
import { Plus, Zap, Users, Clock, Trash2, Copy, QrCode } from 'lucide-react'

const QuickSharePage = () => {
  const rooms = [
    { id: 1, kode: 'LAB-4T9XK2', nama: 'Praktik Word Kelas 5A', status: 'aktif', userCount: 12, files: 5 },
    { id: 2, kode: 'MTR-X8S2P1', nama: 'Materi Photoshop', status: 'berakhir', userCount: 0, files: 2 }
  ]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quick Share</h1>
          <p className="text-gray-500 mt-1">Transfer file instan dalam jaringan LAN</p>
        </div>
        <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2.5 rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transition shadow-lg shadow-orange-200 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Buat Room Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${room.status === 'aktif' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {room.status === 'aktif' ? 'Aktif' : 'Berakhir'}
              </span>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-1">{room.nama}</h3>
            <p className="text-sm text-gray-500 font-mono mb-6">{room.kode}</p>

            <div className="flex justify-between text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4"/> {room.userCount} Online</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> 45 Menit</div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1.5">
                <Copy className="w-4 h-4" /> Copy Link
              </button>
              <button className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition">
                <QrCode className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuickSharePage
