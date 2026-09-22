import { NextResponse } from 'next/server'
import { adminSession } from '@/lib/auth'
export async function GET() { return NextResponse.json({ authorized: Boolean(await adminSession()) }, { headers: { 'Cache-Control': 'no-store' } }) }
