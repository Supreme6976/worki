import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { JobCard } from '@/components/JobCard';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBroom,
  faBoxesStacked,
  faScrewdriverWrench,
  faSeedling,
  faCouch,
  faCarSide,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Worki — Najdi pomoč. Najdi delo.' },
      { name: 'description', content: 'Worki povezuje ljudi, ki potrebujejo pomoč pri majhnih delih, z delavci po vsej Sloveniji.' },
    ],
  }),
  component: Home,
});

const cats = [
  { name: 'Čiščenje', icon: faBroom },
  { name: 'Selitev', icon: faBoxesStacked },
  { name: 'Pomoč doma', icon: faScrewdriverWrench },
  { name: 'Vrtnarstvo', icon: faSeedling },
  { name: 'Montaža pohištva', icon: faCouch },
  { name: 'Dostava', icon: faCarSide },
  { name: 'Ostalo', icon: faWandMagicSparkles },
];

function Home() {
  const { data: jobs } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('id, title, description, city, category, job_date, job_time, price_cents, currency, contact_name, status, posted_by, created_at, updated_at').eq('status', 'active').order('created_at', { ascending: false }).limit(6);
      return data || [];
    },
  });

  const { data: jobsCount } = useQuery({
    queryKey: ['active-jobs-count'],
    queryFn: async () => {
      const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active');
      return count ?? 0;
    },
  });

  return (
    <Layout>
      <div className="page-bg relative overflow-hidden text-white">
        <div className="page-aurora">
          <div className="aurora-blob aurora-blob-1" style={{ top: '-160px', left: '-120px' }} />
          <div className="aurora-blob aurora-blob-2" style={{ top: '20%', right: '-140px' }} />
          <div className="aurora-blob aurora-blob-3" style={{ top: '55%', left: '20%' }} />
          <div className="aurora-blob aurora-blob-1" style={{ top: '80%', right: '-120px', width: '500px', height: '500px' }} />
          <div className="aurora-blob aurora-blob-2" style={{ bottom: '-200px', left: '10%' }} />
          <div className="hero-grid" />
          <div className="hero-noise" />
          {Array.from({ length: 32 }).map((_, i) => (
            <span
              key={i}
              className="particle"
              style={{
                left: `${(i * 3.1) % 100}%`,
                bottom: `${(i * 11) % 100}%`,
                animationDuration: `${22 + (i % 7) * 4}s`,
                animationDelay: `${(i * 1.3) % 18}s`,
                opacity: 0.35 + ((i % 5) * 0.1),
                transform: `scale(${0.6 + (i % 4) * 0.25})`,
              }}
            />
          ))}
        </div>

        <section className="relative overflow-hidden py-28 md:py-36 px-4 text-center">
          <div className="aurora-pulse" />
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="relative">
              <div className="heading-spotlight" />
              <span className="relative inline-block glass rounded-full px-4 py-1.5 text-xs font-semibold mb-8 animate-fade-up text-white/90">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 mr-2 align-middle shadow-[0_0_8px_rgba(120,170,255,0.9)]" />
                Slovensko tržišče za majhna dela
              </span>
              <h1 className="relative font-display text-5xl md:text-7xl font-bold leading-[1.02] mb-7 animate-fade-up delay-100 tracking-tight">
                Najdi pomoč.<br />
                <span className="text-gradient text-glow">Najdi delo.</span>{' '}
                <span className="text-white/95">Hitro.</span>
              </h1>
            </div>
            <p className="text-white/70 text-base md:text-xl mb-10 max-w-xl mx-auto leading-relaxed animate-fade-up delay-200">
              Worki povezuje ljudi, ki potrebujejo pomoč pri majhnih delih, z delavci po vsej Sloveniji.
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-fade-up delay-300">
              <Button asChild size="lg" className="glass-btn-primary font-semibold h-12 px-7 rounded-xl">
                <Link to="/post">Objavi delo</Link>
              </Button>
              <Button asChild size="lg" className="glass-btn h-12 px-7 rounded-xl font-semibold">
                <Link to="/browse">Išči delo</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="relative py-20 px-4 text-center">
          <div className="max-w-6xl mx-auto relative z-10 animate-fade-in-soft">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-gradient text-glow">Kako deluje Worki</h2>
            <p className="text-white/70 mb-10">Trije enostavni koraki</p>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { n: 1, t: 'Objavi delo', d: 'Opiši, kaj potrebuješ, nastavi ceno. Objava stane le 2 €.' },
                { n: 2, t: 'Prejmi prijave', d: 'Delavci v tvoji bližini se prijavijo. Preglej njihove izkušnje.' },
                { n: 3, t: 'Opravi delo', d: 'Izberi najboljšega kandidata in opravi delo.' },
              ].map((s, i) => (
                <div key={s.n} className="glass card-lift rounded-2xl p-7 text-left animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white font-bold grid place-items-center mb-4 border border-white/20 shadow-[0_0_20px_rgba(140,180,255,0.4)]">{s.n}</div>
                  <h3 className="font-display text-xl font-semibold mb-2 text-white">{s.t}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-20 px-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={`cat-p-${i}`}
              className="particle"
              style={{
                left: `${(i * 5.7) % 100}%`,
                bottom: `-10px`,
                animationDuration: `${14 + (i % 6) * 3}s`,
                animationDelay: `${(i * 0.9) % 10}s`,
                opacity: 0.4 + ((i % 4) * 0.12),
                transform: `scale(${0.6 + (i % 4) * 0.25})`,
              }}
            />
          ))}
          <div className="max-w-6xl mx-auto relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-10 text-center text-gradient text-glow">Išči po kategorijah</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {cats.map((c, i) => (
                <Link
                  key={c.name}
                  to="/browse"
                  search={{ category: c.name }}
                  className="glass card-lift rounded-xl p-4 text-center animate-fade-up hover:bg-white/10"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <FontAwesomeIcon icon={c.icon} className="text-2xl mb-2 text-blue-300" />
                  <div className="text-xs font-semibold text-white/90">{c.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden max-w-6xl mx-auto py-20 px-4 z-10">
          {Array.from({ length: Math.min(jobsCount ?? 0, 60) }).map((_, i) => (
            <span
              key={`job-p-${i}`}
              className="particle"
              style={{
                left: `${(i * 6.1) % 100}%`,
                bottom: `-10px`,
                animationDuration: `${16 + (i % 7) * 3}s`,
                animationDelay: `${(i * 0.7) % 14}s`,
                opacity: 0.4 + ((i % 4) * 0.12),
                transform: `scale(${0.6 + (i % 4) * 0.25})`,
              }}
            />
          ))}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient text-glow">Izpostavljena dela</h2>
              <p className="text-sm text-white/60 mt-1">Najnovejše priložnosti</p>
            </div>
            <Button asChild className="glass-btn h-10 px-5 rounded-xl font-semibold"><Link to="/browse">Vsa dela →</Link></Button>
          </div>
          {jobs && jobs.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((j: any) => <JobCard key={j.id} job={j} />)}
            </div>
          ) : (
            <p className="text-white/60 text-center py-12">Trenutno ni aktivnih del. Bodi prvi, ki objavi!</p>
          )}
        </section>
      </div>
    </Layout>
  );
}
