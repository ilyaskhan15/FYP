'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCartStore } from '@/stores/cart'
import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, CreditCard, Truck, ArrowLeft, ArrowRight, Loader2, Package, ChevronRight, CircleDot, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

const steps = [
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Review', icon: CircleDot },
]

interface FormErrors {
  [key: string]: string
}

/** Luhn algorithm for credit card validation */
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

function getValidationErrors(form: Record<string, string>, step: number): FormErrors {
  const errors: FormErrors = {}

  if (step === 0) {
    if (!form.firstName?.trim()) errors.firstName = 'First name is required'
    if (!form.lastName?.trim()) errors.lastName = 'Last name is required'
    if (!form.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!form.street?.trim()) errors.street = 'Street address is required'
    if (!form.city?.trim()) errors.city = 'City is required'
    if (!form.zip?.trim()) {
      errors.zip = 'ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(form.zip)) {
      errors.zip = 'Enter a valid ZIP code'
    }
  }

  if (step === 1) {
    const cleanedCard = (form.cardNumber || '').replace(/\s/g, '')
    if (!form.cardNumber?.trim()) {
      errors.cardNumber = 'Card number is required'
    } else if (!luhnCheck(cleanedCard)) {
      errors.cardNumber = 'Enter a valid card number'
    }
    if (!form.expiry?.trim()) {
      errors.expiry = 'Expiry date is required'
    } else if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      errors.expiry = 'Use MM/YY format'
    } else {
      const expMatch = form.expiry.match(/^(\d{2})\/(\d{2})$/)
      if (expMatch) {
        const expMonth = parseInt(expMatch[1], 10)
        const expYear = parseInt(expMatch[2], 10) + 2000
        if (expMonth < 1 || expMonth > 12) {
          errors.expiry = 'Invalid month'
        } else if (new Date(expYear, expMonth, 0) < new Date()) {
          errors.expiry = 'Card has expired'
        }
      }
    }
    if (!form.cvv?.trim()) {
      errors.cvv = 'CVV is required'
    } else if (!/^\d{3,4}$/.test(form.cvv)) {
      errors.cvv = 'Enter a valid CVV'
    }
  }

  return errors
}

