import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        createdAt: true,
        _count: { select: { orders: true, reviews: true, wishlist: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isBanned, role } = body

    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (typeof isBanned === 'boolean') data.isBanned = isBanned
    if (role === 'admin' || role === 'customer') data.role = role

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isBanned: true, createdAt: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin users PUT error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
