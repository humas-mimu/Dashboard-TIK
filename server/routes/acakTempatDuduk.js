import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()

router.post('/shuffle', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })

  try {
    const { kelas, rombel, mustPairIds } = req.body

    const siswaList = await prisma.siswa.findMany({
      where: { kelas, rombel }
    })

    if (siswaList.length === 0) {
      return res.status(400).json({ message: 'Tidak ada siswa di kelas ini.' })
    }
    if (siswaList.length > 32) {
      return res.status(400).json({ message: 'Maksimal 32 siswa untuk 16 perangkat (2 siswa per perangkat).' })
    }

    const MAX_DEVICES = 16
    const devices = Array.from({ length: MAX_DEVICES }, (_, i) => ({ id: i + 1, students: [] }))

    // Helper untuk acak array
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
      }
      return array
    }

    // 1) Pisahkan siswa berpasangan (mustPairIds) dan siswa biasa
    const pairIdsSet = new Set(mustPairIds || [])
    const pairsPool = shuffle(siswaList.filter(s => pairIdsSet.has(s.id)))
    const singlesPool = shuffle(siswaList.filter(s => !pairIdsSet.has(s.id)))

    // Gabungkan siswa berpasangan menjadi kelompok isi 2
    const pairsGroup = []
    for (let i = 0; i < pairsPool.length; i += 2) {
      pairsGroup.push(pairsPool.slice(i, i + 2))
    }

    // Acak urutan device agar penempatan awal acak (tidak selalu menumpuk di depan)
    const deviceOrder = shuffle(Array.from({ length: MAX_DEVICES }, (_, i) => i))
    let deviceCursor = 0

    // 2) Tempatkan pasangan (pairsGroup) terlebih dahulu
    // Tiap pasangan mendapat 1 device penuh (isi 2 siswa)
    for (const group of pairsGroup) {
      if (deviceCursor >= MAX_DEVICES) break
      const devIdx = deviceOrder[deviceCursor]
      devices[devIdx].students = [...group]
      deviceCursor++
    }

    // 3) Tempatkan siswa biasa (singlesPool) di device yang MASIH KOSONG terlebih dahulu
    // Target: semua device terisi minimal 1 anak sebelum ada device isi 2 (selain pasangan)
    const remainingSingles = [...singlesPool]

    while (remainingSingles.length > 0 && deviceCursor < MAX_DEVICES) {
      const devIdx = deviceOrder[deviceCursor]
      const student = remainingSingles.shift()
      devices[devIdx].students.push(student)
      deviceCursor++
    }

    // 4) Jika singles masih tersisa (berarti total siswa > 16), sebar sisa singles tersebut
    // secara acak ke device-device yang baru terisi 1 siswa (bukan device kosong atau isi 2)
    if (remainingSingles.length > 0) {
      // Cari device yang saat ini tepat berisi 1 siswa
      const availableDevs = devices.filter(d => d.students.length === 1)
      shuffle(availableDevs)

      for (const student of remainingSingles) {
        if (availableDevs.length === 0) break
        const dev = availableDevs.shift()
        dev.students.push(student)
      }
    }

    // Kembalikan urutan device berdasarkan ID (1 sampai 16) untuk kebutuhan display grid
    devices.sort((a, b) => a.id - b.id)

    res.json(devices)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengacak tempat duduk.', error: error.message })
  }
})

export default router
