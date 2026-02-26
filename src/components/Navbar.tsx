import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useScrollHide } from '../hooks/useScrollHide'
import { LogOut, Wrench, User, Plus, X, LayoutDashboard, MapPin, Users, Cog } from 'lucide-react'
import { appName } from '../lib/appConfig'

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

export default function Navbar() {
  const { profile, signOut, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const isHeaderVisible = useScrollHide()
  const isClient = profile?.role === 'client'
  const isVendor = profile?.role === 'vendor'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Vendors', to: '/vendors', icon: Users },
    ...(isClient ? [{ label: 'New Request', to: '/request/new', icon: Plus }] : []),
    { label: 'Edit Profile', to: '/profile/edit', icon: MapPin },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-transform duration-300 ease-out" style={{transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)'}}>
      <div className="header-bar">
        <div className="site-container py-3">
          <div className="header-shell h-16 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label={`${appName} home`}>
          <img src="/VWpartlogo.png" alt={`${appName} logo`} className="w-14 h-14 object-contain" />
          <span className="font-display font-bold text-white text-lg">{appName}</span>
        </Link>

        {user ? (
          // Logged in view
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon size={16} /> {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
              <User size={14} className="text-slate-400" />
              <div>
                <p className="text-xs font-medium text-white leading-none">{profile?.full_name || 'Account'}</p>
                <p className="text-xs text-brand-400 capitalize leading-none mt-0.5">{profile?.role}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-white transition-colors" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          // Not logged in view
          <div className="hidden md:flex items-center gap-4">
            <Link to="/vendors" className="text-slate-300 hover:text-white transition-colors text-sm font-semibold">
              Vendors
            </Link>
            <Link to="/auth" className="btn-primary text-sm px-6 py-2">
              Get Started
            </Link>
          </div>
        )}

        <button
          type="button"
          className="md:hidden p-2.5 rounded-lg text-slate-200 hover:text-brand-300 hover:bg-slate-800/50 ring-1 ring-transparent hover:ring-brand-500/30 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95 group"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {open ? (
            <X size={22} className="transition-transform duration-200 group-hover:rotate-6" />
          ) : (
            <MechanicalMenuIcon size={22} className="transition-transform duration-200 group-hover:rotate-6" />
          )}
        </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-50 border-t border-brand-500/30 bg-gradient-to-b from-slate-900/98 to-slate-950/95 backdrop-blur-md shadow-lg">
          <div className="site-container py-5">
            {user ? (
              // Logged in mobile view
              <div className="space-y-4">
                <div className="grid gap-2">
                  {navItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${
                          isActive
                            ? 'bg-brand-500/90 text-white shadow-md'
                            : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <item.icon size={18} /> {item.label}
                    </NavLink>
                  ))}
                </div>

                <div className="h-px bg-gradient-to-r from-slate-800 via-brand-500/30 to-slate-800"></div>

                <div className="flex items-center justify-between gap-3 bg-slate-800/50 border border-brand-500/20 rounded-xl px-4 py-3 hover:border-brand-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-none">{profile?.full_name || 'Account'}</p>
                      <p className="text-xs text-brand-300 capitalize leading-none mt-1">{profile?.role}</p>
                    </div>
                  </div>
                  <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-700/50 rounded-lg transition-colors" aria-label="Sign out">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              // Not logged in mobile view
              <div className="space-y-3">
                <Link 
                  to="/vendors" 
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-all"
                >
                  Vendors
                </Link>
                <Link 
                  to="/auth" 
                  onClick={() => setOpen(false)}
                  className="block btn-primary text-center py-3"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
