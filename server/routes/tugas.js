import express from 'express'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()
const upload = multer({ dest: './storage/temp' })

function normalizeArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [String(parsed)]
  } catch (err) {
    return [String(value)]
  }
}

// GET semua tugas (untuk Guru)
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') {
    return res.status(403).json({ message: 'Akses ditolak.' })
  }
  try {
    const tugas = await prisma.tugas.findMany({
      include: {
        _count: {
          select: { pengumpulan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(tugas)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data tugas.', error: error.message })
  }
})

// GET tugas untuk siswa
router.get('/siswa', authMiddleware, async (req, res) => {
  if (req.user.role !== 'siswa') {
    return res.status(403).json({ message: 'Hanya untuk siswa.' })
  }
  try {
    const siswa = await prisma.siswa.findUnique({ where: { id: req.user.id } })
    const tugas = await prisma.tugas.findMany({
      where: {
        status: 'launch',
        kelasTarget: {
          contains: `"${siswa.kelas}"`,
        },
      },
      orderBy: { deadline: 'asc' },
    })
    res.json(tugas)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil tugas siswa.', error: error.message })
  }
})

// GET detail tugas
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const tugas = await prisma.tugas.findUnique({
      where: { id: req.params.id },
      include: { lampiran: true },
    })
    if (!tugas) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' })
    }
    res.json(tugas)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail tugas.', error: error.message })
  }
})

// POST tugas baru (Guru)
router.post('/', authMiddleware, upload.array('lampiran', 5), async (req, res) => {
  if (req.user.role !== 'guru') {
    return res.status(403).json({ message: 'Akses ditolak.' })
  }
  try {
    const { judul, deskripsi, jenis, deadline, kelasTarget, rombelTarget } = req.body
    const newTugas = await prisma.tugas.create({
      data: {
        judul,
        deskripsi,
        jenis,
        deadline: deadline ? new Date(deadline) : null,
        kelasTarget: JSON.stringify(normalizeArray(kelasTarget)),
        rombelTarget: rombelTarget ? JSON.stringify(normalizeArray(rombelTarget)) : null,
        lampiran: {
          create: req.files.map((file) => ({
            namaFile: file.originalname,
            path: file.path,
          })),
        },
      },
    })
    res.status(201).json({ message: 'Tugas berhasil dibuat.', tugas: newTugas })
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat tugas.', error: error.message })
  }
})

// UPDATE tugas
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const { judul, deskripsi, deadline, status, kelasTarget, rombelTarget } = req.body
    const updatedTugas = await prisma.tugas.update({
      where: { id: req.params.id },
      data: {
        judul,
        deskripsi,
        deadline: deadline ? new Date(deadline) : undefined,
        status,
        kelasTarget: kelasTarget ? JSON.stringify(normalizeArray(kelasTarget)) : undefined,
        rombelTarget: rombelTarget ? JSON.stringify(normalizeArray(rombelTarget)) : undefined,
      },
    })
    res.json({ message: 'Tugas berhasil diperbarui.', tugas: updatedTugas })
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui tugas.', error: error.message })
  }
})

// DELETE tugas
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    await prisma.tugas.delete({ where: { id: req.params.id } })
    res.json({ message: 'Tugas berhasil dihapus.' })
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus tugas.', error: error.message })
  }
})

export default router
