import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/seller-approvals — list all seller profiles with user info
export async function GET() {
  try {
    const profiles = await db.sellerProfile.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true, isBanned: true, createdAt: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Admin seller approvals GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch seller profiles' }, { status: 500 })
  }
}

// PUT /api/admin/seller-approvals — approve or reject a seller profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isApproved } = body

    if (!id) return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
    if (typeof isApproved !== 'boolean') return NextResponse.json({ error: 'isApproved (boolean) required' }, { status: 400 })

    const existing = await db.sellerProfile.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })

    const profile = await db.sellerProfile.update({
      where: { id },
      data: { isApproved },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Admin seller approvals PUT error:', error)
    return NextResponse.json({ error: 'Failed to update seller profile' }, { status: 500 })
  }
}
