export type ActionResult = { ok: true } | { ok: false; error: string }

export function readInvitationCode(data: unknown) {
  if (!data) return ''

  let payload = data
  if (typeof data === 'string') {
    try {
      payload = JSON.parse(data)
    } catch {
      return ''
    }
  }

  if (Array.isArray(payload)) {
    const first = payload[0] as { code?: unknown } | undefined
    return typeof first?.code === 'string' ? first.code : ''
  }

  if (typeof payload === 'object' && payload !== null && 'code' in payload) {
    const code = (payload as { code?: unknown }).code
    return typeof code === 'string' ? code : ''
  }

  return ''
}

export function mapJoinFailure(
  status?: number,
  serverError?: string,
): ActionResult {
  if (status === 429) {
    return {
      ok: false,
      error: 'Too many attempts. Please try again in a minute.',
    }
  }
  if (status === 401) {
    return { ok: false, error: 'Sign-in failed. Please reload the page.' }
  }
  const message = serverError?.toLowerCase() ?? ''
  if (
    status === 404 ||
    message.includes('invalid or expired') ||
    message.includes('invitation invalid or expired')
  ) {
    return {
      ok: false,
      error: 'This invite is invalid or expired. Ask for a new code under People.',
    }
  }
  return {
    ok: false,
    error: 'Could not join. Check the code or ask for a new one.',
  }
}

export async function parseJoinFunctionError(error: unknown) {
  if (!error || typeof error !== 'object') return {}

  const withContext = error as { context?: Response; message?: string }
  const status = withContext.context?.status
  let message: string | undefined

  if (withContext.context) {
    try {
      const body = (await withContext.context.clone().json()) as {
        error?: unknown
      }
      if (typeof body.error === 'string') message = body.error
    } catch {
      message = withContext.message
    }
  }

  return { status, message: message ?? withContext.message }
}
