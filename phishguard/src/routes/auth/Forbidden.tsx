import { Link } from 'react-router-dom';

/**
 * 403 Forbidden Page
 *
 * Displayed when user is authenticated but lacks required permissions.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-noir-950 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <svg
            className="h-10 w-10 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-5xl font-display font-bold text-amber-500">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Acesso proibido
        </h2>
        <p className="mt-2 text-noir-400">
          Você não tem permissão para acessar esta página.
          <br />
          Entre em contato com o administrador se acredita que isso é um erro.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-6 py-3 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
          >
            Voltar ao Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-noir-700 px-6 py-3 font-semibold text-noir-300 hover:bg-noir-800 hover:text-white transition-colors"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}