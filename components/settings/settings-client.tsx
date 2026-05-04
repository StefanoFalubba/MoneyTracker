'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Email non valida'),
})

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Almeno 6 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Le password non corrispondono',
    path: ['confirmPassword'],
  })

export function SettingsClient({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: userEmail },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function handleEmailUpdate(data: z.infer<typeof emailSchema>) {
    setEmailLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: data.email })
    setEmailLoading(false)
    if (error) {
      toast.error('Errore durante l\'aggiornamento email')
    } else {
      toast.success('Controlla la tua email per confermare il cambio')
    }
  }

  async function handlePasswordUpdate(data: z.infer<typeof passwordSchema>) {
    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setPasswordLoading(false)
    if (error) {
      toast.error('Errore durante l\'aggiornamento password')
    } else {
      toast.success('Password aggiornata')
      passwordForm.reset()
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
          <CardDescription>Aggiorna il tuo indirizzo email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={emailForm.handleSubmit(handleEmailUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...emailForm.register('email')} />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={emailLoading}>
              {emailLoading ? 'Aggiornamento...' : 'Aggiorna email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Scegli una nuova password</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="password">Nuova password</Label>
              <Input id="password" type="password" {...passwordForm.register('password')} />
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Aggiornamento...' : 'Aggiorna password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Esci dall&apos;account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
