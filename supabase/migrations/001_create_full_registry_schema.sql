-- ============================================================
-- Full Supabase schema for the Complete Swine Registry & ASF Management System
-- Safe to run via SQL Editor or via the Supabase CLI
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Safety fix for existing projects that previously used TEXT ids
-- Make sure every foreign key to swine_records(id) matches UUID.
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'swine_records'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'swine_records'
              AND column_name = 'id'
              AND data_type <> 'uuid'
        ) THEN
            ALTER TABLE public.swine_records
                ALTER COLUMN id TYPE UUID USING id::uuid;
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'certificates'
    ) THEN
        ALTER TABLE public.certificates
            ALTER COLUMN swine_id TYPE UUID USING swine_id::uuid;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'monitoring_records'
    ) THEN
        ALTER TABLE public.monitoring_records
            ALTER COLUMN swine_id TYPE UUID USING swine_id::uuid;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'swine_movements'
    ) THEN
        ALTER TABLE public.swine_movements
            ALTER COLUMN swine_id TYPE UUID USING swine_id::uuid;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'mortality_records'
    ) THEN
        ALTER TABLE public.mortality_records
            ALTER COLUMN swine_id TYPE UUID USING swine_id::uuid;
    END IF;
END $$;

-- ============================================================
-- 1. Reference tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.barangays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    municipality TEXT,
    province TEXT,
    region TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    assigned_barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL,
    phone_number TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Farmers and swine records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    suffix TEXT,
    farm_name TEXT,
    farm_address TEXT,
    contact_number TEXT,
    email TEXT,
    gender TEXT,
    birth_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.swine_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE RESTRICT,
    original_tag_number TEXT,
    ear_tag_number TEXT,
    pig_name TEXT,
    breed TEXT,
    sex TEXT,
    birth_date DATE,
    age_days INTEGER,
    age_months INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    swine_type TEXT NOT NULL DEFAULT 'fattening',
    farm_scale TEXT NOT NULL DEFAULT 'backyard',
    asf_zone TEXT NOT NULL DEFAULT 'red',
    weight_kg NUMERIC(10,2),
    price_estimate NUMERIC(12,2),
    photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registry_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registry_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.registry_forms(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    default_value TEXT,
    validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (form_id, field_key)
);

