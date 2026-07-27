import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Clock, FileText, Eye, Edit, Trash2, X, Image, File, Video, Link as LinkIcon, Upload } from 'lucide-react'
import { apiRequest } from '../utils/api'

const JENIS_OPTIONS = [
  { value: 'text', label: 'Teks', icon: FileText },
  { value: 'dokumen', label: 'Dokumen', icon: File },
  { value: 'gambar', label: 'Gambar', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'link', label: 'Link', icon: LinkIcon },
]

const EMPTY_FORM = {
  judul: '', deskripsi: '', jenis: 'text', link: '', deadline: '',
  status: 'draft', kelasTarget: [], rombelTarget: [], lampiran: [],
}

const TugasPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isGuru = user.role === 'guru'
  const fileRef = useRef(null)

  const [tugasList, setTugasList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('semua')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [kelasList, setKelasList] = useState([])
  const [rombelMap, setRombelMap] = useState({})

  useEffect(() => { fetchTugas() }, [])

  useEffect(() => {
    if (!isGuru) return
    const fetchKelas = async () => {
      try {
        const res = await apiRequest('/api/siswa/login-kelas')
        const data = await res.json()
        if (res.ok) setKelasList(data)
      } catch (e) { console.error(e) }
    }
    fetchKelas()
  }, [isGuru])

  useEffect(() => {
    if (form.kelasTarget.length === 0) return
    const fetchRombels = async () => {
      const map = {}
      for (const kelas of form.kelasTarget) {
        try {
          const res = await apiRequest(`/api/siswa/login-rombel?kelas=${encodeURIComponent(kelas)}`)
          const data = await res.json()
          if (res.ok) map[kelas] = data
        } catch (e) { console.error(e) }
      }
      setRombelMap(map)
    }
    fetchRombels()
  }, [form.kelasTarget])

  const fetchTugas = async () => {
    setLoading(true)
    try {
      const url = isGuru ? '/api/tugas' : '/api/tugas/siswa'
      const res = await apiRequest(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTugasList(Array.isArray(data) ? data : [])
    } catch (e) { console.error('Gagal memuat tugas:', e) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    let list = isGuru
      ? tugasList
      : tugasList

    if (filter === 'aktif') list = list.filter(t => t.status === 'launch')
    else if (filter === 'berakhir') list = list.filter(t => t.deadline && new Date(t.deadline) < new Date())
    else if (filter === 'draft') list = list.filter(t => t.status === 'draft')
    const keyword = search.trim().toLowerCase()
    if (keyword) list = list.filter(t => t.judul.toLowerCase().includes(keyword))
    return list
  }, [tugasList, filter, search, isGuru])

  const matchesTask = (tugas) => {
    const userKelas = user.kelas
    const userRombel = user.rombel
    const kelasTarget = Array.isArray(tugas.kelasTarget) ? tugas.kelasTarget : JSON.parse(tugas.kelasTarget || '[]')
    const rombelTarget = tugas.rombelTarget ? (Array.isArray(tugas.rombelTarget) ? tugas.rombelTarget : JSON.parse(tugas.rombelTarget || '[]')) : []

    const kelasMatch = kelasTarget.length === 0 || kelasTarget.includes(userKelas)
    const rombelMatch = rombelTarget.length === 0 || rombelTarget.includes(userRombel)
    return kelasMatch && rombelMatch
  }

  const toggleKelas = (k) => setForm(p => ({
    ...p, kelasTarget: p.kelasTarget.includes(k) ? p.kelasTarget.filter(x => x !== k) : [...p.kelasTarget, k],
  }))
  const toggleRombel = (r) => setForm(p => ({
    ...p, rombelTarget: p.rombelTarget.includes(r) ? p.rombelTarget.filter(x => x !== r) : [...p.rombelTarget, r],
  }))

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!form.judul.trim()) return setFormError('Judul tugas wajib diisi.')
    if (form.kelasTarget.length === 0) return setFormError('Pilih minimal 1 kelas target.')
    setSubmitting(true); setFormError('')
    try {
      const fd = new FormData()
      fd.append('judul', form.judul)
      fd.append('deskripsi', form.deskripsi)
      fd.append('jenis', form.jenis)
      fd.append('status', form.status)
      if (form.deadline) fd.append('deadline', new Date(form.deadline).toISOString())
      form.kelasTarget.forEach(k => fd.append('kelasTarget', k))
      form.rombelTarget.forEach(r => fd.append('rombelTarget', r))
      form.lampiran.forEach(f => fd.append('lampiran', f))
      if (form.jenis === 'link' && form.link) fd.append('deskripsi', form.deskripsi + '\n\nLink: ' + form.link)

      const res = await apiRequest('/api/tugas', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan tugas.')
      setShowForm(false); setForm({ ...EMPTY_FORM }); fetchTugas()
    } catch (e) { setFormError(e.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return
    try {
      const res = await apiRequest(`/api/tugas/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      setTugasList(prev => prev.filter(t => t.id !== id))
    } catch (e) { console.error('Gagal menghapus:', e) }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await apiRequest(`/api/tugas/${id}`, {
        method: 'PUT', body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      fetchTugas()
    } catch (e) { console.error('Gagal ubah status:', e) }
  }

  const getTimeLeft = (deadline) => {
    if (!deadline) return null
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'Berakhir'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) return `${days} Hari ${hours} Jam`
    return `${hours} Jam ${minutes} Menit ${seconds} Detik`
  }

  const openForm = () => { setForm({ ...EMPTY_FORM }); setFormError(''); setShowForm(true) }

  const allRombels = [...new Set(Object.values(rombelMap).flat())]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isGuru ? 'Informasi Tugas' : 'Daftar Tugas'}</h1>
          <p className="text-gray-500 mt-1">{isGuru ? 'Kelola tugas yang diberikan kepada siswa' : 'Tugas yang perlu kamu kerjakan'}</p>
        </div>
        {isGuru && (
          <button onClick={openForm} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-200">
            <Plus className="w-5 h-5" /> Tambah Tugas
          </button>
        )}
      </div>

      {/* MODAL FORM TAMBAH TUGAS */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <form onSubmit={handleCreateTask} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative mb-10">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Tambah Tugas Baru</h2>

            {formError && <p className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{formError}</p>}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Judul Tugas *
                <input type="text" value={form.judul} onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Praktik Microsoft Word" required />
              </label>

              <label className="block text-sm font-medium text-gray-700">Jenis Tugas
                <div className="flex flex-wrap gap-2 mt-1">
                  {JENIS_OPTIONS.map(opt => (
                    <button type="button" key={opt.value} onClick={() => setForm(p => ({ ...p, jenis: opt.value }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${form.jenis === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <opt.icon className="w-4 h-4" /> {opt.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block text-sm font-medium text-gray-700">Deskripsi
                <textarea value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} rows={4} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Kerjakan latihan halaman 20..." />
              </label>

              {form.jenis === 'link' && (
                <label className="block text-sm font-medium text-gray-700">URL Link
                  <input type="url" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://youtube.com/..." />
                </label>
              )}

              {form.jenis !== 'link' && (
                <label className="block text-sm font-medium text-gray-700">Lampiran (Opsional)
                  <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" multiple onChange={e => setForm(p => ({ ...p, lampiran: Array.from(e.target.files || []) }))} className="hidden" />
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{form.lampiran.length > 0 ? `${form.lampiran.length} file dipilih` : 'Klik untuk memilih file'}</p>
                  </div>
                </label>
              )}

              <label className="block text-sm font-medium text-gray-700">Deadline (Opsional)
                <input type="datetime-local" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </label>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Kelas Target *</span>
                <div className="flex flex-wrap gap-2">
                  {kelasList.map(k => (
                    <button type="button" key={k} onClick={() => toggleKelas(k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.kelasTarget.includes(k) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      Kelas {k}
                    </button>
                  ))}
                </div>
              </div>

              {allRombels.length > 0 && (
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">Rombel Target (Opsional, kosong = semua rombel)</span>
                  <div className="flex flex-wrap gap-2">
                    {allRombels.map(r => (
                      <button type="button" key={r} onClick={() => toggleRombel(r)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.rombelTarget.includes(r) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Status Awal</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(p => ({ ...p, status: 'draft' }))} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.status === 'draft' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Draft</button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, status: 'launch' }))} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${form.status === 'launch' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Langsung Aktif</button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Tugas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isGuru && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {['semua', 'aktif', 'berakhir', 'draft'].map(key => (
              <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 font-medium rounded-lg ${filter === key ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {key === 'semua' ? 'Semua' : key === 'aktif' ? 'Aktif' : key === 'berakhir' ? 'Berakhir' : 'Draft'}
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
            if (!isGuru && !matchesTask(tugas)) return null
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

                {timeLeft && !isEnded && (
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500">Sisa Waktu</span>
                    <span className="font-semibold flex items-center gap-1 text-orange-500">
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
                      {tugas.status === 'draft' && (
                        <button onClick={() => handleStatusChange(tugas.id, 'launch')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Launch">🚀</button>
                      )}
                      <button onClick={() => handleDelete(tugas.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {isGuru && (
            <div onClick={openForm} className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-[380px] text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition cursor-pointer">
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
