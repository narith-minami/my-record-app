import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'
import { enrichRecord } from '../server/identify.ts'

import { errorBody } from '../server/errors.ts'
const apiKey = process.env.GEMINI_API_KEY
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!genai) {
    console.error('GEMINI_API_KEY is not set')
    response.status(500).json(errorBody('config', 'Server is not configured', 'GEMINI_API_KEY is not set'))
    return
  }

  const { artist, title } = request.query
  if (typeof artist !== 'string' || !artist || typeof title !== 'string' || !title) {
    response.status(400).json(errorBody('request', 'artist and title are required'))
    return
  }

  try {
    response.status(200).json(await enrichRecord(genai, artist, title))
  } catch (err) {
    console.error('enrichRecord failed:', err)
    response.status(502).json(errorBody('gemini', 'Gemini request failed', err))
  }
}
