import { ThinkingLevel, type GenerateContentResponse, type GoogleGenAI } from '@google/genai'
import { lookupDeezerBpm } from './deezer.ts'

export interface IdentifySource {
  title: string
  url: string
}

/** Stage 1: fast, search-free read of the jacket (artist / title only). */
export interface QuickResult {
  recognized: boolean
  artist: string
  title: string
  confidence: 'high' | 'medium' | 'low'
}

/** Stage 2: web-grounded details for an already identified record. */
export interface EnrichResult {
  releaseYear: string
  label: string
  genre: string
  producer: string
  bpm: string
  bpmSource: 'deezer' | 'search' | null
  artistInfo: string
  notes: string
  sources: IdentifySource[]
}

// Pinned model IDs (the `*-latest` aliases can change targets with only two weeks' notice).
// QUICK: low-latency multimodal read of the jacket. RESEARCH: Search-grounded details.
const QUICK_MODEL = 'gemini-3.5-flash-lite'
const RESEARCH_MODEL = 'gemini-3.8-flash'
const EXTRACT_MODEL = 'gemini-3.5-flash-lite'

const QUICK_PROMPT = `レコード・CD・カセットのジャケット画像から、アーティスト名と曲名・アルバム名を読み取ってください。
ジャケットに印刷されている文字（装飾書体でも一文字ずつ確認）を最優先の根拠にしてください。写真の雰囲気やジャンルの印象だけで推測しないでください。
有名なジャケットなど、文字がなくても確信できる場合は識別して構いません。
ジャケットとして認識できない、または確信が持てない場合は recognized を false にし、分からない文字列項目は空文字にしてください。実在しない情報を推測で断定しないでください。`

const RESEARCH_PROMPT_PREFIX = `あなたはレコード・CD・カセットの専門家です。次のレコードについて、Google検索を使って以下を可能な限り正確に調べてください:
- 発売年（販売年）
- レーベル名
- ジャンル
- プロデューサー
- BPM（テンポ。GetSongBPMやSongBPMなどのBPM専門サイトを含めて検索してください）
- アーティストの簡単な経歴・情報（2〜3文程度）
- 特記事項（エディション、再発盤かどうか等、分かれば）

検索は3回程度を目安にし、同じ仮説を裏付けるためだけに検索を繰り返さないでください。
実在しない情報を推測で断定せず、分からない項目は「不明」とはっきり書いてください。
根拠となった検索結果（ページタイトルやサイト名）が分かるように、自由な文章でまとめてください。

--- 対象 ---
`

const EXTRACT_PROMPT_PREFIX = `以下はレコードの調査結果のテキストです。この内容を指定のJSON形式に整理してください。
調査結果に書かれていない項目は、推測で埋めずに "不明" にしてください。

--- 調査結果 ---
`

