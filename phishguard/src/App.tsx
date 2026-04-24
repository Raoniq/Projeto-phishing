import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

// Scroll to top on navigation
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

// Layout
import MarketingLayout from './components/navigation/MarketingLayout'
import { AppShell } from './components/navigation'

// Marketing pages
import HomePage from './routes/marketing/Home'
import AboutPage from './routes/marketing/About'
import PricingPage from './routes/marketing/Pricing'
import SecurityPage from './routes/marketing/Security'
import LgpdPage from './routes/marketing/Lgpd'
import TermosPage from './routes/marketing/Termos'
import ContactPage from './routes/marketing/Contact'
import DemoPage from './routes/marketing/Demo'

// Auth pages
import LoginPage from './routes/auth/Login'
import RegisterPage from './routes/auth/Register'
import ForgotPasswordPage from './routes/auth/ForgotPassword'
import ChangePasswordPage from './routes/auth/ChangePassword'
import EmailVerificationPage from './routes/auth/EmailVerification'

// App pages (protected)
import DashboardPage from './routes/app/dashboard.page'
import CampanhasPage from './routes/app/Campanhas'
import UsuariosPage from './routes/app/Usuarios'
import ConfiguracoesPage from './routes/app/Configuracoes'
import AuditoriaPage from './routes/app/auditoria/page'
import SuportePage from './routes/app/suporte/page'
import TreinamentoPage from './routes/app/treinamento/page'

// Campanhas sub-pages
import CampanhasListPage from './routes/app/campanhas/CampanhasPage'
import NovaCampanhaPage from './routes/app/campanhas/NovaCampanhaPage'
import CampanhaTargetsPage from './routes/app/campanhas/CampanhaTargetsPage'
import CampanhaDetailPage from './routes/app/campanhas/CampanhaDetailPage'
import RelatorioPage from './routes/app/campanhas/RelatorioPage'
import CampanhaAnalyticsPage from './routes/app/campanhas/[id]/analytics.page'

// Learner pages
import LearnerPortal from './routes/learner/Portal'
import LearnerDashboard from './routes/learner/Dashboard'
import TrilhasPage from './routes/learner/Trilhas'
import CertificadoPage from './routes/learner/Certificado'

// Usuarios sub-pages
import UsersPage from './routes/app/usuarios/UsersPage'
import GroupsPage from './routes/app/usuarios/GroupsPage'
import ImportPage from './routes/app/usuarios/ImportPage'
import UserDetailPage from './routes/app/usuarios/UserDetailPage'

// Configuracoes sub-pages
import AdminsPage from './routes/app/configuracoes/admins.page'
import AuditLogPage from './routes/app/configuracoes/audit-log.page'
import DominiosPage from './routes/app/configuracoes/dominios.page'
import NotificacoesPage from './routes/app/configuracoes/notificacoes.page'

// Relatorios pages
import RelatorioExecutivoPage from './routes/app/relatorios/RelatorioExecutivoPage'
import RelatorioTecnicoPage from './routes/app/relatorios/RelatorioTecnicoPage'

// Templates page
import TemplateEditorPage from './routes/app/templates/editor.page'

// Compliance page
import CompliancePage from './routes/app/compliance/CompliancePage'

// Inteligencia page
import InteligenciaPage from './routes/app/inteligencia/page'

// Onboarding page
import OnboardingPage from './routes/app/onboarding/Onboarding'

// Public pages
import VoceFoiPescado from './routes/pescado/VoceFoiPescado'
import LandingTemplates from './routes/pescado/LandingTemplates'
import PescadoDetailPage from './routes/pescado/[id]/page'

// Verify page
import VerifyPage from './routes/verify/[id].page'

// Utils
import Breadcrumbs from './routes/lib/Breadcrumbs'
import ErrorBoundary from './routes/lib/ErrorBoundary'
import ProtectedRoute from './routes/lib/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Marketing - public */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/lgpd" element={<LgpdPage />} />
          <Route path="/termos" element={<TermosPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

{/* App - protected (requires auth) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<DashboardPage />} />
            <Route path="/app/campanhas" element={<CampanhasPage />} />
            <Route path="/app/usuarios" element={<UsuariosPage />} />
            <Route path="/app/treinamento" element={<TreinamentoPage />} />
            <Route path="/app/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/app/auditoria" element={<AuditoriaPage />} />
            <Route path="/app/suporte" element={<SuportePage />} />

            {/* Campanhas sub-routes */}
            <Route path="/app/campanhas/nova" element={<NovaCampanhaPage />} />
            <Route path="/app/campanhas/:id" element={<CampanhaDetailPage />} />
            <Route path="/app/campanhas/:id/targets" element={<CampanhaTargetsPage />} />
            <Route path="/app/campanhas/:id/analytics" element={<CampanhaAnalyticsPage />} />
            <Route path="/app/campanhas/:id/relatorio" element={<RelatorioPage />} />

            {/* Usuarios sub-routes */}
            <Route path="/app/usuarios/groups" element={<GroupsPage />} />
            <Route path="/app/usuarios/import" element={<ImportPage />} />
            <Route path="/app/usuarios/:id" element={<UserDetailPage />} />

            {/* Configuracoes sub-routes */}
            <Route path="/app/configuracoes/admins" element={<AdminsPage />} />
            <Route path="/app/configuracoes/audit-log" element={<AuditLogPage />} />
            <Route path="/app/configuracoes/dominios" element={<DominiosPage />} />
            <Route path="/app/configuracoes/notificacoes" element={<NotificacoesPage />} />

            {/* Relatorios */}
            <Route path="/app/relatorios" element={<Navigate to="/app/relatorios/executivo" replace />} />
            <Route path="/app/relatorios/executivo" element={<RelatorioExecutivoPage />} />
            <Route path="/app/relatorios/tecnico" element={<RelatorioTecnicoPage />} />

            {/* Templates */}
            <Route path="/app/templates/editor" element={<TemplateEditorPage />} />

            {/* Compliance */}
            <Route path="/app/compliance" element={<CompliancePage />} />

            {/* Inteligencia */}
            <Route path="/app/inteligencia" element={<InteligenciaPage />} />

            {/* Onboarding */}
            <Route path="/app/onboarding" element={<OnboardingPage />} />
          </Route>
        </Route>

        {/* Learner portal */}
        <Route path="/learner/dashboard" element={<LearnerDashboard />} />
        <Route path="/learner/trilhas" element={<TrilhasPage />} />
        <Route path="/learner/certificado" element={<CertificadoPage />} />

        {/* Public - phishing landing */}
        <Route path="/pescado" element={<VoceFoiPescado />} />
        <Route path="/pescado/:id" element={<PescadoDetailPage />} />
        <Route path="/templates" element={<LandingTemplates />} />

        {/* Learner */}
        <Route path="/learner" element={<LearnerPortal />} />
        <Route path="/learner/trilhas/:id" element={<TrilhasPage />} />
        <Route path="/learner/trilhas/:id/modulo/:moduleId" element={<TrilhasPage />} />

        {/* Verify */}
        <Route path="/verify/:id" element={<VerifyPage />} />

        {/* Utils */}
        <Route path="/breadcrumbs" element={<Breadcrumbs />} />
        <Route path="/error" element={<ErrorBoundary />} />

        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}