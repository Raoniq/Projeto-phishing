import { Link } from 'react-router-dom';

export default function VoceFoiPescadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-noir-950 px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20">
          <svg
            className="h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-display font-bold text-white">
          Você foi pescado! 🎣
        </h1>
        <p className="mt-6 text-xl text-noir-300 max-w-4xl">
          Este era um teste de phishing simulado do PhishGuard.
          Não se preocupe - isto é parte do treinamento!
        </p>

        <div className="mt-10 rounded-xl border border-noir-700 bg-noir-900 p-8 text-left">
          <h2 className="text-xl font-semibold text-amber-500">
            O que aconteceu?
          </h2>
          <ul className="mt-4 space-y-3 text-noir-300">
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">✗</span>
              Você clicou em um link suspeita
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">✗</span>
              Ou forneceu suas credenciais em um site falso
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-amber-500">
            Como evitar isso no futuro
          </h2>
          <ul className="mt-4 space-y-3 text-noir-300">
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              Verifique sempre o remetente do email
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              Passe o mouse sobre os links antes de clicar
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              Desconfie de mensagens que criam urgência
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              Quando em dúvida, entre em contato com o TI
            </li>
          </ul>
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <Link
            to="/learner/trilhas"
            className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-noir-950 hover:bg-amber-400 transition-colors"
          >
            Fazer mais treinamentos
          </Link>
          <Link
            to="/learner/portal"
            className="rounded-lg border border-noir-700 px-6 py-3 font-semibold hover:bg-noir-800 transition-colors"
          >
            Voltar ao portal
          </Link>
        </div>
      </div>
    </div>
  );
}
