import { createFileRoute, Link } from '@tanstack/react-router';
import { Layout, AuthGate } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { adminListOrders, adminListJobs, adminListUsers, adminToggleAdmin, adminUpdateJobStatus } from '@/lib/admin.functions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Admin — Worki' }] }),
  component: () => <Layout><AuthGate><AdminPanel /></AuthGate></Layout>,
});

function downloadCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Nalaganje...</div>;
  if (!isAdmin) return <div className="p-8 text-center"><p>Nimaš dovoljenj za dostop do admin panela.</p><Link to="/" className="text-primary underline mt-2 inline-block">← Domov</Link></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Admin panel</h1>
      <Tabs defaultValue="orders">
        <TabsList><TabsTrigger value="orders">Naročila</TabsTrigger><TabsTrigger value="jobs">Dela</TabsTrigger><TabsTrigger value="users">Uporabniki</TabsTrigger></TabsList>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="jobs"><JobsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTab() {
  const fn = useServerFn(adminListOrders);
  const { data } = useQuery({ queryKey: ['admin-orders'], queryFn: () => fn({}) });
  return (
    <div>
      <div className="flex justify-between items-center my-4"><p className="text-sm text-muted-foreground">{data?.length || 0} naročil</p><Button size="sm" variant="outline" onClick={() => downloadCSV(data || [], 'narocila.csv')}>📥 Izvozi CSV</Button></div>
      <div className="overflow-x-auto bg-card border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase"><tr><th className="p-3 text-left">Datum</th><th className="text-left">Stranka</th><th className="text-left">Email</th><th className="text-left">Tip</th><th className="text-right">Znesek</th><th className="text-left">Status</th></tr></thead>
          <tbody>
            {data?.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString('sl-SI')}</td>
                <td>{o.customer_name}</td><td className="text-xs">{o.customer_email}</td><td className="text-xs">{o.order_type}</td>
                <td className="text-right font-semibold">{(o.amount_cents / 100).toFixed(2)} €</td>
                <td><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${o.status === 'paid' ? 'bg-green-100 text-green-800' : o.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-slate-200'}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobsTab() {
  const fn = useServerFn(adminListJobs);
  const upd = useServerFn(adminUpdateJobStatus);
  const { data, refetch } = useQuery({ queryKey: ['admin-jobs'], queryFn: () => fn({}) });
  const change = async (id: string, status: any) => { await upd({ data: { jobId: id, status } }); toast.success('Posodobljeno'); refetch(); };
  return (
    <div>
      <div className="flex justify-between items-center my-4"><p className="text-sm text-muted-foreground">{data?.length || 0} del</p><Button size="sm" variant="outline" onClick={() => downloadCSV(data || [], 'dela.csv')}>📥 Izvozi CSV</Button></div>
      <div className="overflow-x-auto bg-card border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase"><tr><th className="p-3 text-left">Naslov</th><th className="text-left">Mesto</th><th className="text-left">Kategorija</th><th className="text-right">Cena</th><th className="text-left">Status</th><th></th></tr></thead>
          <tbody>
            {data?.map((j: any) => (
              <tr key={j.id} className="border-t border-border">
                <td className="p-3"><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="hover:underline font-semibold">{j.title}</Link></td>
                <td>{j.city}</td><td className="text-xs">{j.category}</td>
                <td className="text-right">{(j.price_cents / 100).toFixed(2)} €</td>
                <td><span className="text-xs font-bold">{j.status}</span></td>
                <td className="p-2"><select className="text-xs border rounded px-1 py-0.5 bg-background" value={j.status} onChange={(e) => change(j.id, e.target.value)}><option>pending_payment</option><option>active</option><option>completed</option><option>cancelled</option></select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const fn = useServerFn(adminListUsers);
  const tog = useServerFn(adminToggleAdmin);
  const { data, refetch } = useQuery({ queryKey: ['admin-users'], queryFn: () => fn({}) });
  const toggle = async (uid: string, isAdmin: boolean) => { await tog({ data: { userId: uid, makeAdmin: !isAdmin } }); toast.success('Posodobljeno'); refetch(); };
  return (
    <div>
      <div className="flex justify-between items-center my-4"><p className="text-sm text-muted-foreground">{data?.length || 0} uporabnikov</p><Button size="sm" variant="outline" onClick={() => downloadCSV(data || [], 'uporabniki.csv')}>📥 Izvozi CSV</Button></div>
      <div className="overflow-x-auto bg-card border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase"><tr><th className="p-3 text-left">Ime</th><th className="text-left">Vloga</th><th className="text-left">Telefon</th><th className="text-left">Vloge</th><th></th></tr></thead>
          <tbody>
            {data?.map((u: any) => {
              const isAdminUser = u.roles?.includes('admin');
              return (
                <tr key={u.user_id} className="border-t border-border">
                  <td className="p-3 font-semibold">{u.name}</td>
                  <td>{u.role === 'client' ? 'Naročnik' : 'Delavec'}</td>
                  <td className="text-xs">{u.phone || '—'}</td>
                  <td>{isAdminUser && <span className="bg-primary/15 text-primary text-xs font-bold px-2 py-0.5 rounded-full">ADMIN</span>}</td>
                  <td className="p-2"><Button size="sm" variant={isAdminUser ? 'destructive' : 'outline'} onClick={() => toggle(u.user_id, isAdminUser)}>{isAdminUser ? 'Odstrani admin' : 'Naredi admin'}</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
