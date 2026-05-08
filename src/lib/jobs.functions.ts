import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { type StripeEnv, createStripeClient } from './stripe.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const JobInput = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(5000),
  city: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  job_date: z.string().optional().nullable(),
  job_time: z.string().optional().nullable(),
  price_cents: z.number().int().min(100).max(1000000),
  contact_name: z.string().trim().min(2).max(120),
  contact_info: z.string().trim().min(3).max(200),
});

export const createJobAndCheckout = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    job: z.infer<typeof JobInput>;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    JobInput.parse(data.job);
    if (data.environment !== 'sandbox' && data.environment !== 'live') throw new Error('env');
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const stripe = createStripeClient(data.environment);

    // 1. Create pending job
    const { data: job, error: jErr } = await supabaseAdmin
      .from('jobs')
      .insert({
        ...data.job,
        job_date: data.job.job_date || null,
        job_time: data.job.job_time || null,
        posted_by: userId,
        status: 'pending_payment',
      })
      .select('id')
      .single();
    if (jErr || !job) throw new Error(jErr?.message || 'Napaka pri kreiranju dela');

    // 2. Create pending order
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        customer_name: data.job.contact_name,
        customer_email: data.job.contact_info.includes('@') ? data.job.contact_info : 'noreply@worki.si',
        product_name: 'Objava dela',
        amount_cents: 200,
        currency: 'eur',
        status: 'pending',
        job_id: job.id,
        order_type: 'job_posting_fee',
      })
      .select('id')
      .single();
    if (oErr || !order) throw new Error('Napaka pri kreiranju naročila');

    // 3. Stripe session
    const prices = await stripe.prices.list({ lookup_keys: ['job_posting_fee_once'] });
    if (!prices.data.length) throw new Error('Cena ni najdena');

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      mode: 'payment',
      ui_mode: 'embedded_page',
      return_url: data.returnUrl,
      metadata: { order_id: order.id, job_id: job.id, userId },
    });

    await supabaseAdmin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    return { clientSecret: session.client_secret, jobId: job.id };
  });

export const applyToJob = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    jobId: string;
    name: string;
    contact: string;
    experience?: string;
    message: string;
  }) => {
    z.object({
      jobId: z.string().uuid(),
      name: z.string().trim().min(2).max(120),
      contact: z.string().trim().min(3).max(200),
      experience: z.string().max(500).optional(),
      message: z.string().trim().min(5).max(2000),
    }).parse(data);
    return data;
  })
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from('applications').insert({
      job_id: data.jobId,
      applicant_user_id: context.userId,
      applicant_name: data.name,
      applicant_contact: data.contact,
      experience: data.experience || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
