'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import ProductFormDialog from './ProductFormDialog'

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
  category: { id: string; name: string; slug: string } | null
}

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [dialogKey, setDialogKey] = useState(0)

  // Fetch products from admin API (includes inactive)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => fetch(`/api/admin/products?search=${encodeURIComponent(search)}&limit=100`).then(r => r.json()),
  })

  const products: ProductRow[] = data?.products || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/products/${id}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to delete product') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
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
        <h2 className="text-lg font-semibold">Products ({data?.pagination?.total ?? products.length})</h2>
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
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-3" />
              <p className="text-sm">No products found</p>
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
                  {products.map(product => {
                    const images: string[] = JSON.parse(product.images || '[]')
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
                                {product.isFeatured && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Featured</Badge>
                                )}
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
                          <Badge variant={product.isActive ? 'default' : 'secondary'} className={product.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : ''}>
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
      <ProductFormDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editProduct={editProduct}
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