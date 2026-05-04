'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

const schema = z
  .object({
    email: z.string().email('Inserisci un indirizzo email valido'),
    password: z.string().min(6, 'La password deve essere di almeno 6 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Le password non corrispondono',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
    // Redirect after a short delay
    setTimeout(() => router.push('/login'), 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-5xl">📧</div>
              <h2 className="text-xl font-semibold">Controlla la tua email</h2>
              <p className="text-muted-foreground">
                Ti abbiamo inviato un link di conferma. Verifica la tua email per completare la
                registrazione.
              </p>
              <p className="text-sm text-muted-foreground">Verrai reindirizzato al login...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">FinanceTrack</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crea account</CardTitle>
            <CardDescription>Registrati per iniziare a tracciare le tue finanze</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mario@esempio.it"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{serverError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registrazione...' : 'Crea account'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Hai già un account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Accedi
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
