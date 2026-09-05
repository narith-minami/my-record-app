export async function searchYoutubeVideo(apiKey: string, query: string): Promise<string | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '1')
  url.searchParams.set('q', query)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`YouTube search failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { items?: Array<{ id?: { videoId?: string } }> }
  return data.items?.[0]?.id?.videoId ?? null
}
