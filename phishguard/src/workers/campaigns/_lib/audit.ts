// workers/campaigns/_lib/audit.ts
import { createAdminClient } from '../../_lib/supabase-admin';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'launch' | 'pause' | 'restore';

export interface AuditLogInput {
  companyId: string;
  userId?: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(input: AuditLogInput, env: Env): Promise<void> {
  const supabase = createAdminClient(env);

  await supabase.from('audit_logs').insert({
    company_id: input.companyId,
    user_id: input.userId ?? null,
    action: input.action,
    table_name: input.tableName,
    record_id: input.recordId,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    created_at: new Date().toISOString(),
  });
}
