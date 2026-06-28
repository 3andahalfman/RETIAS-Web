import { createClient } from '@/lib/supabase'

/** Attach the localStorage session Bearer token for server-authenticated API calls. */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  if (!(init?.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json')
  }
  return fetch(input, { ...init, headers })
}
