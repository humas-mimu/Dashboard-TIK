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

    // 1) Pisahkan siswa yang ditandai (tagged) dan siswa biasa (singles)
    const pairIdsSet = new Set(mustPairIds || [])
    const taggedPool = shuffle(siswaList.filter(s => pairIdsSet.has(s.id)))
    const singlesPool = shuffle(siswaList.filter(s => !pairIdsSet.has(s.id)))

    // 2) Pasangkan siswa yang ditandai. Apapun jumlah genap/ganjap,
    //    siswa yang ditandai TIDAK BOLEH sendiri. Jika jumlah siswa
    //    ditandai ganjil, ambil 1 siswa dari singlesPool untuk dijadikan pasangan.
    const pairsGroup = []
    while (taggedPool.length > 0) {
      const s1 = taggedPool.pop()
      let s2 = null
      if (taggedPool.length > 0) {
        s2 = taggedPool.pop()
      } else if (singlesPool.length > 0) {
        s2 = singlesPool.pop()
      }
      if (s2) {
        pairsGroup.push([s1, s2])
      }
      // Jika tidak ada s2 (tidak ada tagged lain & tidak ada single),
      // siswa ini diabaikan (kasus ekstrim: hanya 1 siswa di kelas).
    }

    // 3) Acak urutan device untuk penempatan
    const deviceOrder = shuffle(Array.from({ length: MAX_DEVICES }, (_, i) => i))
    let deviceCursor = 0

    // 4) Tempatkan pasangan terlebih dahulu (tiap pair = 1 device)
    for (const group of pairsGroup) {
      if (deviceCursor >= MAX_DEVICES) break
      const devIdx = deviceOrder[deviceCursor]
      devices[devIdx].students = [...group]
      deviceCursor++
    }

    // 5) Tempatkan siswa biasa (singlesPool) di device yang MASIH KOSONG terlebih dahulu
    // Target: semua device terisi minimal 1 anak sebelum ada device isi 2 (selain pasangan)
    const remainingSingles = [...singlesPool]

    while (remainingSingles.length > 0 && deviceCursor < MAX_DEVICES) {
      const devIdx = deviceOrder[deviceCursor]
      const student = remainingSingles.shift()
      devices[devIdx].students.push(student)
      deviceCursor++
    }

    // 6) Jika singles masih tersisa (total siswa > 16), sebar sisa singles
    //    secara acak ke device-device yang baru terisi 1 siswa
    if (remainingSingles.length > 0) {
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
