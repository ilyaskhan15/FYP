import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/admin/categories — Return all categories with product counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const categories = await db.category.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Admin categories GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/admin/categories — Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, image, parentId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const categorySlug = slug?.trim() ? slug.trim() : generateSlug(name)

    // Check slug uniqueness
    const existing = await db.category.findUnique({ where: { slug: categorySlug } })
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 })
    }

    // Validate parentId if provided
    if (parentId) {
      const parent = await db.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 })
      }
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug: categorySlug,
        description: description?.trim() || null,
        image: image?.trim() || null,
        parentId: parentId || null,
      },
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Admin categories POST error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}