CREATE TABLE IF NOT EXISTS public.registry_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.registry_forms(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES public.registry_fields(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    value_text TEXT,
    value_number NUMERIC,
    value_boolean BOOLEAN,
    value_date DATE,
    value_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Certificates and documents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    template_body TEXT NOT NULL,
    css_styles JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certificate_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    default_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (template_id, field_key)
);

CREATE TABLE IF NOT EXISTS public.signatories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    position_title TEXT,
    office_name TEXT,
    signature_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certificate_signatories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
    signatory_id UUID NOT NULL REFERENCES public.signatories(id) ON DELETE RESTRICT,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (template_id, signatory_id)
);

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE RESTRICT,
    swine_id UUID REFERENCES public.swine_records(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES public.certificate_templates(id) ON DELETE RESTRICT,
    document_number TEXT NOT NULL UNIQUE,
    document_type TEXT NOT NULL,
    purpose TEXT,
    issue_date DATE NOT NULL,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'issued',
    generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    qr_payload TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.printed_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    document_type TEXT NOT NULL,
    related_table TEXT NOT NULL,
    related_record_id UUID NOT NULL,
    template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
    issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    issued_to TEXT,
    status TEXT NOT NULL DEFAULT 'generated',
    rendered_content TEXT,
    output_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. Monitoring and ASF tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS public.monitoring_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE RESTRICT,
    swine_id UUID REFERENCES public.swine_records(id) ON DELETE RESTRICT,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL,
    severity TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.monitoring_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    monitoring_id UUID NOT NULL REFERENCES public.monitoring_records(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gis_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    feature_type TEXT NOT NULL,
    name TEXT,
    description TEXT,
    geojson JSONB NOT NULL DEFAULT '{}'::jsonb,
    geom GEOMETRY(Geometry, 4326),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.swine_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    from_farmer_id UUID REFERENCES public.farmers(id) ON DELETE RESTRICT,
    to_farmer_id UUID REFERENCES public.farmers(id) ON DELETE RESTRICT,
    from_barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT,
    to_barangay_id UUID REFERENCES public.barangays(id) ON DELETE RESTRICT,
    swine_id UUID REFERENCES public.swine_records(id) ON DELETE RESTRICT,
    movement_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mortality_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE RESTRICT,
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE RESTRICT,
    swine_id UUID REFERENCES public.swine_records(id) ON DELETE RESTRICT,
    mortality_date DATE NOT NULL,
    cause_of_death TEXT,
    suspected_asf BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'reported',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. Audit and system settings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    barangay_id UUID REFERENCES public.barangays(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_group TEXT NOT NULL DEFAULT 'general',
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_barangays_code ON public.barangays(code);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_assigned_barangay_id ON public.users(assigned_barangay_id);
CREATE INDEX IF NOT EXISTS idx_farmers_barangay_id ON public.farmers(barangay_id);
CREATE INDEX IF NOT EXISTS idx_swine_barangay_id ON public.swine_records(barangay_id);
CREATE INDEX IF NOT EXISTS idx_swine_farmer_id ON public.swine_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_swine_status ON public.swine_records(status);
CREATE INDEX IF NOT EXISTS idx_registry_fields_form_id ON public.registry_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_registry_field_values_entity ON public.registry_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_certificates_barangay_id ON public.certificates(barangay_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_barangay_id ON public.certificate_templates(barangay_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_records_barangay_id ON public.monitoring_records(barangay_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_photos_monitoring_id ON public.monitoring_photos(monitoring_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_barangay_id ON public.gis_features(barangay_id);
CREATE INDEX IF NOT EXISTS idx_swine_movements_barangay_id ON public.swine_movements(barangay_id);
CREATE INDEX IF NOT EXISTS idx_mortality_records_barangay_id ON public.mortality_records(barangay_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_group ON public.system_settings(setting_group);

-- ============================================================
-- 7. Updated_at helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. Triggers for updated_at
-- ============================================================

CREATE TRIGGER trg_barangays_updated_at
BEFORE UPDATE ON public.barangays
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_permissions_updated_at
BEFORE UPDATE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_farmers_updated_at
BEFORE UPDATE ON public.farmers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_swine_records_updated_at
BEFORE UPDATE ON public.swine_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_registry_forms_updated_at
BEFORE UPDATE ON public.registry_forms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_registry_fields_updated_at
BEFORE UPDATE ON public.registry_fields
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_registry_field_values_updated_at
BEFORE UPDATE ON public.registry_field_values
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_certificate_fields_updated_at
BEFORE UPDATE ON public.certificate_fields
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_signatories_updated_at
BEFORE UPDATE ON public.signatories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_certificate_signatories_updated_at
BEFORE UPDATE ON public.certificate_signatories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_printed_documents_updated_at
BEFORE UPDATE ON public.printed_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_monitoring_records_updated_at
BEFORE UPDATE ON public.monitoring_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_gis_features_updated_at
BEFORE UPDATE ON public.gis_features
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_swine_movements_updated_at
BEFORE UPDATE ON public.swine_movements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_mortality_records_updated_at
BEFORE UPDATE ON public.mortality_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 9. Access control helpers
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.roles r ON r.id = u.role_id
        WHERE u.id = auth.uid()
          AND r.code = 'super_admin'
          AND u.is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_barangay(p_barangay_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT
        public.is_super_admin()
        OR (
            auth.uid() IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM public.users u
                WHERE u.id = auth.uid()
                  AND u.assigned_barangay_id = p_barangay_id
                  AND u.is_active = true
            )
        );
$$;

-- ============================================================
-- 10. Enable RLS
-- ============================================================

ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swine_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_signatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gis_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swine_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mortality_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. Policies
-- ============================================================

-- barangays
CREATE POLICY "barangays_select_all_authenticated"
ON public.barangays
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "barangays_manage_super_admin"
ON public.barangays
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- roles
CREATE POLICY "roles_select_all_authenticated"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "roles_manage_super_admin"
ON public.roles
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- permissions
CREATE POLICY "permissions_select_all_authenticated"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "permissions_manage_super_admin"
ON public.permissions
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- role_permissions
CREATE POLICY "role_permissions_select_all_authenticated"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "role_permissions_manage_super_admin"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- users
CREATE POLICY "users_super_admin_all"
ON public.users
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "users_self_or_same_barangay_scope"
ON public.users
FOR ALL
TO authenticated
USING (
    id = auth.uid()
    OR public.user_can_access_barangay(assigned_barangay_id)
)
WITH CHECK (
    public.is_super_admin()
    OR id = auth.uid()
    OR public.user_can_access_barangay(assigned_barangay_id)
);

-- farmers
CREATE POLICY "farmers_super_admin_all"
ON public.farmers
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "farmers_barangay_scope"
ON public.farmers
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- swine_records
CREATE POLICY "swine_records_super_admin_all"
ON public.swine_records
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "swine_records_barangay_scope"
ON public.swine_records
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- registry_forms
CREATE POLICY "registry_forms_select_authenticated"
ON public.registry_forms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "registry_forms_manage_super_admin"
ON public.registry_forms
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- registry_fields
CREATE POLICY "registry_fields_select_authenticated"
ON public.registry_fields
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "registry_fields_manage_super_admin"
ON public.registry_fields
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- registry_field_values
CREATE POLICY "registry_field_values_super_admin_all"
ON public.registry_field_values
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "registry_field_values_barangay_scope"
ON public.registry_field_values
FOR ALL
TO authenticated
USING (
    public.user_can_access_barangay(
        COALESCE(
            (SELECT s.barangay_id FROM public.swine_records s WHERE s.id = registry_field_values.entity_id LIMIT 1),
            (SELECT f.barangay_id FROM public.farmers f WHERE f.id = registry_field_values.entity_id LIMIT 1)
        )
    )
)
WITH CHECK (
    public.user_can_access_barangay(
        COALESCE(
            (SELECT s.barangay_id FROM public.swine_records s WHERE s.id = registry_field_values.entity_id LIMIT 1),
            (SELECT f.barangay_id FROM public.farmers f WHERE f.id = registry_field_values.entity_id LIMIT 1)
        )
    )
);

-- certificate_templates
CREATE POLICY "certificate_templates_select_authenticated"
ON public.certificate_templates
FOR SELECT
TO authenticated
USING (public.user_can_access_barangay(barangay_id));

CREATE POLICY "certificate_templates_manage_super_admin"
ON public.certificate_templates
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- certificate_fields
CREATE POLICY "certificate_fields_select_authenticated"
ON public.certificate_fields
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.certificate_templates ct
        WHERE ct.id = certificate_fields.template_id
          AND public.user_can_access_barangay(ct.barangay_id)
    )
);

CREATE POLICY "certificate_fields_manage_super_admin"
ON public.certificate_fields
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- signatories
CREATE POLICY "signatories_select_authenticated"
ON public.signatories
FOR SELECT
TO authenticated
USING (public.user_can_access_barangay(barangay_id));

CREATE POLICY "signatories_manage_super_admin"
ON public.signatories
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- certificate_signatories
CREATE POLICY "certificate_signatories_select_authenticated"
ON public.certificate_signatories
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.certificate_templates ct
        WHERE ct.id = certificate_signatories.template_id
          AND public.user_can_access_barangay(ct.barangay_id)
    )
);

CREATE POLICY "certificate_signatories_manage_super_admin"
ON public.certificate_signatories
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- certificates
CREATE POLICY "certificates_super_admin_all"
ON public.certificates
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "certificates_barangay_scope"
ON public.certificates
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- printed_documents
CREATE POLICY "printed_documents_super_admin_all"
ON public.printed_documents
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "printed_documents_barangay_scope"
ON public.printed_documents
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- monitoring_records
CREATE POLICY "monitoring_records_super_admin_all"
ON public.monitoring_records
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "monitoring_records_barangay_scope"
ON public.monitoring_records
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- monitoring_photos
CREATE POLICY "monitoring_photos_super_admin_all"
ON public.monitoring_photos
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "monitoring_photos_barangay_scope"
ON public.monitoring_photos
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.monitoring_records mr
        WHERE mr.id = monitoring_photos.monitoring_id
          AND public.user_can_access_barangay(mr.barangay_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.monitoring_records mr
        WHERE mr.id = monitoring_photos.monitoring_id
          AND public.user_can_access_barangay(mr.barangay_id)
    )
);

-- gis_features
CREATE POLICY "gis_features_super_admin_all"
ON public.gis_features
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "gis_features_barangay_scope"
ON public.gis_features
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- swine_movements
CREATE POLICY "swine_movements_super_admin_all"
ON public.swine_movements
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "swine_movements_barangay_scope"
ON public.swine_movements
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- mortality_records
CREATE POLICY "mortality_records_super_admin_all"
ON public.mortality_records
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "mortality_records_barangay_scope"
ON public.mortality_records
FOR ALL
TO authenticated
USING (public.user_can_access_barangay(barangay_id))
WITH CHECK (public.user_can_access_barangay(barangay_id));

-- audit_logs
CREATE POLICY "audit_logs_super_admin_all"
ON public.audit_logs
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "audit_logs_barangay_scope"
ON public.audit_logs
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    OR public.user_can_access_barangay(barangay_id)
)
WITH CHECK (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR public.user_can_access_barangay(barangay_id)
);

-- system_settings
CREATE POLICY "system_settings_select_authenticated"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "system_settings_manage_super_admin"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

COMMIT;

-- ============================================================
-- Optional seed data for roles
-- ============================================================
-- INSERT INTO public.roles (code, name, description)
-- VALUES
--   ('super_admin', 'Super Admin', 'Full system access'),
--   ('focal_person', 'Focal Person', 'Barangay-level manager'),
--   ('agent', 'Agent', 'Field user');
--
-- INSERT INTO public.permissions (code, name, description)
-- VALUES
--   ('view_dashboard', 'View Dashboard', 'Access dashboard'),
--   ('manage_farmers', 'Manage Farmers', 'Create and update farmers'),
--   ('manage_swine', 'Manage Swine Records', 'Create and update swine'),
--   ('manage_monitoring', 'Manage Monitoring', 'Create monitoring records');
