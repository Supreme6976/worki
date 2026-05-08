import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthDialog } from './AuthDialog';
import { Button } from './ui/button';
import { Briefcase, LogOut, Settings, Shield, User as UserIcon } from 'lucide-react';
import { PaymentTestModeBanner } from './PaymentTestModeBanner';
import workiLogo from '@/assets/worki-logo.png';
import { LogoSpinnerOverlay } from './LogoSpinner';

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const nav = useNavigate();

  const open = (m: 'login' | 'register') => { setAuthMode(m); setAuthOpen(true); };
  const logout = async () => { await supabase.auth.signOut(); nav({ to: '/' }); };

  return (
    <div className="min-h-screen flex flex-col">
      <PaymentTestModeBanner />
      <nav className="bg-nav text-nav-foreground sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-15 flex items-center gap-2 py-3">
          <Link to="/" className="mr-3 flex items-center">
            <img src={workiLogo} alt="Worki logo" className="h-12 w-auto" />
          </Link>
          <div className="hidden md:flex gap-1 flex-1">
            <NavLink to="/">Domov</NavLink>
            <NavLink to="/browse">Išči dela</NavLink>
            <NavLink to="/post">Objavi delo</NavLink>
            <NavLink to="/about">O nas</NavLink>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold bg-brand/20 border border-brand/30 px-2.5 py-1.5 rounded-md hover:bg-brand/30">
                    <Shield className="h-3 w-3" /> Admin
                  </Link>
                )}
                <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15">
                  <div className="h-7 w-7 rounded-full bg-brand text-brand-foreground grid place-items-center text-xs font-bold overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || <UserIcon className="h-3 w-3" />
                    )}
                  </div>
                  <span className="text-sm font-semibold hidden sm:block">{profile?.name?.split(' ')[0] || 'Profil'}</span>
                </Link>
                <Link to="/settings" className="text-xs font-semibold bg-white/10 border border-white/20 px-2 py-1.5 rounded-md hover:bg-white/20 flex items-center gap-1" title="Nastavitve">
                  <Settings className="h-3 w-3" />
                </Link>
                <button onClick={logout} className="text-xs font-semibold bg-white/10 border border-white/20 px-2.5 py-1.5 rounded-md hover:bg-white/20 flex items-center gap-1">
                  <LogOut className="h-3 w-3" /> <span className="hidden sm:inline">Odjava</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => open('register')} className="text-xs font-bold border-2 border-brand text-brand px-3 py-1.5 rounded-md hover:bg-brand hover:text-brand-foreground transition">Registracija</button>
                <button onClick={() => open('login')} className="text-xs font-bold bg-brand text-brand-foreground px-3 py-1.5 rounded-md hover:bg-brand/90">Prijava</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-nav text-nav-foreground/70 border-t border-white/5 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <div>
            <img src={workiLogo} alt="Worki" className="h-10 w-auto" />
            <div className="text-xs mt-1">© {new Date().getFullYear()} Worki d.o.o. · Slovenija</div>
          </div>
          <div className="flex gap-4 text-sm">
            <Link to="/about" className="hover:text-white">O nas</Link>
            <Link to="/browse" className="hover:text-white">Dela</Link>
            <Link to="/privacy" className="hover:text-white">Zasebnost</Link>
          </div>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} setMode={setAuthMode} />
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-sm font-semibold px-3 py-1.5 rounded-md text-white/85 hover:bg-white/10 hover:text-white"
      activeProps={{ className: '!bg-brand !text-brand-foreground' }}
      activeOptions={{ exact: to === '/' }}
    >
      {children}
    </Link>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-nav text-nav-foreground border-b border-white/10 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-white/60 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  if (loading) return <LogoSpinnerOverlay />;
  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="text-lg font-semibold mb-3">Za nadaljevanje se moraš prijaviti</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => { setMode('login'); setOpen(true); }}>Prijava</Button>
          <Button variant="outline" onClick={() => { setMode('register'); setOpen(true); }}>Registracija</Button>
        </div>
        <AuthDialog open={open} onOpenChange={setOpen} mode={mode} setMode={setMode} />
      </div>
    );
  }
  return <>{children}</>;
}
