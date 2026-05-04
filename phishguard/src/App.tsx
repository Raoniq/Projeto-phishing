import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from '@/lib/auth/AuthContext'

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
import AuthCallbackPage from './routes/auth/AuthCallback'

// App pages (protected)
import DashboardPage from './routes/app/Dashboard'
import CampanhasPage from './routes/app/campanhas/CampanhasPage'
import UsuariosPage from './routes/app/Usuarios'
import ConfiguracoesPage from './routes/app/Configuracoes'
import AuditoriaPage from './routes/app/auditoria/page'
import SuportePage from './routes/app/suporte/page'
import TreinamentoPage from './routes/app/treinamento/page'

// Campanhas sub-pages
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
import GroupsPage from './routes/app/usuarios/GroupsPage'
import ImportPage from './routes/app/usuarios/ImportPage'
import UserDetailPage from './routes/app/usuarios/UserDetailPage'

// Configuracoes sub-pages
import AdminsPage from './routes/app/configuracoes/admins.page'
import AuditLogPage from './routes/app/configuracoes/audit-log.page'
import DominiosPage from './routes/app/configuracoes/dominios.page'
import NotificacoesPage from './routes/app/configuracoes/notificacoes.page'
import PreferenciasNotificacoesPage from './routes/app/configuracoes/preferencias-notificacoes.page'

// SMS pages
import SMSDashboardPage from './routes/app/sms/SMSDashboardPage'
import NovaCampanhaSMSPage from './routes/app/sms/NovaCampanhaSMSPage'

// Quishing pages
import QuishingDashboardPage from './routes/app/campanhas/QuishingDashboardPage'
import NovaCampanhaQRPage from './routes/app/campanhas/NovaCampanhaQRPage'

// Relatorios pages
import RelatorioExecutivoPage from './routes/app/relatorios/RelatorioExecutivoPage'
import RelatorioTecnicoPage from './routes/app/relatorios/RelatorioTecnicoPage'
import SusceptibilityPage from './routes/app/relatorios/SusceptibilityPage'

// Training pages
import TrainingDashboardPage from './routes/app/training/TrainingDashboardPage'
import AssignPage from './routes/app/training/assign/page'
import AnalyticsPage from './routes/app/training/analytics/page'

// Admin pages (orphaned — registered for completeness)
import AdminUsuariosPage from './routes/app/admin/usuarios/page'
import InviteUsersPage from './routes/app/admin/usuarios/invite/page'
import AdminTrainingPage from './routes/app/admin/training/page'
import AdminTrainingAnalyticsPage from './routes/app/admin/training/analytics/page'
import AdminTrainingAssignPage from './routes/app/admin/training/assign/page'

// Notifications page
import NotificationsPage from './routes/app/notifications/page'

// Templates page
import TemplateEditorPage from './routes/app/templates/editor.page'
import BibliotecaPage from './routes/app/templates/biblioteca.page'

// Compliance page
import CompliancePage from './routes/app/compliance/CompliancePage'

// Inteligencia page
import InteligenciaPage from './routes/app/inteligencia/page'

// Dominios page
import DomainPoolPage from './routes/app/dominios/DomainPoolPage'

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
    <AuthProvider>
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
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

{/* App - protected (requires auth) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<DashboardPage />} />
            <Route path="/app/campanhas" element={<CampanhasPage />} />
            <Route path="/app/usuarios" element={<UsuariosPage />} />
            <Route path="/app/treinamento" element={<TreinamentoPage />} />
            <Route path="/app/treinamento/gerenciar" element={<TrainingDashboardPage />} />
            <Route path="/app/treinamento/atribuir" element={<AssignPage />} />
            <Route path="/app/treinamento/analytics" element={<AnalyticsPage />} />
            <Route path="/app/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/app/auditoria" element={<AuditoriaPage />} />
            <Route path="/app/suporte" element={<SuportePage />} />
            <Route path="/app/notificacoes" element={<NotificationsPage />} />

            {/* Campanhas sub-routes */}
            <Route path="/app/campanhas/nova" element={<NovaCampanhaPage />} />
            <Route path="/app/campanhas/:id" element={<CampanhaDetailPage />} />
            <Route path="/app/campanhas/:id/targets" element={<CampanhaTargetsPage />} />
            <Route path="/app/campanhas/:id/analytics" element={<CampanhaAnalyticsPage />} />
            <Route path="/app/campanhas/:id/relatorio" element={<RelatorioPage />} />

            {/* SMS */}
            <Route path="/app/sms" element={<SMSDashboardPage />} />
            <Route path="/app/sms/nova" element={<NovaCampanhaSMSPage />} />

            {/* Quishing */}
            <Route path="/app/quishing" element={<QuishingDashboardPage />} />
            <Route path="/app/quishing/nova" element={<NovaCampanhaQRPage />} />

            {/* Usuarios sub-routes */}
            <Route path="/app/usuarios/groups" element={<GroupsPage />} />
            <Route path="/app/usuarios/import" element={<ImportPage />} />
            <Route path="/app/usuarios/:id" element={<UserDetailPage />} />

            {/* Configuracoes sub-routes */}
            <Route path="/app/configuracoes/admins" element={<AdminsPage />} />
            <Route path="/app/configuracoes/audit-log" element={<AuditLogPage />} />
            <Route path="/app/configuracoes/dominios" element={<DominiosPage />} />
            <Route path="/app/configuracoes/notificacoes" element={<NotificacoesPage />} />
            <Route path="/app/configuracoes/preferencias-notificacoes" element={<PreferenciasNotificacoesPage />} />

            {/* Relatorios */}
            <Route path="/app/relatorios" element={<Navigate to="/app/relatorios/executivo" replace />} />
            <Route path="/app/relatorios/executivo" element={<RelatorioExecutivoPage />} />
            <Route path="/app/relatorios/tecnico" element={<RelatorioTecnicoPage />} />
            <Route path="/app/relatorios/suscetibilidade" element={<SusceptibilityPage />} />

            {/* Templates */}
            <Route path="/app/templates" element={<BibliotecaPage />} />
            <Route path="/app/templates/editor" element={<TemplateEditorPage />} />

            {/* Compliance */}
            <Route path="/app/compliance" element={<CompliancePage />} />

            {/* Inteligencia */}
            <Route path="/app/inteligencia" element={<InteligenciaPage />} />

            {/* Dominios (DomainPoolPage) */}
            <Route path="/app/dominios" element={<DomainPoolPage />} />

            {/* Onboarding */}
            <Route path="/app/onboarding" element={<OnboardingPage />} />

            {/* Admin pages (orphaned — registered for completeness) */}
            <Route path="/app/admin/usuarios" element={<AdminUsuariosPage />} />
            <Route path="/app/admin/usuarios/invite" element={<InviteUsersPage />} />
            <Route path="/app/admin/training" element={<AdminTrainingPage />} />
            <Route path="/app/admin/training/assign" element={<AdminTrainingAssignPage />} />
            <Route path="/app/admin/training/analytics" element={<AdminTrainingAnalyticsPage />} />
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
  </AuthProvider>
  )
}