import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const existing = await db.newsletter.findUnique({ where: { email: normalized } })
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 })
      }
      await db.newsletter.update({
        where: { email: normalized },
        data: { isActive: true },
      })
      return NextResponse.json({ message: 'Welcome back! You have been re-subscribed.' }, { status: 200 })
    }

    await db.newsletter.create({
      data: { email: normalized },
    })

    return NextResponse.json({ message: 'Successfully subscribed! Check your inbox for a welcome gift.' }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('Unique')) {
      return NextResponse.json({ message: 'You are already subscribed!' }, { status: 200 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Safety: check if newsletter model is available on the cached Prisma client
    if (!(db as Record<string, unknown>).newsletter) {
      return NextResponse.json({ subscribers: [], total: 0 })
    }
    const [subscribers, total] = await Promise.all([
      db.newsletter.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, email: true, createdAt: true },
      }),
      db.newsletter.count({ where: { isActive: true } }),
    ])
    return NextResponse.json({ subscribers, total })
  } catch {
    return NextResponse.json({ subscribers: [], total: 0 })
  }
}