export async function quickIdentify(
  genai: GoogleGenAI,
  base64Image: string,
  mimeType: string,
): Promise<QuickResult> {
  const start = performance.now()
  const response = await genai.models.generateContent({
    model: QUICK_MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: QUICK_PROMPT }, { inlineData: { data: base64Image, mimeType } }],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          recognized: { type: 'BOOLEAN' },
          artist: { type: 'STRING' },
          title: { type: 'STRING' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: ['recognized', 'artist', 'title', 'confidence'],
      },
    },
  })

  const text = response.text
  if (!text) throw new Error('Gemini quick call returned an empty response')
  let parsed: QuickResult
  try {
    parsed = JSON.parse(text) as QuickResult
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${text}`)
  }
  if (!parsed.artist || !parsed.title) parsed.recognized = false

  console.log(
    `[jacket-scan] quick (${QUICK_MODEL}): ${Math.round(performance.now() - start)}ms, recognized=${parsed.recognized}`,
  )
  return parsed
}

const ENRICH_CACHE_MAX = 200
const enrichCache = new Map<string, Promise<EnrichResult>>()

function cacheKey(artist: string, title: string): string {
  return `${artist}\u0000${title}`.normalize('NFKC').toLowerCase()
}

/**
 * Looks up details for an identified record. Deezer BPM runs in parallel with the
 * Search-grounded research call, and results are cached per artist/title.
 */
export function enrichRecord(genai: GoogleGenAI, artist: string, title: string): Promise<EnrichResult> {
  const key = cacheKey(artist, title)
  const hit = enrichCache.get(key)
  if (hit) {
    // refresh LRU position
    enrichCache.delete(key)
    enrichCache.set(key, hit)
    return hit
  }

  const pending = runEnrich(genai, artist, title)
  enrichCache.set(key, pending)
  if (enrichCache.size > ENRICH_CACHE_MAX) {
    const oldest = enrichCache.keys().next().value
    if (oldest !== undefined) enrichCache.delete(oldest)
  }
  // don't cache failures
  pending.catch(() => enrichCache.delete(key))
  return pending
}

async function runEnrich(genai: GoogleGenAI, artist: string, title: string): Promise<EnrichResult> {
  const totalStart = performance.now()

  const deezerPromise = lookupDeezerBpm(artist, title).catch((err) => {
    console.warn('[jacket-scan] Deezer BPM lookup failed:', err)
    return null
  })

  const researchStart = performance.now()
  const researchResponse = await genai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: `${RESEARCH_PROMPT_PREFIX}アーティスト: ${artist}\n曲名・アルバム名: ${title}` }],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      tools: [{ googleSearch: {} }],
    },
  })
  const researchMs = Math.round(performance.now() - researchStart)

  const researchText = researchResponse.text
  if (!researchText) throw new Error('Gemini research call returned an empty response')

  const grounding = researchResponse.candidates?.[0]?.groundingMetadata
  const sources = extractSources(researchResponse)
  console.log(
    `[jacket-scan] research (${RESEARCH_MODEL}): ${researchMs}ms, ` +
      `searchQueries=${JSON.stringify(grounding?.webSearchQueries ?? [])}, ` +
      `groundingChunks=${grounding?.groundingChunks?.length ?? 0}, sources=${sources.length}`,
  )

  const extractStart = performance.now()
  const extractResponse = await genai.models.generateContent({
    model: EXTRACT_MODEL,
    contents: [{ role: 'user', parts: [{ text: EXTRACT_PROMPT_PREFIX + researchText }] }],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          releaseYear: { type: 'STRING' },
          label: { type: 'STRING' },
          genre: { type: 'STRING' },
          producer: { type: 'STRING' },
          bpm: { type: 'STRING' },
          artistInfo: { type: 'STRING' },
          notes: { type: 'STRING' },
        },
        required: ['releaseYear', 'label', 'genre', 'producer', 'bpm', 'artistInfo', 'notes'],
      },
    },
  })
  const extractMs = Math.round(performance.now() - extractStart)

  const extractText = extractResponse.text
  if (!extractText) throw new Error('Gemini extract call returned an empty response')

  let parsed: Omit<EnrichResult, 'sources' | 'bpmSource'>
  try {
    parsed = JSON.parse(extractText) as Omit<EnrichResult, 'sources' | 'bpmSource'>
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${extractText}`)
  }

  let bpm = parsed.bpm
  let bpmSource: EnrichResult['bpmSource'] = null
  const deezerBpm = await deezerPromise
  if (deezerBpm) {
    bpm = String(deezerBpm)
    bpmSource = 'deezer'
  } else if (bpm && bpm !== '不明') {
    bpmSource = 'search'
  }

  console.log(
    `[jacket-scan] extract (${EXTRACT_MODEL}): ${extractMs}ms, enrich total: ${Math.round(performance.now() - totalStart)}ms`,
  )
  return { ...parsed, bpm, bpmSource, sources }
}

function extractSources(response: GenerateContentResponse): IdentifySource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const seen = new Set<string>()
  const sources: IdentifySource[] = []
  for (const chunk of chunks) {
    const web = chunk.web
    if (!web?.uri || seen.has(web.uri)) continue
    seen.add(web.uri)
    sources.push({ title: web.title || web.uri, url: web.uri })
    if (sources.length === 3) break
  }
  return sources
}
