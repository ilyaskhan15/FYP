'use client'

import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { User, Mail, Save } from 'lucide-react'

export default function AccountProfile() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setUser({ ...user!, name, email })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name || 'User'}</p>
              <p className="text-sm text-muted-foreground capitalize">{user?.role} account</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5"><User className="h-3.5 w-3.5" />Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5"><Mail className="h-3.5 w-3.5" />Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSave} className="bg-zinc-900 hover:bg-zinc-800">
            {saved ? '✓ Saved' : <><Save className="h-4 w-4 mr-1.5" />Save Changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}