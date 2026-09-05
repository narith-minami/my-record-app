import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'
import { identifyJacket } from '../server/identify.ts'

const apiKey = process.env.GEMINI_API_KEY
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!genai) {
    console.error('GEMINI_API_KEY is not set')
    response.status(500).json({ error: 'Server is not configured' })
    return
  }

  const { image, mimeType } = request.body ?? {}
  if (typeof image !== 'string' || !image) {
    response.status(400).json({ error: 'image is required' })
    return
  }

  try {
    const result = await identifyJacket(genai, image, typeof mimeType === 'string' ? mimeType : 'image/jpeg')
    response.status(200).json(result)
  } catch (err) {
    console.error('identifyJacket failed:', err)
    response.status(502).json({ error: 'Gemini request failed' })
  }
}
