import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Marketing pages
import HomePage from './routes/marketing/Home'
import AboutPage from './routes/marketing/About'
import PricingPage from './routes/marketing/Pricing'
import SecurityPage from './routes/marketing/Security'
import LgpdPage from './routes/marketing/Lgpd'

// Auth pages
import LoginPage from './routes/auth/Login'
import RegisterPage from './routes/auth/Register'
import ForgotPasswordPage from './routes/auth/ForgotPassword'
import ChangePasswordPage from './routes/auth/ChangePassword'
import EmailVerificationPage from './routes/auth/EmailVerification'

// App pages (protected)
import DashboardPage from './routes/app/Dashboard'
import CampanhasPage from './routes/app/Campanhas'
import UsuariosPage from './routes/app/Usuarios'
import ConfiguracoesPage from './routes/app/Configuracoes'

// Learner pages
import LearnerDashboard from './routes/learner/Dashboard'
import TrilhasPage from './routes/learner/Trilhas'
import CertificadoPage from './routes/learner/Certificado'

// Public pages
import VoceFoiPescado from './routes/pescado/VoceFoiPescado'
import LandingTemplates from './routes/pescado/LandingTemplates'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing - public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/lgpd" element={<LgpdPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* App - protected (requires auth) */}
        <Route path="/app/dashboard" element={<DashboardPage />} />
        <Route path="/app/campanhas" element={<CampanhasPage />} />
        <Route path="/app/usuarios" element={<UsuariosPage />} />
        <Route path="/app/configuracoes" element={<ConfiguracoesPage />} />

        {/* Learner portal */}
        <Route path="/learner/dashboard" element={<LearnerDashboard />} />
        <Route path="/learner/trilhas" element={<TrilhasPage />} />
        <Route path="/learner/certificado" element={<CertificadoPage />} />

        {/* Public - phishing landing */}
        <Route path="/pescado" element={<VoceFoiPescado />} />
        <Route path="/templates" element={<LandingTemplates />} />

        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
