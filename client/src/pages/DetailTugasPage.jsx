import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, FileText, Upload, AlertCircle, ArrowLeft, Download, CheckCircle } from 'lucide-react'
import { apiRequest } from '../utils/api'

const DetailTugasPage = () => {
  const { id } = useParams()
  const [tugas, setTugas] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isSiswa = user.role === 'siswa'

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    try {
      const res = await apiRequest(`/api/tugas/${id}`)
      const data = await res.json()
      setTugas(data)
      setLoading(false)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  useEffect(() => {
    let interval = null;
    if (tugas && tugas.deadline) {
      interval = setInterval(() => {
        const dest = new Date(tugas.deadline).getTime()
        const now = new Date().getTime()
        const diff = dest - now

        if (diff <= 0) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
          if (interval) clearInterval(interval)
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setCountdown({ days, hours, minutes, seconds, ended: false })
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [tugas])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('tugasId', id)

    try {
      const res = await apiRequest('/api/pengumpulan/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSuccess('Tugas berhasil diunggah!')
      setFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat detail tugas...</div>
  }

  if (!tugas) {
    return <div className="p-8 text-center text-red-500">Tugas tidak ditemukan.</div>
  }

  // Tentukan warna countdown berdasarkan sisa waktu
  const getCountdownColor = () => {
    if (countdown.ended) return 'text-red-500 bg-red-50 border-red-200'
    const totalHours = (countdown.days * 24) + countdown.hours
    if (totalHours < 1) return 'text-red-600 bg-red-50 border-red-100 animate-pulse'
    if (totalHours < 24) return 'text-yellow-600 bg-yellow-50 border-yellow-100'
    return 'text-blue-600 bg-blue-50 border-blue-100'
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to={isSiswa ? '/siswa/tugas' : '/dashboard/tugas'}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Detail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
              {tugas.jenis}
            </span>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">{tugas.judul}</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Dibuat pada: {new Date(tugas.createdAt).toLocaleDateString('id-ID')}
            </p>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-800 mb-2">Deskripsi Tugas</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{tugas.deskripsi || 'Tidak ada deskripsi.'}</p>
            </div>

            {tugas.lampiran && tugas.lampiran.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-800 mb-3">Lampiran Materi</h3>
                <div className="space-y-2">
                  {tugas.lampiran.map((file) => (
                    <div key={file.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.namaFile}</span>
                      </div>
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition flex-shrink-0">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Aksi / Status */}
        <div className="space-y-6">
          {/* Countdown Card */}
          {tugas.deadline && (
            <div className={`bg-white rounded-2xl p-6 shadow-sm border ${getCountdownColor()} transition duration-300`}>
              <h3 className="font-bold text-sm uppercase tracking-wider mb-3">Sisa Waktu</h3>
              {countdown.ended ? (
                <div className="flex items-center gap-2 font-bold text-lg">
                  <AlertCircle className="w-5 h-5" /> TUGAS TELAH BERAKHIR
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-xl font-bold">{countdown.days}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Hari</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{countdown.hours}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Jam</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{countdown.minutes}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Menit</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{countdown.seconds}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">Detik</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Card khusus siswa */}
          {isSiswa && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Unggah Jawaban</h3>

              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {countdown.ended ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-red-700 font-bold text-sm">
                  ❌ Masa Pengumpulan Telah Berakhir
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition relative">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">
                      {file ? file.name : 'Pilih atau drop file jawaban di sini'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? 'Mengunggah...' : 'Kirim Jawaban'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailTugasPage
