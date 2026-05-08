import { createFileRoute, Link } from '@tanstack/react-router';
import { Layout, AuthGate } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { claimFirstAdmin, hasAnyAdmin } from '@/lib/admin.functions';
import { toast } from 'sonner';
import { Settings, Shield } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [{ title: 'Moj profil — Worki' }] }),
  component: () => <Layout><AuthGate><Dashboard /></AuthGate></Layout>,
});

function Dashboard() {
  const { user, profile, isAdmin, reload } = useAuth();
  const qc = useQueryClient();
  const checkAdmin = useServerFn(hasAnyAdmin);
  const claim = useServerFn(claimFirstAdmin);

  const { data: adminCheck } = useQuery({
    queryKey: ['has-any-admin'],
    queryFn: () => checkAdmin(),
  });

  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: async () => {
      toast.success('Postal si admin! Osveži stran.');
      await reload();
      qc.invalidateQueries({ queryKey: ['has-any-admin'] });
    },
    onError: (e: any) => toast.error(e.message || 'Napaka'),
  });

  const showClaim = !isAdmin && adminCheck && !adminCheck.exists;

  const { data: myJobs } = useQuery({
    queryKey: ['my-jobs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*').eq('posted_by', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
  });
  const { data: myApps } = useQuery({
    queryKey: ['my-apps', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('applications').select('*, jobs(title, city)').eq('applicant_user_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Pozdravljen, {profile?.name?.split(' ')[0]}!</h1>
          <p className="text-sm text-muted-foreground">Vloga: <span className="font-semibold text-foreground">{profile?.role === 'client' ? 'Naročnik' : 'Delavec'}</span></p>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/settings"><Settings className="h-4 w-4 mr-1" /> Nastavitve</Link></Button>
      </div>

      {showClaim && (
        <div className="bg-brand/10 border-2 border-brand/30 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold flex items-center gap-2"><Shield className="h-4 w-4" /> Postani prvi admin</h2>
            <p className="text-sm text-muted-foreground mt-1">Še ni nobenega administratorja. Klikni gumb in postani prvi.</p>
          </div>
          <Button onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
            {claimMut.isPending ? 'Pošiljam...' : 'Postani admin'}
          </Button>
        </div>
      )}

      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Moje objave del ({myJobs?.length || 0})</h2>
          <Button asChild size="sm"><Link to="/post">+ Novo</Link></Button>
        </div>
        <div className="space-y-2">
          {myJobs?.map((j: any) => (
            <Link key={j.id} to="/jobs/$jobId" params={{ jobId: j.id }} className="block bg-card border border-border rounded-xl p-4 hover:border-primary">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold">{j.title}</h3>
                  <p className="text-xs text-muted-foreground">{j.city} · {j.category} · {(j.price_cents / 100).toFixed(2)} €</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${j.status === 'active' ? 'bg-green-100 text-green-800' : j.status === 'pending_payment' ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-700'}`}>{j.status}</span>
              </div>
            </Link>
          )) || <p className="text-muted-foreground text-sm">Še nimaš objav.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Moje prijave ({myApps?.length || 0})</h2>
        <div className="space-y-2">
          {myApps?.map((a: any) => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold">{a.jobs?.title}</h3>
              <p className="text-xs text-muted-foreground">{a.jobs?.city} · poslano {new Date(a.created_at).toLocaleDateString('sl-SI')}</p>
              <p className="text-sm mt-2">{a.message}</p>
            </div>
          )) || <p className="text-muted-foreground text-sm">Še nisi poslal prijave.</p>}
        </div>
      </section>
    </div>
  );
}
