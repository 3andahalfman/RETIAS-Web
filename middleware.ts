import { NextResponse, type NextRequest } from 'next/server'

/** Auth sessions live in localStorage; dashboard routes guard client-side. */
export async function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
