import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold">Configurazione mancante</h1>
          <p className="text-sm text-muted-foreground">
            Le variabili d&apos;ambiente Supabase non sono impostate. Aggiungi
            <code className="mx-1 px-1 rounded bg-muted">NEXT_PUBLIC_SUPABASE_URL</code>
            e
            <code className="mx-1 px-1 rounded bg-muted">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            nelle impostazioni del progetto Vercel.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email ?? ''} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">{children}</main>
    </div>
  )
}
