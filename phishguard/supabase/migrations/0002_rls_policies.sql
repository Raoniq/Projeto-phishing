-- ============================================
-- Migration 0002: Row Level Security (RLS) Policies
-- Critical: Security is non-negotiable
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_track_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Companies Policies
-- ============================================

-- Companies: Users can read their own company
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE company_id = companies.id
        )
    );

-- Companies: Only admins can insert (via service role)
CREATE POLICY "Service role can insert companies"
    ON companies FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT auth_id FROM users WHERE role = 'admin'
        )
    );

-- Companies: Admins can update their own company
CREATE POLICY "Admins can update their own company"
    ON companies FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = companies.id AND role = 'admin'
        )
    );

-- Companies: No deletion allowed
CREATE POLICY "No companies deletion"
    ON companies FOR DELETE
    USING (false);

-- ============================================
-- Users Policies
-- ============================================

-- Users: Users can view all users in their company
CREATE POLICY "Users can view company users"
    ON users FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE company_id = users.company_id
        )
    );

-- Users: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (
        auth.uid() = users.auth_id
    );

-- Users: Admins can insert users in their company
CREATE POLICY "Admins can insert company users"
    ON users FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = users.company_id AND role = 'admin'
        )
    );

-- Users: Admins can delete users in their company (except themselves)
CREATE POLICY "Admins can delete company users"
    ON users FOR DELETE
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = users.company_id AND role = 'admin'
        )
        AND auth.uid() != users.auth_id
    );

-- ============================================
-- Learning Tracks Policies
-- ============================================

-- Learning Tracks: Company users can view tracks
CREATE POLICY "Users can view company learning tracks"
    ON learning_tracks FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE company_id = learning_tracks.company_id
        )
    );

-- Learning Tracks: Admins can manage tracks
CREATE POLICY "Admins can manage learning tracks"
    ON learning_tracks FOR ALL
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = learning_tracks.company_id AND role = 'admin'
        )
    );

-- ============================================
-- Learning Modules Policies
-- ============================================

-- Learning Modules: Company users can view modules
CREATE POLICY "Users can view company learning modules"
    ON learning_modules FOR SELECT
    USING (
        auth.uid() IN (
            SELECT u.auth_id FROM users u
            JOIN learning_tracks lt ON lt.company_id = u.company_id
            WHERE lt.id = learning_modules.track_id AND u.auth_id = auth.uid()
        )
    );

-- Learning Modules: Admins can manage modules
CREATE POLICY "Admins can manage learning modules"
    ON learning_modules FOR ALL
    USING (
        auth.uid() IN (
            SELECT u.auth_id FROM users u
            JOIN learning_tracks lt ON lt.company_id = u.company_id
            WHERE lt.id = learning_modules.track_id AND u.role = 'admin'
        )
    );

-- ============================================
-- User Track Enrollments Policies
-- ============================================

-- Enrollments: Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
    ON user_track_enrollments FOR SELECT
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = user_track_enrollments.user_id
        )
    );

-- Enrollments: Users can create their own enrollments
CREATE POLICY "Users can create own enrollments"
    ON user_track_enrollments FOR INSERT
    WITH CHECK (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = user_track_enrollments.user_id
        )
    );

-- Enrollments: Users can update their own enrollments
CREATE POLICY "Users can update own enrollments"
    ON user_track_enrollments FOR UPDATE
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = user_track_enrollments.user_id
        )
    );

-- Enrollments: Admins can view all enrollments in their company
CREATE POLICY "Admins can view company enrollments"
    ON user_track_enrollments FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = (
                SELECT company_id FROM users WHERE auth_id = auth.uid()
            ) AND role = 'admin'
        )
    );

-- ============================================
-- User Journey States Policies
-- ============================================

-- Journey States: Users can view their own state
CREATE POLICY "Users can view own journey state"
    ON user_journey_states FOR SELECT
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = user_journey_states.user_id
        )
    );

-- Journey States: Admins can view all states in their company
CREATE POLICY "Admins can view company journey states"
    ON user_journey_states FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = user_journey_states.company_id AND role = 'admin'
        )
    );

-- Journey States: Users can update their own state (for progress tracking)
CREATE POLICY "Users can update own journey state"
    ON user_journey_states FOR UPDATE
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = user_journey_states.user_id
        )
    );

-- ============================================
-- Campaign Templates Policies
-- ============================================

