-- Gracia Visitor App - Initial Database Schema
-- Run this migration to set up the Supabase database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- USERS & AUTHENTICATION
-- ===========================================

-- Staff users table (for admin dashboard)
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'support',
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor users table (optional registration)
CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    phone VARCHAR(50),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ZONES & LOCATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(100),
    description TEXT,
    location_x DECIMAL(10, 6),
    location_y DECIMAL(10, 6),
    color VARCHAR(20) DEFAULT '#22C55E',
    map_icon VARCHAR(100),
    is_closed BOOLEAN DEFAULT false,
    closure_severity VARCHAR(20) DEFAULT 'open',
    closure_reason TEXT,
    closure_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- EVENTS
-- ===========================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    audience_type VARCHAR(50) DEFAULT 'family',
    age_min INTEGER,
    age_max INTEGER,
    image_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    capacity INTEGER,
    booked_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying upcoming events
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_audience ON events(audience_type);

-- ===========================================
-- ACTIVITIES
-- ===========================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(100),
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    age_group VARCHAR(50),
    time_window VARCHAR(100),
    duration_minutes INTEGER,
    frequency VARCHAR(100),
    image_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    max_participants INTEGER,
    skill_level VARCHAR(50),
    prerequisites TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SHOPS & CAFES
-- ===========================================

CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    opening_hours VARCHAR(100),
    is_open BOOLEAN DEFAULT true,
    phone VARCHAR(50),
    email VARCHAR(255),
    menu_items JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    accepts_bookings BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ANNOUNCEMENTS
-- ===========================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    display_location VARCHAR(100) DEFAULT 'all',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES staff_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, start_time, end_time);

-- ===========================================
-- BOOKINGS
-- ===========================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_email VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(50),
    participants INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    confirmation_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying bookings by event
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);

-- ===========================================
-- AI CONVERSATIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI feedback for improving responses
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
    message_index INTEGER,
    rating VARCHAR(20),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ANALYTICS
-- ===========================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    page_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- ===========================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ===========================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- FAVORITES
-- ===========================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(visitor_id, item_type, item_id)
);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ language 'plpgsql';

-- Function to update event booked_count
CREATE OR REPLACE FUNCTION update_event_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events
        SET booked_count = booked_count + NEW.participants
        WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events
        SET booked_count = booked_count - OLD.participants
        WHERE id = OLD.event_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.participants != OLD.participants THEN
        UPDATE events
        SET booked_count = booked_count - OLD.participants + NEW.participants
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_booked_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_event_booked_count();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on tables
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for visitor-facing tables
CREATE POLICY "Public read access" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON activities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON shops FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON zones FOR SELECT USING (true);
CREATE POLICY "Public read access" ON announcements FOR SELECT USING (
    is_active = true
    AND start_time <= NOW()
    AND (end_time IS NULL OR end_time >= NOW())
);

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Insert default admin user (password: admin123)
INSERT INTO staff_users (email, name, password_hash, role, permissions)
VALUES (
    'admin@gracia.farm',
    'Admin User',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- SHA-256 of 'admin123'
    'super_admin',
    '["all"]'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Insert sample zones
INSERT INTO zones (zone_name, zone_type, description, color) VALUES
    ('Main Entrance', 'entrance', 'Welcome center, tickets, and information', '#6B7280'),
    ('Greenhouses', 'agriculture', 'Organic vegetables and herbs', '#22C55E'),
    ('Animal Yard', 'animals', 'Farm animals, petting zoo, feeding times', '#F59E0B'),
    ('Training Centre', 'education', 'Workshops and educational programs', '#3B82F6'),
    ('Kids Play Zone', 'recreation', 'Playground and kids activities', '#EC4899'),
    ('Farm Cafe', 'food', 'Fresh food and beverages', '#8B5CF6'),
    ('Farm Shop', 'retail', 'Local produce and souvenirs', '#14B8A6'),
    ('Fruit Orchard', 'agriculture', 'Seasonal fruit picking', '#84CC16')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE staff_users IS 'Staff and admin users for the admin dashboard';
COMMENT ON TABLE visitors IS 'Registered visitors (optional)';
COMMENT ON TABLE events IS 'Farm events and activities with schedules';
COMMENT ON TABLE activities IS 'Regular activities available at the farm';
COMMENT ON TABLE shops IS 'Shops and cafes at the farm';
COMMENT ON TABLE zones IS 'Map zones and locations within the farm';
COMMENT ON TABLE announcements IS 'Farm-wide announcements and alerts';
COMMENT ON TABLE bookings IS 'Event bookings made by visitors';
