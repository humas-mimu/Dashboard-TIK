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

import express from 'express'
import multer from 'multer'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'
import path from 'path'
import fs from 'fs/promises'

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
        lampiran: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Tambahkan progress per rombel untuk guru
    const tugasWithProgress = await Promise.all(tugas.map(async (tugas) => {
      const kelasTarget = JSON.parse(tugas.kelasTarget || '[]')
      const rombelTarget = tugas.rombelTarget ? JSON.parse(tugas.rombelTarget || '[]') : []

      // Hitung siswa target per rombel
      const rombelGroups = {}
      if (rombelTarget.length === 0) {
        // Semua rombel dari kelas target
        const siswaList = await prisma.siswa.findMany({
          where: { kelas: { in: kelasTarget } }
        })
        siswaList.forEach(s => {
          const key = `${s.kelas}${s.rombel}`
          if (!rombelGroups[key]) rombelGroups[key] = { kelas: s.kelas, rombel: s.rombel, total: 0 }
          rombelGroups[key].total++
        })
      } else {
        // Hanya rombel target
        rombelTarget.forEach(rombel => {
          kelasTarget.forEach(kelas => {
            const key = `${kelas}${rombel}`
            const count = await prisma.siswa.count({
              where: { kelas, rombel }
            })
            if (count > 0) {
              rombelGroups[`${kelas}${rombel}`] = { kelas, rombel, total: count }
            }
          })
        })
      }

      // Hitung pengumpulan per rombel
      const pengumpulan = await prisma.pengumpulan.findMany({
        where: { tugasId: tugas.id },
        include: { siswa: { select: { kelas: true, rombel: true } } }
      })

      const pengumpulanPerRombel = {}
      pengumpulan.forEach(p => {
        const key = `${p.siswa.kelas}${p.siswa.rombel}`
        if (!pengumpulanPerRombel[key]) pengumpulanPerRombel[key] = 0
        pengumpulanPerRombel[key]++
      })

      const rombelProgress = Object.keys(rombelGroups).map(key => ({
        key,
        kelas: rombelGroups[key].kelas,
        rombel: rombelGroups[key].rombel,
        total: rombelGroups[key].total,
        collected: pengumpulanPerRombel[key] || 0,
        percent: rombelGroups[key].total > 0 ? Math.round((pengumpulanPerRombel[key] || 0) / rombelGroups[key].total * 100) : 0
      }))

      return { ...tugas, rombelProgress }
    }))

    res.json(tugasWithProgress)
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
    const allTugas = await prisma.tugas.findMany({
      where: { status: 'launch' },
      orderBy: { deadline: 'asc' },
    })

    // Filter kelas DAN rombel
    const tugas = allTugas.filter((t) => {
      const kelasTarget = JSON.parse(t.kelasTarget || '[]')
      const rombelTarget = t.rombelTarget ? JSON.parse(t.rombelTarget || '[]') : []
      const kelasMatch = kelasTarget.includes(siswa.kelas)
      const rombelMatch = rombelTarget.length === 0 || rombelTarget.includes(siswa.rombel)
      return kelasMatch && rombelMatch
    })
    res.json(tugas)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil tugas siswa.', error: error.message })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const tugas = await prisma.tugas.findUnique({
      where: { id: req.params.id },
      include: { lampiran: true },
    })
    if (!tugas) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' })
    }

    // Log aktivitas BUKA_TUGAS untuk siswa
    if (req.user.role === 'siswa') {
      try {
        await prisma.aktivitasSiswa.create({
          data: {
            siswaId: req.user.id,
            tugasId: tugas.id,
            jenis: 'BUKA_TUGAS',
          }
        })
      } catch (e) {
        console.error('Gagal log aktivitas buka tugas:', e)
      }
    }

    res.json(tugas)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail tugas.', error: error.message })
  }
})

// Preview lampiran (inline)
router.get('/lampiran/:id/view', authMiddleware, async (req, res) => {
  try {
    const lampiran = await prisma.lampiranTugas.findUnique({
      where: { id: req.params.id },
      include: { tugas: true }
    })
    if (!lampiran) {
      return res.status(404).json({ message: 'File tidak ditemukan.' })
    }
    const filePath = path.resolve(lampiran.path)
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ message: 'File tidak ditemukan di server.' })
    }

    // Set headers untuk inline preview
    const ext = path.extname(lampiran.namaFile).toLowerCase()
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
    }
    const mime = mimeTypes[ext] || 'application/octet-stream'
    res.setHeader('Content-Type', mime)
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(lampiran.path)}"`)
    res.sendFile(filePath)
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat file.', error: error.message })
  }
})

// Download lampiran
router.get('/lampiran/:id/download', authMiddleware, async (req, res) => {
  try {
    const lampiran = await prisma.lampiranTugas.findUnique({
      where: { id: req.params.id },
      include: { tugas: true }
    })
    if (!lampiran) {
      return res.status(404).json({ message: 'File tidak ditemukan.' })
    }
    const filePath = path.resolve(lampiran.path)
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ message: 'File tidak ditemukan di server.' })
    }
    res.download(filePath, lampiran.namaFile)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mendownload file.', error: error.message })
  }
})

// POST tugas baru (Guru) - Buat per rombel
router.post('/', authMiddleware, upload.array('lampiran', 5), async (req, res) => {
  if (req.user.role !== 'guru') {
    return res.status(403).json({ message: 'Akses ditolak.' })
  }
  try {
    const { judul, deskripsi, jenis, deadline, kelasTarget, rombelTarget, status } = req.body

    // Parse target rombel
    const kelasTarget = normalizeArray(kelasTarget)
    const rombelTarget = normalizeArray(rombelTarget)

    // Tentukan rombel target
    let rombelTargets = []
    if (rombelTarget.length > 0) {
      rombelTarget.forEach(rombel => {
        kelasTarget.forEach(kelas => {
          rombelTargets.push({ kelas, rombel })
        })
      } else {
        // Ambil semua rombel dari kelas target yang ada siswanya
        const siswaList = await prisma.siswa.findMany({
          where: { kelas: { in: kelasTarget } },
          select: { kelas: true, rombel: true },
          distinct: ['kelas', 'rombel']
        })
        rombelTargets = siswaList
      }

    // Buat tugas per rombel target
    const createdTasks = []
    for (const target of rombelTargets) {
      const newTugas = await prisma.tugas.create({
        data: {
          judul,
          deskripsi,
          jenis,
          deadline: deadline ? new Date(deadline) : null,
          status: status || 'draft',
          kelasTarget: JSON.stringify([target.kelas]),
          rombelTarget: JSON.stringify([target.rombel]),
          lampiran: {
            create: req.files.map((file) => ({
              namaFile: file.originalname,
              path: file.path,
            })),
          },
        },
      })
      createdTasks.push({ ...newTugas, targetRombel: target })
    }

    res.status(201).json({ message: 'Tugas berhasil dibuat.', tugas: createdTasks })
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
