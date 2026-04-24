-- ============================================
-- Migration 0011: Training System Schema
-- Training tracks, modules, lessons, enrollments, certificates, badges, and points
-- ============================================

-- ============================================
-- Training Tracks Table
-- ============================================
CREATE TABLE training_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration_minutes INT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Training Modules Table
-- ============================================
CREATE TABLE training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sequence_order INT,
    content_type TEXT CHECK (content_type IN ('video', 'interactive', 'reading', 'game')),
    content_url TEXT,
    duration_minutes INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Training Lessons Table
-- ============================================
CREATE TABLE training_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    sequence_order INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- User Training Enrollments Table
-- ============================================
CREATE TABLE user_training_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    track_id UUID NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    assigned_due_date DATE,
    assigned_reason TEXT,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Certificates Table
-- ============================================
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    track_id UUID NOT NULL REFERENCES training_tracks(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    pdf_url TEXT,
    verification_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- User Badges Table
-- ============================================
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_type VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- User Points Table
-- ============================================
CREATE TABLE user_points (
    user_id UUID PRIMARY KEY,
    points_total INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for Training Tables
-- ============================================
CREATE INDEX idx_training_tracks_difficulty ON training_tracks(difficulty_level);
CREATE INDEX idx_training_tracks_is_required ON training_tracks(is_required);

CREATE INDEX idx_training_modules_track_id ON training_modules(track_id);
CREATE INDEX idx_training_modules_sequence ON training_modules(sequence_order);
CREATE INDEX idx_training_modules_content_type ON training_modules(content_type);

CREATE INDEX idx_training_lessons_module_id ON training_lessons(module_id);
CREATE INDEX idx_training_lessons_sequence ON training_lessons(sequence_order);

CREATE INDEX idx_enrollments_user_id ON user_training_enrollments(user_id);
CREATE INDEX idx_enrollments_track_id ON user_training_enrollments(track_id);
CREATE INDEX idx_enrollments_status ON user_training_enrollments(status);
CREATE INDEX idx_enrollments_due_date ON user_training_enrollments(assigned_due_date);

CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_track_id ON certificates(track_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_type ON user_badges(badge_type);

-- ============================================
-- Updated At Triggers
-- ============================================
CREATE TRIGGER update_training_tracks_updated_at
    BEFORE UPDATE ON training_tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_modules_updated_at
    BEFORE UPDATE ON training_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_lessons_updated_at
    BEFORE UPDATE ON training_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_training_enrollments_updated_at
    BEFORE UPDATE ON user_training_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
    BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE training_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for training_tracks
-- All authenticated users can view training tracks
-- Only admins can manage them
-- ============================================
CREATE POLICY "Authenticated users can view training tracks"
    ON training_tracks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage training tracks"
    ON training_tracks FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- RLS Policies for training_modules
-- All authenticated users can view training modules
-- Only admins can manage them
-- ============================================
CREATE POLICY "Authenticated users can view training modules"
    ON training_modules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage training modules"
    ON training_modules FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- RLS Policies for training_lessons
-- All authenticated users can view training lessons
-- Only admins can manage them
-- ============================================
CREATE POLICY "Authenticated users can view training lessons"
    ON training_lessons FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage training lessons"
    ON training_lessons FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- RLS Policies for user_training_enrollments
-- Users can view and update their own enrollments
-- Admins can manage company enrollments
-- ============================================
CREATE POLICY "Users can view own enrollments"
    ON user_training_enrollments FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments"
    ON user_training_enrollments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage enrollments"
    ON user_training_enrollments FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- RLS Policies for certificates
-- Users can view their own certificates
-- Admins can manage certificates
-- ============================================
CREATE POLICY "Users can view own certificates"
    ON certificates FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage certificates"
    ON certificates FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- RLS Policies for user_badges
-- Users can view their own badges
-- Admins can manage badges
-- ============================================
CREATE POLICY "Users can view own badges"
    ON user_badges FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage badges"
    ON user_badges FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- RLS Policies for user_points
-- Users can view and update their own points
-- Admins can manage points
-- ============================================
CREATE POLICY "Users can view own points"
    ON user_points FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own points"
    ON user_points FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage user points"
    ON user_points FOR ALL
    TO authenticated
    USING (is_user_admin())
    WITH CHECK (is_user_admin());

-- ============================================
-- Migration Complete
-- ============================================
