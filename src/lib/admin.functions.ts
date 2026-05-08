import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  if (!data) throw new Error('Nimate dovoljenj');
}

export const adminListOrders = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
    return data || [];
  });

export const adminListJobs = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await supabaseAdmin.from('jobs').select('*').order('created_at', { ascending: false }).limit(500);
    return data || [];
  });

export const adminListUsers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    const { data: roles } = await supabaseAdmin.from('user_roles').select('user_id, role');
    return (profiles || []).map((p: any) => ({
      ...p,
      roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
    }));
  });

export const adminToggleAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; makeAdmin: boolean }) => {
    z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(d);
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.makeAdmin) {
      await supabaseAdmin.from('user_roles').insert({ user_id: data.userId, role: 'admin' });
    } else {
      await supabaseAdmin.from('user_roles').delete().eq('user_id', data.userId).eq('role', 'admin');
    }
    return { ok: true };
  });

const jobStatusSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['active', 'completed', 'cancelled', 'pending_payment']),
});

export const adminUpdateJobStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string; status: 'active' | 'completed' | 'cancelled' | 'pending_payment' }) => {
    return jobStatusSchema.parse(d);
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from('jobs').update({ status: data.status }).eq('id', data.jobId);
    return { ok: true };
  });

export const claimFirstAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    if (existing && existing.length > 0) {
      throw new Error('Admin že obstaja');
    }
    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: context.userId, role: 'admin' });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const hasAnyAdmin = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    return { exists: !!(data && data.length > 0) };
  });

