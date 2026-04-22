-- ============================================
-- Migration 0001: Core Schema (companies, users, profiles)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies table (multi-tenant root)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'business', 'enterprise', 'white_label')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users table (Supabase Auth integration)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    department TEXT,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookup by auth_id
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- Learning Tracks (Trilhas de Aprendizado)
-- ============================================
CREATE TABLE learning_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_learning_tracks_company_id ON learning_tracks(company_id);
CREATE INDEX idx_learning_tracks_category ON learning_tracks(category);

-- ============================================
-- Learning Modules (Módulos das Trilhas)
-- ============================================
CREATE TABLE learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL DEFAULT 'article' CHECK (content_type IN ('article', 'video', 'quiz', 'interactive')),
    content JSONB NOT NULL DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    passing_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_learning_modules_track_id ON learning_modules(track_id);

-- ============================================
-- User Track Enrollments
-- ============================================
CREATE TABLE user_track_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES learning_tracks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, track_id)
);

CREATE INDEX idx_user_track_enrollments_user_id ON user_track_enrollments(user_id);
CREATE INDEX idx_user_track_enrollments_track_id ON user_track_enrollments(track_id);

-- ============================================
-- User Journey States (Estado da Jornada)
-- ============================================
CREATE TABLE user_journey_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    current_tier INTEGER NOT NULL DEFAULT 1 CHECK (current_tier >= 1 AND current_tier <= 3),
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    last_phishing_attempt_at TIMESTAMPTZ,
    total_campaigns_participated INTEGER DEFAULT 0,
    total_campaigns_failed INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_journey_states_user_id ON user_journey_states(user_id);
CREATE INDEX idx_user_journey_states_company_id ON user_journey_states(company_id);

-- ============================================
-- Campaign Templates (Modelos de E-mail)
-- ============================================
CREATE TABLE campaign_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'banking', 'rh', 'it', 'government', 'social')),
    difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    clickbait_score INTEGER DEFAULT 50 CHECK (clickbait_score >= 0 AND clickbait_score <= 100),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_templates_company_id ON campaign_templates(company_id);
CREATE INDEX idx_campaign_templates_category ON campaign_templates(category);

-- ============================================
-- Campaigns (Campanhas de Phishing)
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES campaign_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    target_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- ============================================
-- Campaign Targets (Alvos da Campanha)
-- ============================================
CREATE TABLE campaign_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    tracking_id UUID NOT NULL DEFAULT gen_random_uuid(),
    landed_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'reported', 'failed')),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_targets_campaign_id ON campaign_targets(campaign_id);
CREATE INDEX idx_campaign_targets_user_id ON campaign_targets(user_id);
CREATE INDEX idx_campaign_targets_tracking_id ON campaign_targets(tracking_id);

-- ============================================
-- Campaign Events (Eventos de Tracking)
-- ============================================
CREATE TABLE campaign_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_target_id UUID NOT NULL REFERENCES campaign_targets(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'reported', 'failed')),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaign_events_campaign_target_id ON campaign_events(campaign_target_id);
CREATE INDEX idx_campaign_events_event_type ON campaign_events(event_type);
CREATE INDEX idx_campaign_events_created_at ON campaign_events(created_at);

-- ============================================
-- Department Scores (Métricas por Departamento)
-- ============================================
CREATE TABLE department_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    avg_risk_score NUMERIC(5,2) DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_campaigns INTEGER DEFAULT 0,
    phishing_attempts INTEGER DEFAULT 0,
    phishing_failed INTEGER DEFAULT 0,
    success_rate NUMERIC(5,2) DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, department)
);

CREATE INDEX idx_department_scores_company_id ON department_scores(company_id);

-- ============================================
-- Risk Scores (Scores de Risco por Usuário)
-- ============================================
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    score_breakdown JSONB DEFAULT '{}',
    risk_factors JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_risk_scores_user_id ON risk_scores(user_id);
CREATE INDEX idx_risk_scores_company_id ON risk_scores(company_id);
CREATE INDEX idx_risk_scores_score ON risk_scores(score DESC);

-- ============================================
-- Audit Logs (Logs de Auditoria - Imutável)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
)
PARTITION BY RANGE (created_at);

-- Create partitions by month (last 24 months)
-- Note: Partitions need to be created manually or via a maintenance script

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_tracks_updated_at
    BEFORE UPDATE ON learning_tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_modules_updated_at
    BEFORE UPDATE ON learning_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_track_enrollments_updated_at
    BEFORE UPDATE ON user_track_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journey_states_updated_at
    BEFORE UPDATE ON user_journey_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_templates_updated_at
    BEFORE UPDATE ON campaign_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_targets_updated_at
    BEFORE UPDATE ON campaign_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_department_scores_updated_at
    BEFORE UPDATE ON department_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_scores_updated_at
    BEFORE UPDATE ON risk_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
