import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const orders = await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: { id: true, productName: true, productImage: true, variantName: true, price: true, quantity: true },
        },
      },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, shippingAddress, shippingMethod, couponCode, userId, cardNumber, expiry, cvv } = body

    // Validate payment details using Luhn algorithm
    if (!cardNumber || !expiry || !cvv) {
      return NextResponse.json({ error: 'Payment details are required' }, { status: 400 })
    }

    const cleanedCard = cardNumber.replace(/\s/g, '')
    if (!luhnCheck(cleanedCard)) {
      return NextResponse.json({ error: 'Invalid credit card number. Please provide a valid card.' }, { status: 400 })
    }

    // Validate expiry date (MM/YY format)
    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/)
    if (!expiryMatch) {
      return NextResponse.json({ error: 'Invalid expiry date format. Use MM/YY.' }, { status: 400 })
    }
    const expMonth = parseInt(expiryMatch[1], 10)
    const expYear = parseInt(expiryMatch[2], 10) + 2000
    const now = new Date()
    const expDate = new Date(expYear, expMonth, 0) // Last day of expiry month
    if (expMonth < 1 || expMonth > 12) {
      return NextResponse.json({ error: 'Invalid expiry month. Must be between 01 and 12.' }, { status: 400 })
    }
    if (expDate < now) {
      return NextResponse.json({ error: 'Card has expired. Please use a valid card.' }, { status: 400 })
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return NextResponse.json({ error: 'Invalid CVV. Must be 3 or 4 digits.' }, { status: 400 })
    }

    // Validate stock availability
    const outOfStock: string[] = []
    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.productId }, select: { name: true, stock: true, isActive: true } })
      if (!product || !product.isActive) {
        outOfStock.push(`${item.productName} is no longer available`)
      } else if (product.stock < item.quantity) {
        outOfStock.push(`${product.name} has only ${product.stock} left in stock`)
      }
    }
    if (outOfStock.length > 0) {
      return NextResponse.json({ error: 'Some items are out of stock', details: outOfStock }, { status: 400 })
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0)
    const shippingCost = subtotal > 75 ? 0 : 9.99
    const tax = subtotal * 0.08
    let discount = 0

    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
      if (coupon && coupon.isValid && (!coupon.maxUses || coupon.usedCount < coupon.maxUses) && (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)) {
        if (coupon.type === 'fixed') discount = coupon.value
        else if (coupon.type === 'percentage') discount = subtotal * (coupon.value / 100)
        else if (coupon.type === 'free_shipping') discount = shippingCost
      }
    }

    const total = subtotal + shippingCost + tax - discount
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        status: 'processing',
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        couponCode: couponCode?.toUpperCase() || null,
        shippingMethod: shippingMethod || 'standard',
        shippingAddress: JSON.stringify(shippingAddress),
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paidAt: new Date(),
        items: {
          create: items.map((item: { productId: string; variantId?: string; productName: string; productImage?: string; variantName?: string; price: number; quantity: number }) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            productName: item.productName,
            productImage: item.productImage || null,
            variantName: item.variantName || null,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // Decrement stock
    for (const item of items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
      })
    }

    if (couponCode) {
      await db.coupon.update({
        where: { code: couponCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ order, orderNumber })
  } catch (error) {
    console.error('Create order API error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

/** Luhn algorithm to validate credit card numbers */
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (isEven) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    isEven = !isEven
  }
  return sum % 10 === 0
}
