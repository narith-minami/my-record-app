import type { VercelRequest, VercelResponse } from '@vercel/node'
import { searchYoutubeVideo } from '../server/youtube.ts'

const youtubeApiKey = process.env.YOUTUBE_API_KEY

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const q = request.query.q
  if (typeof q !== 'string' || !q) {
    response.status(400).json({ error: 'q is required' })
    return
  }

  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY is not set')
    response.status(500).json({ error: 'YouTube search is not configured' })
    return
  }

  try {
    const videoId = await searchYoutubeVideo(youtubeApiKey, q)
    response.status(200).json({ videoId })
  } catch (err) {
    console.error('searchYoutubeVideo failed:', err)
    response.status(502).json({ error: 'YouTube search failed' })
  }
}
