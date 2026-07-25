'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: { id: string; name: string; slug: string; description: string | null; image: string | null } | null
}

interface FormErrors {
  name?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!category

  // Form state — initialized from category; component remounts via key prop on parent
  const [name, setName] = useState(() => category?.name || '')
  const [slug, setSlug] = useState(() => category?.slug || '')
  const [description, setDescription] = useState(() => category?.description || '')
  const [image, setImage] = useState(() => category?.image || '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(() => !!category)

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to create category') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Category created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to update category') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Category updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!name.trim()) newErrors.name = 'Category name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name,
      slug: slug || generateSlug(name),
      description: description || null,
      image: image || null,
    }

    if (isEditing && category) {
      updateMutation.mutate({ id: category.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update category details below.' : 'Fill in the details to create a new category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="cat-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cat-name"
              placeholder="Category name"
              value={name}
              onChange={e => {
                const val = e.target.value
                setName(val)
                if (!slugManuallyEdited) setSlug(generateSlug(val))
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
              }}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              placeholder="category-slug"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Auto-generated from name. Edit to customize.</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              placeholder="Brief category description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="cat-image">Image URL</Label>
            <Input
              id="cat-image"
              placeholder="https://example.com/image.jpg"
              value={image}
              onChange={e => setImage(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-foreground text-background hover:bg-foreground/90">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}