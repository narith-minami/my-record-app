import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'
import { errorBody } from '../server/errors.ts'
import { verifyAndEnrich } from '../server/identify.ts'

const apiKey = process.env.GEMINI_API_KEY
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!genai) {
    console.error('GEMINI_API_KEY is not set')
    response.status(500).json(errorBody('config', 'Server is not configured', 'GEMINI_API_KEY is not set'))
    return
  }

  const { image, mimeType, artist, title, printedText } = request.body ?? {}
  if (typeof image !== 'string' || !image || typeof artist !== 'string' || !artist || typeof title !== 'string' || !title) {
    response.status(400).json(errorBody('request', 'image, artist and title are required'))
    return
  }

  try {
    response.status(200).json(
      await verifyAndEnrich(genai, {
        image,
        mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
        artist,
        title,
        printedText: typeof printedText === 'string' ? printedText : '',
      }),
    )
  } catch (err) {
    console.error('verifyAndEnrich failed:', err)
    response.status(502).json(errorBody('gemini', 'Gemini request failed', err))
  }
}
