import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()

router.get('/rooms', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const rooms = await prisma.quickShareRoom.findMany({
      include: { _count: { select: { files: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(rooms)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil daftar room.', error: error.message })
  }
})

router.post('/rooms', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') return res.status(403).json({ message: 'Akses ditolak.' })
  try {
    const { nama, password, mode, durasiMenit } = req.body
    const kode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const batasWaktu = new Date(Date.now() + (durasiMenit || 60) * 60 * 1000)

    const room = await prisma.quickShareRoom.create({
      data: {
        kode, nama, password, mode, batasWaktu,
      },
    })
    res.status(201).json(room)
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat room.', error: error.message })
  }
})

export default router
