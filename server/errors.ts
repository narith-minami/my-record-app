export type ErrorStage = 'config' | 'request' | 'gemini'

export interface ErrorBody {
  error: string
  stage: ErrorStage
  detail: string
}

/** Error payload shared by the API handlers. `detail` is truncated and never contains the API key. */
export function errorBody(stage: ErrorStage, error: string, err?: unknown): ErrorBody {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : err === undefined ? '' : String(err)
  return { error, stage, detail: raw.slice(0, 500) }
}
