import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'
import os from 'os'
import apiRoutes from './routes/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
})

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'
const clientDistPath = path.resolve(__dirname, '../client/dist')

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

app.set('io', io)
app.use('/api', apiRoutes)
app.use(express.static(clientDistPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Terhubung ke Dashboard TIK' })
})

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === 'IPv4' && !network.internal)
    .map((network) => network.address)
}

httpServer.listen(PORT, HOST, () => {
  const lanAddresses = getLanAddresses()

  console.log('\n===============================================')
  console.log(' Dashboard Guru TIK berhasil berjalan')
  console.log('===============================================')
  console.log(`Komputer Guru : http://localhost:${PORT}`)

  if (lanAddresses.length) {
    console.log('\nAkses dari komputer siswa di jaringan LAN:')
    lanAddresses.forEach((address) => {
      console.log(`  http://${address}:${PORT}`)
    })
  } else {
    console.log('\nIP LAN belum terdeteksi. Pastikan Wi-Fi/LAN tersambung.')
  }

  console.log('\nSiswa cukup membuka salah satu link di atas lewat browser.')
  console.log('Tidak perlu install Node.js atau aplikasi apa pun di komputer siswa.')
  console.log('===============================================\n')
})
