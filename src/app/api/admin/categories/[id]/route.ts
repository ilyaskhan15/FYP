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

// PUT /api/admin/categories/[id] — Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, description, image, parentId } = body

    // Check category exists
    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const categorySlug = slug?.trim() ? slug.trim() : generateSlug(name)

    // Check slug uniqueness (excluding self)
    const slugConflict = await db.category.findFirst({
      where: { slug: categorySlug, id: { not: id } },
    })
    if (slugConflict) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 })
    }

    // Validate parentId if provided
    if (parentId) {
      if (parentId === id) {
        return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 })
      }
      const parent = await db.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 })
      }
    }

    const category = await db.category.update({
      where: { id },
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

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Admin categories PUT error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/admin/categories/[id] — Delete a category
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Set products' categoryId to null before deleting
    await db.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    })

    // Set children's parentId to null before deleting
    await db.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })

    await db.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin categories DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}