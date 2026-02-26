import { Link, useNavigate } from 'react-router-dom'
import { Wrench, MapPin, Zap, Shield, ChevronRight, Bell, User, LogOut, X, Gauge, Cog, Droplet, Hammer } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useScrollHide } from '../hooks/useScrollHide'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { appName } from '../lib/appConfig'
import LandingVendorsMap from '../components/LandingVendorsMap'
import Footer from '../components/Footer'

// Custom mechanical SVG icon for mobile menu
const MechanicalMenuIcon = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Piston block */}
    <rect x="4" y="4" width="8" height="10" rx="2" />
    <rect x="5.5" y="2" width="5" height="3" rx="1" />
    <circle cx="8" cy="9" r="2" />

    {/* Connecting rod */}
    <path d="M12 9h4l3 3" />

    {/* Small gear */}
    <circle cx="19" cy="15" r="3" />
    <path d="M19 12v1M19 18v1M16 15h1M22 15h1" />
  </svg>
)

export default function LandingPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isHeaderVisible = useScrollHide()
  const [vendors, setVendors] = useState<any[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'vendor')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
        setVendors(data || [])
      } catch (err) {
        console.error('Error loading vendors:', err)
      }
    }
    loadVendors()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px'}} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-transform duration-300 ease-out" style={{transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)'}}>
        <div className="header-bar">
          <div className="site-container py-3">
            <div className="header-shell px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <Link to="/" className="flex items-center gap-2" aria-label={`${appName} home`}>
              <img src="/VWpartlogo.png" alt={`${appName} logo`} className="w-14 h-14 object-contain" />
              <span className="font-display font-bold text-xl">{appName}</span>
            </Link>
            {user ? (
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <div className="hidden md:flex items-center gap-3">
                  <Link to="/vendors" className="btn-secondary flex items-center gap-2 text-sm">
                    Vendors
                  </Link>
                  <Link to="/dashboard" className="btn-secondary flex items-center gap-2 text-sm">
                    <Bell size={16} /> Notifications
                  </Link>
                  <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-sm">
                    Dashboard <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                  <User size={14} className="text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-white leading-none">{profile?.full_name || 'Account'}</p>
                    <p className="text-xs text-brand-400 capitalize leading-none mt-0.5">{profile?.role}</p>
                  </div>
                  <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-white transition-colors" aria-label="Sign out">
                    <LogOut size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  className="md:hidden p-2.5 rounded-lg text-slate-200 hover:text-brand-300 hover:bg-slate-800/50 ring-1 ring-transparent hover:ring-brand-500/30 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95 group"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="Toggle menu"
                >
                  {menuOpen ? (
                    <X size={22} className="transition-transform duration-200 group-hover:rotate-6" />
                  ) : (
                    <MechanicalMenuIcon size={22} className="transition-transform duration-200 group-hover:rotate-6" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/vendors" className="btn-secondary flex items-center gap-2 text-sm">
                  Vendors
                </Link>
                <Link to="/auth" className="btn-primary flex items-center gap-2 text-sm">
                  Get Started <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
          </div>
        </div>
      </nav>
      {user && menuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-50 border-t border-brand-500/30 bg-gradient-to-b from-slate-900/98 to-slate-950/95 backdrop-blur-md shadow-lg">
          <div className="site-container py-5">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Link
                  to="/vendors"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 text-slate-200 hover:text-white hover:bg-slate-800/60"
                >
                  <MapPin size={18} /> Vendors
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 text-slate-200 hover:text-white hover:bg-slate-800/60"
                >
                  <Bell size={18} /> Notifications
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 text-slate-200 hover:text-white hover:bg-slate-800/60"
                >
                  <Zap size={18} /> Dashboard
                </Link>
              </div>

              <div className="h-px bg-gradient-to-r from-slate-800 via-brand-500/30 to-slate-800"></div>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 text-slate-200 hover:text-white hover:bg-slate-800/60"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 site-container pt-32 sm:pt-36 pb-14 sm:pb-16 text-center">
        <div className="absolute inset-0 -z-10">
          <div className="hero-bg-layer hero-bg-1" />
          <div className="hero-bg-layer hero-bg-2" />
          <div className="hero-bg-layer hero-bg-3" />
          <div className="hero-bg-layer hero-bg-4" />
          <div className="hero-bg-layer hero-bg-5" />
          <div className="hero-bg-layer hero-bg-6" />
          <div className="hero-bg-layer hero-bg-7" />
          <div className="hero-bg-layer hero-bg-8" />
          <div className="hero-bg-layer hero-bg-9" />
          <div className="hero-bg-layer hero-bg-10" />
          <div className="hero-bg-overlay" />
        </div>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[80%] h-24 bg-gradient-to-r from-brand-500/0 via-brand-500/15 to-brand-500/0 blur-2xl animate-shimmer" />
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-400 mb-8 font-mono">
          <Zap size={14} /> Auto Parts Marketplace
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-7xl leading-tight mb-6">
          Find Auto Parts<br />
          <span className="text-brand-500">Near You</span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Connect with local automobile part vendors. Post a request, get responses from nearby vendors, close the deal.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create-request" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
            Post a Request →
          </Link>
          <Link to="/auth?mode=vendor" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            Join as Vendor
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Avg. Response', value: '12 min' },
            { label: 'Verified Vendors', value: '2,400+' },
            { label: 'Cities Covered', value: '120+' }
          ].map(stat => (
            <div key={stat.label} className="card bg-slate-900/70 border-slate-800/80 text-center">
              <div className="font-display font-bold text-2xl text-white">{stat.value}</div>
              <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Strip */}
      <section className="relative z-10 site-container pb-20">
        <div className="card bg-slate-900/70 border-slate-800/80 relative overflow-hidden">
          <div className="absolute inset-0 industry-backdrop animate-shimmer" />
          <div className="absolute -bottom-8 left-6 right-6 h-2 road-line animate-shimmer opacity-60" />
          <div className="relative">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-display font-semibold text-lg">Automotive Network</h3>
              <span className="text-xs text-slate-500">Trusted by workshops and suppliers</span>
            </div>
            <div className="marquee">
              <div className="marquee-track">
                {[
                  'Bosch', 'Minda', 'Mahindra', 'Bajaj', 'TVS', 'Hero', 'Maruti', 'Hyundai', 'Denso', 'Apollo',
                  'CEAT', 'MRF', 'Exide', 'Amaron', 'Shell', 'Castrol', 'ZF', 'Valeo', 'Continental', 'Hella',
                  'SKF', 'NGK', 'Rane', 'Schaeffler', 'Goodyear', 'Bridgestone', 'Michelin', 'Valeo', 'Eberspacher',
                  'Tata Motors', 'Ashok Leyland', 'Sundaram', 'Force', 'Yokohama', 'Gulf', 'Mobil'
                ].map((name, index) => (
                  <div key={`a-${name}-${index}`} className="brand-tile">
                    <span className="brand-dot" />
                    {name}
                  </div>
                ))}
                {[
                  'Bosch', 'Minda', 'Mahindra', 'Bajaj', 'TVS', 'Hero', 'Maruti', 'Hyundai', 'Denso', 'Apollo',
                  'CEAT', 'MRF', 'Exide', 'Amaron', 'Shell', 'Castrol', 'ZF', 'Valeo', 'Continental', 'Hella',
                  'SKF', 'NGK', 'Rane', 'Schaeffler', 'Goodyear', 'Bridgestone', 'Michelin', 'Valeo', 'Eberspacher',
                  'Tata Motors', 'Ashok Leyland', 'Sundaram', 'Force', 'Yokohama', 'Gulf', 'Mobil'
                ].map((name, index) => (
                  <div key={`b-${name}-${index}`} className="brand-tile">
                    <span className="brand-dot" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Genuine & OEM', desc: 'Source original parts with verified vendor profiles.' },
                { title: 'Live Availability', desc: 'Get instant responses based on real location radius.' },
                { title: 'Clear Status', desc: 'Track open, accepted, and closed requests in real time.' }
              ].map(item => (
                <div key={item.title} className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/70">
                  <div className="text-brand-400 text-sm font-semibold mb-1">{item.title}</div>
                  <div className="text-slate-400 text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 site-container pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Cog, title: 'Location-Based', desc: 'Find vendors within 5km, 10km, 50km or by city — only relevant vendors see your request.' },
            { icon: Gauge, title: 'Fast Responses', desc: 'Vendors accept or reject quickly. See who accepted and get their contact details instantly.' },
            { icon: Wrench, title: 'Privacy First', desc: "Vendors see your request details but not your contact info — until you close the deal." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center mb-4 animate-float-slow">
                <Icon size={20} className="text-brand-400" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 site-container pb-24">
        <h2 className="font-display font-bold text-3xl text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card border-brand-500/30">
            <div className="text-brand-500 font-mono text-xs font-semibold mb-4 uppercase tracking-widest">For Clients</div>
            {[
              { icon: Hammer, label: 'Post a request with part details & location' },
              { icon: MapPin, label: 'Vendors in your area receive the request' },
              { icon: Gauge, label: 'Accept their offer & view contact info' },
              { icon: Wrench, label: 'Close the request when done' }
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <step.icon size={18} className="text-brand-400" />
                </div>
                <div>
                  <div className="text-brand-400 text-xs font-mono font-bold mb-0.5">Step {i+1}</div>
                  <p className="text-slate-300 text-sm">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card border-blue-500/20">
            <div className="text-blue-400 font-mono text-xs font-semibold mb-4 uppercase tracking-widest">For Vendors</div>
            {[
              { icon: Cog, label: 'Register with your category & location' },
              { icon: Bell, label: 'Receive requests matching your area' },
              { icon: Wrench, label: 'Accept requests you can fulfill' },
              { icon: Shield, label: 'Client sees your contact details' }
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <step.icon size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-blue-400 text-xs font-mono font-bold mb-0.5">Step {i+1}</div>
                  <p className="text-slate-300 text-sm">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendors Map */}
      <section className="relative z-10 site-container pb-0">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl mb-3">
            Browse Registered <span className="text-brand-500">Vendors</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">Explore auto part vendors across India. Hover over markers to see details.</p>
        </div>
        {vendors.length > 0 ? (
          <div>
            <LandingVendorsMap vendors={vendors} />
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">Loading vendors...</div>
        )}
        <div className="text-center">
          <Link to="/vendors" className="btn-primary inline-flex items-center gap-2">
            View All Vendors <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
