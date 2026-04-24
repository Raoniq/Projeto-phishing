-- ============================================
-- Migration 0005: Landing Pages
-- ============================================

-- Landing Pages table (customizable phishing landing pages per company)
CREATE TABLE landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    html_content TEXT NOT NULL DEFAULT '',
    css_variables JSONB DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'banking', 'social', 'email', 'login', 'support')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, slug)
);

-- Index for company lookups
CREATE INDEX idx_landing_pages_company_id ON landing_pages(company_id);

-- Index for slug lookups
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);

-- Trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
    BEFORE UPDATE ON landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();