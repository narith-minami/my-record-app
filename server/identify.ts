import { createHash } from 'node:crypto'
import { ThinkingLevel, type GenerateContentResponse, type GoogleGenAI } from '@google/genai'
import { lookupDeezerBpm } from './deezer.ts'

export interface IdentifySource {
  title: string
  url: string
}

/** Stage 1: fast, search-free read of the jacket (artist / title only). */
export interface QuickResult {
  recognized: boolean
  /** Text actually printed on the jacket, transcribed before guessing artist/title. */
  printedText: string
  artist: string
  title: string
  confidence: 'high' | 'medium' | 'low'
}

/** Stage 2: web-grounded details for an already identified record. */
export interface EnrichResult {
  /** Final artist/title after web verification (may differ from the quick candidate). */
  artist: string
  title: string
  /** true when web search confirmed the identification. */
  verified: boolean
  /** true when verification changed the quick candidate. */
  corrected: boolean
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
const QUICK_MODEL = 'gemini-3.8-flash'
const RESEARCH_MODEL = 'gemini-3.8-flash'
const EXTRACT_MODEL = 'gemini-3.5-flash-lite'

const QUICK_PROMPT = `あなたはレコード・CD・カセットのジャケット画像を鑑定する専門家です。

【手順】
1. まず printedText に、ジャケットに実際に印刷・型押しされている文字（アーティスト名、タイトル、レーベル名、カタログ番号など）を、装飾的な書体で読みにくい場合でも一文字ずつ注意深く、見えている通りに書き出してください。
2. その書き起こしを根拠にアーティスト名と曲名・アルバム名を判断してください。

写真の色調・雰囲気・人物のポーズ・ジャンルの印象だけで国籍やアーティスト像を推測してはいけません。印刷文字が読み取れない場合に、似た別のアーティストへ決め打ちしないでください。
印刷文字が読めず、ジャケットから確信できない場合は recognized を false にするか、confidence を low にし、分からない項目は空文字にしてください。実在しない情報を推測で断定しないでください。`

const RESEARCH_PROMPT_PREFIX = `あなたはレコード・CD・カセットの専門家です。ジャケット画像と、画像から一次判定した「候補」があります。候補は誤読の可能性があるため、必ず検証してください。

【検証手順】
1. ジャケットに印刷されている文字を自分でも確認する（一次判定の書き起こしは参考情報）。
2. 印刷文字（アーティスト名・タイトル・レーベル・カタログ番号）を検索クエリに含めてGoogle検索し、候補が実在し、ジャケットと一致するか確認する。
3. 一致しない場合は、印刷文字をもとに正しいアーティスト・タイトルを検索して訂正する。候補に固執しない。
4. 確定した（または訂正した）レコードについて、以下を調べる:
   - 発売年（販売年）
   - レーベル名
   - ジャンル
   - プロデューサー
   - BPM（GetSongBPMやSongBPMなどのBPM専門サイトを含めて検索）
   - アーティストの簡単な経歴・情報（2〜3文程度）
   - 特記事項（エディション、再発盤かどうか等）

検索は3〜4回程度を目安にし、同じ仮説を裏付けるためだけに繰り返さないでください。
確信が持てない場合は無理に決め打ちせず、不確実な点や他の候補を記載してください。実在しない情報を推測で断定せず、分からない項目は「不明」と書いてください。
最終的に確定したアーティスト名・タイトル、候補を訂正したかどうか、根拠にした検索結果（ページタイトルやサイト名）が分かるよう、自由な文章でまとめてください。

--- 一次判定の候補 ---
`

const EXTRACT_PROMPT_PREFIX = `以下はレコードジャケットの検証・調査結果のテキストです。この内容を指定のJSON形式に整理してください。
- artist / title は、調査で最終的に確定した（訂正した場合は訂正後の）値にしてください。
- verified は、検索で実在とジャケットとの一致が確認できた場合のみ true。確認できなかった・不確実な場合は false。
- 調査結果に書かれていない項目は、推測で埋めずに "不明" にしてください。

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
        // property order matters: transcribe printed text first, then decide
        propertyOrdering: ['printedText', 'recognized', 'artist', 'title', 'confidence'],
        properties: {
          printedText: { type: 'STRING' },
          recognized: { type: 'BOOLEAN' },
          artist: { type: 'STRING' },
          title: { type: 'STRING' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: ['printedText', 'recognized', 'artist', 'title', 'confidence'],
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
  parsed.printedText ??= ''
  if (!parsed.artist || !parsed.title) parsed.recognized = false

  console.log(
    `[jacket-scan] quick (${QUICK_MODEL}): ${Math.round(performance.now() - start)}ms, recognized=${parsed.recognized}`,
  )
  return parsed
}

export interface VerifyInput {
  image: string
  mimeType: string
  artist: string
  title: string
  printedText: string
}

const ENRICH_CACHE_MAX = 100
const enrichCache = new Map<string, Promise<EnrichResult>>()

// keyed by image + candidate so a wrong candidate never serves another jacket's result
function cacheKey(input: VerifyInput): string {
  const imageHash = createHash('sha1').update(input.image).digest('hex')
  return `${imageHash}\u0000${input.artist}\u0000${input.title}`.normalize('NFKC').toLowerCase()
}

/**
 * Verifies the quick candidate against the jacket image with Google Search (correcting it if
 * wrong) and fetches the details. Deezer BPM runs in parallel with the research call.
 */
export function verifyAndEnrich(genai: GoogleGenAI, input: VerifyInput): Promise<EnrichResult> {
  const key = cacheKey(input)
  const hit = enrichCache.get(key)
  if (hit) {
    enrichCache.delete(key)
    enrichCache.set(key, hit)
    return hit
  }

  const pending = runVerify(genai, input)
  enrichCache.set(key, pending)
  if (enrichCache.size > ENRICH_CACHE_MAX) {
    const oldest = enrichCache.keys().next().value
    if (oldest !== undefined) enrichCache.delete(oldest)
  }
  pending.catch(() => enrichCache.delete(key))
  return pending
}

function sameRecord(a: { artist: string; title: string }, b: { artist: string; title: string }): boolean {
  const n = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  return n(a.artist) === n(b.artist) && n(a.title) === n(b.title)
}

async function bpmLookup(artist: string, title: string): Promise<number | null> {
  return lookupDeezerBpm(artist, title).catch((err) => {
    console.warn('[jacket-scan] Deezer BPM lookup failed:', err)
    return null
  })
}

async function runVerify(genai: GoogleGenAI, input: VerifyInput): Promise<EnrichResult> {
  const totalStart = performance.now()
  const candidate = { artist: input.artist, title: input.title }

  // start with the candidate; redone below only if verification corrects it
  const candidateBpm = bpmLookup(candidate.artist, candidate.title)

  const researchStart = performance.now()
  const researchResponse = await genai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              `${RESEARCH_PROMPT_PREFIX}アーティスト: ${candidate.artist}\n曲名・アルバム名: ${candidate.title}\n` +
              `一次判定の書き起こし: ${input.printedText || '（なし）'}`,
          },
          { inlineData: { data: input.image, mimeType: input.mimeType } },
        ],
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
    `[jacket-scan] verify (${RESEARCH_MODEL}): ${researchMs}ms, ` +
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
          artist: { type: 'STRING' },
          title: { type: 'STRING' },
          verified: { type: 'BOOLEAN' },
          releaseYear: { type: 'STRING' },
          label: { type: 'STRING' },
          genre: { type: 'STRING' },
          producer: { type: 'STRING' },
          bpm: { type: 'STRING' },
          artistInfo: { type: 'STRING' },
          notes: { type: 'STRING' },
        },
        required: [
          'artist',
          'title',
          'verified',
          'releaseYear',
          'label',
          'genre',
          'producer',
          'bpm',
          'artistInfo',
          'notes',
        ],
      },
    },
  })
  const extractMs = Math.round(performance.now() - extractStart)

  const extractText = extractResponse.text
  if (!extractText) throw new Error('Gemini extract call returned an empty response')

  let parsed: Omit<EnrichResult, 'sources' | 'bpmSource' | 'corrected'>
  try {
    parsed = JSON.parse(extractText) as typeof parsed
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${extractText}`)
  }

  const final =
    parsed.artist && parsed.title && parsed.artist !== '不明' && parsed.title !== '不明'
      ? { artist: parsed.artist, title: parsed.title }
      : candidate
  const corrected = !sameRecord(final, candidate)

  const deezerBpm = await (corrected ? bpmLookup(final.artist, final.title) : candidateBpm)
  let bpm = parsed.bpm
  let bpmSource: EnrichResult['bpmSource'] = null
  if (deezerBpm) {
    bpm = String(deezerBpm)
    bpmSource = 'deezer'
  } else if (bpm && bpm !== '不明') {
    bpmSource = 'search'
  }

  console.log(
    `[jacket-scan] extract (${EXTRACT_MODEL}): ${extractMs}ms, verify total: ${Math.round(performance.now() - totalStart)}ms, ` +
      `verified=${parsed.verified}, corrected=${corrected}` +
      (corrected ? ` (${candidate.artist} / ${candidate.title} -> ${final.artist} / ${final.title})` : ''),
  )
  return { ...parsed, ...final, corrected, bpm, bpmSource, sources }
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
