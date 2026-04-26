import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Auth callback handler for Supabase email magic link / signup confirmation.
 *
 * Supabase redirects here with #access_token=... in the URL.
 * We exchange it for a session, then redirect to /verify-email with status.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const exchangeToken = async () => {
      // Supabase automatically detects #access_token in URL and exchanges it
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate('/verify-email?error=confirmation_failed', { replace: true });
        return;
      }

      // Session established — redirect to verify-email with success
      navigate('/verify-email?status=confirmed', { replace: true });
    };

    exchangeToken();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-noir-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-noir-400 text-sm">Confirmando sua conta...</p>
      </div>
    </div>
  );
}
