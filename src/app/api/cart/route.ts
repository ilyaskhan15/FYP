import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/* ------------------------------------------------------------------ */
/*  Schemas                                                            */
/* ------------------------------------------------------------------ */

const addItemSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
})

const updateItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
})

const removeItemSchema = z.object({
  id: z.string(),
})

const syncCartSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
  })),
})

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildWhere(userId?: string, sessionId?: string) {
  if (userId) return { userId }
  if (sessionId) return { sessionId }
  return { userId: '__none__' as string } // matches nothing
}

/* ------------------------------------------------------------------ */
/*  GET – fetch cart items                                             */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const sessionId = searchParams.get('sessionId') || undefined

    if (!userId && !sessionId) {
      return NextResponse.json({ items: [] })
    }

    const where = buildWhere(userId, sessionId)

    const cartItems = await db.cart.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            images: true,
            stock: true,
          },
        },
        variant: {
          select: { id: true, name: true, attributes: true, price: true, stock: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const items = cartItems.map((ci) => {
      const product = ci.product
      const variant = ci.variant
      const images: string[] = JSON.parse(product.images || '[]')
      const effectivePrice = variant?.price ?? product.price
      const effectiveStock = variant?.stock ?? product.stock
      const attrs = variant?.attributes ? JSON.parse(variant.attributes) : null

      return {
        id: ci.id,
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        image: images[0] || '',
        price: effectivePrice,
        compareAtPrice: product.compareAtPrice,
        variantName: variant?.name || (attrs ? Object.values(attrs).join(' / ') : undefined),
        quantity: ci.quantity,
        stock: effectiveStock,
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

/* ------------------------------------------------------------------ */
/*  POST – add item / sync entire cart                                 */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // If body has 'items' array → full sync
    if (body.items && Array.isArray(body.items)) {
      const { userId, sessionId, items } = syncCartSchema.parse(body)

      if (!userId && !sessionId) {
        return NextResponse.json({ error: 'User or session ID required' }, { status: 400 })
      }

      const where = buildWhere(userId, sessionId)

      // Delete existing cart items
      await db.cart.deleteMany({ where })

      // Create new cart items
      if (items.length > 0) {
        await db.cart.createMany({
          data: items.map((item) => ({
            userId: userId || null,
            sessionId: sessionId || null,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          })),
        })
      }

      return NextResponse.json({ success: true })
    }

    // Otherwise → add single item
    const { userId, sessionId, productId, variantId, quantity } = addItemSchema.parse(body)

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'User or session ID required' }, { status: 400 })
    }

    // Check if item already exists in cart
    const where = buildWhere(userId, sessionId)
    const existing = await db.cart.findFirst({
      where: {
        ...where,
        productId,
        variantId: variantId || null,
      },
    })

    if (existing) {
      await db.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      await db.cart.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || null,
          productId,
          variantId: variantId || null,
          quantity,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as unknown as { issues: Array<{ message: string }> }).issues
      return NextResponse.json({ error: issues[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

/* ------------------------------------------------------------------ */
/*  PUT – update item quantity                                         */
/* ------------------------------------------------------------------ */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, quantity } = updateItemSchema.parse(body)

    await db.cart.update({
      where: { id },
      data: { quantity },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as unknown as { issues: Array<{ message: string }> }).issues
      return NextResponse.json({ error: issues[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Cart PUT error:', error)
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 })
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE – remove item or clear cart                                 */
/* ------------------------------------------------------------------ */

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearAll = searchParams.get('clear') === 'true'
    const userId = searchParams.get('userId') || undefined
    const sessionId = searchParams.get('sessionId') || undefined
    const itemId = searchParams.get('id') || undefined

    if (clearAll) {
      if (!userId && !sessionId) {
        return NextResponse.json({ error: 'User or session ID required' }, { status: 400 })
      }
      const where = buildWhere(userId, sessionId)
      await db.cart.deleteMany({ where })
      return NextResponse.json({ success: true })
    }

    if (itemId) {
      await db.cart.delete({ where: { id: itemId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Specify id or clear=true' }, { status: 400 })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 })
  }
}
