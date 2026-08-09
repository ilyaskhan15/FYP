'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'
import { Search, Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProductRow {
  id: string
  name: string
  slug: string
  brand: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  soldCount: number
  isFeatured: boolean
  isNew: boolean
  isActive: boolean
  images: string
  description?: string
  tags?: string
  category: { id: string; name: string; slug: string } | null
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

export default function SellerProducts() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const userId = user?.id

  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [dialogKey, setDialogKey] = useState(0)

  // Fetch seller products
  const { data, isLoading } = useQuery({
    queryKey: ['seller-products', userId, search],
    queryFn: () => fetch(`/api/seller/products?userId=${userId}`).then(r => r.json()),
    enabled: !!userId,
  })

  const products: ProductRow[] = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : []

  // Filter by search
  const filteredProducts = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(search.toLowerCase())
      )
    : products

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/seller/products/${id}?userId=${userId}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to delete product') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      setDeleteTarget(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleAdd = useCallback(() => {
    setEditProduct(null)
    setDialogKey(k => k + 1)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((product: ProductRow) => {
    setEditProduct(product)
    setDialogKey(k => k + 1)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback((product: ProductRow) => {
    setDeleteTarget(product)
  }, [])

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">My Products ({filteredProducts.length})</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button onClick={handleAdd} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-3" />
              <p className="text-sm">{search ? 'No products match your search' : 'No products yet — add your first product!'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Stock</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Sold</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const images: string[] = (() => { try { return JSON.parse(product.images || '[]') } catch { return [] } })()
                    return (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                              {images[0] ? (
                                <img src={images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-48">{product.name}</p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs text-muted-foreground">{product.brand || '—'}</p>
                                {product.isNew && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-600">New</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                          {product.category?.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">${product.price.toFixed(2)}</span>
                            {product.compareAtPrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${product.compareAtPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-sm font-medium ${product.stock > 20 ? 'text-green-600 dark:text-green-400' : product.stock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                          {product.soldCount}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={product.isActive ? 'default' : 'secondary'}
                            className={product.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : ''}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <SellerProductFormDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editProduct={editProduct}
        userId={userId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ============ Product Form Dialog ============ */

interface SellerProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editProduct?: ProductRow | null
  userId?: string
}

function SellerProductFormDialog({ open, onOpenChange, editProduct, userId }: SellerProductFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!editProduct

  const [name, setName] = useState(() => (editProduct?.name as string) || '')
  const [description, setDescription] = useState(() => (editProduct?.description as string) || '')
  const [price, setPrice] = useState(() => editProduct?.price != null ? String(editProduct.price) : '')
  const [compareAtPrice, setCompareAtPrice] = useState(() => editProduct?.compareAtPrice ? String(editProduct.compareAtPrice) : '')
  const [stock, setStock] = useState(() => editProduct?.stock != null ? String(editProduct.stock) : '0')
  const [brand, setBrand] = useState(() => (editProduct?.brand as string) || '')
  const [categoryId, setCategoryId] = useState(() => editProduct?.category?.id || '')
  const [tags, setTags] = useState(() => (editProduct?.tags as string) || '')
  const [images, setImages] = useState(() => editProduct ? parseImages(editProduct.images) : '')
  const [errors, setErrors] = useState<FormErrors>({})

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetch(`/api/seller/products?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to create product') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Product created successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/seller/products/${id}?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to update product') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, price])

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
      categoryId: categoryId || null,
      tags: tags || null,
      images: images || null,
    }

    if (isEditing && editProduct) {
      updateMutation.mutate({ id: editProduct.id, data: payload })
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
            <Label htmlFor="s-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="s-name"
              placeholder="Product name"
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })) }}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="s-description">Description</Label>
            <Textarea
              id="s-description"
              placeholder="Brief product description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price & Compare At Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="s-price">
                Price ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="s-price"
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
              <Label htmlFor="s-compareAtPrice">Compare at Price ($)</Label>
              <Input
                id="s-compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={compareAtPrice}
                onChange={e => setCompareAtPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="s-stock">Stock</Label>
            <Input
              id="s-stock"
              type="number"
              min="0"
              placeholder="0"
              value={stock}
              onChange={e => setStock(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="s-brand">Brand</Label>
            <Input
              id="s-brand"
              placeholder="Brand name"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="s-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="s-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: Record<string, unknown>) => (
                  <SelectItem key={cat.id as string} value={cat.id as string}>
                    {cat.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="s-tags">Tags</Label>
            <Input
              id="s-tags"
              placeholder="tag1, tag2, tag3"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label htmlFor="s-images">Image URLs</Label>
            <Textarea
              id="s-images"
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