-- Templates: Company users can view templates
CREATE POLICY "Users can view company templates"
    ON campaign_templates FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE company_id = campaign_templates.company_id
        )
    );

-- Templates: Admins can manage templates
CREATE POLICY "Admins can manage templates"
    ON campaign_templates FOR ALL
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = campaign_templates.company_id AND role = 'admin'
        )
    );

-- ============================================
-- Campaigns Policies
-- ============================================

-- Campaigns: Company users can view campaigns
CREATE POLICY "Users can view company campaigns"
    ON campaigns FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE company_id = campaigns.company_id
        )
    );

-- Campaigns: Admins can manage campaigns
CREATE POLICY "Admins can manage campaigns"
    ON campaigns FOR ALL
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = campaigns.company_id AND role = 'admin'
        )
    );

-- ============================================
-- Campaign Targets Policies
-- ============================================

-- Targets: Users can view their own targets
CREATE POLICY "Users can view own targets"
    ON campaign_targets FOR SELECT
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = campaign_targets.user_id
        )
    );

-- Targets: Admins can view all targets in their company
CREATE POLICY "Admins can view company targets"
    ON campaign_targets FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users u
            JOIN campaigns c ON c.company_id = u.company_id
            WHERE c.id = campaign_targets.campaign_id AND u.auth_id = auth.uid()
        )
    );

-- Targets: Service/Admins can manage targets
CREATE POLICY "Admins can manage targets"
    ON campaign_targets FOR ALL
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users u
            JOIN campaigns c ON c.company_id = u.company_id
            WHERE c.id = campaign_targets.campaign_id AND u.role = 'admin'
        )
    );

-- ============================================
-- Campaign Events Policies
-- ============================================

-- Events: Users can view their own events (via targets)
CREATE POLICY "Users can view own events"
    ON campaign_events FOR SELECT
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = campaign_targets.user_id
            FROM campaign_targets WHERE id = campaign_events.campaign_target_id
        )
    );

-- Events: Anyone can insert events (tracking pixel doesn't have auth)
CREATE POLICY "Anyone can insert campaign events"
    ON campaign_events FOR INSERT
    WITH CHECK (true);

-- Events: No updates allowed (immutable)
CREATE POLICY "No event updates"
    ON campaign_events FOR UPDATE
    USING (false);

-- Events: No deletion allowed
CREATE POLICY "No event deletion"
    ON campaign_events FOR DELETE
    USING (false);

-- ============================================
-- Department Scores Policies
-- ============================================

-- Department Scores: Admins can view scores in their company
CREATE POLICY "Admins can view department scores"
    ON department_scores FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = department_scores.company_id AND role = 'admin'
        )
    );

-- Department Scores: Admins can manage scores
CREATE POLICY "Admins can manage department scores"
    ON department_scores FOR ALL
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = department_scores.company_id AND role = 'admin'
        )
    );

-- ============================================
-- Risk Scores Policies
-- ============================================

-- Risk Scores: Users can view their own risk score
CREATE POLICY "Users can view own risk score"
    ON risk_scores FOR SELECT
    USING (
        auth.uid() = (
            SELECT auth_id FROM users WHERE id = risk_scores.user_id
        )
    );

-- Risk Scores: Admins can view all scores in their company
CREATE POLICY "Admins can view company risk scores"
    ON risk_scores FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = risk_scores.company_id AND role = 'admin'
        )
    );

-- Risk Scores: Service can manage scores (background calculations)
CREATE POLICY "Service can manage risk scores"
    ON risk_scores FOR ALL
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users WHERE role = 'admin'
        )
    );

-- ============================================
-- Audit Logs Policies
-- ============================================

-- Audit Logs: Users can view their company's audit logs (admins only)
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_id FROM users
            WHERE company_id = audit_logs.company_id AND role = 'admin'
        )
    );

-- Audit Logs: Anyone can insert (service role for logging mutations)
CREATE POLICY "Service can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- Audit Logs: No updates (immutable)
CREATE POLICY "No audit log updates"
    ON audit_logs FOR UPDATE
    USING (false);

-- Audit Logs: No deletion (immutable)
CREATE POLICY "No audit log deletion"
    ON audit_logs FOR DELETE
    USING (false);

-- ============================================
-- Helper Functions for RLS
-- ============================================

-- Function to get current user's company ID
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
    )
$$ LANGUAGE SQL SECURITY DEFINER;
