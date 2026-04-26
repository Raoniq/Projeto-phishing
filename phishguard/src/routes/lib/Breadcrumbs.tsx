/* eslint-disable react-refresh/only-export-components */
import { useLocation, Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

  const pathSnippets = location.pathname.split('/').filter((segment) => segment);

  let currentPath = '';
  for (let i = 0; i < pathSnippets.length; i++) {
    const segment = pathSnippets[i];
    currentPath += `/${segment}`;

    const label = formatLabel(segment);
    breadcrumbs.push({ label, path: currentPath });
  }

  return breadcrumbs;
}

function formatLabel(segment: string): string {
  // Handle common patterns
  const labelMap: Record<string, string> = {
    app: 'Aplicativo',
    dashboard: 'Dashboard',
    campanhas: 'Campanhas',
    usuarios: 'Usuarios',
    configuracoes: 'Configuracoes',
    learner: 'Aprendiz',
    portal: 'Portal',
    trilhas: 'Trilhas',
    certificado: 'Certificados',
    pescado: 'Pescado',
    'voce-foi-pescado': 'Voce Foi Pescado',
    landingTemplates: 'Templates',
    marketing: 'Marketing',
    pricing: 'Precos',
    about: 'Sobre',
    security: 'Seguranca',
    lgpd: 'LGPD',
    login: 'Entrar',
    register: 'Cadastro',
    forgotPassword: 'Esqueci a Senha',
  };

  if (labelMap[segment]) {
    return labelMap[segment];
  }

  // Convert kebab-case to Title Case
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-noir-600">/</span>
              )}
              {isLast ? (
                <span className="text-amber-500 font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-noir-400 hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
