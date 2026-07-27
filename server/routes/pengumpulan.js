import express from 'express'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'
import path from 'path'
import fs from 'fs/promises'
import XLSX from 'xlsx'

const prisma = new PrismaClient()
const router = express.Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// Upload tugas
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'siswa') {
    return res.status(403).json({ message: 'Hanya untuk siswa.' })
  }
  try {
    const { tugasId } = req.body
    const file = req.file

    if (!file) return res.status(400).json({ message: 'Tidak ada file diunggah.' })

    const siswa = await prisma.siswa.findUnique({ where: { id: req.user.id } })
    const tugas = await prisma.tugas.findUnique({ where: { id: tugasId } })
    const settings = await prisma.pengaturan.findFirst() || { baseDir: './storage' }

    const ext = path.extname(file.originalname)
    const cleanSiswaName = siswa.nama.replace(/[^a-zA-Z0-9]/g, '_')
    const finalFilename = `${cleanSiswaName}${ext}`

    const destination = path.join(
      settings.baseDir,
      'PengumpulanTugas',
      tugas.judul.replace(/[^a-zA-Z0-9]/g, '_'),
      `${siswa.kelas}_${siswa.rombel}`
    )
    await fs.mkdir(destination, { recursive: true })
    const finalPath = path.join(destination, finalFilename)

    await fs.writeFile(finalPath, file.buffer)

    // Replace
    const existing = await prisma.pengumpulan.findFirst({
      where: { tugasId, siswaId: req.user.id },
    })

    if (existing) {
      // Hapus file lama jika path berbeda
      if (existing.path !== finalPath) {
        try { await fs.unlink(existing.path) } catch (err) {}
      }

      const updated = await prisma.pengumpulan.update({
        where: { id: existing.id },
        data: { namaFile: finalFilename, path: finalPath, ukuran: file.size },
      })
      req.app.get('io').emit('pengumpulan-update', updated)
      return res.json({ message: 'Tugas berhasil diunggah ulang.', data: updated })
    }

    const pengumpulan = await prisma.pengumpulan.create({
      data: {
        tugasId, siswaId: req.user.id, namaFile: finalFilename, path: finalPath, ukuran: file.size,
      },
    })
    req.app.get('io').emit('pengumpulan-baru', pengumpulan)
    res.status(201).json({ message: 'Tugas berhasil diunggah.', data: pengumpulan })
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengunggah tugas.', error: error.message })
  }
})

// GET status pengumpulan untuk suatu tugas
router.get('/status/:tugasId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const { tugasId } = req.params
    const tugas = await prisma.tugas.findUnique({ where: { id: tugasId } })
    if (!tugas) return res.status(404).json({ message: 'Tugas tidak ditemukan.' })

    let kelasTarget = []
    try {
      kelasTarget = JSON.parse(tugas.kelasTarget || '[]')
    } catch (err) {
      kelasTarget = []
    }

    const allSiswa = await prisma.siswa.findMany({
      where: kelasTarget.length ? { kelas: { in: kelasTarget } } : {},
    })
    const sudahMengumpulkan = await prisma.pengumpulan.findMany({
      where: { tugasId },
      include: { siswa: { select: { nama: true, kelas: true, rombel: true } } },
    })

    const statusSiswa = allSiswa.map((s) => {
      const p = sudahMengumpulkan.find((p) => p.siswaId === s.id)
      return {
        id: s.id,
        nama: s.nama,
        kelas: s.kelas,
        rombel: s.rombel,
        sudahUpload: !!p,
        jamUpload: p ? p.updatedAt : null,
        namaFile: p ? p.namaFile : null,
        ukuran: p ? p.ukuran : null,
        path: p ? p.path : null,
      }
    })
    res.json(statusSiswa)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil status.', error: error.message })
  }
})

// Export Excel rekap pengumpulan
router.get('/export/:tugasId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const { tugasId } = req.params
    const tugas = await prisma.tugas.findUnique({ where: { id: tugasId } })
    if (!tugas) return res.status(404).json({ message: 'Tugas tidak ditemukan.' })

    let kelasTarget = []
    try {
      kelasTarget = JSON.parse(tugas.kelasTarget || '[]')
    } catch (err) {
      kelasTarget = []
    }

    const allSiswa = await prisma.siswa.findMany({
      where: kelasTarget.length ? { kelas: { in: kelasTarget } } : {},
    })
    const sudahMengumpulkan = await prisma.pengumpulan.findMany({
      where: { tugasId },
      include: { siswa: { select: { nama: true, kelas: true, rombel: true } } },
    })

    const statusSiswa = allSiswa.map((s) => {
      const p = sudahMengumpulkan.find((p) => p.siswaId === s.id)
      return {
        Nama: s.nama,
        Kelas: s.kelas,
        Rombel: s.rombel,
        Status: !!p ? 'Sudah' : 'Belum',
        'Nama File': p ? p.namaFile : '-',
        'Jam Upload': p ? new Date(p.updatedAt).toLocaleString('id-ID') : '-',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(statusSiswa)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Pengumpulan')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Disposition', `attachment; filename=rekap-${tugas.judul.replace(/ /g, '_')}.xlsx`)
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buffer)
  } catch (error) {
    res.status(500).json({ message: 'Gagal export data.', error: error.message })
  }
})

// Download file siswa
router.get('/download/:pengumpulanId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const p = await prisma.pengumpulan.findUnique({ where: { id: req.params.pengumpulanId } })
    if (!p) return res.status(404).json({ message: 'File tidak ditemukan.' })
    res.download(p.path, p.namaFile)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengunduh file.', error: error.message })
  }
})

export default router