import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { applyToJob } from '@/lib/jobs.functions';
import { useState } from 'react';
import { MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/jobs/$jobId')({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user, profile } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('id, title, description, city, category, job_date, job_time, price_cents, currency, contact_name, status, posted_by, created_at, updated_at').eq('id', jobId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Layout><div className="p-12 text-center text-muted-foreground">Nalaganje...</div></Layout>;
  if (!job) return <Layout><div className="p-12 text-center"><p>Delo ni najdeno.</p><Link to="/browse" className="text-primary underline mt-3 inline-block">← Nazaj</Link></div></Layout>;

  const isOwner = user?.id === job.posted_by;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-5"><ArrowLeft className="h-4 w-4" /> Nazaj na iskanje</Link>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-start gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">{job.category}</span>
            <span className="text-3xl font-extrabold text-primary">{(job.price_cents / 100).toLocaleString('sl-SI', { style: 'currency', currency: job.currency.toUpperCase() })}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-3">{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{job.city}</span>
            {job.job_date && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(job.job_date).toLocaleDateString('sl-SI')}</span>}
            {job.job_time && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{job.job_time.slice(0, 5)}</span>}
          </div>
          <div className="prose max-w-none mb-6">
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wide mb-2">Opis dela</h3>
            <p className="whitespace-pre-wrap text-foreground/90">{job.description}</p>
          </div>
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wide mb-2">Naročnik</h3>
            <p className="font-semibold">{job.contact_name}</p>
            {!isOwner && profile?.role !== 'client' && (
              <Button size="lg" className="mt-5 w-full md:w-auto" onClick={() => setApplyOpen(true)} disabled={!user}>
                {user ? 'Prijavi se na delo →' : 'Prijavi se za prijavo'}
              </Button>
            )}
            {isOwner && <p className="text-sm text-muted-foreground mt-3">To je tvoje delo.</p>}
          </div>
        </div>
      </div>
      <ApplyDialog open={applyOpen} onOpenChange={setApplyOpen} jobId={job.id} jobTitle={job.title} defaultName={profile?.name || ''} />
    </Layout>
  );
}

function ApplyDialog({ open, onOpenChange, jobId, jobTitle, defaultName }: any) {
  const [name, setName] = useState(defaultName);
  const [contact, setContact] = useState('');
  const [experience, setExperience] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const apply = useServerFn(applyToJob);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apply({ data: { jobId, name, contact, experience, message } });
      toast.success('Prijava poslana!');
      onOpenChange(false);
      setMessage(''); setExperience('');
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Prijava na delo</DialogTitle></DialogHeader>
        <div className="bg-primary/10 text-primary p-3 rounded-md text-sm font-semibold mb-3">{jobTitle}</div>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Tvoje ime *</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Telefon ali e-pošta *</Label><Input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="041 123 456 ali ti@email.si" /></div>
          <div><Label>Tvoje izkušnje</Label><Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="npr. 3 leta izkušenj" /></div>
          <div><Label>Kratko sporočilo *</Label><Textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Zakaj si primeren za to delo?" /></div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Pošiljanje...' : 'Pošlji prijavo →'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
