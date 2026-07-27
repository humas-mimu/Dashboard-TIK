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
      where: { kelas, rombel },
    })

    if (siswaList.length === 0) {
      return res.status(400).json({ message: 'Tidak ada siswa di kelas ini.' })
    }
    if (siswaList.length > 32) {
      return res.status(400).json({ message: 'Maksimal 32 siswa untuk 16 perangkat (2 siswa per perangkat).' })
    }

    const MAX_DEVICES = 16
    const devices = Array.from({ length: MAX_DEVICES }, (_, i) => ({ id: i + 1, students: [] }))
    const rightDeviceIndexes = [2, 3, 6, 7, 10, 11, 14, 15]
    const leftDeviceIndexes = [0, 1, 4, 5, 8, 9, 12, 13]

    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
      }
      return array
    }

    const normalizeGender = (value) => String(value || '').toLowerCase()
    const isMale = (student) => normalizeGender(student.jenisKelamin).startsWith('l')
    const sameGender = (a, b) => normalizeGender(a.jenisKelamin) === normalizeGender(b.jenisKelamin)

    const taggedSet = new Set(mustPairIds || [])
    const tagged = shuffle(siswaList.filter((s) => taggedSet.has(s.id)))
    const untagged = shuffle(siswaList.filter((s) => !taggedSet.has(s.id)))
    const pairs = []

    // Pair tagged students with same-gender partner. Prefer another tagged student, then untagged.
    while (tagged.length > 0) {
      const student = tagged.pop()
      let partnerIndex = tagged.findIndex((candidate) => sameGender(student, candidate))
      let partner = null

      if (partnerIndex >= 0) {
        partner = tagged.splice(partnerIndex, 1)[0]
      } else {
        partnerIndex = untagged.findIndex((candidate) => sameGender(student, candidate))
        if (partnerIndex >= 0) partner = untagged.splice(partnerIndex, 1)[0]
      }

      if (!partner) {
        return res.status(400).json({
          message: `${student.nama} ditandai wajib berdua, tetapi tidak ada pasangan dengan jenis kelamin sama.`,
        })
      }

      pairs.push([student, partner])
    }

    const singles = shuffle(untagged)
    const maleSingles = singles.filter(isMale)
    const femaleSingles = singles.filter((s) => !isMale(s))
    const orderedSingles = [...maleSingles, ...femaleSingles]

    // Laki-laki mengisi sisi kanan dulu; sisanya acak kiri+kanan.
    const rightOrder = shuffle([...rightDeviceIndexes])
    const restOrder = shuffle([...leftDeviceIndexes, ...rightDeviceIndexes])
    const deviceOrder = [...rightOrder, ...restOrder.filter((idx) => !rightOrder.includes(idx))]
    let cursor = 0

    // Place pair groups first. Male pair prioritizes right side; female pair uses remaining order.
    const malePairs = shuffle(pairs.filter((pair) => isMale(pair[0])))
    const femalePairs = shuffle(pairs.filter((pair) => !isMale(pair[0])))
    const orderedPairs = [...malePairs, ...femalePairs]

    for (const pair of orderedPairs) {
      if (cursor >= deviceOrder.length) break
      const idx = deviceOrder[cursor]
      devices[idx].students = pair
      cursor++
    }

    // Fill empty devices with one student first.
    for (const student of orderedSingles) {
      if (cursor >= deviceOrder.length) break
      const idx = deviceOrder[cursor]
      if (devices[idx].students.length === 0) {
        devices[idx].students.push(student)
        cursor++
      }
    }

    const placedIds = new Set(devices.flatMap((d) => d.students.map((s) => s.id)))
    const overflow = orderedSingles.filter((s) => !placedIds.has(s.id))

    if (overflow.length > 0) {
      const available = shuffle(devices.filter((d) => d.students.length === 1))
      for (const student of overflow) {
        const matchIndex = available.findIndex((device) => sameGender(device.students[0], student))
        if (matchIndex < 0) continue
        const device = available.splice(matchIndex, 1)[0]
        device.students.push(student)
      }
    }

    devices.sort((a, b) => a.id - b.id)
    res.json(devices)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengacak tempat duduk.', error: error.message })
  }
})

export default router
