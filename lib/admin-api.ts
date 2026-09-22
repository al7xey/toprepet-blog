import { NextRequest, NextResponse } from 'next/server'
import { adminSession } from './auth'

export async function authorizeMutation(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== request.nextUrl.host) return { error: NextResponse.json({ error: 'Invalid origin' }, { status: 403 }) }
  const session = await adminSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { session }
}

export const errorJson = (message: string, status = 400) => NextResponse.json({ error: message }, { status })
