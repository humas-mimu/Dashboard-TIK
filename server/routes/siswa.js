import express from 'express'
import multer from 'multer'
import XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const requiredHeaders = ['NAMA', 'KELAS', 'ROMBEL', 'TANGGAL LAHIR', 'JENIS KELAMIN']

function parseBirthDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d)
  }
  const text = String(value || '').trim()
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!match) return null
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  return Number.isNaN(date.getTime()) ? null : date
}

// Get unique kelas for login dropdown
router.get('/login-kelas', async (req, res) => {
  try {
    const kelas = await prisma.siswa.findMany({
      select: { kelas: true },
      distinct: ['kelas'],
      orderBy: { kelas: 'asc' },
    })
    res.json(kelas.map(k => k.kelas))
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar kelas.', error: error.message })
  }
})

// Get unique rombel for login dropdown, filtered by kelas
router.get('/login-rombel', async (req, res) => {
  try {
    const { kelas } = req.query
    if (!kelas) return res.status(400).json({ message: 'Parameter kelas diperlukan.' })

    const rombel = await prisma.siswa.findMany({
      where: { kelas },
      select: { rombel: true },
      distinct: ['rombel'],
      orderBy: { rombel: 'asc' },
    })
    res.json(rombel.map(r => r.rombel))
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar rombel.', error: error.message })
  }
})

// Data siswa untuk dropdown login; tanpa data tanggal lahir.
router.get('/login-list', async (req, res) => {
  try {
    const { kelas, rombel } = req.query
    const whereClause = {}

    if (kelas) whereClause.kelas = kelas
    if (rombel) whereClause.rombel = rombel

    const siswa = await prisma.siswa.findMany({
      where: whereClause,
      select: { id: true, nama: true, kelas: true, rombel: true },
      orderBy: [{ kelas: 'asc' }, { rombel: 'asc' }, { nama: 'asc' }],
    })
    res.json(siswa)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar siswa.', error: error.message })
  }
})

router.get('/dashboard-data', authMiddleware, async (req, res) => {
  if (req.user.role !== 'siswa') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const siswa = await prisma.siswa.findUnique({ where: { id: req.user.id } })
    if (!siswa) return res.status(404).json({ message: 'Data siswa tidak ditemukan.' })

    const tugas = await prisma.tugas.findMany({
      where: {
        status: 'launch',
        kelasTarget: { contains: `"${siswa.kelas}"` },
      },
      orderBy: { deadline: 'asc' },
    })
    const pengumpulan = await prisma.pengumpulan.findMany({
      where: { siswaId: siswa.id, tugasId: { in: tugas.map((item) => item.id) } },
      select: { tugasId: true, updatedAt: true },
    })

    res.json({ tugas, pengumpulan })
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data dashboard siswa.', error: error.message })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const siswa = await prisma.siswa.findMany({ orderBy: [{ kelas: 'asc' }, { rombel: 'asc' }, { nama: 'asc' }] })
    res.json(siswa)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data siswa.', error: error.message })
  }
})

router.get('/kelas/list', authMiddleware, async (req, res) => {
  try {
    const rows = await prisma.siswa.findMany({ select: { kelas: true, rombel: true }, distinct: ['kelas', 'rombel'] })
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil kelas.', error: error.message })
  }
})

// Import Excel sesuai template.
router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  if (!req.file) return res.status(400).json({ message: 'File Excel wajib diunggah.' })

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
    const headers = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] || []
    const missing = requiredHeaders.filter((header) => !headers.includes(header))
    if (missing.length) return res.status(400).json({ message: `Kolom "${missing[0]}" tidak ditemukan. Silakan gunakan Template Data Siswa.` })

    const data = rows.map((row, index) => {
      const tanggalLahir = parseBirthDate(row['TANGGAL LAHIR'])
      const emptyHeader = requiredHeaders.find((header) => !String(row[header] ?? '').trim())
      if (emptyHeader) throw new Error(`Baris ${index + 2}: kolom "${emptyHeader}" wajib diisi.`)
      if (!tanggalLahir) throw new Error(`Baris ${index + 2}: format TANGGAL LAHIR tidak valid.`)
      const dd = String(tanggalLahir.getUTCDate()).padStart(2, '0')
      const mm = String(tanggalLahir.getUTCMonth() + 1).padStart(2, '0')
      return {
        nama: String(row.NAMA).trim(), kelas: String(row.KELAS).trim(), rombel: String(row.ROMBEL).trim(),
        tanggalLahir, jenisKelamin: String(row['JENIS KELAMIN']).trim(), nis: row.NIS ? String(row.NIS).trim() : null,
        password: `${dd}${mm}${tanggalLahir.getUTCFullYear()}`,
      }
    })

    await prisma.$transaction([prisma.siswa.deleteMany(), prisma.siswa.createMany({ data })])
    res.json({ message: `${data.length} data siswa berhasil diimpor.`, total: data.length })
  } catch (error) {
    res.status(400).json({ message: error.message || 'Gagal mengimpor file Excel.' })
  }
})

router.get('/template/download', (req, res) => {
  const sheet = XLSX.utils.aoa_to_sheet([requiredHeaders])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Data Siswa')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Disposition', 'attachment; filename=template-data-siswa.xlsx')
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buffer)
})

export default router
