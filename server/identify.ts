import type { GenerateContentResponse, GoogleGenAI } from '@google/genai'
import { lookupDeezerBpm } from './deezer.ts'

export interface IdentifySource {
  title: string
  url: string
}

export interface IdentifyResult {
  recognized: boolean
  artist: string
  title: string
  confidence: 'high' | 'medium' | 'low'
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

const RESEARCH_MODEL = 'gemini-flash-latest'
const EXTRACT_MODEL = 'gemini-flash-latest'

const RESEARCH_PROMPT = `あなたはレコード・CD・カセットのジャケット画像を鑑定する専門家です。

【最初のステップ】検索を始める前に、ジャケットに印刷・型押しされている文字（アーティスト名、タイトル、レーベル名、カタログ番号など）を、装飾的な書体で読みにくい場合でも一文字ずつ注意深く確認し、実際に見えている通りに書き出してください。この「ジャケットに実際に印刷されている文字」が最も信頼できる手がかりです。
写真の色調・雰囲気・人物のポーズ・ジャンルの印象だけで国籍やアーティスト像を推測し、それを前提に検索してはいけません。印刷文字が読み取れた場合は、必ずその文字列を検索クエリに含めてください。

書き出した文字をもとにGoogle検索を使って、以下を可能な限り正確に調べてください:
- アーティスト名
- 曲名・アルバム名
- 発売年（販売年）
- レーベル名
- ジャンル
- プロデューサー
- BPM（テンポ。曲名・アーティスト名が判明した場合、GetSongBPMやSongBPMなどのBPM専門サイトを含めて検索してください）
- アーティストの簡単な経歴・情報（2〜3文程度）
- ジャケットに写っている特記事項（エディション、再発盤かどうか等、分かれば）

検索は3回程度を目安にし、同じ仮説を裏付けるためだけに検索を繰り返さないでください。検索結果が最初の仮説を裏付けない、または情報が見つからない場合は、その仮説に固執せず、印刷文字の読み取りを見直すか、他の可能性を検討してください。
それでも確信が持てない場合は、無理に一つの答えに決め打ちせず、confidenceを下げ、不確実な点や候補をnotesに記載してください。

画像がジャケットでない場合、または内容から判断できない場合は、その旨を明記してください。
実在しない情報を推測で断定しないでください。分からない項目は「不明」とはっきり書いてください。
調査結果を、根拠となった検索結果（ページタイトルやサイト名）が分かるように、自由な文章でまとめてください。`

const EXTRACT_PROMPT_PREFIX = `以下はレコードジャケットの画像をもとにした調査結果のテキストです。この内容を指定のJSON形式に整理してください。
調査結果に書かれていない項目は、推測で埋めずに "不明"（文字列項目）にしてください。
画像がジャケットとして認識できなかった場合や、アーティスト名・曲名が全く分からない場合は recognized を false にしてください。

--- 調査結果 ---
`

export async function identifyJacket(
  genai: GoogleGenAI,
  base64Image: string,
  mimeType: string,
): Promise<IdentifyResult> {
  const totalStart = performance.now()

  const researchStart = performance.now()
  const researchResponse = await genai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: [
      {
        role: 'user',
        parts: [{ text: RESEARCH_PROMPT }, { inlineData: { data: base64Image, mimeType } }],
      },
    ],
    config: {
      tools: [{ googleSearch: {} }],
    },
  })
  const researchMs = Math.round(performance.now() - researchStart)

  const researchText = researchResponse.text
  if (!researchText) throw new Error('Gemini research call returned an empty response')

  const grounding = researchResponse.candidates?.[0]?.groundingMetadata
  const sources = extractSources(researchResponse)
  console.log(
    `[jacket-scan] research call (${RESEARCH_MODEL}): ${researchMs}ms, ` +
      `searchQueries=${JSON.stringify(grounding?.webSearchQueries ?? [])}, ` +
      `imageSearchQueries=${JSON.stringify(grounding?.imageSearchQueries ?? [])}, ` +
      `groundingChunks=${grounding?.groundingChunks?.length ?? 0}, sources=${sources.length}`,
  )

  const extractStart = performance.now()
  const extractResponse = await genai.models.generateContent({
    model: EXTRACT_MODEL,
    contents: [{ role: 'user', parts: [{ text: EXTRACT_PROMPT_PREFIX + researchText }] }],
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          recognized: { type: 'BOOLEAN' },
          artist: { type: 'STRING' },
          title: { type: 'STRING' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
          releaseYear: { type: 'STRING' },
          label: { type: 'STRING' },
          genre: { type: 'STRING' },
          producer: { type: 'STRING' },
          bpm: { type: 'STRING' },
          artistInfo: { type: 'STRING' },
          notes: { type: 'STRING' },
        },
        required: [
          'recognized',
          'artist',
          'title',
          'confidence',
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

  let parsed: Omit<IdentifyResult, 'sources' | 'bpmSource'>
  try {
    parsed = JSON.parse(extractText) as Omit<IdentifyResult, 'sources' | 'bpmSource'>
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${extractText}`)
  }

  const totalMs = Math.round(performance.now() - totalStart)
  console.log(
    `[jacket-scan] extract call (${EXTRACT_MODEL}): ${extractMs}ms, total: ${totalMs}ms, recognized=${parsed.recognized}`,
  )

  let bpm = parsed.bpm
  let bpmSource: IdentifyResult['bpmSource'] = null
  if (parsed.recognized) {
    const deezerBpm = await lookupDeezerBpm(parsed.artist, parsed.title).catch((err) => {
      console.warn('[jacket-scan] Deezer BPM lookup failed:', err)
      return null
    })
    if (deezerBpm) {
      bpm = String(deezerBpm)
      bpmSource = 'deezer'
    } else if (bpm && bpm !== '不明') {
      bpmSource = 'search'
    }
  }

  return { ...parsed, bpm, bpmSource, sources: parsed.recognized ? sources : [] }
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
