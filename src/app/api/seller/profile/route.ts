import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seller/profile?userId=xxx — get seller profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const profile = await db.sellerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Seller profile GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller profile' },
      { status: 500 }
    )
  }
}

// PUT /api/seller/profile — update seller profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, storeName, description, logo, banner, bankInfo } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const existing = await db.sellerProfile.findUnique({
      where: { userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    // If storeName is changing, regenerate slug and check uniqueness
    if (storeName && storeName.trim() !== existing.storeName) {
      const slug = storeName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const slugConflict = await db.sellerProfile.findFirst({
        where: { storeSlug: slug, id: { not: existing.id } },
      })
      if (slugConflict) {
        return NextResponse.json(
          { error: 'A store with a similar name already exists' },
          { status: 409 }
        )
      }

      // Update with new slug
      const profile = await db.sellerProfile.update({
        where: { userId },
        data: {
          storeName: storeName.trim(),
          storeSlug: slug,
          description: description !== undefined ? description?.trim() || null : undefined,
          logo: logo !== undefined ? logo || null : undefined,
          banner: banner !== undefined ? banner || null : undefined,
          bankInfo: bankInfo !== undefined ? bankInfo || null : undefined,
        },
      })

      return NextResponse.json({ profile })
    }

    // Store name unchanged — update remaining fields
    const profile = await db.sellerProfile.update({
      where: { userId },
      data: {
        description: description !== undefined ? description?.trim() || null : undefined,
        logo: logo !== undefined ? logo || null : undefined,
        banner: banner !== undefined ? banner || null : undefined,
        bankInfo: bankInfo !== undefined ? bankInfo || null : undefined,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Seller profile PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update seller profile' },
      { status: 500 }
    )
  }
}
