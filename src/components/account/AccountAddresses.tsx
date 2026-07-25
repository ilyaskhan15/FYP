'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Address {
  id: string
  label: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (typeof window === 'undefined') return []
    try { const stored = localStorage.getItem('addresses'); return stored ? JSON.parse(stored) : [] } catch { return [] }
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState({ label: '', street: '', city: '', state: '', zip: '', country: 'US' })

  const saveAddresses = (addrs: Address[]) => {
    setAddresses(addrs)
    localStorage.setItem('addresses', JSON.stringify(addrs))
  }

  const handleSave = () => {
    if (editing) {
      saveAddresses(addresses.map(a => a.id === editing.id ? { ...editing, ...form } : a))
    } else {
      saveAddresses([...addresses, { id: Date.now().toString(), ...form, isDefault: addresses.length === 0 }])
    }
    setForm({ label: '', street: '', city: '', state: '', zip: '', country: 'US' })
    setEditing(null)
    setOpen(false)
  }

  const openNew = () => { setEditing(null); setForm({ label: '', street: '', city: '', state: '', zip: '', country: 'US' }); setOpen(true) }
  const openEdit = (addr: Address) => { setEditing(addr); setForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, zip: addr.zip, country: addr.country }); setOpen(true) }
  const remove = (id: string) => saveAddresses(addresses.filter(a => a.id !== id))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Saved Addresses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-zinc-900 hover:bg-zinc-800" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Address' : 'Add Address'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Label</Label><Input placeholder="Home, Office..." value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="mt-1" /></div>
              <div><Label>Street</Label><Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
                <div><Label>State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="mt-1" /></div>
                <div><Label>ZIP</Label><Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} className="mt-1" /></div>
              </div>
              <Button className="w-full bg-zinc-900 hover:bg-zinc-800" onClick={handleSave}>Save Address</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-xl">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No saved addresses</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {addresses.map(addr => (
            <Card key={addr.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{addr.label || 'Address'}</p>
                    {addr.isDefault && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">Default</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(addr)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(addr.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{addr.street}<br />{addr.city}, {addr.state} {addr.zip}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}