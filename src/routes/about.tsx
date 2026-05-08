import { createFileRoute, Link } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'O nas — Worki' }] }),
  component: () => (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-5"><ArrowLeft className="h-4 w-4" /> Nazaj</Link>
        <div className="bg-gradient-to-br from-[#070D1A] to-[#1D3461] text-white rounded-3xl p-10 mb-6 text-center">
          <h1 className="text-3xl font-extrabold mb-2">O podjetju Worki</h1>
          <p className="text-white/60">Gradimo najpreprostejše slovensko tržišče za majhna dela</p>
        </div>
        <div className="space-y-3">
          <Card title="Naša zgodba">
            <p>Worki je bil rojen v Ljubljani leta 2024. Nastali smo iz enostavne frustracije — iskanje zanesljive pomoči pri majhnih opravilih je bilo težje, kot bi moralo biti.</p>
          </Card>
          <Card title="Naše številke">
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[['1.200+','Objavljenih del'],['430+','Aktivnih delavcev'],['8','Mest']].map(([n,l]) => (
                <div key={l} className="bg-primary/10 rounded-xl p-4 text-center"><div className="text-2xl font-extrabold text-primary">{n}</div><div className="text-xs text-primary/80 font-semibold">{l}</div></div>
              ))}
            </div>
          </Card>
          <Card title="Kontakt">
            <p>📧 <strong>zdravo@worki.si</strong></p>
            <p>📍 Trubarjeva 50, 1000 Ljubljana, Slovenija</p>
          </Card>
        </div>
      </div>
    </Layout>
  ),
});

function Card({ title, children }: any) {
  return <div className="bg-card border border-border rounded-2xl p-6"><h2 className="font-extrabold mb-2">{title}</h2><div className="text-sm text-muted-foreground space-y-1">{children}</div></div>;
}
