import { Component, type ReactNode } from 'react';
import { isRouteErrorResponse, useNavigate } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Route Error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <RouteErrorView error={this.state.error} />;
    }

    return this.props.children;
  }
}

function RouteErrorView({ error }: { error: Error | null }) {
  const navigate = useNavigate();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noir-950 px-4">
        <div className="text-center">
          <h1 className="text-6xl font-display font-bold text-amber-500">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Página não encontrada
          </h2>
          <p className="mt-2 text-noir-400">
            A página que você está procurando não existe.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (isRouteErrorResponse(error) && error.status === 401) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noir-950 px-4">
        <div className="text-center">
          <h1 className="text-6xl font-display font-bold text-amber-500">401</h1>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Acesso não autorizado
          </h2>
          <p className="mt-2 text-noir-400">
            Você precisa estar logado para acessar esta página.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
          >
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-noir-950 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-red-500">:(</h1>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Algo deu errado
        </h2>
        <p className="mt-2 text-noir-400">
          {error?.message || 'Um erro inesperado ocorreu.'}
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
          >
            Voltar ao início
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-noir-700 px-6 py-3 font-semibold hover:bg-noir-800 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
