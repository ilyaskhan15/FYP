'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editProduct?: Record<string, unknown> | null
}

interface FormErrors {
  name?: string
  price?: string
  categoryId?: string
}

function parseImages(raw: unknown): string {
  try {
    const imgs: string[] = JSON.parse((raw as string) || '[]')
    return imgs.join(', ')
  } catch {
    return ''
  }
}

export default function ProductFormDialog({ open, onOpenChange, editProduct }: ProductFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!editProduct

  // Form state — initialized from editProduct; component remounts via key prop on parent
  const [name, setName] = useState(() => (editProduct?.name as string) || '')
  const [description, setDescription] = useState(() => (editProduct?.description as string) || '')
  const [price, setPrice] = useState(() => editProduct?.price != null ? String(editProduct.price) : '')
  const [compareAtPrice, setCompareAtPrice] = useState(() => editProduct?.compareAtPrice ? String(editProduct.compareAtPrice) : '')
  const [stock, setStock] = useState(() => editProduct?.stock != null ? String(editProduct.stock) : '0')
  const [brand, setBrand] = useState(() => (editProduct?.brand as string) || '')
  const [categoryId, setCategoryId] = useState(() => (editProduct?.categoryId as string) || '')
  const [isFeatured, setIsFeatured] = useState(() => !!editProduct?.isFeatured)
  const [isNew, setIsNew] = useState(() => !!editProduct?.isNew)
  const [isActive, setIsActive] = useState(() => editProduct?.isActive !== false)
  const [tags, setTags] = useState(() => (editProduct?.tags as string) || '')
  const [sku, setSku] = useState(() => (editProduct?.sku as string) || '')
  const [images, setImages] = useState(() => editProduct ? parseImages(editProduct.images) : '')
  const [errors, setErrors] = useState<FormErrors>({})

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to create product') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Product created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to update product') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!name.trim()) newErrors.name = 'Product name is required'
    if (!price || isNaN(Number(price)) || Number(price) < 0) newErrors.price = 'Valid price is required'
    if (!categoryId) newErrors.categoryId = 'Category is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, price, categoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      stock: Number(stock),
      brand: brand || null,
      categoryId,
      isFeatured,
      isNew,
      isActive,
      tags: tags || null,
      sku: sku || null,
      images: images || null,
    }

    if (isEditing && editProduct) {
      updateMutation.mutate({ id: editProduct.id as string, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update product details below.' : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Product name"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })) }}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief product description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price & Compare At Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Price ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={e => { setPrice(e.target.value); if (errors.price) setErrors(prev => ({ ...prev, price: undefined })) }}
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare at Price ($)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={compareAtPrice}
                onChange={e => setCompareAtPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Stock & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="SKU-001"
                value={sku}
                onChange={e => setSku(e.target.value)}
              />
            </div>
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              placeholder="Brand name"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={categoryId} onValueChange={v => { setCategoryId(v); if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: undefined })) }}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: Record<string, unknown>) => (
                  <SelectItem key={cat.id as string} value={cat.id as string}>
                    {cat.name as string}
                    <span className="text-muted-foreground ml-1">
                      ({(cat._count as Record<string, number>)?.products ?? 0})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <Label htmlFor="isFeatured" className="cursor-pointer">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isNew" checked={isNew} onCheckedChange={setIsNew} />
              <Label htmlFor="isNew" className="cursor-pointer">New</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="tag1, tag2, tag3"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label htmlFor="images">Image URLs</Label>
            <Textarea
              id="images"
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              value={images}
              onChange={e => setImages(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">Comma-separated image URLs</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}