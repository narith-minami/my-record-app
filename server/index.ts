import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import express from 'express'
import { errorBody } from './errors.ts'
import { enrichRecord, quickIdentify } from './identify.ts'
import { searchYoutubeVideo } from './youtube.ts'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set. Copy .env.example to .env and fill in your key.')
  process.exit(1)
}

const youtubeApiKey = process.env.YOUTUBE_API_KEY

const genai = new GoogleGenAI({ apiKey })
const app = express()
app.use(express.json({ limit: '10mb' }))

app.post('/api/identify-jacket', async (req, res) => {
  const { image, mimeType } = req.body ?? {}
  if (typeof image !== 'string' || !image) {
    res.status(400).json(errorBody('request', 'image is required'))
    return
  }

  try {
    const result = await quickIdentify(genai, image, typeof mimeType === 'string' ? mimeType : 'image/jpeg')
    res.json(result)
  } catch (err) {
    console.error('identifyJacket failed:', err)
    res.status(502).json(errorBody('gemini', 'Gemini request failed', err))
  }
})

app.get('/api/enrich-jacket', async (req, res) => {
  const { artist, title } = req.query
  if (typeof artist !== 'string' || !artist || typeof title !== 'string' || !title) {
    res.status(400).json(errorBody('request', 'artist and title are required'))
    return
  }

  try {
    res.json(await enrichRecord(genai, artist, title))
  } catch (err) {
    console.error('enrichRecord failed:', err)
    res.status(502).json(errorBody('gemini', 'Gemini request failed', err))
  }
})

app.get('/api/youtube-search', async (req, res) => {
  const q = req.query.q
  if (typeof q !== 'string' || !q) {
    res.status(400).json({ error: 'q is required' })
    return
  }
  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY is not set')
    res.status(500).json({ error: 'YouTube search is not configured' })
    return
  }

  try {
    const videoId = await searchYoutubeVideo(youtubeApiKey, q)
    res.json({ videoId })
  } catch (err) {
    console.error('searchYoutubeVideo failed:', err)
    res.status(502).json({ error: 'YouTube search failed' })
  }
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  console.log(`jacket-scan proxy server listening on http://localhost:${port}`)
})
