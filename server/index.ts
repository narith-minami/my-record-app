import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import express from 'express'
import { identifyJacket } from './identify.ts'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set. Copy .env.example to .env and fill in your key.')
  process.exit(1)
}

const genai = new GoogleGenAI({ apiKey })
const app = express()
app.use(express.json({ limit: '10mb' }))

app.post('/api/identify-jacket', async (req, res) => {
  const { image, mimeType } = req.body ?? {}
  if (typeof image !== 'string' || !image) {
    res.status(400).json({ error: 'image is required' })
    return
  }

  try {
    const result = await identifyJacket(genai, image, typeof mimeType === 'string' ? mimeType : 'image/jpeg')
    res.json(result)
  } catch (err) {
    console.error('identifyJacket failed:', err)
    res.status(502).json({ error: 'Gemini request failed' })
  }
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  console.log(`jacket-scan proxy server listening on http://localhost:${port}`)
})
