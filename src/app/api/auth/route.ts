import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['customer', 'seller']).optional(),
})

const sellerProfileSchema = z.object({
  storeName: z.string().min(2),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action as string

    if (action === 'login') {
      const { email, password } = loginSchema.parse(body)
      const user = await db.user.findUnique({ where: { email } })

      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      if (user.isBanned) {
        return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 })
      }

      // Fetch seller profile if applicable
      let sellerProfile: { id: string; storeName: string; storeSlug: string; isApproved: boolean } | null = null
      if (user.role === 'seller') {
        const sp = await db.sellerProfile.findUnique({ where: { userId: user.id } })
        if (sp) {
          sellerProfile = { id: sp.id, storeName: sp.storeName, storeSlug: sp.storeSlug, isApproved: sp.isApproved }
        }
      }

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, sellerProfile },
      })
    }

    if (action === 'register') {
      const { email, password, name, role } = registerSchema.parse(body)
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      const user = await db.user.create({
        data: { email, password, name, role: role || 'customer' },
      })

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, sellerProfile: null },
      })
    }

    if (action === 'create-seller-profile') {
      const userId = body.userId as string
      const { storeName, description } = sellerProfileSchema.parse(body)

      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if seller profile already exists
      const existingProfile = await db.sellerProfile.findUnique({ where: { userId } })
      if (existingProfile) {
        return NextResponse.json({ error: 'Seller profile already exists' }, { status: 409 })
      }

      // Update user role to seller
      await db.user.update({ where: { id: userId }, data: { role: 'seller' } })

      // Generate slug from store name
      const baseSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      let slug = baseSlug
      let counter = 1
      while (await db.sellerProfile.findUnique({ where: { storeSlug: slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      const sellerProfile = await db.sellerProfile.create({
        data: {
          userId,
          storeName,
          storeSlug: slug,
          description: description || null,
          isApproved: false,
        },
      })

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, image: user.image, role: 'seller', sellerProfile: { id: sellerProfile.id, storeName: sellerProfile.storeName, storeSlug: sellerProfile.storeSlug, isApproved: sellerProfile.isApproved } },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as unknown as { issues: Array<{ message: string }> }).issues
      return NextResponse.json({ error: issues[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
