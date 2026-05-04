import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Auth callback handler for Supabase email magic link / signup confirmation.
 *
 * Supabase redirects here with #access_token=... in the URL.
 * We exchange it for a session, then redirect to /verify-email with status.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const exchangeToken = async () => {
      // detectSessionInUrl: false in supabase.ts means the SDK does NOT auto-detect
      // the #access_token=... hash from Supabase redirects. We must parse it manually.
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1)) // strip leading '#'
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        // Manually establish session from the hash tokens
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (setSessionError) {
          console.warn('[AuthCallback] setSession failed:', setSessionError.message)
          navigate('/verify-email?error=confirmation_failed', { replace: true })
          return
        }

        // Wait for auth state to propagate before checking session
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Now check if we have a valid session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        navigate('/verify-email?error=confirmation_failed', { replace: true })
        return
      }

      // Session established — redirect to verify-email with success
      navigate('/verify-email?status=confirmed', { replace: true })
    }

    exchangeToken()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-noir-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-noir-400 text-sm">Confirmando sua conta...</p>
      </div>
    </div>
  );
}
