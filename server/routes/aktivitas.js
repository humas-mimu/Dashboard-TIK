import express from 'express'
import { getAktivitasTerbaru } from '../services/activityService.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/recent', authMiddleware, async (req, res) => {
  if (req.user.role !== 'guru') {
    return res.status(403).json({ message: 'Akses ditolak.' })
  }
  try {
    const limit = parseInt(req.query.limit) || 10
    const logs = await getAktivitasTerbaru(limit)
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil log aktivitas.', error: error.message })
  }
})

export default router
