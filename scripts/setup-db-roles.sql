-- ==============================================================================
-- BalanceVault: PostgreSQL Role Separation & First-Admin Bootstrap Security Model
-- ==============================================================================
-- Resolves Neon / Cloud Postgres SQLSTATE 42501 permission issue.
-- Instead of altering cloud-managed superusers or granting unsafe ALTER ROLE privileges,
-- we use role membership with SET ROLE and a SECURITY DEFINER function.
-- ==============================================================================

-- 1. Create Application Database Roles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bv_app_role') THEN
        CREATE ROLE bv_app_role NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bootstrap_operator') THEN
        CREATE ROLE bootstrap_operator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bv_auditor') THEN
        CREATE ROLE bv_auditor NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;
END $$;

-- 2. Grant table permissions to Application Role (Least Privilege)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bv_app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bv_app_role;

-- Auditor Role: Strictly Read-Only access to audit tables and ledger transactions
GRANT SELECT ON TABLE public.audit_logs TO bv_auditor;
GRANT SELECT ON TABLE public.transactions TO bv_auditor;
GRANT SELECT ON TABLE public.admin_bootstrap_logs TO bv_auditor;

-- 3. Security Definer Function for First-Admin Bootstrap
-- Executed with privileges of the function creator (bv_owner / schema owner),
-- allowing the bootstrap_operator role to securely provision the initial admin
-- without requiring global role administration or superuser privileges.
CREATE OR REPLACE FUNCTION fn_bootstrap_first_admin(
    p_email TEXT,
    p_password_hash TEXT,
    p_full_name TEXT
)
RETURNS TABLE (
    admin_id TEXT,
    admin_email TEXT,
    admin_role TEXT,
    status_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_admin_count INT;
    v_new_id TEXT;
    v_checksum TEXT;
    v_timestamp TIMESTAMPTZ := clock_timestamp();
BEGIN
    -- Guard Clause: Ensure this bootstrap can ONLY run if no active admin exists
    SELECT COUNT(*) INTO v_existing_admin_count FROM users WHERE role = 'ADMIN';

    IF v_existing_admin_count > 0 THEN
        -- Record audit attempt of redundant bootstrap
        INSERT INTO admin_bootstrap_logs (id, "operatorRole", "adminEmail", "executionMethod", "pgRoleUsed", success, "errorMessage", "timestamp")
        VALUES (
            gen_random_uuid()::text,
            current_user,
            p_email,
            'SET_ROLE_SECURITY_DEFINER',
            current_role,
            FALSE,
            'Bootstrap rejected: Admin already exists in system',
            v_timestamp
        );

        RAISE EXCEPTION 'First administrator already bootstrapped. Subsequent admin accounts must be created through admin portal.'
            USING ERRCODE = 'BV001';
    END IF;

    -- Generate UUID for the new admin
    v_new_id := gen_random_uuid()::text;

    -- Insert first administrator
    INSERT INTO users (id, email, "passwordHash", "fullName", role, status, "createdAt", "updatedAt")
    VALUES (v_new_id, p_email, p_password_hash, p_full_name, 'ADMIN', 'ACTIVE', v_timestamp, v_timestamp);

    -- Compute checksum for audit log entry
    v_checksum := encode(digest(v_new_id || p_email || 'ADMIN_BOOTSTRAP' || v_timestamp::text, 'sha256'), 'hex');

    -- Insert immutably into Audit Log
    INSERT INTO audit_logs (id, "actorId", "actorRole", action, "entityType", "entityId", "metadataJson", checksum, "timestamp")
    VALUES (
        gen_random_uuid()::text,
        v_new_id,
        'SYSTEM_BOOTSTRAP',
        'ADMIN_BOOTSTRAP',
        'USER',
        v_new_id,
        json_build_object('method', 'fn_bootstrap_first_admin', 'operator', current_user, 'email', p_email)::text,
        v_checksum,
        v_timestamp
    );

    -- Log successful bootstrap execution
    INSERT INTO admin_bootstrap_logs (id, "operatorRole", "adminEmail", "executionMethod", "pgRoleUsed", success, "errorMessage", "timestamp")
    VALUES (
        gen_random_uuid()::text,
        current_user,
        p_email,
        'SET_ROLE_SECURITY_DEFINER',
        current_role,
        TRUE,
        NULL,
        v_timestamp
    );

    -- Return the result row
    RETURN QUERY SELECT v_new_id, p_email, 'ADMIN'::TEXT, 'First administrator initialized successfully'::TEXT;
END;
$$;

-- 4. Grant Execute Permission on Bootstrap Function to bootstrap_operator
GRANT EXECUTE ON FUNCTION fn_bootstrap_first_admin(TEXT, TEXT, TEXT) TO bootstrap_operator;

-- 5. Helper verification query
COMMENT ON FUNCTION fn_bootstrap_first_admin IS 'Secure bootstrap function for initial BalanceVault admin. Guarded against multiple executions.';

