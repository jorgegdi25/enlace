import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalhost = process.env.NODE_ENV === 'development'
      
      // Construimos la URL de redirección
      let redirectUrl = `${origin}${next}`
      
      if (!isLocalhost && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      }
      
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Error exchanging code for session:', error)
    }
  }

  // Si hay error o no hay código, redirigir al login
  return NextResponse.redirect(`${origin}/admin/login?error=AuthCallbackError`)
}
