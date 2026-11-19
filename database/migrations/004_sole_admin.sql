-- 004_sole_admin.sql
-- Set divyanshusingh17102002@gmail.com as sole administrator of Gyanvatsala.
-- Demotes other previous administrators to user while preserving support accounts.

BEGIN;

-- 1. Demote other administrators to user role (preserving support)
UPDATE "user"
SET role = 'user'
WHERE role = 'admin'
  AND LOWER(email) != 'divyanshusingh17102002@gmail.com';

-- 2. Elevate divyanshusingh17102002@gmail.com to admin
UPDATE "user"
SET role = 'admin'
WHERE LOWER(email) = 'divyanshusingh17102002@gmail.com';

-- 3. Record audit trail entry
INSERT INTO admin_audit_logs (
    id,
    actor_id,
    actor_email,
    action,
    target_id,
    details
) VALUES (
    'audit_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12),
    (SELECT id FROM "user" WHERE LOWER(email) = 'divyanshusingh17102002@gmail.com'),
    'divyanshusingh17102002@gmail.com',
    'ROLE_PROMOTION_SOLE_ADMIN',
    (SELECT id FROM "user" WHERE LOWER(email) = 'divyanshusingh17102002@gmail.com'),
    '{"reason": "Designated sole administrator for Gyanvatsala platform", "previous_admins_demoted": true}'::jsonb
);

COMMIT;
