import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()

// Simpan/Update data kursi (opsional untuk persistensi)
// Sementara kita buat logika acak murni di backend yang bisa dipanggil frontend

router.post('/shuffle', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })

  try {
    const { kelas, rombel, mustPairIds } = req.body // mustPairIds: array ID siswa yang harus berpasangan

    const siswaList = await prisma.siswa.findMany({
      where: { kelas, rombel }
    })

    if (siswaList.length === 0) return res.status(400).json({ message: 'Tidak ada siswa di kelas ini.' })

    // Logika pengacakan
    let pool = [...siswaList]
    let result = []

    // 16 device, tiap device bisa 1 atau 2 siswa
    // Layout: 4 baris, 2 kolom (kiri/kanan), tiap kolom punya 2 meja samping?
    // Sesuai prompt: 16 device, 8 kiri, 8 kanan.

    // Fungsi shuffle array
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
      }
      return array
    }

    shuffle(pool)

    // Tangani yang "Harus Berdampingan"
    // Pisahkan siswa yang wajib berpasangan
    let pairedSiswa = pool.filter(s => mustPairIds?.includes(s.id))
    let normalSiswa = pool.filter(s => !mustPairIds?.includes(s.id))

    let devices = Array.from({ length: 16 }, (_, i) => ({ id: i + 1, students: [] }))

    // Jika total > 16, pasti ada yang berdua.
    // Aturan dampingan: mereka HARUS berdua di 1 device.

    let currentDeviceIdx = 0

    // Isi pasangan dulu
    while (pairedSiswa.length > 0 && currentDeviceIdx < 16) {
      const s1 = pairedSiswa.pop()
      const s2 = pairedSiswa.pop()
      if (s1) devices[currentDeviceIdx].students.push(s1)
      if (s2) devices[currentDeviceIdx].students.push(s2)
      currentDeviceIdx++
    }

    // Isi sisa siswa normal
    let combinedRemaining = [...pairedSiswa, ...normalSiswa] // pairedSiswa mungkin sisa 1 jika ganjil
    shuffle(combinedRemaining)

    for (const student of combinedRemaining) {
      // Cari device yang masih muat (maks 2)
      // Jika <= 16 siswa, target 1 per device. Jika > 16, target 2 per device.
      if (siswaList.length <= 16) {
        if (currentDeviceIdx < 16) {
          devices[currentDeviceIdx].students.push(student)
          currentDeviceIdx++
        }
      } else {
        // Cari yang masih kosong atau baru isi 1
        let targetDevice = devices.find(d => d.students.length < (siswaList.length > 16 ? 2 : 1))
        if (!targetDevice) targetDevice = devices.find(d => d.students.length < 2)
        if (targetDevice) targetDevice.students.push(student)
      }
    }

    res.json(devices)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengacak tempat duduk.', error: error.message })
  }
})

export default router
