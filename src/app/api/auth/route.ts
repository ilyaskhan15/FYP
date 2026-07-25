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

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role },
      })
    }

    if (action === 'register') {
      const { email, password, name } = registerSchema.parse(body)
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      const user = await db.user.create({
        data: { email, password, name, role: 'customer' },
      })

      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}