export default function CheckoutPage() {
  const { items, subtotal, shipping, tax, clearCart } = useCartStore()
  const { navigate } = useNavigationStore()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    cardNumber: '',
    expiry: '',
    cvv: '',
    shippingMethod: 'standard',
  })

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const handleBlur = (key: string) => setTouched(prev => ({ ...prev, [key]: true }))
  const shippingCost = form.shippingMethod === 'express' ? 19.99 : shipping()
  const subtotalValue = subtotal()
  const taxValue = tax()
  const orderTotal = subtotalValue + shippingCost + taxValue - couponDiscount

  // Restore coupon from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nova-cart-coupon')
      if (stored) {
        const parsed = JSON.parse(stored) as { code: string; discount: number }
        setCouponCode(parsed.code)
        setCouponDiscount(parsed.discount)
      }
    } catch { /* ignore */ }
  }, [])

  const errors = useMemo(() => getValidationErrors(form, step), [form, step])
  const hasErrors = Object.keys(errors).length > 0

  const canProceed = step === 0
    ? !!(form.firstName && form.lastName && form.email && form.street && form.city && form.zip && !hasErrors)
    : step === 1
      ? !!(form.cardNumber && form.expiry && form.cvv && !hasErrors)
      : true

  const handleNext = () => {
    setTouched(prev => {
      const newTouched = { ...prev }
      if (step === 0) {
        newTouched.firstName = true
        newTouched.lastName = true
        newTouched.email = true
        newTouched.street = true
        newTouched.city = true
        newTouched.zip = true
      }
      if (step === 1) {
        newTouched.cardNumber = true
        newTouched.expiry = true
        newTouched.cvv = true
      }
      return newTouched
    })
    if (!hasErrors) {
      setStep(step + 1)
    }
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            productName: i.name,
            productImage: i.image,
            variantName: i.variantName,
            price: i.price,
            quantity: i.quantity,
          })),
          shippingAddress: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
            street: form.street,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
          },
          shippingMethod: form.shippingMethod,
          couponCode: couponCode || undefined,
          userId: user?.id,
          cardNumber: form.cardNumber,
          expiry: form.expiry,
          cvv: form.cvv,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const details = data.details
        toast.error(data.error || 'Order failed', {
          description: Array.isArray(details) ? details.join('\n') : 'Please review and try again.',
          duration: 5000,
        })
        return
      }
      toast.success('Order placed successfully!', {
        description: `Order ${data.orderNumber || ''} of $${orderTotal.toFixed(2)} is being processed. Thank you for shopping with NOVA STORE!`,
        duration: 4000,
      })
      clearCart()
      localStorage.removeItem('nova-cart-coupon')
      navigate('order-confirmation')
    } catch (error) {
      console.error('Order failed:', error)
      toast.error('Order failed', {
        description: 'Something went wrong. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const showError = (field: string) => touched[field] && errors[field]

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No items to checkout</h2>
        <p className="text-sm text-muted-foreground mb-6">Your cart is empty. Browse our store to find something you love.</p>
        <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => navigate('shop')}>Continue Shopping</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button
        onClick={() => step > 0 ? setStep(step - 1) : navigate('cart')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Checkout</h1>

      {/* Step Indicator with Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          {/* Progress bar background */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full -z-0" />
          {/* Progress bar fill */}
          <div
            className="absolute top-5 left-0 h-1 bg-foreground rounded-full -z-0 transition-all duration-500 ease-out animate-progress"
            style={{ '--progress-width': `${(step / (steps.length - 1)) * 100}%` } as React.CSSProperties}
          />
          {/* Steps */}
          {steps.map((s, i) => {
            const StepIcon = s.icon
            const isActive = i === step
            const isComplete = i < step
            return (
              <div key={s.label} className="flex flex-col items-center relative z-10 flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2 ${
                    isComplete
                      ? 'bg-foreground border-foreground text-background'
                      : isActive
                        ? 'bg-card border-foreground text-foreground'
                        : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : <StepIcon className="h-4.5 w-4.5" />}
                </div>
                <span className={`text-xs font-medium mt-2 transition-colors hidden sm:block ${isActive ? 'text-foreground' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          {step === 0 && (
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Contact Information</h2>
                <p className="text-sm text-muted-foreground mb-5">We&apos;ll use this to send your order updates.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={e => update('firstName', e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      placeholder="John"
                      className={`h-10 ${showError('firstName') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {showError('firstName') && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={e => update('lastName', e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      placeholder="Doe"
                      className={`h-10 ${showError('lastName') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {showError('lastName') && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="john@example.com"
                      className={`h-10 ${showError('email') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {showError('email') && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Shipping Address</h2>
                <p className="text-sm text-muted-foreground mb-5">Where should we deliver your order?</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="street" className="text-sm font-medium">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="street"
                      value={form.street}
                      onChange={e => update('street', e.target.value)}
                      onBlur={() => handleBlur('street')}
                      placeholder="123 Main St, Apt 4B"
                      className={`h-10 ${showError('street') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {showError('street') && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm font-medium">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={e => update('city', e.target.value)}
                        onBlur={() => handleBlur('city')}
                        placeholder="New York"
                        className={`h-10 ${showError('city') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                      />
                      {showError('city') && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state" className="text-sm font-medium">State</Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={e => update('state', e.target.value)}
                        placeholder="NY"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="zip" className="text-sm font-medium">
                        ZIP Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="zip"
                        value={form.zip}
                        onChange={e => update('zip', e.target.value)}
                        onBlur={() => handleBlur('zip')}
                        placeholder="10001"
                        className={`h-10 ${showError('zip') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                      />
                      {showError('zip') && <p className="text-xs text-red-500 mt-1">{errors.zip}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">Shipping Method</h2>
                <p className="text-sm text-muted-foreground mb-5">Choose your preferred delivery speed.</p>
                <RadioGroup value={form.shippingMethod} onValueChange={v => update('shippingMethod', v)} className="space-y-3">
                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 ${form.shippingMethod === 'standard' ? 'border-foreground bg-muted ring-1 ring-zinc-900' : 'hover:border-border'}`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="standard" />
                      <div>
                        <p className="font-medium text-sm">Standard Shipping</p>
                        <p className="text-xs text-muted-foreground">5-7 business days</p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${subtotal() >= 75 ? 'text-emerald-600' : ''}`}>
                      {subtotal() >= 75 ? 'Free' : '$9.99'}
                    </span>
                  </label>
                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 ${form.shippingMethod === 'express' ? 'border-foreground bg-muted ring-1 ring-zinc-900' : 'hover:border-border'}`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="express" />
                      <div>
                        <p className="font-medium text-sm">Express Shipping</p>
                        <p className="text-xs text-muted-foreground">2-3 business days</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">$19.99</span>
                  </label>
                </RadioGroup>
                {subtotal() < 75 && form.shippingMethod === 'standard' && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    Add ${(75 - subtotal()).toFixed(2)} more for free standard shipping
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-foreground">Payment Details</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">This is a demo checkout. No real payment will be processed.</p>
              <p className="text-xs text-muted-foreground/70 mb-6">For testing, use card number: <span className="font-mono">4242 4242 4242 4242</span>, expiry: <span className="font-mono">12/28</span>, CVV: <span className="font-mono">123</span></p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber" className="text-sm font-medium">
                    Card Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cardNumber"
                    value={form.cardNumber}
                    onChange={e => update('cardNumber', e.target.value)}
                    onBlur={() => handleBlur('cardNumber')}
                    className={`h-10 font-mono text-sm tracking-wider ${showError('cardNumber') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                  />
                  {showError('cardNumber') && <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry" className="text-sm font-medium">
                      Expiry Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expiry"
                      value={form.expiry}
                      onChange={e => update('expiry', e.target.value)}
                      onBlur={() => handleBlur('expiry')}
                      className={`h-10 font-mono text-sm ${showError('expiry') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {showError('expiry') && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvv" className="text-sm font-medium">
                      CVV <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cvv"
                      value={form.cvv}
                      onChange={e => update('cvv', e.target.value)}
                      onBlur={() => handleBlur('cvv')}
                      className={`h-10 font-mono text-sm ${showError('cvv') ? 'border-red-400 focus-visible:ring-red-200' : ''}`}
                    />
                    {showError('cvv') && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-5">Review Your Order</h2>
                <div className="bg-muted rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ship to</span>
                    <span className="font-medium text-foreground">{form.firstName} {form.lastName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-foreground text-right max-w-[60%]">{form.street}, {form.city}, {form.state} {form.zip}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">{form.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-foreground">{form.shippingMethod === 'express' ? 'Express (2-3 days)' : 'Standard (5-7 days)'}</span>
                  </div>
                  <button
                    onClick={() => setStep(0)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-0.5 transition-colors"
                  >
                    Edit shipping info <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{items.length} {items.length === 1 ? 'item' : 'items'}</h3>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3 items-center p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}{item.variantName ? ` · ${item.variantName}` : ''}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            ) : (
              <div />
            )}
            {step < 2 ? (
              <Button
                className="bg-foreground text-background hover:bg-foreground/90 gap-2 px-6"
                onClick={handleNext}
                disabled={!canProceed}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-8"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  `Place Order · $${orderTotal.toFixed(2)}`
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-2">
          <Card className="sticky top-24 rounded-xl border border-border overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-base font-semibold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Item list */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-muted-foreground text-background text-[10px] font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.name}</p>
                      {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                    </div>
                    <p className="text-sm font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={`font-medium ${shippingCost === 0 ? 'text-emerald-600' : ''}`}>
                    {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${taxValue.toFixed(2)}</span>
                </div>
                {couponCode && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponCode})</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure checkout · SSL encrypted
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}