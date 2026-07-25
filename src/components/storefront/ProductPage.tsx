'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useCartStore } from '@/stores/cart'
import { useComparisonStore } from '@/stores/comparison'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Star, StarHalf, Minus, Plus, Truck, RotateCcw, Shield, ShoppingCart, Check, Search as SearchIcon, MapPin, ChevronRight, Link, Copy, CheckCheck, GitCompareArrows } from 'lucide-react'
import { useState, useMemo, useRef, useCallback } from 'react'
import ProductCard from './ProductCard'

export default function ProductPage() {
  const { selectedProductId, navigate, goBack, setShopFilters } = useNavigationStore()
  const { addItem } = useCartStore()
  const { addToComparison, removeFromComparison, isInComparison } = useComparisonStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isZooming, setIsZooming] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const inComparison = selectedProductId ? isInComparison(selectedProductId) : false

  const { data, isLoading } = useQuery({
    queryKey: ['product', selectedProductId],
    queryFn: () => fetch(`/api/products/${selectedProductId}`).then(r => r.json()),
    enabled: !!selectedProductId,
  })

  const product = data?.product
  const related = data?.related || []
  const reviews = product?.reviews || []

  const images: string[] = useMemo(() => {
    if (!product?.images) return []
    try { return JSON.parse(product.images) }
    catch { return [] }
  }, [product])

  const variants = product?.variants || []
  const hasDiscount = product?.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0

  // Extract unique variant attributes
  const colorOptions = useMemo(() => {
    const colors = new Set<string>()
    variants.forEach((v: Record<string, unknown>) => {
      try {
        const attrs = JSON.parse(v.attributes as string)
        if (attrs.color) colors.add(attrs.color)
      } catch {}
    })
    return [...colors]
  }, [variants])

  const sizeOptions = useMemo(() => {
    const sizes = new Set<string>()
    variants.forEach((v: Record<string, unknown>) => {
      try {
        const attrs = JSON.parse(v.attributes as string)
        if (attrs.size) sizes.add(attrs.size)
      } catch {}
    })
    return [...sizes]
  }, [variants])

  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0] || '')
  const [selectedSize, setSelectedSize] = useState<string>(sizeOptions[0] || '')

  // Find matching variant
  const currentVariant = useMemo(() => {
    return variants.find((v: Record<string, unknown>) => {
      try {
        const attrs = JSON.parse(v.attributes as string)
        const colorMatch = !selectedColor || attrs.color === selectedColor
        const sizeMatch = !selectedSize || attrs.size === selectedSize
        return colorMatch && sizeMatch
      } catch { return false }
    })
  }, [variants, selectedColor, selectedSize])

  const currentStock = currentVariant ? (currentVariant.stock as number) : (product?.stock || 0)
  const currentPrice = currentVariant?.price ? (currentVariant.price as number) : (product?.price || 0)

  const handleAddToCart = () => {
    if (!product) return
    // Track recently viewed
    useNavigationStore.getState().addRecentlyViewed({ id: product.id, name: product.name, image: images[0] || '', price: currentPrice })
    addItem({
      productId: product.id,
      variantId: currentVariant?.id as string || null,
      name: product.name,
      image: images[0] || '',
      price: currentPrice,
      compareAtPrice: product.compareAtPrice,
      variantName: currentVariant ? (currentVariant.name as string) : undefined,
      quantity,
      stock: currentStock,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Zoom handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsZooming(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false)
  }, [])

  // Share handlers
  const handleCopyLink = useCallback(() => {
    const url = window.location.origin + window.location.pathname
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }, [])

  const handleShareTwitter = useCallback(() => {
    const url = window.location.origin + window.location.pathname
    const text = `Check out ${product?.name || 'this product'} on NOVA STORE!`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
  }, [product?.name])

  const handleShareFacebook = useCallback(() => {
    const url = window.location.origin + window.location.pathname
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer')
  }, [])

  // Compare handler
  const handleCompare = useCallback(() => {
    if (!product) return
    if (inComparison) {
      removeFromComparison(product.id)
      toast.success('Removed from comparison')
    } else {
      const success = addToComparison(product.id)
      if (!success) {
        toast.error('You can compare up to 4 products at a time')
      } else {
        toast.success('Added to comparison')
      }
    }
  }, [product, inComparison, addToComparison, removeFromComparison])

  // Submit review
  const handleSubmitReview = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to submit a review')
      window.dispatchEvent(new Event('open-auth-dialog'))
      return
    }
    if (!selectedProductId) return
    if (!reviewComment.trim()) {
      toast.error('Please write a comment for your review')
      return
    }
    setIsSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: selectedProductId,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit review')
        return
      }
      toast.success('Review submitted successfully! It will be visible once approved by an admin.')
      setReviewTitle('')
      setReviewComment('')
      setReviewRating(5)
      queryClient.invalidateQueries({ queryKey: ['product', selectedProductId] })
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmittingReview(false)
    }
  }, [user, selectedProductId, reviewRating, reviewTitle, reviewComment, navigate, queryClient])

  // Breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((view: 'home' | 'shop', category?: string | null) => {
    if (category) {
      setShopFilters({ category, page: 1 })
    } else if (view === 'shop') {
      setShopFilters({ category: null, page: 1 })
    }
    navigate(view)
  }, [navigate, setShopFilters])

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-4 w-64 mb-8" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-xl font-semibold">Product not found</p>
      <Button variant="outline" className="mt-4" onClick={goBack}>Go Back</Button>
    </div>
  )

  const categoryName = (product.category as Record<string, string>)?.name || 'Shop'
  const categorySlug = (product.category as Record<string, string>)?.slug || null

  const renderStars = (rating: number, size = 'sm') => {
    const cls = size === 'sm' ? 'h-3.5 w-3.5' : size === 'xs' ? 'h-3 w-3' : 'h-5 w-5'
    return Array.from({ length: 5 }).map((_, i) => {
      const filled = i < Math.floor(rating)
      const half = !filled && i < rating
      return filled ? <Star key={i} className={`${cls} fill-amber-400 text-amber-400`} />
        : half ? <StarHalf key={i} className={`${cls} fill-amber-400 text-amber-400`} />
        : <Star key={i} className={`${cls} text-muted`} />
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap" aria-label="Breadcrumb">
        <button onClick={() => handleBreadcrumbNavigate('home')} className="text-muted-foreground hover:text-foreground transition-colors">
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <button onClick={() => handleBreadcrumbNavigate('shop')} className="text-muted-foreground hover:text-foreground transition-colors">
          Shop
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <button onClick={() => handleBreadcrumbNavigate('shop', categorySlug)} className="text-muted-foreground hover:text-foreground transition-colors">
          {categoryName}
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div
            ref={imageContainerRef}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border cursor-zoom-in group"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={images[selectedImage] || ''}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-200 ease-out"
              style={{
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transform: isZooming ? 'scale(2)' : 'scale(1)',
              }}
            />
            {/* Magnifying glass indicator */}
            <div className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border transition-opacity duration-200 pointer-events-none ${isZooming ? 'opacity-0' : 'opacity-100'}`}>
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            {/* Zoom-out hint on hover */}
            <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs text-muted-foreground border border-border transition-opacity duration-200 pointer-events-none ${isZooming ? 'opacity-100' : 'opacity-0'}`}>
              Move to zoom
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${selectedImage === i ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.brand && (
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-2">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">{renderStars(product.rating)}</div>
            <span className="text-sm text-muted-foreground">{product.rating} ({product.reviewCount} reviews)</span>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{product.soldCount} sold</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-foreground">${currentPrice.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">${product.compareAtPrice!.toFixed(2)}</span>
                <Badge className="bg-red-600 text-white hover:bg-red-600">-{discountPercent}%</Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

          <Separator className="mb-6" />

          {/* Variant Selectors */}
          {colorOptions.length > 0 && (
            <div className="mb-5">
              <Label className="text-sm font-medium mb-2 block">Color: <span className="text-muted-foreground">{selectedColor}</span></Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-all ${selectedColor === color ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground'}`}
                  >{color}</button>
                ))}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="mb-5">
              <Label className="text-sm font-medium mb-2 block">Size: <span className="text-muted-foreground">{selectedSize}</span></Label>
              <div className="flex gap-2 flex-wrap">
                {sizeOptions.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 w-10 rounded-md text-sm font-medium border transition-all flex items-center justify-center ${selectedSize === size ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground'}`}
                  >{size}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex gap-3 mb-6">
            <div className="flex items-center border rounded-lg">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-r-none" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-l-none" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className={`flex-1 h-11 text-base font-semibold ${addedToCart ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-foreground text-background hover:bg-foreground/90'}`}
              onClick={handleAddToCart}
              disabled={currentStock === 0}
            >
              {addedToCart ? <><Check className="h-5 w-5 mr-2" /> Added to Cart</> : <><ShoppingCart className="h-5 w-5 mr-2" /> {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}</>}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={`h-11 px-4 shrink-0 ${inComparison ? 'border-foreground bg-foreground/5' : ''}`}
              onClick={handleCompare}
              title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
            >
              <GitCompareArrows className={`h-5 w-5 ${inComparison ? 'fill-foreground' : ''}`} />
            </Button>
          </div>

          {/* Stock indicator */}
          <p className={`text-sm mb-6 ${currentStock > 10 ? 'text-green-600' : currentStock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {currentStock > 10 ? '✓ In Stock' : currentStock > 0 ? `Only ${currentStock} left in stock` : 'Out of Stock'}
          </p>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-muted rounded-xl mb-6">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'Over $75' },
              { icon: RotateCcw, label: 'Easy Returns', sub: '30 days' },
              { icon: Shield, label: 'Secure', sub: 'Payment' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <item.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Delivery Information */}
          <div className="space-y-2.5 mb-6 p-4 bg-muted rounded-xl">
            <h3 className="text-sm font-semibold text-foreground mb-3">Delivery Information</h3>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span>Estimated delivery: <span className="text-foreground font-medium">3-5 business days</span></span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Free returns within <span className="text-foreground font-medium">30 days</span></span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Ships from <span className="text-foreground font-medium">NOVA STORE warehouse</span></span>
            </div>
          </div>

          {/* Share Product */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium text-foreground mr-1">Share:</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleCopyLink}
            >
              {linkCopied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleShareTwitter}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleShareFacebook}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Accordion */}
          <Accordion type="multiple" defaultValue={['description']}>
            <AccordionItem value="description">
              <AccordionTrigger className="text-sm font-semibold">Description</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                {product.richDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{product.richDescription}</p>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="specs">
              <AccordionTrigger className="text-sm font-semibold">Specifications</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Brand</span><span className="font-medium">{product.brand || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SKU</span><span className="font-medium font-mono">{product.sku || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{product.category?.name || 'N/A'}</span></div>
                  {product.tags && <div className="flex justify-between"><span className="text-muted-foreground">Tags</span><span className="font-medium">{product.tags}</span></div>}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reviews">
              <AccordionTrigger className="text-sm font-semibold">Reviews ({reviews.length})</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mb-6">
                  {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>}
                  {reviews.map((review: Record<string, unknown>) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">{renderStars(review.rating as number, 'xs')}</div>
                        <span className="text-sm font-medium">{review.title || ''}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment || ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(review.user as Record<string, string>)?.name || 'Anonymous'} • {new Date(review.createdAt as string).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
                {/* Write Review Form */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Write a Review</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Rating</Label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(r => (
                          <button key={r} onClick={() => setReviewRating(r)}>
                            <Star className={`h-5 w-5 transition-colors ${r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted hover:text-amber-400'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input placeholder="Review title" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} className="h-9" />
                    <Textarea placeholder="Share your experience..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} />
                    <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={handleSubmitReview} disabled={isSubmittingReview}>
                      {isSubmittingReview ? (
                        <><span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mr-1.5" />Submitting...</>
                      ) : (
                        'Submit Review'
                      )}
                    </Button>
                    {!user && (
                      <p className="text-xs text-muted-foreground">Please <button onClick={() => window.dispatchEvent(new Event('open-auth-dialog'))} className="text-foreground underline underline-offset-2 hover:text-primary">log in</button> to submit a review.</p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-foreground mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((p: Record<string, unknown>) => (
              <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]['product']} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}